# Script de Inicialización para Proyecto Barbería
# Ejecuta esto en un terminal con permisos de administrador en D:\Proyecto Barberia

Write-Host "🚀 Iniciando creación del Frontend de la Barbería..." -ForegroundColor Cyan

# 1. Crear el proyecto Angular (Standalone por defecto en versiones recientes)
npx -y @angular/cli@latest new frontend --directory ./ --style scss --routing true --skip-git --skip-install

# 2. Instalar Angular Material (para componentes UI Premium)
# Esto lo puedes ejecutar después de 'npm install'
Write-Host "📦 Archivos base creados. Ahora ejecuta estos comandos manualmente:" -ForegroundColor Yellow
Write-Host "1. npm install"
Write-Host "2. ng add @angular/material"
Write-Host "3. npm start"

Write-Host "✅ Estructura base completada. ¡A programar!" -ForegroundColor Green
