import { Suspense } from 'react'
import ExtensionClient from './ExtensionClient'

export default function ExtensionPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><p className="text-lg text-gray-500">載入中…</p></div>}>
      <ExtensionClient />
    </Suspense>
  )
}
