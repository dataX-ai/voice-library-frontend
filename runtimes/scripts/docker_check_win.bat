@echo off
setlocal enabledelayedexpansion

REM Refresh environment variables
REM This is to ensure that any recent changes to environment variables are reflected
REM For example, if Docker was just installed and updated the PATH variable

call refreshenv

REM Check if Docker is installed and responding
docker --version > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Docker not installed
    echo NOT INSTALLED
    exit 1
)

REM Check if Docker daemon is running
docker info > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Docker daemon is not running or not accessible.
    echo NOT RUNNING
    exit 1
)

echo Docker is running
echo RUNNING
exit 0
