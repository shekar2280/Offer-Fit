import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
export function sealSecret(
  value: string,
  key: Buffer,
  owner: string,
  kind: string,
): string {
  if (key.length !== 32) throw new Error("Invalid encryption key length");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from(`${owner}:${kind}`));
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  return [
    "v1",
    iv.toString("base64"),
    cipher.getAuthTag().toString("base64"),
    encrypted.toString("base64"),
  ].join(".");
}
export function openSecret(
  value: string,
  key: Buffer,
  owner: string,
  kind: string,
): string {
  const [version, iv, tag, encrypted, ...extra] = value.split(".");
  if (
    version !== "v1" ||
    !iv ||
    !tag ||
    !encrypted ||
    extra.length ||
    Buffer.from(iv, "base64").length !== 12 ||
    Buffer.from(tag, "base64").length !== 16
  )
    throw new Error("Invalid encrypted envelope");
  const cipher = createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(iv, "base64"),
  );
  cipher.setAAD(Buffer.from(`${owner}:${kind}`));
  cipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([
    cipher.update(Buffer.from(encrypted, "base64")),
    cipher.final(),
  ]).toString("utf8");
}
