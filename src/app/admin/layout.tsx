"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/checkpoints", label: "Checkpoints" },
  { href: "/admin/questions", label: "Questions" },
  { href: "/admin/pois", label: "Map POIs" },
  { href: "/admin/routes", label: "Routes" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname === "/admin/login") {
      setAuthed(true); // skip check on login page
      return;
    }
    fetch("/api/admin/auth")
      .then((r) => {
        if (r.ok) setAuthed(true);
        else {
          setAuthed(false);
          router.replace("/admin/login");
        }
      })
      .catch(() => {
        setAuthed(false);
        router.replace("/admin/login");
      });
  }, [pathname, router]);

  async function handleLogout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.replace("/admin/login");
  }

  if (authed === null) {
    return <div className="flex items-center justify-center h-screen text-gray-500">Loading...</div>;
  }

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-56 bg-gray-900 text-gray-100 flex flex-col">
        <div className="p-4 font-bold text-lg border-b border-gray-700" style={{ color: "#4DBFB3" }}>
          GBR Admin
        </div>
        <nav className="flex-1 py-4">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-2 text-sm hover:bg-gray-800 ${
                pathname === item.href ? "bg-gray-800 font-semibold" : ""
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="m-4 px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded text-center"
        >
          Logout
        </button>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
