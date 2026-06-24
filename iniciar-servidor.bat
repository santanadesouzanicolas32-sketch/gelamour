@echo off
echo Iniciando MySQL...
start "" "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" --datadir="C:\ProgramData\MySQL\MySQL Server 8.4\Data"
timeout /t 3 /nobreak >nul

echo Iniciando servidor Gelamour...
cd /d "%~dp0backend"
node server.js
pause
