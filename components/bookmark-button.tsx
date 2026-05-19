"use client"

import { useTransition } from "react"
import { Bookmark, BookmarkCheck, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { bookmarkVerseAction, removeBookmarkAction } from "@/app/actions"

type Props = {
  chapter: number
  verse: number
  bookmarkId?: string | null
}

export function BookmarkButton({ chapter, verse, bookmarkId }: Props) {
  const [pending, start] = useTransition()
  const isBookmarked = Boolean(bookmarkId)

  return (
    <Button
      type="button"
      variant={isBookmarked ? "default" : "outline"}
      size="sm"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const fd = new FormData()
          if (isBookmarked && bookmarkId) {
            fd.set("id", bookmarkId)
            await removeBookmarkAction(fd)
          } else {
            fd.set("chapter", String(chapter))
            fd.set("verse", String(verse))
            await bookmarkVerseAction(fd)
          }
        })
      }
      className="gap-2"
      aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isBookmarked ? (
        <BookmarkCheck className="h-4 w-4" />
      ) : (
        <Bookmark className="h-4 w-4" />
      )}
      <span>{isBookmarked ? "Bookmarked" : "Bookmark"}</span>
    </Button>
  )
}
