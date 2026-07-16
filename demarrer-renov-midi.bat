@echo off
rem ============================================================
rem  Renov Midi - Demarrage du service (mode production)
rem  Double-cliquer ce fichier pour lancer l'application.
rem  Le service reste actif tant que cette fenetre est ouverte :
rem  - collecte BOAMP toutes les 4 h, TED 2x/jour
rem  - rapport email chaque lundi 8 h
rem ============================================================
setlocal
title Renov Midi - Veille AO BTP
cd /d "%~dp0"

echo.
echo  ============================================
echo   RENOV MIDI - Veille AO BTP
echo  ============================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERREUR] Node.js n'est pas installe. Telechargez-le sur https://nodejs.org
  pause
  exit /b 1
)

if not exist node_modules (
  echo [1/4] Installation des dependances ^(premiere fois, quelques minutes^)...
  call npm install || goto :erreur
) else (
  echo [1/4] Dependances OK.
)

echo [2/4] Preparation de la base de donnees...
call npx prisma generate >nul || goto :erreur
call npx prisma db push >nul || goto :erreur
call npm run db:seed >nul || goto :erreur

if not exist .next\BUILD_ID (
  echo [3/4] Construction de l'application ^(premiere fois, 1-2 minutes^)...
  call npm run build || goto :erreur
) else (
  echo [3/4] Application deja construite. ^(Supprimez le dossier .next pour forcer une reconstruction apres une mise a jour.^)
)

echo [4/4] Demarrage du service sur http://localhost:3000 ...
echo.
echo   Fermez cette fenetre pour arreter le service.
echo.
start "" "http://localhost:3000"
call npm run start
goto :fin

:erreur
echo.
echo [ERREUR] Le demarrage a echoue. Lisez le message ci-dessus.
pause
exit /b 1

:fin
endlocal
