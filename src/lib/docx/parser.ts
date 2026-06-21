import mammoth from 'mammoth'

export interface ParsedCharacter {
  character: string
  strokeCount: null
  radical: null
}

export async function parseDocxCharacters(buffer: Buffer): Promise<ParsedCharacter[]> {
  const result = await mammoth.extractRawText({ buffer })
  const uniqueChars = [...new Set((result.value.match(/[一-鿿]/g) ?? []))]
  return uniqueChars.map((character) => ({ character, strokeCount: null, radical: null }))
}
