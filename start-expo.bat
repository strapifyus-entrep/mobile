@echo off
echo.
echo ==========================================
echo    Poly3D - App Mobile (Expo Go)
echo ==========================================
echo.
echo IP de tu PC: 192.168.78.111
echo.
echo Para usar en tu iPhone:
echo 1. Asegurate de que el iPhone este en la misma WiFi que la PC
echo 2. Desactiva NordVPN si esta activo
echo 3. Escanea el QR con la camara de iOS o desde Expo Go
echo.

set PATH=C:\Program Files\nodejs;%PATH%
cd /d "%~dp0"

set REACT_NATIVE_PACKAGER_HOSTNAME=192.168.78.111
npx expo start --lan

echo.
echo ========== El servidor se cerro ==========
pause
