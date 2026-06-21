import { GoogleGenerativeAI } from '@google/generative-ai'

let client: GoogleGenerativeAI | null = null

export function getGemini(): GoogleGenerativeAI {
  if (!client) {
    if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not set')
    client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  }
  return client
}
