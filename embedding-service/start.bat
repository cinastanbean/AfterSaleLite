@echo off
REM Embedding 服务启动脚本 (Windows)

chcp 65001 >nul
setlocal

cd /d "%~dp0"
set SERVICE_DIR=%CD%

echo ======================================
echo Embedding 服务启动
echo ======================================
echo 工作目录: %SERVICE_DIR%
echo.

REM 检查 Python 是否安装
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 未找到 Python
    echo 请先安装 Python 3.8 或更高版本
    pause
    exit /b 1
)

for /f "tokens=2" %%i in ('python --version 2^>^&1') do set PYTHON_VERSION=%%i
echo ✓ Python 版本: %PYTHON_VERSION%

REM 检查虚拟环境是否存在
if not exist "venv\" (
    echo.
    echo 创建虚拟环境...
    python -m venv venv
    echo ✓ 虚拟环境创建完成
) else (
    echo ✓ 虚拟环境已存在
)

REM 激活虚拟环境
echo.
echo 激活虚拟环境...
call venv\Scripts\activate.bat

REM 检查依赖是否已安装
echo.
echo 检查依赖...
python -c "import flask, sentence_transformers" 2>nul
if %errorlevel% neq 0 (
    echo 安装依赖...
    pip install --upgrade pip
    pip install -r requirements.txt
    echo ✓ 依赖安装完成
) else (
    echo ✓ 依赖已安装
)

REM 启动服务
echo.
echo ======================================
echo 启动 Embedding 服务
echo ======================================
echo.

set EMBEDDING_HOST=0.0.0.0
set EMBEDDING_PORT=5001
set EMBEDDING_DEBUG=false

echo 监听地址: %EMBEDDING_HOST%:%EMBEDDING_PORT%
echo 调试模式: %EMBEDDING_DEBUG%
echo.

python app.py

pause
