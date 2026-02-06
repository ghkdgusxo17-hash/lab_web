#!/usr/bin/env node
/**
 * DB 백업 스크립트
 * 사용법: node scripts/backup.js [라벨]
 * 예시:   node scripts/backup.js before-migration
 *         node scripts/backup.js daily
 *
 * npm 스크립트: npm run db:backup
 *              npm run db:backup -- before-migration
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const BACKUP_DIR = path.join(__dirname, '..', 'backups')
const MAX_BACKUPS = 30
const CONTAINER_NAME = 'supabase_db_Supabase'

// 타임스탬프 생성
const now = new Date()
const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 16) // 2026-02-07T03-43

// 라벨
const label = process.argv[2] || ''
const filename = label
    ? `backup_${timestamp}_${label}.sql`
    : `backup_${timestamp}.sql`

const filepath = path.join(BACKUP_DIR, filename)

// backups 디렉토리 생성
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true })
}

console.log(`[백업] ${filename} 생성 중...`)

try {
    // Docker 컨테이너에서 pg_dump 실행
    execSync(
        `docker exec ${CONTAINER_NAME} pg_dump -U postgres -d postgres --no-owner --no-acl > "${filepath}"`,
        { stdio: ['pipe', 'pipe', 'pipe'], timeout: 60000 }
    )

    const stats = fs.statSync(filepath)
    const sizeKB = Math.round(stats.size / 1024)

    if (stats.size < 100) {
        console.error('[오류] 백업 파일이 너무 작습니다. Docker 컨테이너를 확인하세요.')
        fs.unlinkSync(filepath)
        process.exit(1)
    }

    console.log(`[백업 완료] backups/${filename} (${sizeKB} KB)`)

    // 오래된 백업 정리 (MAX_BACKUPS 초과 시)
    const backups = fs.readdirSync(BACKUP_DIR)
        .filter(f => f.startsWith('backup_') && f.endsWith('.sql'))
        .sort() // 이름순 = 날짜순

    if (backups.length > MAX_BACKUPS) {
        const toDelete = backups.slice(0, backups.length - MAX_BACKUPS)
        toDelete.forEach(f => {
            fs.unlinkSync(path.join(BACKUP_DIR, f))
            console.log(`[정리] ${f} 삭제`)
        })
    }
} catch (error) {
    console.error('[오류] 백업 실패:', error.message)
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath)
    process.exit(1)
}
