param(
    [Parameter(Mandatory=$true)]
    [string]$SourcePath
)

# Script para copiar imagens dos produtos para a pasta do backend
# Uso: .\copy_images.ps1 -SourcePath "C:\caminho\para\imagens"

$DestPath = Join-Path $PSScriptRoot "..\public\images\produtos"

Write-Host "Copiando imagens de: $SourcePath" -ForegroundColor Green
Write-Host "Para: $DestPath" -ForegroundColor Green

# Criar pasta de destino se não existir
if (!(Test-Path $DestPath)) {
    New-Item -ItemType Directory -Path $DestPath -Force
}

# Copiar arquivos
try {
    Copy-Item -Path "$SourcePath\*" -Destination $DestPath -Force -Recurse
    Write-Host "`nImagens copiadas com sucesso!" -ForegroundColor Green
    Write-Host "Verifique se os arquivos estão na pasta: $DestPath" -ForegroundColor Yellow
    Write-Host "`nPróximo passo: Execute o script SQL 202601200001_atualizar_urls_imagens.sql" -ForegroundColor Cyan
} catch {
    Write-Host "Erro ao copiar imagens: $($_.Exception.Message)" -ForegroundColor Red
}

Read-Host "Pressione Enter para continuar"