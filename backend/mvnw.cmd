@echo off
setlocal
set "MAVEN_BIN=%~dp0.mvn\apache-maven-3.9.6\bin\mvn.cmd"
if exist "%MAVEN_BIN%" (
    call "%MAVEN_BIN%" %*
) else (
    echo Error: Embedded Maven not found at %MAVEN_BIN%
    exit /b 1
)
