import { randomInt } from "node:crypto";

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD = 10;

// tanpa karakter yang mudah tertukar (0/O, 1/l/I)
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

/** Kata sandi sementara acak (kriptografis). Hanya dipakai di server. */
export function tempPassword(length = 16): string {
  let s = "";
  for (let i = 0; i < length; i++) s += ALPHABET[randomInt(ALPHABET.length)];
  return s;
}

export const AUDIT_LABEL: Record<string, string> = {
  "staff.create": "Membuat akun",
  "staff.role": "Mengubah peran",
  "staff.activate": "Mengaktifkan akun",
  "staff.deactivate": "Menonaktifkan akun",
  "staff.reset_password": "Mengatur ulang kata sandi",
};
