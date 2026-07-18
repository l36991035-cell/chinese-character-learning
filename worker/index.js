const COMBINED_PROMPT = `You are a Taiwanese elementary school Chinese teacher creating learning materials.

Target character: {character}
Student grade: {grade} (1-6, where 1 is easiest)

Generate ALL learning content for this character in ONE response. Use Traditional Chinese (繁體中文) only. Use Bopomofo (注音符號) for phonetic annotation.

CRITICAL CHARACTER FORM RULE: Every character you output must use the standard Taiwan Ministry of Education form (教育部標準字體). NEVER use variant forms (異體字) or archaic forms. For example: always write 為 not 爲, 著 not 着 (when used as verb), 臺 not 台 (in formal contexts). If in doubt, use the most common printed form taught in Taiwan elementary schools.

Return ONLY valid JSON with NO extra text. Example format (for character "火"):
{
  "vocabulary": "火車",
  "vocabularyBopomofo": "ㄏㄨㄛˇ ㄔㄜ",
  "sentence": "火車跑得很快。",
  "sentenceBopomofo": "ㄏㄨㄛˇ ㄔㄜ ㄆㄠˇ ㄉㄜ˙ ㄏㄣˇ ㄎㄨㄞˋ。",
  "readingText": "火車跑得很快。火車可以載很多人。我喜歡坐火車。",
  "radical": "火",
  "strokeCount": 4,
  "definition": "物質燃燒時產生的光和熱。如：「火焰」、「火光」。\n比喻激烈或緊急的情況。如：「火速」、「火爆」。",
  "confusableChars": [{ "char": "水", "explanation": "「火」是熱的，「水」是冷的，兩者相反" }],
  "wordFormation": [
    { "word": "火車", "explanation": "一種用燃料或電力推動的大型交通工具" },
    { "word": "火山", "explanation": "會噴出熔岩和氣體的山" },
    { "word": "大火", "explanation": "很大的火災" }
  ],
  "multiPronunciation": [],
  "synonyms": ["燃燒", "火焰"],
  "antonyms": ["水", "冰"],
  "idioms": [{ "idiom": "火上加油", "meaning": "比喻使情況更加嚴重或激烈" }],
  "rhetoric": []
}

Now generate the actual content for the target character "{character}". Do NOT copy the example above.

{pronunciationNote}

Rules for core fields:
- vocabulary: 2–3 characters containing the target character, common and age-appropriate
- vocabularyBopomofo: exact Bopomofo with tones for each syllable, space-separated
- sentence: 10–20 characters, simple grammar for grade {grade}
- sentenceBopomofo: exact Bopomofo for the full sentence
- readingText: 2–3 simple sentences forming a coherent passage
- radical: the correct Kangxi radical (部首) for this character, as a single Chinese character
- strokeCount: total stroke count as a number
- definition: 1–3 child-friendly meanings in Traditional Chinese. Each meaning on its own line separated by \n. Format each line as: "意思說明。如：「例子一」、「例子二」。"

Rules for extension fields (always include ALL fields regardless of grade, use empty array [] only if truly not applicable):
- confusableChars: array of {"char":"字","explanation":"說明"}，max 3 genuinely visually confusable characters. Always try to find at least one.
- wordFormation: 3–5 common compound words as array of {"word":"詞語","explanation":"簡短說明這個詞的意思"}
- multiPronunciation: ONLY include if the character is a genuine 多音字 (different pronunciations with different grammatical roles or meanings). CRITICAL: all entries must be pronunciations of the EXACT SAME character 「{character}」 — do NOT include a different character that looks similar or is historically related (e.g. 隻 is a completely different character from 只, not a pronunciation of 只). For each pronunciation provide: "pronunciation" (注音), "meaning" (精確說明此讀音的語法功能與意義，例如「動詞：表示做、從事、變成」或「介詞：表示為了、替、因為」，勿混用兩個讀音的意思), "example" (一個詞語，需確認該字在此詞中確實讀這個音，勿用在此讀音下意思模糊的詞). Double-check: each example word must unambiguously belong to that specific pronunciation. Otherwise [].
- synonyms: 2–4 synonyms or similar-meaning words as string array. Always include if any exist.
- antonyms: 2–4 antonyms or opposite-meaning words as string array. Always include if any exist.
- idioms: 1–3 common Chinese idioms containing or related to this character as array of {"idiom":"成語","meaning":"成語的意思"}. Always try to find at least one.
- rhetoric: []`

