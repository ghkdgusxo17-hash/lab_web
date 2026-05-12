'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { AlertCircle, Loader2, Maximize2, Minimize2 } from 'lucide-react'

declare global {
  interface Window {
    DocsAPI?: {
      DocEditor: new (placeholderId: string, config: Record<string, unknown>) => OnlyOfficeDocEditor
    }
    __onlyOfficeScriptPromise__?: Promise<void>
  }
}

interface OnlyOfficeDocEditor {
  destroyEditor?: () => void
}

interface Props {
  documentServerUrl: string
  config: Record<string, unknown>
}

function buildScriptUrl(documentServerUrl: string) {
  return `${documentServerUrl.replace(/\/+$/, '')}/web-apps/apps/api/documents/api.js`
}

function loadOnlyOfficeScript(documentServerUrl: string) {
  if (typeof window === 'undefined') {
    return Promise.resolve()
  }

  if (window.DocsAPI) {
    return Promise.resolve()
  }

  if (window.__onlyOfficeScriptPromise__) {
    return window.__onlyOfficeScriptPromise__
  }

  const scriptUrl = buildScriptUrl(documentServerUrl)

  window.__onlyOfficeScriptPromise__ = new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${scriptUrl}"]`)

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true })
      existingScript.addEventListener(
        'error',
        () => reject(new Error('ONLYOFFICE script failed to load.')),
        { once: true }
      )
      return
    }

    const script = document.createElement('script')
    script.src = scriptUrl
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('ONLYOFFICE script failed to load.'))
    document.body.appendChild(script)
  })

  return window.__onlyOfficeScriptPromise__
}

