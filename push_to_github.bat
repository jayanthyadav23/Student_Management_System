@echo off
echo ========================================================
echo   EduManage - Push to GitHub
echo ========================================================
echo.
set "PATH=C:\Users\pjaya\.tools\git\cmd;%PATH%"

echo Current Git Status:
git status
echo.

echo Pushing main branch to origin...
git push -u origin main

echo.
echo ========================================================
if %ERRORLEVEL% equ 0 (
    echo Successfully pushed to GitHub!
) else (
    echo Push failed. Please check your GitHub credentials or Personal Access Token.
)
echo ========================================================
pause