// 異體字 → 教育部標準字體 對照表
const VARIANT_CHAR_MAP = {
  '爲': '為',
  '裏': '裡',
  '靣': '面',
  '覈': '核',
  '鹼': '鹼',
  '羣': '群',
  '峯': '峰',
  '棱': '稜',
  '凴': '憑',
  '踊': '踴',
}

function normalizeVariantChars(text) {
  if (typeof text !== 'string') return text
  let result = text
  for (const [variant, standard] of Object.entries(VARIANT_CHAR_MAP)) {
    result = result.replaceAll(variant, standard)
  }
  return result
}

function deepNormalize(obj) {
  if (typeof obj === 'string') return normalizeVariantChars(obj)
  if (Array.isArray(obj)) return obj.map(deepNormalize)
  if (obj && typeof obj === 'object') {
    const out = {}
    for (const [key, value] of Object.entries(obj)) {
      out[key] = deepNormalize(value)
    }
    return out
  }
  return obj
}

async function callClaude(apiKey, prompt) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  const data = await res.json()
  if (!data.content || data.content.length === 0) {
    const errMsg = data.error?.message ?? JSON.stringify(data)
    throw new Error(`Claude error: ${errMsg}`)
  }
  const raw = data.content[0]?.text ?? '{}'
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()
  return deepNormalize(JSON.parse(cleaned))
}

function normalizeWordFormation(arr) {
  if (!Array.isArray(arr)) return []
  return arr.map(item => {
    if (typeof item === 'string') return { word: item, explanation: '' }
    return item
  })
}

function normalizeConfusableChars(arr) {
  if (!Array.isArray(arr)) return []
  return arr.map(item => {
    if (typeof item === 'string') return { char: item, explanation: '' }
    return item
  })
}

export default {
  async fetch(request, env) {
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

    let body
    try {
      body = await request.json()
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { character, grade, pronunciationHint } = body
    if (!character || !grade) {
      return new Response(JSON.stringify({ error: 'Missing character or grade' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const apiKey = env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let raw
    try {
      const pronunciationNote = pronunciationHint
        ? `IMPORTANT: In this textbook, 「${character}」 is read as ${pronunciationHint}. Use this pronunciation for vocabulary, sentence, and readingText. In multiPronunciation, list ${pronunciationHint} first.`
        : ''
      const prompt = COMBINED_PROMPT
        .replace(/{character}/g, character)
        .replace(/{grade}/g, String(grade))
        .replace(/{pronunciationNote}/g, pronunciationNote)
      raw = await callClaude(apiKey, prompt)
    } catch (err) {
      return new Response(JSON.stringify({ error: String(err) }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const result = {
      vocabulary: raw.vocabulary ?? '',
      vocabularyBopomofo: raw.vocabularyBopomofo ?? '',
      sentence: raw.sentence ?? '',
      sentenceBopomofo: raw.sentenceBopomofo ?? '',
      readingText: raw.readingText ?? '',
      radical: raw.radical ?? null,
      strokeCount: typeof raw.strokeCount === 'number' ? raw.strokeCount : null,
      definition: raw.definition ?? '',
      extensions: {
        confusableChars: normalizeConfusableChars(raw.confusableChars),
        wordFormation: normalizeWordFormation(raw.wordFormation),
        semanticRelation: raw.semanticRelation ?? [],
        multiPronunciation: raw.multiPronunciation ?? [],
        synonyms: raw.synonyms ?? [],
        antonyms: raw.antonyms ?? [],
        idioms: raw.idioms ?? [],
        rhetoric: [],
      },
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  },
}
