'use client'
import type { Extensions } from '@/types'
import { AudioPlayer } from '@/components/ui/AudioPlayer'

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
      <div className="bg-card rounded-xl border-2 border-gold p-6 flex flex-col items-center gap-3" style={{ boxShadow: '0 2px 16px rgba(44,24,16,0.1), inset 0 1px 0 rgba(255,255,255,0.9)' }}>
        <span className="text-8xl font-bold text-ink font-serif">{character}</span>
        {bopomofo && (
          <span className="text-2xl text-[#8b7355] tracking-widest font-serif">{bopomofo}</span>
        )}
        {(radical != null || strokeCount != null) && (
          <div className="flex gap-6 text-lg text-[#a89060] mt-1">
            {radical && <span>部首：<span className="font-semibold text-[#8b7355]">{radical}</span></span>}
            {strokeCount != null && <span>筆畫：<span className="font-semibold text-[#8b7355]">{strokeCount} 畫</span></span>}
          </div>
        )}
        <AudioPlayer text={character} />
      </div>

      {/* 生字解釋 */}
      {definitionLines.length > 0 && (
        <section className="bg-card rounded-xl border border-gold p-5">
          <h3 className="text-base font-semibold text-ink mb-3 pl-3 border-l-2 border-zhu tracking-widest font-serif">生字解釋</h3>
          <div className="flex flex-col gap-2">
            {definitionLines.map((line, i) => (
              <p key={i} className="text-base text-ink leading-relaxed">
                {definitionLines.length > 1 && (
                  <span className="font-semibold text-zhu mr-1">{i + 1}.</span>
                )}
                {line}
              </p>
            ))}
          </div>
        </section>
      )}

      {/* 造詞 */}
      {wordFormation.length > 0 && (
        <section className="bg-card rounded-xl border border-gold p-5">
          <h3 className="text-base font-semibold text-ink mb-3 pl-3 border-l-2 border-zhu tracking-widest font-serif">造詞</h3>
          <div className="flex flex-col gap-3">
            {wordFormation.map((item, i) => (
              <div key={i} className="flex flex-col gap-0.5">
                <span className="text-xl font-bold text-ink font-serif">{item.word}</span>
                {item.explanation && (
                  <span className="text-base text-[#8b7355]">{item.explanation}</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 多音字 */}
      {extensions.multiPronunciation.length > 0 && (
        <section className="bg-card rounded-xl border border-gold p-5">
          <h3 className="text-base font-semibold text-ink mb-3 pl-3 border-l-2 border-zhu tracking-widest font-serif">多音字</h3>
          <div className="flex flex-col gap-4">
            {extensions.multiPronunciation.map((item, i) => (
              <div key={i} className="flex flex-col gap-1">
                <span className="text-2xl font-bold text-zhu font-serif">{item.pronunciation}</span>
                <span className="text-lg font-semibold text-ink font-serif">{item.example}</span>
                <span className="text-base text-[#8b7355]">{item.meaning}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 同義字 + 相反字 */}
      {(extensions.synonyms.length > 0 || extensions.antonyms.length > 0) && (
        <section className="bg-card rounded-xl border border-gold p-5">
          <h3 className="text-base font-semibold text-ink mb-3 pl-3 border-l-2 border-zhu tracking-widest font-serif">同義字 ／ 相反字</h3>
          {extensions.synonyms.length > 0 && (
            <div className="mb-3">
              <p className="text-sm text-[#a89060] mb-2">同義字</p>
              <div className="flex flex-wrap gap-2">
                {extensions.synonyms.map((w, i) => (
                  <span key={i} className="px-3 py-1 bg-paper text-[#8b7355] border border-gold rounded-md text-base font-medium">{w}</span>
                ))}
              </div>
            </div>
          )}
          {extensions.antonyms.length > 0 && (
            <div>
              <p className="text-sm text-[#a89060] mb-2">相反字</p>
              <div className="flex flex-wrap gap-2">
                {extensions.antonyms.map((w, i) => (
                  <span key={i} className="px-3 py-1 bg-[#fef0e6] text-[#8b5e3c] border border-[#e8c4a0] rounded-md text-base font-medium">{w}</span>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* 易混淆的字 */}
      {extensions.confusableChars.length > 0 && (
        <section className="bg-card rounded-xl border border-gold p-5">
          <h3 className="text-base font-semibold text-ink mb-3 pl-3 border-l-2 border-zhu tracking-widest font-serif">易混淆的字</h3>
          <div className="flex flex-col gap-3">
            {extensions.confusableChars.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-3xl font-bold text-zhu w-12 text-center shrink-0 font-serif">{item.char}</span>
                <span className="text-base text-[#8b7355] pt-1">{item.explanation}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 成語 */}
      {extensions.idioms.length > 0 && (
        <section className="bg-card rounded-xl border border-gold p-5">
          <h3 className="text-base font-semibold text-ink mb-3 pl-3 border-l-2 border-zhu tracking-widest font-serif">成語</h3>
          <div className="flex flex-col gap-4">
            {extensions.idioms.map((item, i) => (
              <div key={i} className="flex flex-col gap-1">
                <span className="text-2xl font-bold text-ink font-serif tracking-widest">{item.idiom}</span>
                <span className="text-base text-[#8b7355]">{item.meaning}</span>
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  )
}
