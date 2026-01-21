@echo off
REM Script para copiar imagens dos produtos para a pasta do backend
REM Uso: copy_images.bat "caminho/para/pasta/com/imagens"

if "%~1"=="" (
    echo Uso: %0 "caminho/para/pasta/com/imagens"
    echo Exemplo: %0 "C:\Users\Usuario\Desktop\imagens_produtos"
    pause
    exit /b 1
)

set SOURCE_DIR=%~1
set DEST_DIR=%~dp0..\public\images\produtos

echo Copiando imagens de: %SOURCE_DIR%
echo Para: %DEST_DIR%

if not exist "%DEST_DIR%" (
    mkdir "%DEST_DIR%"
)

xcopy "%SOURCE_DIR%\*.*" "%DEST_DIR%\" /Y /I

echo.
echo Imagens copiadas com sucesso!
echo Verifique se os arquivos estao na pasta: %DEST_DIR%
echo.
echo Proximo passo: Execute o script SQL 202601200001_atualizar_urls_imagens.sql
pause