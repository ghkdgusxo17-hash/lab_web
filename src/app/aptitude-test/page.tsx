import type { Metadata } from 'next'
import { Navbar } from '@/components/layout'
import { getPublicLabNotes } from '@/actions/lab-note'
import { AptitudeTestClient } from './AptitudeTestClient'

export const metadata: Metadata = {
  title: '연구 성향 테스트 | CPE Lab',
  description: '학부생도 참여할 수 있는 10문항 공개 테스트와 5축 연구 성향 그래프',
}

export default async function AptitudeTestPage() {
  const publicNotes = await getPublicLabNotes()

  return (
    <>
      <Navbar />
      <main className="min-h-screen px-6 pb-20 pt-32">
        <div className="mx-auto max-w-6xl">
          <AptitudeTestClient publicNotes={publicNotes} />
        </div>
      </main>
    </>
  )
}
