# AI Translator - Backend Launcher Script
# Run this from the project root: .\start_backend.ps1

Write-Host "Starting AI Voice Translator Backend..." -ForegroundColor Cyan

$venvPython = Join-Path $PSScriptRoot "backend\.venv\Scripts\python.exe"

if (-not (Test-Path $venvPython)) {
    Write-Host "ERROR: Virtual environment not found at backend\.venv" -ForegroundColor Red
    Write-Host "Run: uv venv backend/.venv --python 3.11" -ForegroundColor Yellow
    exit 1
}

Write-Host "Using Python: $venvPython" -ForegroundColor Green

Set-Location backend
& $venvPython -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
