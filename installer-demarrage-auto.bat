@echo off
rem ============================================================
rem  Renov Midi - Installation du demarrage automatique
rem  Double-cliquer UNE FOIS : cree un raccourci dans le dossier
rem  Demarrage de Windows. Le service Renov Midi se lancera alors
rem  automatiquement (fenetre reduite) a chaque ouverture de session.
rem
rem  Pour desinstaller : relancer ce script, il propose la suppression.
rem ============================================================
setlocal
title Renov Midi - Demarrage automatique
set "STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "LNK=%STARTUP%\Renov Midi - Service.lnk"
set "TARGET=%~dp0demarrer-renov-midi.bat"

echo.
echo  ============================================
echo   RENOV MIDI - Demarrage automatique
echo  ============================================
echo.

if exist "%LNK%" (
  echo Le demarrage automatique est DEJA installe.
  set /p REP="Voulez-vous le DESINSTALLER ? (o/n) : "
  if /i "%REP%"=="o" (
    del "%LNK%"
    echo Raccourci supprime : Renov Midi ne se lancera plus automatiquement.
  ) else (
    echo Aucun changement.
  )
  pause
  exit /b 0
)

echo Ce script va creer un raccourci ici :
echo   %LNK%
echo pointant vers :
echo   %TARGET%
echo.
set /p REP="Confirmer l'installation du demarrage automatique ? (o/n) : "
if /i not "%REP%"=="o" (
  echo Installation annulee.
  pause
  exit /b 0
)

powershell -NoProfile -Command ^
  "$ws = New-Object -ComObject WScript.Shell;" ^
  "$sc = $ws.CreateShortcut('%LNK%');" ^
  "$sc.TargetPath = '%TARGET%';" ^
  "$sc.WorkingDirectory = '%~dp0';" ^
  "$sc.WindowStyle = 7;" ^
  "$sc.Description = 'Demarre le service Renov Midi (veille AO BTP)';" ^
  "$sc.Save()"

if exist "%LNK%" (
  echo.
  echo [OK] Demarrage automatique installe.
  echo Le service Renov Midi se lancera a la prochaine ouverture de session
  echo ^(fenetre reduite dans la barre des taches^).
) else (
  echo [ERREUR] La creation du raccourci a echoue.
)
echo.
pause
endlocal
