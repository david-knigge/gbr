#!/usr/bin/env python3
"""
Amsterdam tweede-woning (pied-a-terre) onttrekkingsvergunning — doorlooptijd analyse.

Pulls every "onttrekkingsvergunning tweede woning" publication for gemeente Amsterdam
from the KOOP SRU API (officiele bekendmakingen), categorises them
(aanvraag / verleend / geweigerd / buiten behandeling), joins aanvraag -> besluit on
the zaaknummer (Z20xx-xxxxxx), and reports the aanvraag->besluit doorlooptijd.

Run where the network is open (NOT inside the dev-locked sandbox):
    python3 tweede_woning_doorlooptijd.py

Caveats (see chat): the join uses *publication* dates, not the true ontvangstdatum the
Awb-termijn runs from; not every aanvraag is published; the publications never state the
ground (sub-a/b/c), so transitional vs new-case cannot be split here. For the clean
official figure, file the Woo-verzoek instead.
"""

import csv
import re
import statistics
import sys
import time
import urllib.parse
import urllib.request
from collections import defaultdict
from datetime import date
from xml.etree import ElementTree as ET

SRU = "https://repository.overheid.nl/sru"

# Every creator gemeente Amsterdam has published under, incl. Weesp (merged 2022) and the
# historical stadsdelen. As of 2026 only "Amsterdam" carries tweede-woning publications, so
# the OR-list does not change today's numbers; it keeps the query correct if that shifts.
CREATORS = [
    "Amsterdam", "gemeente Amsterdam", "Weesp",
    "Amsterdam - West", "Amsterdam - Oost/Watergraafsmeer", "Amsterdam - Noord",
    "Amsterdam - Zuid", "Amsterdam - Nieuw-West", "Amsterdam - Centrum",
    "Amsterdam - Zuidoost", "Amsterdam - Oost", "Amsterdam - Westpoort",
    "Amsterdam - Osdorp", "Amsterdam - Oud Zuid", "Amsterdam - Zuideramstel",
    "Amsterdam - Bos en Lommer", "Amsterdam - Westerpark", "Amsterdam - Slotervaart",
    "Amsterdam - Oud-West", "Amsterdam - Geuzenveld-Slotermeer", "Amsterdam - Zeeburg",
]
_CREATOR_OR = " or ".join(f'dt.creator=="{c}"' for c in CREATORS)

# Mirror of the working web-UI query, trimmed to the parts that actually filter. The text
# filter deliberately does NOT require "Besluit" so aanvraag publications are kept too — we
# need both sides to measure the aanvraag->besluit doorlooptijd.
CQL = (
    'c.product-area=="officielepublicaties" '
    f'and ({_CREATOR_OR}) '
    'and w.publicatienaam=="Gemeenteblad" '
    'and (cql.textAndIndexes="Onttrekkingsvergunning" and cql.textAndIndexes="tweede woning")'
)

PAGE = 100          # records per SRU page
START_YEAR = "2026"  # only keep publications from this year onward
ZAAK_RE = re.compile(r"Z20\d{2}-\d{4,6}")

# The publications carry no zaaknummer; the address in the title is the join key.
# Strip the fixed boilerplate ("... tweede woning") and, for besluiten, the leading
# outcome word, leaving just the address.
BOILERPLATE_RE = re.compile(r"^.*?tweede woning\s*", re.IGNORECASE)
OUTCOME_RE = re.compile(r"^(verleend|geweigerd|buiten behandeling(?: gesteld)?)\s+", re.IGNORECASE)


def local(tag: str) -> str:
    """Strip the XML namespace so we can match by local tag name."""
    return tag.rsplit("}", 1)[-1].lower()


def address_key(title: str) -> str:
    """Normalised address used to join aanvraag <-> besluit."""
    t = BOILERPLATE_RE.sub("", title)
    t = OUTCOME_RE.sub("", t)
    return " ".join(t.split()).lower()


