/**
 * The signed-in session, stored under one localStorage key so a page reload keeps the user in.
 * Plain module (no React) so both the axios client and AuthContext can use it.
 * Shape: { token, expiresAt (ms since epoch), user: { id, username, display_name, role } }
 */
export const AUTH_STORAGE_KEY = 'KTR_ONE_AUTH';

let unauthorizedHandler = null;

export function readSession() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (!session || typeof session.token !== 'string' || !session.token) return null;
    if (!Number.isFinite(session.expiresAt) || session.expiresAt <= Date.now()) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function writeSession(session) {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // storage full or blocked: the session then only lasts until the tab reloads
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // nothing to do
  }
}

export function getToken() {
  return readSession()?.token ?? null;
}

/** AuthContext registers here; the axios client calls it when the server answers 401. */
export function setUnauthorizedHandler(fn) {
  unauthorizedHandler = fn;
}

export function notifyUnauthorized() {
  if (unauthorizedHandler) unauthorizedHandler();
  else clearSession();
}
