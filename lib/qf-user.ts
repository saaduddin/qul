// Server-only helper for the Quran Foundation User APIs (Bookmarks).
// Uses a personal user access token (QF_USER_ACCESS_TOKEN).

const USER_API_BASE_BY_ENV = {
  prelive: "https://apis-prelive.quran.foundation/auth",
  production: "https://apis.quran.foundation/auth",
} as const

function base() {
  const env = (process.env.QF_ENV ?? "prelive") as keyof typeof USER_API_BASE_BY_ENV
  return USER_API_BASE_BY_ENV[env]
}

function authHeaders() {
  const token = process.env.QF_USER_ACCESS_TOKEN
  const clientId = process.env.QF_CLIENT_ID
  if (!token) throw new Error("QF_USER_ACCESS_TOKEN must be set to use bookmarks")
  if (!clientId) throw new Error("QF_CLIENT_ID must be set")
  return {
    "x-auth-token": token,
    "x-client-id": clientId,
    "Content-Type": "application/json",
  }
}

export const MUSHAF_ID = 4 // UthmaniHafs

export type Bookmark = {
  id: string
  createdAt: string
  type: "ayah" | "page" | "juz" | "surah"
  key: number
  verseNumber: number | null
  group: string
  isInDefaultCollection: boolean
  isReading: boolean | null
  collectionsCount: number
}

export async function listBookmarks(): Promise<Bookmark[]> {
  const url = new URL(`${base()}/v1/bookmarks`)
  url.searchParams.set("type", "ayah")
  url.searchParams.set("mushafId", String(MUSHAF_ID))
  url.searchParams.set("first", "20")
  const res = await fetch(url.toString(), {
    headers: authHeaders(),
    cache: "no-store",
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`User API list bookmarks ${res.status}: ${text}`)
  }
  const json = (await res.json()) as { data: Bookmark[] }
  return json.data ?? []
}

export async function addBookmark(chapter: number, verseNumber: number): Promise<Bookmark> {
  const res = await fetch(`${base()}/v1/bookmarks`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      type: "ayah",
      key: chapter,
      verseNumber,
      mushafId: MUSHAF_ID,
    }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`User API add bookmark ${res.status}: ${text}`)
  }
  const json = (await res.json()) as { data: Bookmark }
  return json.data
}

export async function deleteBookmark(bookmarkId: string): Promise<void> {
  const res = await fetch(`${base()}/v1/bookmarks/${bookmarkId}`, {
    method: "DELETE",
    headers: authHeaders(),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`User API delete bookmark ${res.status}: ${text}`)
  }
}
