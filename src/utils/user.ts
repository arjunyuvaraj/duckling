export interface StoredUser {
  id: string;
  username: string;
  email: string;
  display_name?: string;
  role?: 'student' | 'teacher' | 'student-teacher' | string;
  school_name?: string;
  bio?: string;
}

export interface StoredSession {
  user: StoredUser;
  accessToken: string;
  tokenType: 'bearer';
  expiresAt: string;
}

const LEGACY_USER_KEY = 'duckling_user';
const SESSION_KEY = 'duckling_session';

function parseSession(raw: string | null): StoredSession | null {
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as StoredSession;
    if (!session.user?.id || !session.accessToken || !session.expiresAt) return null;
    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      clearSession();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function saveSession(session: StoredSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  localStorage.setItem(LEGACY_USER_KEY, JSON.stringify(session.user));
}

export function updateStoredUser(user: StoredUser): void {
  const session = readSession();
  if (!session) return;
  saveSession({ ...session, user });
}

export function saveUserSession({
  user,
  accessToken,
  expiresIn,
}: {
  user: StoredUser;
  accessToken: string;
  expiresIn: number;
}): void {
  saveSession({
    user,
    accessToken,
    tokenType: 'bearer',
    expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
  });
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(LEGACY_USER_KEY);
}

export function readSession(): StoredSession | null {
  const session = parseSession(localStorage.getItem(SESSION_KEY));
  if (session?.accessToken.startsWith('local-')) {
    clearSession();
    return null;
  }
  return session;
}

export function readStoredUser(): StoredUser | null {
  return readSession()?.user ?? null;
}

export function authHeader(): Record<string, string> {
  const session = readSession();
  return session ? { Authorization: `Bearer ${session.accessToken}` } : {};
}
