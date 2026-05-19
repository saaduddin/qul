import { Suspense } from "react"
import Link from "next/link"
import { BookmarkCheck, BookOpen, ChevronLeft, ChevronRight, Sparkles } from "lucide-react"
import { getQulData } from "@/lib/qul-verses"
import { getVerseByKey } from "@/lib/qf-content"
import { listBookmarks, type Bookmark } from "@/lib/qf-user"
import { BookmarkButton } from "@/components/bookmark-button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export const dynamic = "force-dynamic"

const PAGE_SIZE = 12

type SearchParams = Promise<{ page?: string }>

async function safeListBookmarks(): Promise<{ bookmarks: Bookmark[]; error?: string }> {
  try {
    const bookmarks = await listBookmarks()
    return { bookmarks }
  } catch (e) {
    return { bookmarks: [], error: (e as Error).message }
  }
}

function bookmarkIndex(bookmarks: Bookmark[]) {
  const map = new Map<string, string>()
  for (const b of bookmarks) {
    if (b.type === "ayah" && b.verseNumber != null) {
      map.set(`${b.key}:${b.verseNumber}`, b.id)
    }
  }
  return map
}

export default async function HomePage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams
  const page = Math.max(1, Number(sp.page ?? 1) || 1)

  const { verses: allVerses, totalOccurrences } = getQulData()
  const totalPages = Math.ceil(allVerses.length / PAGE_SIZE)
  const start = (page - 1) * PAGE_SIZE
  const slice = allVerses.slice(start, start + PAGE_SIZE)

  const [bookmarksResult, fetchedVerses] = await Promise.all([
    safeListBookmarks(),
    Promise.all(
      slice.map(async (v) => {
        try {
          const verse = await getVerseByKey(v.verseKey)
          return { meta: v, verse, error: null as string | null }
        } catch (e) {
          return { meta: v, verse: null, error: (e as Error).message }
        }
      }),
    ),
  ])

  const bIndex = bookmarkIndex(bookmarksResult.bookmarks)

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-4xl flex-col gap-4 px-6 py-10">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-amber-600" />
            <span>Quran Foundation API</span>
          </div>
          <h1 className="text-pretty text-3xl font-semibold tracking-tight md:text-4xl">
            Verses containing{" "}
            <span className="font-serif italic text-amber-700 dark:text-amber-500">Qul</span>
          </h1>
          <p className="max-w-2xl text-pretty leading-relaxed text-muted-foreground">
            The Arabic imperative{" "}
            <span className="font-serif italic">Qul</span> — meaning <em>&quot;Say&quot;</em> — is a divine
            instruction that occurs <strong className="text-foreground">{totalOccurrences}</strong> times across{" "}
            <strong className="text-foreground">{allVerses.length}</strong> {" "} distinct verses of the Qur&apos;an. Browse
            them below, read translations, and bookmark your favorites.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Badge variant="secondary" className="font-normal">
              {allVerses.length} verses
            </Badge>
            <Badge variant="secondary" className="font-normal">
              {totalOccurrences} occurrences
            </Badge>
            <Badge variant="secondary" className="font-normal">
              <BookmarkCheck className="mr-1 h-3 w-3" />
              {bookmarksResult.bookmarks.length} bookmarked
            </Badge>
            <Link href="/bookmarks">
              <Button variant="outline" size="sm" className="ml-2 gap-2 bg-transparent">
                <BookOpen className="h-4 w-4" />
                View bookmarks
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {bookmarksResult.error ? (
        <div className="mx-auto max-w-4xl px-6 pt-6">
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
            Bookmarks unavailable: {bookmarksResult.error}. Make sure{" "}
            <code className="font-mono">QF_USER_ACCESS_TOKEN</code> is set.
          </div>
        </div>
      ) : null}

      <section className="mx-auto max-w-4xl px-6 py-8">
        <Suspense>
          <div className="flex flex-col gap-4">
            {fetchedVerses.map(({ meta, verse, error }) => {
              const bookmarkId = bIndex.get(meta.verseKey) ?? null
              return (
                <Card key={meta.verseKey} className="overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-border bg-muted/40 py-3">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="font-mono text-xs">
                        {meta.verseKey}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        Surah {meta.chapter}, Ayah {meta.verse}
                      </span>
                      {meta.occurrences > 1 ? (
                        <Badge variant="outline" className="text-xs">
                          {meta.occurrences}× Qul
                        </Badge>
                      ) : null}
                    </div>
                    <BookmarkButton chapter={meta.chapter} verse={meta.verse} bookmarkId={bookmarkId} />
                  </CardHeader>
                  <CardContent className="space-y-4 py-5">
                    {error || !verse ? (
                      <p className="text-sm text-destructive">Failed to load verse: {error}</p>
                    ) : (
                      <>
                        <p
                          dir="rtl"
                          lang="ar"
                          className="text-pretty font-serif text-2xl leading-loose text-foreground md:text-3xl"
                        >
                          {verse.text_uthmani}
                        </p>
                        {verse.translations?.[0]?.text ? (
                          <p
                            className="text-pretty leading-relaxed text-muted-foreground"
                            // Translations from QF can include simple HTML (sup tags for footnotes)
                            dangerouslySetInnerHTML={{ __html: verse.translations[0].text }}
                          />
                        ) : null}
                      </>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </Suspense>

        <nav
          aria-label="Pagination"
          className="mt-8 flex items-center justify-between border-t border-border pt-6"
        >
          <Link href={`/?page=${Math.max(1, page - 1)}`} aria-disabled={page <= 1}>
            <Button variant="outline" size="sm" disabled={page <= 1} className="gap-1 bg-transparent">
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
          </Link>
          <span className="text-sm text-muted-foreground">
            Page <strong className="text-foreground">{page}</strong> of {totalPages}
          </span>
          <Link href={`/?page=${Math.min(totalPages, page + 1)}`} aria-disabled={page >= totalPages}>
            <Button variant="outline" size="sm" disabled={page >= totalPages} className="gap-1 bg-transparent">
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </nav>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-4xl px-6 py-6 text-xs text-muted-foreground">
          Verse data &amp; translations from the{" "}
          <a
            className="underline underline-offset-2 hover:text-foreground"
            href="https://api-docs.quran.foundation/"
            target="_blank"
            rel="noreferrer"
          >
            Quran Foundation Content API
          </a>
          . Bookmarks via the User API.
        </div>
      </footer>
    </main>
  )
}
