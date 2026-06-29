import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, Download, ExternalLink } from 'lucide-react'
import { auth } from '@/auth'
import { Navbar } from '@/components/layout'
import { getLabMeetingMaterialAccessPath } from '@/lib/lab-meeting-material-security-shared'
import { prisma } from '@/lib/prisma'
import {
  buildOnlyOfficeViewerConfig,
  canOpenInOnlyOffice,
  getOnlyOfficeDocumentServerUrl,
  isOnlyOfficeConfigured,
  isOnlyOfficeSlideMaterial,
} from '@/lib/onlyoffice'
import { OnlyOfficeViewerClient } from '@/app/materials/lab-meeting/[id]/materials/[materialId]/viewer/OnlyOfficeViewerClient'

export const dynamic = 'force-dynamic'

interface ViewerPageParams {
  id: string
  materialId: string
}

async function getPartitionMaterialForViewer(partitionId: string, materialId: string) {
  return prisma.material.findFirst({
    where: {
      id: materialId,
      partitionId,
    },
    select: {
      id: true,
      title: true,
      filename: true,
      url: true,
      mimeType: true,
      updatedAt: true,
      partition: {
        select: {
          id: true,
          name: true,
          category: true,
          emoji: true,
        },
      },
    },
  })
}

export async function generateMetadata({
  params,
}: {
  params: Promise<ViewerPageParams>
}): Promise<Metadata> {
  const { id, materialId } = await params
  const material = await getPartitionMaterialForViewer(id, materialId)

  if (!material) {
    return {
      title: '자료 뷰어 | 연구자료',
    }
  }

  return {
    title: `${material.title} | 자료 뷰어`,
    description: `${material.partition?.name || '연구자료'} 자료를 웹 뷰어로 확인합니다.`,
  }
}

export default async function PartitionMaterialViewerPage({
  params,
}: {
  params: Promise<ViewerPageParams>
}) {
  const { id, materialId } = await params
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const material = await getPartitionMaterialForViewer(id, materialId)

  if (!material || !material.partition) {
    notFound()
  }

  if (!canOpenInOnlyOffice(material)) {
    redirect(`/materials/partition/${id}`)
  }

  const isSlideMaterial = isOnlyOfficeSlideMaterial(material)
  const viewerAppearance = isSlideMaterial ? 'desktop' : 'embedded'
  const materialAccessPath = getLabMeetingMaterialAccessPath(material.id)
  const documentServerUrl = getOnlyOfficeDocumentServerUrl()
  const isConfigured = isOnlyOfficeConfigured()
  const viewerConfig = isConfigured
    ? await buildOnlyOfficeViewerConfig(
        material,
        {
          id: session.user.id,
          name: session.user.name ?? null,
        },
        {
          appearance: viewerAppearance,
          variant: isSlideMaterial ? 'slides' : 'focus',
        }
      )
    : null

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.12),_transparent_32%),linear-gradient(180deg,#f8fdff_0%,#eef8ff_52%,#f8fbff_100%)] px-6 pb-20 pt-32">
        <div className="mx-auto max-w-7xl space-y-6">
          <div className="rounded-[30px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0 space-y-3">
                <Link
                  href={`/materials/partition/${id}`}
                  className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-cyan-700"
                >
                  <ArrowLeft className="h-4 w-4" />
                  연구자료 목록으로 돌아가기
                </Link>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-cyan-700">
                    {material.partition.emoji} {material.partition.name}
                  </p>
                  <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
                    {material.title}
                  </h1>
                  <p className="max-w-3xl text-sm leading-6 text-slate-500 md:text-base">
                    다운로드하지 않고 바로 확인할 수 있는 연구자료 뷰어입니다.
                    {isSlideMaterial
                      ? ' 발표자료는 슬라이드가 한눈에 보이도록 맞춤 보기로 열립니다.'
                      : ' 문서 내용에 집중할 수 있도록 뷰어 메뉴를 최소화했습니다.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={materialAccessPath}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-900"
                >
                  <ExternalLink className="h-4 w-4" />
                  원본 열기
                </Link>
                <Link
                  href={materialAccessPath}
                  download={material.filename}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#0f172a_0%,#0891b2_100%)] px-4 py-3 text-sm font-medium text-white shadow-[0_18px_40px_rgba(8,145,178,0.26)] transition-transform hover:-translate-y-0.5"
                >
                  <Download className="h-4 w-4" />
                  다운로드
                </Link>
              </div>
            </div>
          </div>

          {viewerConfig ? (
            <OnlyOfficeViewerClient documentServerUrl={documentServerUrl} config={viewerConfig} />
          ) : (
            <div className="rounded-[30px] border border-amber-200 bg-white p-8 shadow-[0_20px_70px_rgba(15,23,42,0.08)]">
              <div className="max-w-2xl space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-amber-600">
                  Viewer Setup Needed
                </p>
                <h2 className="text-2xl font-semibold text-slate-900">
                  ONLYOFFICE 문서 서버 설정이 필요합니다
                </h2>
                <p className="text-sm leading-6 text-slate-600 md:text-base">
                  ONLYOFFICE 환경 변수와 Docker 문서 서버를 준비하면 이 화면에서 바로 자료를 볼 수 있습니다.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
