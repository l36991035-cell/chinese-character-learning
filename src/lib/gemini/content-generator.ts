import { getGemini } from './client'
import type { GeneratedContent, Extensions } from '@/types'

const CONTENT_PROMPT = `You are a Taiwanese elementary school Chinese teacher creating learning materials.

Target character: {character}
Student grade: {grade} (1-6, where 1 is easiest)

Generate learning content for this character suitable for grade {grade} students.
Use Traditional Chinese (繁體中文) only.
Use Bopomofo (注音符號) for phonetic annotation.

Return ONLY valid JSON:
{
  "vocabulary": "大樹",
  "vocabularyBopomofo": "ㄉㄚˋ ㄕㄨˋ",
  "sentence": "公園裡有一棵大樹。",
  "sentenceBopomofo": "ㄍㄨㄥ ㄩㄢˊ ㄌㄧˇ ㄧㄡˇ ㄧ ㄎㄜ ㄉㄚˋ ㄕㄨˋ。",
  "readingText": "公園裡有一棵大樹。大樹的葉子是綠色的。小朋友喜歡在大樹下玩。"
}

Rules:
- vocabulary: 2–3 characters containing the target character, common and age-appropriate
- vocabularyBopomofo: exact Bopomofo with tones for each syllable, space-separated
- sentence: 10–20 characters, simple grammar for grade {grade}
- sentenceBopomofo: exact Bopomofo for the full sentence
- readingText: 2–3 simple sentences forming a coherent passage`

const EXTENSION_PROMPT = `You are a Taiwanese elementary school Chinese teacher.

Target character: {character}
Student grade: {grade}

Generate extension learning content. Return ONLY the fields applicable for grade {grade}:
- Grade 1+: confusableChars, wordFormation, semanticRelation
- Grade 3+: additionally multiPronunciation, synonyms, antonyms
- Grade 5+: additionally idioms, rhetoric

Return ONLY valid JSON with the applicable fields. Omit fields not applicable for grade {grade}.

Field formats:
{
  "confusableChars": [{ "char": "己", "explanation": "「己」自己，「已」已經" }],
  "wordFormation": ["大樹", "樹木", "果樹"],
  "semanticRelation": ["森林", "植物"],
  "multiPronunciation": [{ "pronunciation": "ㄕㄨˋ", "meaning": "樹木", "example": "大樹" }],
  "synonyms": ["樹木"],
  "antonyms": [],
  "idioms": [{ "idiom": "樹大根深", "meaning": "比喻根基穩固" }],
  "rhetoric": [{ "type": "擬人", "example": "大樹張開雙臂歡迎小鳥。" }]
}

Rules:
- confusableChars: max 3, only genuinely confusable
- wordFormation: 4–6 common compound words
- semanticRelation: 3–5 related words
- Traditional Chinese only`

export async function generateCharacterContent(
  character: string,
  grade: number,
  courseId: number,
  characterId: string
): Promise<Omit<GeneratedContent, 'status' | 'generatedAt' | 'errorMessage'>> {
  const genAI = getGemini()
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: { responseMimeType: 'application/json' },
  })

  // Generate core content
  const contentResult = await model.generateContent(
    CONTENT_PROMPT.replace('{character}', character).replace(/{grade}/g, String(grade))
  )
  const core = JSON.parse(contentResult.response.text())

  // 1-second delay between the two calls within a character
  await new Promise((r) => setTimeout(r, 1000))

  // Generate extension content
  const extResult = await model.generateContent(
    EXTENSION_PROMPT.replace('{character}', character).replace(/{grade}/g, String(grade))
  )
  const extRaw = JSON.parse(extResult.response.text())

  // Enforce grade-based field availability — Gemini may return fields beyond the grade ceiling
  const extensions: Extensions = {
    confusableChars: extRaw.confusableChars ?? [],
    wordFormation: extRaw.wordFormation ?? [],
    semanticRelation: extRaw.semanticRelation ?? [],
    multiPronunciation: grade >= 3 ? (extRaw.multiPronunciation ?? []) : [],
    synonyms: grade >= 3 ? (extRaw.synonyms ?? []) : [],
    antonyms: grade >= 3 ? (extRaw.antonyms ?? []) : [],
    idioms: grade >= 5 ? (extRaw.idioms ?? []) : [],
    rhetoric: grade >= 5 ? (extRaw.rhetoric ?? []) : [],
  }

  return {
    characterId,
    courseId,
    grade,
    character,
    vocabulary: core.vocabulary ?? '',
    vocabularyBopomofo: core.vocabularyBopomofo ?? '',
    sentence: core.sentence ?? '',
    sentenceBopomofo: core.sentenceBopomofo ?? '',
    readingText: core.readingText ?? '',
    extensions,
  }
}
