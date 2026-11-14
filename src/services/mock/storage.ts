/**
 * Tiny key/value persistence for the mock backend.
 * Uses sessionStorage in the browser (cleared when the tab closes) and an
 * in-memory map elsewhere (tests). NOT a security boundary.
 */
const memory = new Map<string, string>();

function store(): Pick<Storage, "getItem" | "setItem" | "removeItem"> {
  if (typeof window !== "undefined" && window.sessionStorage) return window.sessionStorage;
  return {
    getItem: (k) => memory.get(k) ?? null,
    setItem: (k, v) => void memory.set(k, v),
    removeItem: (k) => void memory.delete(k),
  };
}

export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = store().getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown): void {
  store().setItem(key, JSON.stringify(value));
}

export function removeKey(key: string): void {
  store().removeItem(key);
}
