import * as XLSX from 'xlsx'
import type { ParsedCharacter } from '@/lib/docx/parser'

export async function parseXlsxCharacters(buffer: Buffer): Promise<ParsedCharacter[]> {
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  let allText = ''
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    const csv = XLSX.utils.sheet_to_csv(sheet)
    allText += csv
  }
  const uniqueChars = [...new Set((allText.match(/[一-鿿]/g) ?? []))]
  return uniqueChars.map((character) => ({ character, strokeCount: null, radical: null }))
}
