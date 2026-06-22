import WordExtractor from 'word-extractor'
import type { ParsedCharacter } from '@/lib/docx/parser'

export async function parseDocCharacters(buffer: Buffer): Promise<ParsedCharacter[]> {
  const extractor = new WordExtractor()
  const doc = await extractor.extract(buffer)
  const text = doc.getBody()
  const uniqueChars = [...new Set((text.match(/[一-鿿]/g) ?? []))]
  return uniqueChars.map((character) => ({ character, strokeCount: null, radical: null }))
}
