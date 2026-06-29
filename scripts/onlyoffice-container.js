#!/usr/bin/env node

const { spawnSync } = require('child_process')
const http = require('http')
const fs = require('fs')
const path = require('path')

const PROJECT_DIR = path.join(__dirname, '..')
const ENV_FILE = '.env.onlyoffice'
const COMPOSE_FILE = 'docker-compose.onlyoffice.yml'
const SERVICE_NAME = 'onlyoffice-documentserver'
const CONTAINER_NAME = 'labweb_onlyoffice'

// 문서 서버는 컨테이너가 떠도 내부 예열(postgres/rabbitmq/converter)에 30~90초가 더 걸린다.
// up -d 직후 곧바로 문서를 열면 이 예열 창에서 변환이 느리거나 재시도되므로,
// /healthcheck 가 실제로 응답할 때까지 기다린 뒤 서버 기동을 끝낸다.
const HEALTHCHECK_URL =
  process.env.ONLYOFFICE_HEALTHCHECK_URL || 'http://127.0.0.1:9892/healthcheck'
const HEALTHCHECK_TIMEOUT_MS = Number(process.env.ONLYOFFICE_HEALTHCHECK_TIMEOUT_MS || 150000)
const HEALTHCHECK_INTERVAL_MS = 2000

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

function checkHealthOnce() {
  return new Promise((resolve) => {
    const req = http.get(HEALTHCHECK_URL, (res) => {
      let body = ''
      res.on('data', (chunk) => {
        body += chunk
      })
      res.on('end', () => {
        resolve(res.statusCode === 200 && body.trim().toLowerCase().includes('true'))
      })
    })

    req.on('error', () => resolve(false))
    req.setTimeout(3000, () => {
      req.destroy()
      resolve(false)
    })
  })
}

async function waitForHealthy() {
  const deadline = Date.now() + HEALTHCHECK_TIMEOUT_MS
  let warned = false

  while (Date.now() < deadline) {
    if (await checkHealthOnce()) {
      logInfo('문서 서버가 응답을 시작했습니다. (준비 완료)')
      return true
    }

    if (!warned) {
      logInfo('문서 서버 예열을 기다리는 중입니다... (최초 기동 시 30~90초 소요될 수 있습니다)')
      warned = true
    }

    await new Promise((resolve) => setTimeout(resolve, HEALTHCHECK_INTERVAL_MS))
  }

  logInfo('예열 대기 시간이 초과되어 계속 진행합니다. 첫 문서 열람이 잠시 느릴 수 있습니다.')
  return false
}

async function ensureOnlyOffice() {
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
    await waitForHealthy()
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

  await waitForHealthy()
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

async function main() {
  ensureRequiredFiles()

  const command = process.argv[2] || 'ensure'

  if (command === 'ensure') {
    if (process.env.SKIP_ONLYOFFICE_AUTO_START === '1') {
      logInfo('자동 시작을 건너뜁니다. (SKIP_ONLYOFFICE_AUTO_START=1)')
      return
    }

    await ensureOnlyOffice()
    return
  }

  if (command === 'stop') {
    stopOnlyOffice()
    return
  }

  if (command === 'down') {
    removeOnlyOffice()
    return
  }

  exitWithError(`지원하지 않는 명령입니다: ${command}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => exitWithError(error.message))
