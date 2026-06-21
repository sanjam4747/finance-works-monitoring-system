@echo off
echo ============================================================
echo   Finance Works Monitoring System - Backend Startup
echo ============================================================
echo.

REM Try to find Maven
set MAVEN_CMD=mvn
if exist "%USERPROFILE%\maven\apache-maven-3.9.6\bin\mvn.cmd" (
    set MAVEN_CMD="%USERPROFILE%\maven\apache-maven-3.9.6\bin\mvn.cmd"
)

REM Set JAVA_HOME if not set
if "%JAVA_HOME%"=="" (
    if exist "C:\Program Files\Eclipse Adoptium\jdk-17.0.18.8-hotspot" (
        set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.18.8-hotspot
    )
)

echo Starting Spring Boot backend on http://localhost:8080
echo.
echo NOTE: Make sure MySQL is running and configured in:
echo       backend\src\main\resources\application.properties
echo.
echo Default credentials: root / root
echo.

%MAVEN_CMD% spring-boot:run

pause
