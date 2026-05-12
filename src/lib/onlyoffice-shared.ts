export type OnlyOfficeDocumentType = 'word' | 'cell' | 'slide' | 'pdf' | 'diagram'

const FILE_TYPE_TO_DOCUMENT_TYPE: Record<string, OnlyOfficeDocumentType> = {
  doc: 'word',
  docm: 'word',
  docx: 'word',
  dot: 'word',
  dotm: 'word',
  dotx: 'word',
  epub: 'word',
  fb2: 'word',
  fodt: 'word',
  htm: 'word',
  html: 'word',
  hwp: 'word',
  hwpx: 'word',
  mht: 'word',
  mhtml: 'word',
  md: 'word',
  odt: 'word',
  ott: 'word',
  pages: 'word',
  rtf: 'word',
  txt: 'word',
  wps: 'word',
  wpt: 'word',
  xml: 'word',
  csv: 'cell',
  et: 'cell',
  ett: 'cell',
  fods: 'cell',
  numbers: 'cell',
  ods: 'cell',
  ots: 'cell',
  sxc: 'cell',
  xls: 'cell',
  xlsb: 'cell',
  xlsm: 'cell',
  xlsx: 'cell',
  xlt: 'cell',
  xltm: 'cell',
  xltx: 'cell',
  dps: 'slide',
  dpt: 'slide',
  fodp: 'slide',
  key: 'slide',
  odp: 'slide',
  otp: 'slide',
  pot: 'slide',
  potm: 'slide',
  potx: 'slide',
  pps: 'slide',
  ppsm: 'slide',
  ppsx: 'slide',
  ppt: 'slide',
  pptm: 'slide',
  pptx: 'slide',
  sxi: 'slide',
  djvu: 'pdf',
  oxps: 'pdf',
  pdf: 'pdf',
  xps: 'pdf',
  vsdm: 'diagram',
  vsdx: 'diagram',
  vssm: 'diagram',
  vssx: 'diagram',
  vstm: 'diagram',
  vstx: 'diagram',
}

const MIME_EXTENSION_MAP: Record<string, string> = {
  'application/msword': 'doc',
  'application/pdf': 'pdf',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/vnd.openxmlformats-officedocument.presentationml.slideshow': 'ppsx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.oasis.opendocument.presentation': 'odp',
  'application/vnd.oasis.opendocument.spreadsheet': 'ods',
  'application/vnd.oasis.opendocument.text': 'odt',
  'text/csv': 'csv',
  'text/markdown': 'md',
  'text/plain': 'txt',
}

export function getOnlyOfficeFileType(filename: string, mimeType?: string | null) {
  const normalizedFilename = filename.trim().toLowerCase()
  const directExtension = normalizedFilename.includes('.')
    ? normalizedFilename.split('.').pop() ?? ''
    : ''

  if (directExtension && FILE_TYPE_TO_DOCUMENT_TYPE[directExtension]) {
    return directExtension
  }

  const normalizedMimeType = (mimeType ?? '').trim().toLowerCase()
  return MIME_EXTENSION_MAP[normalizedMimeType] ?? ''
}

export function getOnlyOfficeDocumentType(fileType: string): OnlyOfficeDocumentType | null {
  return FILE_TYPE_TO_DOCUMENT_TYPE[fileType.toLowerCase()] ?? null
}

export function isOnlyOfficeViewable(filename: string, mimeType?: string | null) {
  const fileType = getOnlyOfficeFileType(filename, mimeType)
  return Boolean(fileType && getOnlyOfficeDocumentType(fileType))
}
