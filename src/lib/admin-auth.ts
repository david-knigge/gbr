import crypto from "crypto";

function getSecret(): string {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) throw new Error("ADMIN_PASSWORD env var is not set");
  return password;
}

export function createToken(): string {
  const secret = getSecret();
  const timestamp = Date.now().toString();
  const hmac = crypto.createHmac("sha256", secret).update(timestamp).digest("hex");
  return `${timestamp}.${hmac}`;
}

export function verifyToken(token: string): boolean {
  try {
    const secret = getSecret();
    const [timestamp, signature] = token.split(".");
    if (!timestamp || !signature) return false;

    const expected = crypto.createHmac("sha256", secret).update(timestamp).digest("hex");
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}
