import { readFileSync } from "node:fs"
import path from "node:path"

export type QulVerse = {
  serial: number
  chapter: number
  verse: number
  verseKey: string
}

let cache: QulVerse[] | null = null

export function getQulVerses(): QulVerse[] {
  if (cache) return cache
  const csvPath = path.join(process.cwd(), "lib", "qul-occurrences.csv")
  const raw = readFileSync(csvPath, "utf8")
  const lines = raw.trim().split(/\r?\n/).slice(1)
  const list: QulVerse[] = []
  for (const line of lines) {
    const [serial, sura, verse] = line.split(",").map((s) => s.trim())
    if (!serial || !sura || !verse) continue
    list.push({
      serial: Number(serial),
      chapter: Number(sura),
      verse: Number(verse),
      verseKey: `${sura}:${verse}`,
    })
  }
  // de-duplicate by verseKey (some lines repeat the same ayah for multiple Qul occurrences)
  const seen = new Set<string>()
  const unique = list.filter((v) => {
    if (seen.has(v.verseKey)) return false
    seen.add(v.verseKey)
    return true
  })
  cache = unique
  return cache
}
