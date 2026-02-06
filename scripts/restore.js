#!/usr/bin/env node
/**
 * DB 복원 스크립트
 * 사용법: node scripts/restore.js <백업파일명>
 * 예시:   node scripts/restore.js backup_2026-02-07T03-43_before-migration.sql
 *
 * 파일명 없이 실행하면 사용 가능한 백업 목록을 보여줍니다.
 * npm 스크립트: npm run db:restore -- <백업파일명>
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const readline = require('readline')

const BACKUP_DIR = path.join(__dirname, '..', 'backups')
const CONTAINER_NAME = 'supabase_db_Supabase'

const backupFile = process.argv[2]

// 백업 목록 표시
function listBackups() {
    if (!fs.existsSync(BACKUP_DIR)) {
        console.log('백업 폴더가 없습니다.')
        return
    }

    const backups = fs.readdirSync(BACKUP_DIR)
        .filter(f => f.startsWith('backup_') && f.endsWith('.sql'))
        .sort()
        .reverse()

    if (backups.length === 0) {
        console.log('사용 가능한 백업이 없습니다.')
        return
    }

    console.log('\n[사용 가능한 백업 목록]:')
    backups.forEach(f => {
        const stats = fs.statSync(path.join(BACKUP_DIR, f))
        const sizeKB = Math.round(stats.size / 1024)
        console.log(`  ${f}  (${sizeKB} KB)`)
    })
    console.log(`\n사용법: node scripts/restore.js <파일명>`)
}

if (!backupFile) {
    listBackups()
    process.exit(0)
}

const filepath = path.join(BACKUP_DIR, backupFile)
if (!fs.existsSync(filepath)) {
    console.error(`[오류] 파일을 찾을 수 없습니다: ${backupFile}`)
    listBackups()
    process.exit(1)
}

// 확인 프롬프트
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
console.log('\n============================================')
console.log(' 주의: 현재 DB의 모든 데이터가 덮어쓰기됩니다!')
console.log(` 복원할 파일: ${backupFile}`)
console.log('============================================\n')

rl.question('정말 복원하시겠습니까? (y/N): ', (answer) => {
    rl.close()

    if (answer.toLowerCase() !== 'y') {
        console.log('[취소됨]')
        process.exit(0)
    }

    try {
        // 1. 복원 전 현재 DB 백업
        console.log('\n[1/3] 복원 전 현재 DB 백업 중...')
        execSync('node scripts/backup.js before-restore', {
            cwd: path.join(__dirname, '..'),
            stdio: 'inherit'
        })

        // 2. 기존 스키마 초기화
        console.log('\n[2/3] 기존 데이터 정리 중...')
        execSync(
            `docker exec ${CONTAINER_NAME} psql -U postgres -d postgres -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO postgres; GRANT ALL ON SCHEMA public TO public;"`,
            { stdio: 'inherit' }
        )

        // 3. 백업 파일 복원
        console.log('\n[3/3] 백업 파일 복원 중...')
        execSync(
            `docker exec -i ${CONTAINER_NAME} psql -U postgres -d postgres < "${filepath}"`,
            { stdio: ['pipe', 'pipe', 'pipe'], timeout: 120000 }
        )

        console.log(`\n[복원 완료] ${backupFile}`)
        console.log('[참고] 앱 서버를 재시작하세요: npm run dev')
    } catch (error) {
        console.error('\n[오류] 복원 중 문제 발생:', error.message)
        console.log('[참고] before-restore 백업으로 롤백 가능합니다')
        process.exit(1)
    }
})
