const ABUSIVE_PATTERNS: RegExp[] = [
  /시\s*발|씨\s*발|씨\s*8|ㅅ\s*ㅂ/i,
  /병\s*신|븅\s*신|ㅂ\s*ㅅ/i,
  /개\s*새\s*끼|개\s*새/i,
  /미친\s*놈|미친\s*년|미쳤\s*냐/i,
  /좆|존\s*나|지\s*랄/i,
  /꺼\s*져|닥\s*쳐|죽\s*어|죽\s*여/i,
  /애\s*미|느\s*금|호\s*로\s*새\s*끼/i,
]

function normalizeForModeration(content: string) {
  return content
    .toLowerCase()
    .replace(/[\s\u200b\u2060\-_.,!?~()[\]{}"'`]+/g, '')
}

export function hasAbusiveAnonymousInquiryContent(content: string) {
  const normalized = normalizeForModeration(content)
  return ABUSIVE_PATTERNS.some((pattern) => pattern.test(normalized))
}

export function getAnonymousInquiryModerationError(content: string) {
  if (!hasAbusiveAnonymousInquiryContent(content)) {
    return null
  }

  return '욕설, 비방, 인신공격성 표현은 익명 문의방에 작성할 수 없습니다. 표현을 순화해서 다시 작성해 주세요.'
}
