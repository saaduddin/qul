"use server"

import { revalidatePath } from "next/cache"
import { addBookmark, deleteBookmark } from "@/lib/qf-user"

export async function bookmarkVerseAction(formData: FormData) {
  const chapter = Number(formData.get("chapter"))
  const verse = Number(formData.get("verse"))
  if (!chapter || !verse) return { ok: false, error: "Invalid verse" }
  try {
    await addBookmark(chapter, verse)
    revalidatePath("/")
    return { ok: true as const }
  } catch (e) {
    return { ok: false as const, error: (e as Error).message }
  }
}

export async function removeBookmarkAction(formData: FormData) {
  const id = String(formData.get("id") ?? "")
  if (!id) return { ok: false, error: "Missing id" }
  try {
    await deleteBookmark(id)
    revalidatePath("/")
    return { ok: true as const }
  } catch (e) {
    return { ok: false as const, error: (e as Error).message }
  }
}
