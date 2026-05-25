// Server-only helper for the Quran Foundation Content APIs.
// Manages OAuth2 client_credentials token caching and authenticated fetches.

const AUTH_BASE_BY_ENV = {
  prelive: "https://prelive-oauth2.quran.foundation",
  production: "https://oauth2.quran.foundation",
} as const

const API_BASE_BY_ENV = {
  prelive: "https://apis-prelive.quran.foundation",
  production: "https://apis.quran.foundation",
} as const

type Env = keyof typeof AUTH_BASE_BY_ENV

function getEnv(): Env {
  const e = (process.env.QF_ENV ?? "prelive") as Env
  if (!(e in AUTH_BASE_BY_ENV)) throw new Error("QF_ENV must be 'prelive' or 'production'")
  return e
}

export function getContentApiBase(): string {
  return API_BASE_BY_ENV[getEnv()]
}

let tokenCache: { token: string; expiresAt: number } | null = null

async function getAccessToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt - 60_000) {
    return tokenCache.token
  }
  const clientId = process.env.QF_CLIENT_ID
  const clientSecret = process.env.QF_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error("QF_CLIENT_ID and QF_CLIENT_SECRET must be set")
  }
  const env = getEnv()
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")
  const res = await fetch(`${AUTH_BASE_BY_ENV[env]}/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      scope: "content",
    }),
    cache: "no-store",
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Token request failed: ${res.status} ${text}`)
  }
  const data = (await res.json()) as { access_token: string; expires_in: number }
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  }
  return tokenCache.token
}

export async function qfContentFetch<T = unknown>(
  pathname: string,
  init: { searchParams?: Record<string, string | number | undefined>; revalidate?: number } = {},
): Promise<T> {
  const token = await getAccessToken()
  const url = new URL(`${getContentApiBase()}${pathname}`)
  if (init.searchParams) {
    for (const [k, v] of Object.entries(init.searchParams)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v))
    }
  }
  const res = await fetch(url.toString(), {
    headers: {
      "x-auth-token": token,
      "x-client-id": process.env.QF_CLIENT_ID!,
    },
    next: init.revalidate !== undefined ? { revalidate: init.revalidate } : undefined,
  })
  if (res.status === 401) {
    // token may have rotated; clear cache and retry once
    tokenCache = null
    const t2 = await getAccessToken()
    const res2 = await fetch(url.toString(), {
      headers: { "x-auth-token": t2, "x-client-id": process.env.QF_CLIENT_ID! },
    })
    if (!res2.ok) throw new Error(`Content API ${res2.status}`)
    return (await res2.json()) as T
  }
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Content API ${res.status}: ${text}`)
  }
  return (await res.json()) as T
}

export type ApiVerse = {
  id: number
  verse_key: string
  verse_number: number
  chapter_id?: number
  text_uthmani: string
  translations?: { resource_id: number; text: string }[]
}

export async function getVerseByKey(verseKey: string, translationId = 131): Promise<ApiVerse> {
  const data = await qfContentFetch<{ verse: ApiVerse }>(`/content/api/v4/verses/by_key/${verseKey}`, {
    searchParams: {
      language: "en",
      translations: String(translationId),
      fields: "text_uthmani",
    },
    revalidate: 60 * 60 * 24, // verses are immutable
  })
  console.log("[v0] raw verse keys:", Object.keys(data.verse ?? {}))
  console.log("[v0] translations:", JSON.stringify(data.verse?.translations))
  return data.verse
}
