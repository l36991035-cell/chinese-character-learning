import type { Student } from '@/types'

export function getDefaultExtensions(grade: number): Student['enabledExtensions'] {
  return {
    confusableChars: true,
    wordFormation: true,
    semanticRelation: true,
    multiPronunciation: grade >= 3,
    synonyms: grade >= 3,
    antonyms: grade >= 3,
    idioms: grade >= 5,
    rhetoric: grade >= 5,
  }
}
