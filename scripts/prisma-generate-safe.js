const { existsSync } = require('fs')
const { join } = require('path')
const { spawnSync } = require('child_process')

const projectRoot = process.cwd()
const prismaClientDir = join(projectRoot, 'node_modules', '.prisma', 'client')
const prismaClientFiles = [
  join(prismaClientDir, 'index.js'),
  join(prismaClientDir, 'query_engine-windows.dll.node'),
]

function hasExistingClient() {
  return prismaClientFiles.every((file) => existsSync(file))
}

const result = spawnSync('npx', ['prisma', 'generate'], {
  cwd: projectRoot,
  stdio: 'pipe',
  shell: process.platform === 'win32',
  encoding: 'utf8',
})

if (result.stdout) {
  process.stdout.write(result.stdout)
}

if (result.stderr) {
  process.stderr.write(result.stderr)
}

if (result.status === 0) {
  process.exit(0)
}

const stderr = result.stderr || ''
const stdout = result.stdout || ''
const output = `${stdout}\n${stderr}`

const isWindowsRenameLock =
  output.includes('EPERM: operation not permitted, rename') &&
  output.includes('query_engine-windows.dll.node')

if (isWindowsRenameLock && hasExistingClient()) {
  console.warn(
    '[prisma-generate-safe] Prisma engine DLL is locked by a running process. Reusing the existing generated client for this build.'
  )
  console.warn(
    '[prisma-generate-safe] To refresh Prisma client later, stop running Node servers and run `npm run prisma:generate`.'
  )
  process.exit(0)
}

process.exit(result.status || 1)
