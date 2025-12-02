@echo off
echo 🚀 Running Edison Quest Bot Tests...
echo.

echo 📋 Running Unit Tests...
echo ──────────────────────────────────────────────────
node tests/simple.test.js
if %errorlevel% neq 0 (
    echo ❌ Unit Tests failed
) else (
    echo ✅ Unit Tests passed
)

echo.
echo 📋 Running Integration Tests...
echo ──────────────────────────────────────────────────
node tests/integration.test.js
if %errorlevel% neq 0 (
    echo ❌ Integration Tests failed
) else (
    echo ✅ Integration Tests passed
)

echo.
echo ============================================================
echo 📊 Test Results Summary
echo ============================================================
echo All tests completed!
pause





