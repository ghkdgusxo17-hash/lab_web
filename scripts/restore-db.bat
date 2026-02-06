@echo off
REM ============================================
REM  DB 복원 스크립트
REM  사용법: scripts\restore-db.bat <백업파일명>
REM  예시:   scripts\restore-db.bat backup_2026-02-06_1430_before-migration.sql
REM ============================================

setlocal

set BACKUP_FILE=%~1

if "%BACKUP_FILE%"=="" (
    echo [사용법] scripts\restore-db.bat ^<백업파일명^>
    echo.
    echo [사용 가능한 백업 목록]:
    dir /b /o:-d "%~dp0..\backups\backup_*.sql" 2>nul
    exit /b 1
)

set SCRIPT_DIR=%~dp0
set BACKUP_PATH=%SCRIPT_DIR%..\backups\%BACKUP_FILE%

if not exist "%BACKUP_PATH%" (
    echo [오류] 파일을 찾을 수 없습니다: %BACKUP_PATH%
    exit /b 1
)

echo ============================================
echo  주의: 현재 DB의 모든 데이터가 덮어쓰기됩니다!
echo  복원할 파일: %BACKUP_FILE%
echo ============================================
echo.
set /p CONFIRM="정말 복원하시겠습니까? (y/N): "
if /i not "%CONFIRM%"=="y" (
    echo [취소됨]
    exit /b 0
)

echo.
echo [1/3] 복원 전 현재 DB 백업 중...
call "%SCRIPT_DIR%backup-db.bat" before-restore

echo [2/3] 기존 데이터 정리 중...
docker exec supabase_db_Supabase psql -U postgres -d postgres -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO postgres; GRANT ALL ON SCHEMA public TO public;" 2>&1

echo [3/3] 백업 파일 복원 중...
docker exec -i supabase_db_Supabase psql -U postgres -d postgres < "%BACKUP_PATH%" > nul 2>&1

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [복원 완료] %BACKUP_FILE%
    echo [참고] 앱 서버를 재시작하세요: npm run dev
) else (
    echo.
    echo [오류] 복원 중 문제가 발생했습니다
    echo [참고] before-restore 백업으로 롤백 가능합니다
)

endlocal
