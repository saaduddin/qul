import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { listBookmarks } from "@/lib/qf-user"
import { getVerseByKey } from "@/lib/qf-content"
import { BookmarkButton } from "@/components/bookmark-button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export const dynamic = "force-dynamic"

export default async function BookmarksPage() {
  let error: string | null = null
  let bookmarks: Awaited<ReturnType<typeof listBookmarks>> = []
  try {
    bookmarks = await listBookmarks()
  } catch (e) {
    error = (e as Error).message
  }

  const ayahBookmarks = bookmarks.filter((b) => b.type === "ayah" && b.verseNumber != null)

  const verses = await Promise.all(
    ayahBookmarks.map(async (b) => {
      const key = `${b.key}:${b.verseNumber}`
      try {
        const v = await getVerseByKey(key)
        return { bookmark: b, verseKey: key, verse: v, error: null as string | null }
      } catch (e) {
        return { bookmark: b, verseKey: key, verse: null, error: (e as Error).message }
      }
    }),
  )

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-4xl flex-col gap-4 px-6 py-10">
          <Link href="/" className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-4 w-4" />
            Back to verses
          </Link>
          <h1 className="text-pretty text-3xl font-semibold tracking-tight md:text-4xl">Your bookmarks</h1>
          <p className="text-muted-foreground">Saved verses from the Quran Foundation User API.</p>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-8">
        {error ? (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : verses.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border px-6 py-12 text-center">
            <p className="text-muted-foreground">No bookmarks yet. Tap the bookmark button on any verse to save it.</p>
            <Link href="/" className="mt-4 inline-block">
              <Button variant="outline" className="bg-transparent">
                Browse Qul verses
              </Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {verses.map(({ bookmark, verseKey, verse, error: vErr }) => (
              <Card key={bookmark.id} className="overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-border bg-muted/40 py-3">
                  <Badge variant="outline" className="font-mono text-xs">
                    {verseKey}
                  </Badge>
                  <BookmarkButton
                    chapter={bookmark.key}
                    verse={bookmark.verseNumber as number}
                    bookmarkId={bookmark.id}
                  />
                </CardHeader>
                <CardContent className="space-y-3 py-5">
                  {vErr || !verse ? (
                    <p className="text-sm text-destructive">Failed to load: {vErr}</p>
                  ) : (
                    <>
                      <p
                        dir="rtl"
                        lang="ar"
                        className="font-serif text-2xl leading-loose text-foreground md:text-3xl"
                      >
                        {verse.text_uthmani}
                      </p>
                      {verse.translations?.[0]?.text ? (
                        <p
                          className="leading-relaxed text-muted-foreground"
                          dangerouslySetInnerHTML={{ __html: verse.translations[0].text }}
                        />
                      ) : null}
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
