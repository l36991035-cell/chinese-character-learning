import type { Extensions, Student } from '@/types'

interface ExtensionPanelProps {
  character: string
  extensions: Extensions
  enabledExtensions: Student['enabledExtensions']
}

export function ExtensionPanel({ character, extensions, enabledExtensions }: ExtensionPanelProps) {
  const sections = []

  if (enabledExtensions.confusableChars && extensions.confusableChars.length > 0) {
    sections.push(
      <section key="confusable" className="bg-white rounded-2xl border border-gray-200 p-5">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">易混淆字</h3>
        <div className="flex flex-col gap-2">
          {extensions.confusableChars.map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="text-2xl font-bold text-red-500 w-10 text-center">{item.char}</span>
              <span className="text-base text-gray-600">{item.explanation}</span>
            </div>
          ))}
        </div>
      </section>
    )
  }

  if (enabledExtensions.wordFormation && extensions.wordFormation.length > 0) {
    sections.push(
      <section key="word" className="bg-white rounded-2xl border border-gray-200 p-5">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">造詞</h3>
        <div className="flex flex-wrap gap-2">
          {extensions.wordFormation.map((w, i) => (
            <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-base font-medium">{w}</span>
          ))}
        </div>
      </section>
    )
  }

  if (enabledExtensions.semanticRelation && extensions.semanticRelation.length > 0) {
    sections.push(
      <section key="semantic" className="bg-white rounded-2xl border border-gray-200 p-5">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">找朋友</h3>
        <div className="flex flex-wrap gap-2">
          {extensions.semanticRelation.map((w, i) => (
            <span key={i} className="px-3 py-1 bg-green-50 text-green-700 rounded-lg text-base font-medium">{w}</span>
          ))}
        </div>
      </section>
    )
  }

  if (enabledExtensions.multiPronunciation && extensions.multiPronunciation.length > 0) {
    sections.push(
      <section key="multi" className="bg-white rounded-2xl border border-gray-200 p-5">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">多音字</h3>
        <div className="flex flex-col gap-3">
          {extensions.multiPronunciation.map((item, i) => (
            <div key={i} className="flex flex-col gap-1">
              <span className="text-xl font-bold text-blue-600">{item.pronunciation}</span>
              <span className="text-base text-gray-600">{item.meaning}｜例：{item.example}</span>
            </div>
          ))}
        </div>
      </section>
    )
  }

  if (enabledExtensions.synonyms && extensions.synonyms.length > 0) {
    sections.push(
      <section key="synonyms" className="bg-white rounded-2xl border border-gray-200 p-5">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">同義詞</h3>
        <div className="flex flex-wrap gap-2">
          {extensions.synonyms.map((w, i) => (
            <span key={i} className="px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-base font-medium">{w}</span>
          ))}
        </div>
      </section>
    )
  }

  if (enabledExtensions.antonyms && extensions.antonyms.length > 0) {
    sections.push(
      <section key="antonyms" className="bg-white rounded-2xl border border-gray-200 p-5">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">反義詞</h3>
        <div className="flex flex-wrap gap-2">
          {extensions.antonyms.map((w, i) => (
            <span key={i} className="px-3 py-1 bg-orange-50 text-orange-700 rounded-lg text-base font-medium">{w}</span>
          ))}
        </div>
      </section>
    )
  }

  if (enabledExtensions.idioms && extensions.idioms.length > 0) {
    sections.push(
      <section key="idioms" className="bg-white rounded-2xl border border-gray-200 p-5">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">成語</h3>
        <div className="flex flex-col gap-3">
          {extensions.idioms.map((item, i) => (
            <div key={i} className="flex flex-col gap-1">
              <span className="text-xl font-bold text-gray-800">{item.idiom}</span>
              <span className="text-base text-gray-600">{item.meaning}</span>
            </div>
          ))}
        </div>
      </section>
    )
  }

  if (enabledExtensions.rhetoric && extensions.rhetoric.length > 0) {
    sections.push(
      <section key="rhetoric" className="bg-white rounded-2xl border border-gray-200 p-5">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">修辭</h3>
        <div className="flex flex-col gap-3">
          {extensions.rhetoric.map((item, i) => (
            <div key={i} className="flex flex-col gap-1">
              <span className="text-base font-semibold text-gray-700">{item.type}</span>
              <span className="text-base text-gray-600 italic">{item.example}</span>
            </div>
          ))}
        </div>
      </section>
    )
  }

  if (sections.length === 0) return null

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold text-gray-800 border-l-4 border-blue-500 pl-3">{character}</h2>
      {sections}
    </div>
  )
}
