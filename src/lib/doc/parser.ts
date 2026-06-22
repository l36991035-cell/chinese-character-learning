import WordExtractor from 'word-extractor'
import { writeFile, unlink } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import type { ParsedCharacter } from '@/lib/docx/parser'

export async function parseDocCharacters(buffer: Buffer): Promise<ParsedCharacter[]> {
  const tmpPath = join(tmpdir(), `doc_${Date.now()}.doc`)
  await writeFile(tmpPath, buffer)
  try {
    const extractor = new WordExtractor()
    const doc = await extractor.extract(tmpPath)
    const text = doc.getBody()
    const uniqueChars = [...new Set((text.match(/[一-鿿]/g) ?? []))]
    return uniqueChars.map((character) => ({ character, strokeCount: null, radical: null }))
  } finally {
    await unlink(tmpPath).catch(() => {})
  }
}
