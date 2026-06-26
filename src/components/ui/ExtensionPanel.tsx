import type { Extensions } from '@/types'

interface ExtensionPanelProps {
  character: string
  bopomofo?: string
  definition?: string
  radical?: string | null
  strokeCount?: number | null
  extensions: Extensions
}

export function ExtensionPanel({
  character,
  bopomofo,
  definition,
  radical,
  strokeCount,
  extensions,
}: ExtensionPanelProps) {
  const definitionLines = definition
    ? definition.split('\n').map(s => s.trim()).filter(Boolean)
    : []

  // Handle old string[] format for wordFormation
  const wordFormation = (extensions.wordFormation as Array<{ word: string; explanation: string } | string>)
    .map(item => typeof item === 'string' ? { word: item, explanation: '' } : item)

  return (
    <div className="flex flex-col gap-4">

      {/* 生字主標題 */}
      <div className="bg-white rounded-2xl border-2 border-blue-200 p-6 flex flex-col items-center gap-3">
        <span className="text-8xl font-bold text-gray-800">{character}</span>
        {bopomofo && (
          <span className="text-2xl text-blue-600 tracking-widest">{bopomofo}</span>
        )}
        {(radical != null || strokeCount != null) && (
          <div className="flex gap-6 text-lg text-gray-500 mt-1">
            {radical && <span>部首：<span className="font-bold text-gray-700">{radical}</span></span>}
            {strokeCount != null && <span>筆畫：<span className="font-bold text-gray-700">{strokeCount} 畫</span></span>}
          </div>
        )}
      </div>

      {/* 生字解釋 */}
      {definitionLines.length > 0 && (
        <section className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">📖 生字解釋</h3>
          <div className="flex flex-col gap-2">
            {definitionLines.map((line, i) => (
              <p key={i} className="text-base text-gray-700 leading-relaxed">
                {definitionLines.length > 1 && (
                  <span className="font-semibold text-blue-600 mr-1">{i + 1}.</span>
                )}
                {line}
              </p>
            ))}
          </div>
        </section>
      )}

      {/* 造詞 */}
      {wordFormation.length > 0 && (
        <section className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">✏️ 造詞</h3>
          <div className="flex flex-col gap-3">
            {wordFormation.map((item, i) => (
              <div key={i} className="flex flex-col gap-0.5">
                <span className="text-xl font-bold text-blue-700">{item.word}</span>
                {item.explanation && (
                  <span className="text-base text-gray-600">{item.explanation}</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 多音字 */}
      {extensions.multiPronunciation.length > 0 && (
        <section className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">🔊 多音字</h3>
          <div className="flex flex-col gap-4">
            {extensions.multiPronunciation.map((item, i) => (
              <div key={i} className="flex flex-col gap-1">
                <span className="text-2xl font-bold text-blue-600">{item.pronunciation}</span>
                <span className="text-lg font-semibold text-gray-800">{item.example}</span>
                <span className="text-base text-gray-600">{item.meaning}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 同義字 + 相反字 */}
      {(extensions.synonyms.length > 0 || extensions.antonyms.length > 0) && (
        <section className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">🔄 同義字 / 相反字</h3>
          {extensions.synonyms.length > 0 && (
            <div className="mb-3">
              <p className="text-sm text-gray-500 mb-2">同義字</p>
              <div className="flex flex-wrap gap-2">
                {extensions.synonyms.map((w, i) => (
                  <span key={i} className="px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-base font-medium">{w}</span>
                ))}
              </div>
            </div>
          )}
          {extensions.antonyms.length > 0 && (
            <div>
              <p className="text-sm text-gray-500 mb-2">相反字</p>
              <div className="flex flex-wrap gap-2">
                {extensions.antonyms.map((w, i) => (
                  <span key={i} className="px-3 py-1 bg-orange-50 text-orange-700 rounded-lg text-base font-medium">{w}</span>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* 易混淆的字 */}
      {extensions.confusableChars.length > 0 && (
        <section className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">👀 易混淆的字</h3>
          <div className="flex flex-col gap-3">
            {extensions.confusableChars.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-3xl font-bold text-red-500 w-12 text-center shrink-0">{item.char}</span>
                <span className="text-base text-gray-600 pt-1">{item.explanation}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 成語 */}
      {extensions.idioms.length > 0 && (
        <section className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">🏮 成語</h3>
          <div className="flex flex-col gap-4">
            {extensions.idioms.map((item, i) => (
              <div key={i} className="flex flex-col gap-1">
                <span className="text-2xl font-bold text-gray-800">{item.idiom}</span>
                <span className="text-base text-gray-600">{item.meaning}</span>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  )
}
