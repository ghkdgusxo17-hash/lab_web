@echo off
REM ============================================
REM  DB 백업 스크립트 (pg_dump via Docker)
REM  사용법: scripts\backup-db.bat [라벨]
REM  예시:   scripts\backup-db.bat before-migration
REM          scripts\backup-db.bat daily
REM ============================================

setlocal enabledelayedexpansion

REM 날짜/시간 생성
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /format:list') do set datetime=%%I
set TIMESTAMP=%datetime:~0,4%-%datetime:~4,2%-%datetime:~6,2%_%datetime:~8,2%%datetime:~10,2%

REM 라벨 (선택)
set LABEL=%~1
if not "%LABEL%"=="" (
    set FILENAME=backup_%TIMESTAMP%_%LABEL%.sql
) else (
    set FILENAME=backup_%TIMESTAMP%.sql
)

REM 프로젝트 루트 기준 backups 폴더
set SCRIPT_DIR=%~dp0
set BACKUP_DIR=%SCRIPT_DIR%..\backups

if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

echo [백업] %FILENAME% 생성 중...

docker exec supabase_db_Supabase pg_dump -U postgres -d postgres --no-owner --no-acl > "%BACKUP_DIR%\%FILENAME%" 2>&1

if %ERRORLEVEL% EQU 0 (
    echo [백업 완료] backups\%FILENAME%

    REM 파일 크기 표시
    for %%F in ("%BACKUP_DIR%\%FILENAME%") do (
        set SIZE=%%~zF
        set /a SIZE_KB=!SIZE!/1024
        echo [크기] !SIZE_KB! KB
    )

    REM 오래된 백업 정리 (30개 초과 시 가장 오래된 것 삭제)
    set COUNT=0
    for %%F in ("%BACKUP_DIR%\backup_*.sql") do set /a COUNT+=1
    if !COUNT! GTR 30 (
        echo [정리] 백업 30개 초과, 가장 오래된 백업 삭제 중...
        for /f "delims=" %%F in ('dir /b /o:d "%BACKUP_DIR%\backup_*.sql" 2^>nul') do (
            del "%BACKUP_DIR%\%%F"
            echo [삭제] %%F
            goto :cleanup_done
        )
        :cleanup_done
    )
) else (
    echo [오류] 백업 실패!
    del "%BACKUP_DIR%\%FILENAME%" 2>nul
)

endlocal
