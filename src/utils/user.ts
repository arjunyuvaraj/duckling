export interface StoredUser {
  id: string;
  username: string;
  email: string;
}

export function readStoredUser(): StoredUser | null {
  try {
    const raw = localStorage.getItem('duckling_user');
    return raw ? (JSON.parse(raw) as StoredUser) : null;
  } catch {
    return null;
  }
}

export function gradientFromId(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = Math.imul(h, 31) + id.charCodeAt(i);
  }
  const hue1 = ((h >>> 0) % 360);
  const hue2 = (hue1 + 140 + (((h >>> 8) >>> 0) % 80)) % 360;
  return `linear-gradient(135deg, hsl(${hue1},65%,55%), hsl(${hue2},65%,45%))`;
}