export function OnlyOfficeViewerClient({ documentServerUrl, config }: Props) {
  const id = useId()
  const placeholderId = useMemo(() => `onlyoffice-viewer-${id.replace(/[:]/g, '')}`, [id])
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const viewerHostRef = useRef<HTMLDivElement | null>(null)
  const editorRef = useRef<OnlyOfficeDocEditor | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('문서 뷰어를 준비하고 있습니다.')
  const [isFullscreen, setIsFullscreen] = useState(false)

  const documentType = typeof config.documentType === 'string' ? config.documentType : ''
  const viewerType = typeof config.type === 'string' ? config.type : ''
  const usesSlideStage = isFullscreen && documentType === 'slide' && viewerType === 'embedded'
  const effectiveConfig = useMemo(() => {
    const editorConfig =
      config.editorConfig && typeof config.editorConfig === 'object'
        ? (config.editorConfig as Record<string, unknown>)
        : {}
    const customization =
      editorConfig.customization && typeof editorConfig.customization === 'object'
        ? (editorConfig.customization as Record<string, unknown>)
        : {}

    return {
      ...config,
      editorConfig: {
        ...editorConfig,
        customization: {
          ...customization,
          zoom:
            documentType === 'slide'
              ? -2
              : isFullscreen
                ? 140
                : customization.zoom ?? 100,
        },
      },
    }
  }, [config, documentType, isFullscreen])

  useEffect(() => {
    let disposed = false
    let readyFallbackTimer: ReturnType<typeof setTimeout> | null = null
    let observer: MutationObserver | null = null

    function markReady() {
      if (!disposed) {
        setStatus('ready')
      }
    }

    async function setupViewer() {
      const host = viewerHostRef.current

      if (!host) {
        return
      }

      setStatus('loading')
      setErrorMessage('문서 뷰어를 준비하고 있습니다.')
      host.replaceChildren()

      const placeholder = document.createElement('div')
      placeholder.id = placeholderId
      placeholder.className = 'h-full w-full'
      host.appendChild(placeholder)

      try {
        await loadOnlyOfficeScript(documentServerUrl)

        if (disposed) {
          return
        }

        if (!window.DocsAPI) {
          throw new Error('ONLYOFFICE API가 아직 준비되지 않았습니다.')
        }

        const nextConfig = {
          ...effectiveConfig,
          events: {
            onAppReady: () => {
              markReady()
            },
            onDocumentReady: () => {
              markReady()
            },
            onError: (event: { data?: { message?: string } }) => {
              if (!disposed) {
                setStatus('error')
                setErrorMessage(event?.data?.message || '문서를 불러오지 못했습니다.')
              }
            },
          },
        }

        editorRef.current?.destroyEditor?.()
        editorRef.current = new window.DocsAPI.DocEditor(placeholderId, nextConfig)

        observer = new MutationObserver(() => {
          const iframe = host.querySelector('iframe')

          if (!iframe) {
            return
          }

          iframe.addEventListener('load', markReady, { once: true })

          if (readyFallbackTimer) {
            clearTimeout(readyFallbackTimer)
          }

          readyFallbackTimer = setTimeout(() => {
            if (host.querySelector('iframe')) {
              markReady()
            }
          }, 1800)

          observer?.disconnect()
          observer = null
        })

        observer.observe(host, {
          childList: true,
          subtree: true,
        })
      } catch (error) {
        if (!disposed) {
          setStatus('error')
          setErrorMessage(error instanceof Error ? error.message : '문서 뷰어 연결에 실패했습니다.')
        }
      }
    }

    setupViewer()

    return () => {
      disposed = true
      if (readyFallbackTimer) {
        clearTimeout(readyFallbackTimer)
      }
      observer?.disconnect()
      editorRef.current?.destroyEditor?.()
      editorRef.current = null
      viewerHostRef.current?.replaceChildren()
    }
  }, [documentServerUrl, effectiveConfig, placeholderId])

  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(document.fullscreenElement === wrapperRef.current)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  async function toggleFullscreen() {
    const element = wrapperRef.current
    if (!element) {
      return
    }

    if (document.fullscreenElement === element) {
      await document.exitFullscreen()
      return
    }

    await element.requestFullscreen()
  }

  return (
    <div
      ref={wrapperRef}
      className={
        isFullscreen
          ? 'relative flex h-screen min-h-screen w-screen flex-col bg-slate-950 p-4'
          : 'relative h-[72vh] min-h-[560px] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.12)]'
      }
    >
      {isFullscreen ? (
        <div className="mb-4 flex items-center justify-end">
          <button
            type="button"
            onClick={toggleFullscreen}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/12 px-4 py-2 text-sm font-medium text-white shadow-[0_12px_35px_rgba(15,23,42,0.25)] backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/18"
          >
            <Minimize2 className="h-4 w-4" />
            전체화면 종료
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={toggleFullscreen}
          className="absolute right-5 top-12 z-20 inline-flex items-center gap-2 rounded-2xl border border-white/70 bg-white/92 px-4 py-2 text-sm font-medium text-slate-700 shadow-[0_12px_35px_rgba(15,23,42,0.12)] backdrop-blur transition hover:-translate-y-0.5 hover:text-cyan-700"
        >
          <Maximize2 className="h-4 w-4" />
          전체화면
        </button>
      )}

      <div
        className={
          isFullscreen
            ? 'relative flex min-h-0 flex-1 items-center justify-center overflow-hidden'
            : 'relative h-full w-full'
        }
      >
        <div
          className={
            usesSlideStage
              ? 'relative aspect-video w-full max-w-[calc((100vh-8rem)*16/9)] overflow-hidden rounded-[24px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]'
              : isFullscreen
                ? 'relative h-full w-full overflow-hidden rounded-[24px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]'
                : 'relative h-full w-full'
          }
        >
          <div ref={viewerHostRef} className="h-full w-full" />

          {status !== 'ready' && (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-white/90 backdrop-blur-sm">
              <div
                className={`mx-6 w-full max-w-md rounded-3xl border px-6 py-7 ${
                  status === 'error'
                    ? 'border-rose-200 bg-rose-50 text-rose-700'
                    : 'border-cyan-200 bg-cyan-50 text-slate-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 rounded-2xl p-3 ${
                      status === 'error' ? 'bg-rose-100 text-rose-600' : 'bg-white text-cyan-700'
                    }`}
                  >
                    {status === 'error' ? (
                      <AlertCircle className="h-5 w-5" />
                    ) : (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-base font-semibold">
                      {status === 'error' ? '뷰어를 열지 못했습니다' : 'ONLYOFFICE를 불러오는 중입니다'}
                    </h3>
                    <p className="text-sm leading-6">{errorMessage}</p>
                    {status === 'error' && (
                      <p className="text-sm leading-6 text-rose-600">
                        Docker 문서 서버가 켜져 있는지와 `ONLYOFFICE_DOCUMENT_SERVER_URL` 설정을 함께 확인해 주세요.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
