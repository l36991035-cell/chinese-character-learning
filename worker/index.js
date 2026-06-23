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

async function callGemini(apiKey, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' },
    }),
  })
  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}'
  return JSON.parse(text)
}

export default {
  async fetch(request, env) {
    // CORS headers for GitHub Pages
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
    }

    const { character, grade } = await request.json()
    if (!character || !grade) {
      return new Response(JSON.stringify({ error: 'Missing character or grade' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const apiKey = env.GEMINI_API_KEY

    // Core content
    const core = await callGemini(apiKey,
      CONTENT_PROMPT.replace('{character}', character).replace(/{grade}/g, String(grade))
    )

    // 1s delay between two Gemini calls
    await new Promise(r => setTimeout(r, 1000))

    // Extension content
    const extRaw = await callGemini(apiKey,
      EXTENSION_PROMPT.replace('{character}', character).replace(/{grade}/g, String(grade))
    )

    const extensions = {
      confusableChars: extRaw.confusableChars ?? [],
      wordFormation: extRaw.wordFormation ?? [],
      semanticRelation: extRaw.semanticRelation ?? [],
      multiPronunciation: grade >= 3 ? (extRaw.multiPronunciation ?? []) : [],
      synonyms: grade >= 3 ? (extRaw.synonyms ?? []) : [],
      antonyms: grade >= 3 ? (extRaw.antonyms ?? []) : [],
      idioms: grade >= 5 ? (extRaw.idioms ?? []) : [],
      rhetoric: grade >= 5 ? (extRaw.rhetoric ?? []) : [],
    }

    const result = {
      vocabulary: core.vocabulary ?? '',
      vocabularyBopomofo: core.vocabularyBopomofo ?? '',
      sentence: core.sentence ?? '',
      sentenceBopomofo: core.sentenceBopomofo ?? '',
      readingText: core.readingText ?? '',
      extensions,
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  },
}
