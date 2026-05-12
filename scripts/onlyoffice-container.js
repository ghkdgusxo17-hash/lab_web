#!/usr/bin/env node

const { spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const PROJECT_DIR = path.join(__dirname, '..')
const ENV_FILE = '.env.onlyoffice'
const COMPOSE_FILE = 'docker-compose.onlyoffice.yml'
const SERVICE_NAME = 'onlyoffice-documentserver'
const CONTAINER_NAME = 'labweb_onlyoffice'

function logInfo(message) {
  console.log(`[ONLYOFFICE] ${message}`)
}

function exitWithError(message) {
  console.error(`[ONLYOFFICE] ${message}`)
  process.exit(1)
}

function ensureRequiredFiles() {
  for (const file of [ENV_FILE, COMPOSE_FILE]) {
    const fullPath = path.join(PROJECT_DIR, file)
    if (!fs.existsSync(fullPath)) {
      exitWithError(`${file} 파일을 찾을 수 없습니다.`)
    }
  }
}

function runDocker(args) {
  const result = spawnSync('docker', args, {
    cwd: PROJECT_DIR,
    encoding: 'utf8',
    stdio: 'pipe',
  })

  if (result.error) {
    throw result.error
  }

  return result
}

function relayOutput(result) {
  if (result.stdout) {
    process.stdout.write(result.stdout)
  }

  if (result.stderr) {
    process.stderr.write(result.stderr)
  }
}

function ensureOnlyOffice() {
  logInfo('문서 서버를 확인하고 필요하면 자동으로 시작합니다.')

  const composeResult = runDocker([
    'compose',
    '--env-file',
    ENV_FILE,
    '-f',
    COMPOSE_FILE,
    'up',
    '-d',
    SERVICE_NAME,
  ])

  if (composeResult.status === 0) {
    relayOutput(composeResult)
    return
  }

  const combinedOutput = `${composeResult.stdout || ''}\n${composeResult.stderr || ''}`
  const hasNameConflict =
    combinedOutput.includes(`container name "/${CONTAINER_NAME}" is already in use`) ||
    combinedOutput.includes(`container name "${CONTAINER_NAME}" is already in use`)

  if (!hasNameConflict) {
    relayOutput(composeResult)
    exitWithError(`docker compose up -d exited with code ${composeResult.status}`)
  }

  logInfo('기존 ONLYOFFICE 컨테이너를 찾아 다시 시작합니다.')

  const startResult = runDocker(['start', CONTAINER_NAME])
  relayOutput(startResult)

  if (startResult.status !== 0) {
    exitWithError(`docker start ${CONTAINER_NAME} exited with code ${startResult.status}`)
  }
}

function stopOnlyOffice() {
  logInfo('ONLYOFFICE 컨테이너를 정지합니다.')

  const result = runDocker(['stop', CONTAINER_NAME])
  const combinedOutput = `${result.stdout || ''}\n${result.stderr || ''}`

  if (combinedOutput.includes('No such container')) {
    logInfo('정지할 ONLYOFFICE 컨테이너가 없습니다.')
    return
  }

  relayOutput(result)

  if (result.status !== 0) {
    exitWithError(`docker stop ${CONTAINER_NAME} exited with code ${result.status}`)
  }
}

function removeOnlyOffice() {
  logInfo('ONLYOFFICE 컨테이너를 완전히 제거합니다.')

  const result = runDocker(['rm', '-f', CONTAINER_NAME])
  const combinedOutput = `${result.stdout || ''}\n${result.stderr || ''}`

  if (combinedOutput.includes('No such container')) {
    logInfo('제거할 ONLYOFFICE 컨테이너가 없습니다.')
    return
  }

  relayOutput(result)

  if (result.status !== 0) {
    exitWithError(`docker rm -f ${CONTAINER_NAME} exited with code ${result.status}`)
  }
}

try {
  ensureRequiredFiles()

  const command = process.argv[2] || 'ensure'

  if (command === 'ensure') {
    if (process.env.SKIP_ONLYOFFICE_AUTO_START === '1') {
      logInfo('자동 시작을 건너뜁니다. (SKIP_ONLYOFFICE_AUTO_START=1)')
      process.exit(0)
    }

    ensureOnlyOffice()
    process.exit(0)
  }

  if (command === 'stop') {
    stopOnlyOffice()
    process.exit(0)
  }

  if (command === 'down') {
    removeOnlyOffice()
    process.exit(0)
  }

  exitWithError(`지원하지 않는 명령입니다: ${command}`)
} catch (error) {
  exitWithError(error.message)
}
