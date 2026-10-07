const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

export function getClientIp(request) {
  const direct = request.headers.get("CF-Connecting-IP")?.trim();
  if (direct) return direct;

  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded) return forwarded;

  return request.headers.get("x-real-ip")?.trim() || "local-development";
}

export async function hashIp(ip, salt) {
  if (!salt) throw new Error("IP_HASH_SALT is not configured");

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(salt),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(ip));
  return [...new Uint8Array(signature)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function voterHash(request, env) {
  return hashIp(getClientIp(request), env.IP_HASH_SALT);
}

export function isValidOption(value) {
  return Number.isInteger(value) && value >= 1 && value <= 20;
}

