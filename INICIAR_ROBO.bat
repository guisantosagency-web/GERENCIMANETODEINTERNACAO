@echo off
title HTO - Robô de Integração SISREG
echo ====================================================
echo    HTO - INICIANDO ROBÔ DE INTEGRAÇÃO SISREG
echo ====================================================
echo.

:: Verifica se o Python está instalado
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Python não encontrado! Por favor, instale o Python.
    pause
    exit
)

:: Entra na pasta dos scripts
cd src\scripts

echo [1/3] Verificando e Instalando bibliotecas necessarias...
python -m pip install --upgrade pip >nul
pip install -r requirements.txt >nul

echo.
echo [2/3] Iniciando o robô...
echo.
echo [AVISO] Uma janela do Chrome sera aberta. 
echo [AVISO] Faca o login no SISREG e deixe a janela aberta.
echo.
echo [3/3] AGUARDANDO COMANDOS DO SITE...
echo.

python sisreg_automation.py

echo.
echo Robô encerrado.
pause