def fetch_page(start: int) -> tuple[bytes, int]:
    q = {
        "version": "2.0",
        "operation": "searchRetrieve",
        "query": CQL,
        "startRecord": str(start),
        "maximumRecords": str(PAGE),
        "recordSchema": "gzd",
    }
    url = SRU + "?" + urllib.parse.urlencode(q)
    req = urllib.request.Request(url, headers={"User-Agent": "doorlooptijd-analyse/1.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        body = r.read()
    root = ET.fromstring(body)
    total = 0
    for el in root.iter():
        if local(el.tag) == "numberofrecords":
            total = int((el.text or "0").strip())
            break
    return body, total


def parse_records(body: bytes) -> list[dict]:
    root = ET.fromstring(body)
    out = []
    for rec in root.iter():
        if local(rec.tag) != "record":
            continue
        raw = ET.tostring(rec, encoding="unicode")
        title = available = identifier = None
        for el in rec.iter():
            t = local(el.tag)
            txt = (el.text or "").strip()
            if not txt:
                continue
            if t == "title" and title is None:
                title = txt
            elif t in ("available", "date", "modified") and available is None and re.match(r"\d{4}-\d{2}-\d{2}", txt):
                available = txt[:10]
            elif t == "identifier" and identifier is None and txt.startswith("gmb-"):
                identifier = txt
        if not title:
            continue
        zaak = ZAAK_RE.search(raw)
        low = title.lower()
        if low.startswith("aanvraag") or "aanvraag" in low:
            kind = "aanvraag"
        elif "geweigerd" in low:
            kind = "geweigerd"
        elif "buiten behandeling" in low:
            kind = "buiten_behandeling"
        elif "verleend" in low:
            kind = "verleend"
        elif low.startswith("besluit"):
            # "Besluit ... tweede woning  <adres>" with the outcome word omitted.
            kind = "besluit_overig"
        else:
            kind = "overig"
        out.append({
            "kind": kind,
            "title": title,
            "date": available,
            "zaak": zaak.group(0) if zaak else None,
            "address": address_key(title),
            "id": identifier,
        })
    return out


def days_between(d1: str, d2: str) -> int:
    a = date.fromisoformat(d1)
    b = date.fromisoformat(d2)
    return (b - a).days


def main() -> None:
    records, start, total = [], 1, None
    while True:
        try:
            body, total = fetch_page(start)
        except Exception as e:  # noqa: BLE001
            print(f"SRU fetch failed at startRecord={start}: {e}", file=sys.stderr)
            break
        page = parse_records(body)
        if not page:
            break
        records.extend(page)
        print(f"  fetched {len(records)}/{total} ...", file=sys.stderr)
        start += PAGE
        if total and start > total:
            break
        time.sleep(0.5)

    records = [r for r in records if r["date"] and r["date"] >= f"{START_YEAR}-01-01"]
    print(f"\nTotal tweede-woning publications {START_YEAR}+: {len(records)}")

    counts: dict[str, int] = {}
    for r in records:
        counts[r["kind"]] = counts.get(r["kind"], 0) + 1
    for k, v in sorted(counts.items(), key=lambda kv: -kv[1]):
        print(f"  {k:20s} {v}")

    # Join aanvraag -> besluit on the (normalised) address in the title. An address can
    # appear more than once over time, so per address we sort both sides by date and pair
    # each aanvraag to the earliest not-yet-used besluit on or after it.
    besluit_kinds = ("verleend", "geweigerd", "buiten_behandeling", "besluit_overig")
    aanvragen: dict[str, list[str]] = defaultdict(list)
    besluiten: dict[str, list[tuple[str, str]]] = defaultdict(list)
    for r in records:
        if not r["address"]:
            continue
        if r["kind"] == "aanvraag":
            aanvragen[r["address"]].append(r["date"])
        elif r["kind"] in besluit_kinds:
            besluiten[r["address"]].append((r["date"], r["kind"]))

    pairs = []
    for addr, adates in aanvragen.items():
        bl = sorted(besluiten.get(addr, []))
        used = [False] * len(bl)
        for adate in sorted(adates):
            for i, (bdate, bkind) in enumerate(bl):
                if not used[i] and bdate >= adate:
                    used[i] = True
                    pairs.append((addr, adate, bdate, bkind, days_between(adate, bdate)))
                    break

    print(f"\nMatched aanvraag->besluit pairs (by adres): {len(pairs)}")
    if pairs:
        dl = sorted(p[4] for p in pairs)
        print(f"  doorlooptijd (publicatie->publicatie, dagen):")
        print(f"    mediaan : {statistics.median(dl)}")
        print(f"    gemiddeld: {statistics.mean(dl):.1f}")
        print(f"    min / max: {dl[0]} / {dl[-1]}")
        print(f"    <= 56 dagen (8 wk regulier)      : {sum(d<=56 for d in dl)}/{len(dl)}")
        print(f"    <= 98 dagen (8 wk + 6 wk verdaag): {sum(d<=98 for d in dl)}/{len(dl)}")

    with open("tweede_woning_publicaties.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["kind", "date", "address", "zaak", "id", "title"])
        w.writeheader()
        for r in sorted(records, key=lambda r: r["date"] or ""):
            w.writerow(r)
    with open("tweede_woning_doorlooptijd.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["adres", "aanvraag_publ", "besluit_publ", "besluit", "dagen"])
        w.writerows(sorted(pairs, key=lambda p: p[1]))
    print("\nWrote tweede_woning_publicaties.csv and tweede_woning_doorlooptijd.csv")


if __name__ == "__main__":
    main()
