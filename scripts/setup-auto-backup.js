#!/usr/bin/env node
/**
 * Windows 작업 스케줄러에 매일 자동 백업 등록
 * 사용법: node scripts/setup-auto-backup.js
 *
 * - 매일 새벽 3시에 DB 백업 실행
 * - 제거: schtasks /delete /tn "CPELab-DB-Backup" /f
 */

const { execSync } = require('child_process')
const path = require('path')

const TASK_NAME = 'CPELab-DB-Backup'
const PROJECT_DIR = path.join(__dirname, '..')
const NODE_PATH = process.execPath // 현재 node.exe 경로
const SCRIPT_PATH = path.join(__dirname, 'backup.js')

// 기존 작업 삭제 (있으면)
try {
    execSync(`schtasks /delete /tn "${TASK_NAME}" /f`, { stdio: 'pipe' })
    console.log('[기존 작업 삭제됨]')
} catch {
    // 없으면 무시
}

// 새 작업 등록 (매일 03:00)
const command = `schtasks /create /tn "${TASK_NAME}" /tr "\\"${NODE_PATH}\\" \\"${SCRIPT_PATH}\\" daily" /sc daily /st 03:00 /rl HIGHEST /f`

try {
    execSync(command, { stdio: 'inherit' })
    console.log('')
    console.log('[자동 백업 설정 완료]')
    console.log(`  작업 이름: ${TASK_NAME}`)
    console.log('  실행 시간: 매일 03:00')
    console.log(`  백업 위치: ${path.join(PROJECT_DIR, 'backups')}`)
    console.log('')
    console.log('확인: schtasks /query /tn "CPELab-DB-Backup"')
    console.log('제거: schtasks /delete /tn "CPELab-DB-Backup" /f')
} catch (error) {
    console.error('[오류] 작업 스케줄러 등록 실패:', error.message)
    console.log('[참고] 관리자 권한으로 실행해보세요')
    process.exit(1)
}
