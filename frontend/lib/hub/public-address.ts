export function isPublicIPv4(address: string): boolean {
  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(address)) return false;
  const parts = address.split(".").map(Number);
  if (parts.some((n) => n > 255)) return false;
  const [a, b, c] = parts;
  if (a === 0 || a === 10 || a === 127 || a >= 224) return false;
  if (a === 100 && b >= 64 && b <= 127) return false;
  if (a === 169 && b === 254) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && (b === 168 || (b === 0 && (c === 0 || c === 2))))
    return false;
  if (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100)))
    return false;
  if (a === 203 && b === 0 && c === 113) return false;
  return true;
}
