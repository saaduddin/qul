import { readFileSync } from "node:fs"
import path from "node:path"

export type QulVerse = {
  chapter: number
  verse: number
  verseKey: string
  /** How many times the word "Qul" appears in this ayah */
  occurrences: number
}

let cache: { verses: QulVerse[]; totalOccurrences: number } | null = null

export function getQulData() {
  if (cache) return cache
  const csvPath = path.join(process.cwd(), "lib", "qul-occurrences.csv")
  const raw = readFileSync(csvPath, "utf8")
  const lines = raw.trim().split(/\r?\n/).slice(1)
  const counts = new Map<string, { chapter: number; verse: number; count: number }>()
  let totalOccurrences = 0
  for (const line of lines) {
    const [sura, verse] = line.split(",").map((s) => s.trim())
    if (!sura || !verse) continue
    totalOccurrences++
    const key = `${sura}:${verse}`
    const prev = counts.get(key)
    if (prev) prev.count++
    else counts.set(key, { chapter: Number(sura), verse: Number(verse), count: 1 })
  }
  const verses: QulVerse[] = Array.from(counts.entries())
    .map(([verseKey, v]) => ({
      verseKey,
      chapter: v.chapter,
      verse: v.verse,
      occurrences: v.count,
    }))
    .sort((a, b) => a.chapter - b.chapter || a.verse - b.verse)
  cache = { verses, totalOccurrences }
  return cache
}

export function getQulVerses(): QulVerse[] {
  return getQulData().verses
}
