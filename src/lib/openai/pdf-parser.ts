import { PDFDocument } from 'pdf-lib'
import { getOpenAI } from './client'

const PDF_PARSE_PROMPT = `You are a Chinese language OCR system analyzing a Chinese elementary school textbook page.

Extract ALL Chinese characters shown as "生字" (new characters to learn) from this image/document.

For each character, extract:
1. The character itself
2. Stroke count (筆畫) - if visible
3. Radical (部首) - if visible

Return ONLY valid JSON, no explanation:
{
  "characters": [
    {
      "character": "樹",
      "strokeCount": 16,
      "radical": "木"
    }
  ]
}

Rules:
- Only extract characters explicitly marked as study targets (生字)
- Do not extract characters from example sentences or annotations
- If stroke count or radical is unclear, set to null
- Maintain the order they appear on the page`

export async function parsePdfCharacters(
  pdfBuffer: Buffer
): Promise<Array<{ character: string; strokeCount: number | null; radical: string | null }>> {
  const pdfDoc = await PDFDocument.load(pdfBuffer)
  const pageCount = pdfDoc.getPageCount()
  const allCharacters: Array<{ character: string; strokeCount: number | null; radical: string | null }> = []
  const seen = new Set<string>()

  for (let i = 0; i < pageCount; i++) {
    // Extract single page as a new PDF
    const singlePagePdf = await PDFDocument.create()
    const [copiedPage] = await singlePagePdf.copyPages(pdfDoc, [i])
    singlePagePdf.addPage(copiedPage)
    const pageBytes = await singlePagePdf.save()
    const pageBase64 = Buffer.from(pageBytes).toString('base64')

    try {
      const response = await getOpenAI().chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:application/pdf;base64,${pageBase64}`,
                  detail: 'high',
                },
              },
              { type: 'text', text: PDF_PARSE_PROMPT },
            ],
          },
        ],
        max_tokens: 1000,
        response_format: { type: 'json_object' },
      })

      const content = response.choices[0].message.content
      if (!content) continue

      const parsed = JSON.parse(content) as {
        characters: Array<{ character: string; strokeCount: number | null; radical: string | null }>
      }
      for (const char of parsed.characters) {
        if (!seen.has(char.character)) {
          seen.add(char.character)
          allCharacters.push(char)
        }
      }
    } catch (err) {
      console.error(`Failed to parse page ${i}:`, err)
    }
  }

  return allCharacters
}
