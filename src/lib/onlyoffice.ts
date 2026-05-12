import 'server-only'

import { jwtVerify, SignJWT } from 'jose'
import type { JWTPayload } from 'jose'
import {
  buildLabMeetingMaterialAbsoluteAccessUrl,
  createLabMeetingMaterialAccessToken,
} from '@/lib/lab-meeting-material-security'
import {
  getOnlyOfficeDocumentType,
  getOnlyOfficeFileType,
  isOnlyOfficeViewable,
} from '@/lib/onlyoffice-shared'

interface ViewerMaterial {
  id: string
  filename: string
  mimeType: string
  title: string
  url: string
  updatedAt: Date
}

interface ViewerIdentity {
  id: string
  name: string | null
}

interface ViewerConfigOptions {
  appearance?: 'embedded' | 'desktop'
  variant?: 'focus' | 'slides'
}

interface OnlyOfficeCallbackPayload extends JWTPayload {
  key?: string
  payload?: {
    key?: string
    document?: {
      key?: string
    }
  }
  document?: {
    key?: string
  }
}

function extractOnlyOfficeCallbackKey(payload: OnlyOfficeCallbackPayload) {
  return (
    payload.document?.key ??
    payload.key ??
    payload.payload?.document?.key ??
    payload.payload?.key ??
    ''
  )
}

function stripTrailingSlash(value: string) {
  return value.replace(/\/+$/, '')
}

function getOnlyOfficeJwtSecret() {
  const secret = process.env.ONLYOFFICE_JWT_SECRET?.trim()

  if (!secret) {
    throw new Error('ONLYOFFICE JWT secret is not configured.')
  }

  return secret
}

function toDockerReachableUrl(rawValue: string | undefined, fallback: string) {
  const source = rawValue?.trim() || fallback

  try {
    const parsed = new URL(source)
    if (parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost') {
      parsed.hostname = 'host.docker.internal'
    }
    return stripTrailingSlash(parsed.toString())
  } catch {
    return stripTrailingSlash(fallback)
  }
}

function buildCallbackUrl(materialId: string) {
  const internalAppBase = toDockerReachableUrl(
    process.env.ONLYOFFICE_INTERNAL_APP_URL,
    process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://127.0.0.1:9891'
  )

  return `${internalAppBase}/api/onlyoffice/callback/${materialId}`
}

async function buildDocumentUrl(materialId: string) {
  const internalAppBase = toDockerReachableUrl(
    process.env.ONLYOFFICE_INTERNAL_APP_URL,
    process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://127.0.0.1:9891'
  )

  const token = await createLabMeetingMaterialAccessToken(materialId, '10m')
  return buildLabMeetingMaterialAbsoluteAccessUrl(internalAppBase, materialId, token)
}

export function getOnlyOfficeDocumentServerUrl() {
  const appBase = stripTrailingSlash(
    process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://127.0.0.1:3000'
  )
  const configuredUrl = process.env.ONLYOFFICE_DOCUMENT_SERVER_URL?.trim()

  if (configuredUrl && !/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/i.test(configuredUrl)) {
    try {
      const configured = new URL(configuredUrl)
      const app = new URL(appBase)

      if (configured.origin === app.origin && stripTrailingSlash(configured.pathname) === '/onlyoffice') {
        return appBase
      }
    } catch {
      return stripTrailingSlash(configuredUrl)
    }

    return stripTrailingSlash(configuredUrl)
  }

  return `${appBase}/onlyoffice`
}

export function isOnlyOfficeConfigured() {
  return Boolean(process.env.ONLYOFFICE_JWT_SECRET?.trim())
}

export function canOpenInOnlyOffice(material: Pick<ViewerMaterial, 'filename' | 'mimeType'>) {
  return isOnlyOfficeViewable(material.filename, material.mimeType)
}

export function isOnlyOfficeSlideMaterial(material: Pick<ViewerMaterial, 'filename' | 'mimeType'>) {
  const fileType = getOnlyOfficeFileType(material.filename, material.mimeType)
  return getOnlyOfficeDocumentType(fileType) === 'slide'
}

export async function buildOnlyOfficeViewerConfig(
  material: ViewerMaterial,
  viewer: ViewerIdentity,
  options: ViewerConfigOptions = {}
) {
  if (!isOnlyOfficeConfigured()) {
    throw new Error('ONLYOFFICE JWT secret is not configured.')
  }

  const fileType = getOnlyOfficeFileType(material.filename, material.mimeType)
  const documentType = getOnlyOfficeDocumentType(fileType)

  if (!fileType || !documentType) {
    throw new Error('ONLYOFFICE에서 지원하지 않는 파일 형식입니다.')
  }

  const appearance = options.appearance ?? 'embedded'
  const isEmbedded = appearance === 'embedded'
  const variant = options.variant ?? 'focus'
  const initialZoom = documentType === 'slide' ? -2 : 100

  const config = {
    documentType,
    height: '100%',
    width: '100%',
    type: isEmbedded ? 'embedded' : 'desktop',
    document: {
      title: material.filename.slice(0, 128),
      url: await buildDocumentUrl(material.id),
      fileType,
      key: `${material.id}-${material.updatedAt.getTime()}`,
    },
    editorConfig: {
      callbackUrl: buildCallbackUrl(material.id),
      lang: 'ko',
      mode: 'view',
      coEditing: {
        mode: 'strict',
        change: false,
      },
      user: {
        id: viewer.id,
        name: viewer.name?.trim() || 'CPE Lab Member',
      },
      ...(isEmbedded
        ? {
            embedded: {
              toolbarDocked: 'top' as const,
            },
          }
        : {}),
      customization: {
        ...(isEmbedded
          ? {
              integrationMode: 'embed' as const,
            }
          : {}),
        compactHeader: true,
        compactToolbar: true,
        toolbarHideFileName: true,
        hideRightMenu: true,
        help: false,
        feedback: false,
        comments: false,
        plugins: false,
        macros: false,
        zoom: initialZoom,
        ...(documentType === 'slide'
          ? {
              hideNotes: true,
            }
          : {}),
        features: {
          featuresTips: false,
          tabStyle: 'line' as const,
          tabBackground: 'toolbar' as const,
        },
      },
    },
    permissions: {
      edit: false,
      print: false,
      download: false,
      copy: true,
      comment: false,
      review: false,
    },
  }

  const token = await new SignJWT(config as unknown as JWTPayload)
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .sign(new TextEncoder().encode(getOnlyOfficeJwtSecret()))

  return {
    ...config,
    token,
  }
}

export async function verifyOnlyOfficeCallbackToken(token: string, materialId: string) {
  const normalizedToken = token.trim()

  if (!normalizedToken) {
    return false
  }

  try {
    const { payload } = await jwtVerify(
      normalizedToken,
      new TextEncoder().encode(getOnlyOfficeJwtSecret())
    )

    const callbackPayload = payload as OnlyOfficeCallbackPayload
    const documentKey = extractOnlyOfficeCallbackKey(callbackPayload)

    if (!documentKey) {
      return false
    }

    return documentKey === materialId || documentKey.startsWith(`${materialId}-`)
  } catch {
    return false
  }
}
