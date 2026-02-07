#!/bin/bash
set -e

# ===============================
# 环境区分
# ===============================
if [ "$ENV" = "prod" ]; then
  CLOUD_HOST="${CLOUD_HOST}"
  CLOUD_USER="${CLOUD_USER}"
  CLOUD_PORT="${CLOUD_PORT:-22}"
  CLOUD_DEPLOY_PATH="${CLOUD_DEPLOY_PATH}"
  APP_PORT="${CLOUD_APP_PORT:-5555}"
  NODE_ENV="production"
else
  CLOUD_HOST="${CLOUD_HOST}"
  CLOUD_USER="${CLOUD_USER}"
  CLOUD_PORT="${CLOUD_PORT:-22}"
  CLOUD_DEPLOY_PATH="${CLOUD_DEPLOY_PATH}"
  APP_PORT="${CLOUD_APP_PORT:-3001}"
  NODE_ENV="test"
fi

# ===============================
# 校验变量
# ===============================
if [ -z "$CLOUD_HOST" ] || [ -z "$CLOUD_USER" ] || [ -z "$CLOUD_DEPLOY_PATH" ]; then
  echo "❌ Missing required environment variables"
  exit 1
fi

echo "Deploying to: $CLOUD_USER@$CLOUD_HOST:$CLOUD_PORT"
echo "Deploy path: $CLOUD_DEPLOY_PATH"
echo "App port: $APP_PORT"
echo "Node environment: $NODE_ENV"

# ===============================
# 上传部署包
# ===============================
echo "Uploading deployment package..."

# 优化 rsync 参数以加快上传速度
# - 移除 -z 选项：deploy.tar.gz 已经是压缩文件，再次压缩浪费 CPU 且效果有限
# - 添加 --partial：支持断点续传
# - 添加 --inplace：直接覆盖目标文件，减少磁盘 I/O
# - 添加 --no-whole-file：启用增量传输（如果文件已存在）
# - 添加 --checksum：启用校验和传输
# - 调整 SSH 选项：添加压缩和连接复用（对已压缩文件效果有限，但保留以备将来使用）
rsync -av --progress --partial --inplace --checksum \
  -e "ssh -p $CLOUD_PORT -i ~/.ssh/id_rsa -o StrictHostKeyChecking=no -o Compression=no -o ControlMaster=auto -o ControlPath=~/.ssh/control-%r@%h:%p -o ControlPersist=10m" \
  deploy.tar.gz "$CLOUD_USER@$CLOUD_HOST:/tmp/deploy.tar.gz"

# ===============================
# 远程执行部署
# ===============================
ssh -p "$CLOUD_PORT" -i ~/.ssh/id_rsa "$CLOUD_USER@$CLOUD_HOST" << EOF
set -e

echo "===== Init Node.js environment (root + nvm) ====="

# ---- 强制指定 root 环境 ----
export HOME=/root
export NVM_DIR="/root/.nvm"

if [ ! -s "\$NVM_DIR/nvm.sh" ]; then
  echo "❌ nvm not found at \$NVM_DIR"
  exit 1
fi

# 加载 nvm
. "\$NVM_DIR/nvm.sh"

# 使用指定 Node 版本（不存在则安装）
NODE_VERSION=22
nvm use \$NODE_VERSION || nvm install \$NODE_VERSION

echo "Node path: \$(which node)"
echo "Node version: \$(node -v)"
echo "NPM version: \$(npm -v)"

# ===============================
# 部署目录
# ===============================
mkdir -p "$CLOUD_DEPLOY_PATH"
cd "$CLOUD_DEPLOY_PATH"

# 备份旧版本
if [ -d "current" ]; then
  echo "Backing up current version..."
  mv current "backup-\$(date +%Y%m%d-%H%M%S)"
fi

# 解压新版本
echo "Extracting new version..."
mkdir current
tar -xzf /tmp/deploy.tar.gz -C current
rm -f /tmp/deploy.tar.gz

cd current

# ===============================
# 整理 standalone 模式的目录结构
# ===============================
if [ -d ".next/standalone" ]; then
  echo "Setting up standalone directory structure..."
  
  # 确保 .next 目录存在
  mkdir -p .next/standalone/.next
  
  # 复制静态文件（如果存在且目标不存在或需要更新）
  if [ -d ".next/static" ]; then
    echo "Copying .next/static to standalone directory..."
    # 如果目标已存在，先删除再复制，确保是最新的
    if [ -d ".next/standalone/.next/static" ]; then
      rm -rf .next/standalone/.next/static
    fi
    cp -r .next/static .next/standalone/.next/static
    echo "✅ Static files copied successfully"
  else
    echo "⚠️  Warning: .next/static not found"
  fi
  
  # 复制 public 目录
  if [ -d "public" ]; then
    if [ -d ".next/standalone/public" ]; then
      rm -rf .next/standalone/public
    fi
    echo "Copying public directory to standalone..."
    cp -r public .next/standalone/public
    echo "✅ Public directory copied successfully"
  else
    echo "⚠️  Warning: public directory not found"
  fi
  
  # 验证目录结构
  echo "Verifying directory structure..."
  if [ -d ".next/standalone/.next/static" ]; then
    echo "✅ .next/standalone/.next/static exists"
    ls -la .next/standalone/.next/static/ | head -3
  else
    echo "❌ .next/standalone/.next/static missing!"
  fi
  
  if [ -d ".next/standalone/public" ]; then
    echo "✅ .next/standalone/public exists"
  else
    echo "⚠️  .next/standalone/public missing"
  fi
fi

# ===============================
# 写入环境变量
# ===============================
echo "Setting up environment variables..."

# 在 current 目录创建 .env.local（用于调试）
cat > .env.local << ENVEOF
NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL}
NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
NEXT_PUBLIC_API_BASE_URL_PORT=${NEXT_PUBLIC_API_BASE_URL_PORT}
ENVEOF

# 如果使用 standalone 模式，也在 standalone 目录创建 .env.local
if [ -d ".next/standalone" ]; then
  echo "Creating .env.local in standalone directory..."
  cat > .next/standalone/.env.local << ENVEOF
NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL}
NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
NEXT_PUBLIC_API_BASE_URL_PORT=${NEXT_PUBLIC_API_BASE_URL_PORT}
ENVEOF
fi

# ===============================
# PM2 启动
# ===============================
echo "Restarting application..."

# 安装 PM2（如不存在）
if ! command -v pm2 >/dev/null 2>&1; then
  echo "PM2 not found, installing..."
  npm install -g pm2
fi

pm2 stop "hotel-frontend-pc-$ENV" 2>/dev/null || true
pm2 delete "hotel-frontend-pc-$ENV" 2>/dev/null || true

# Next.js standalone 优先
if [ -d ".next/standalone" ]; then
  echo "Starting Next.js standalone build..."
  
  cd .next/standalone

  if [ ! -f "server.js" ]; then
    echo "❌ server.js not found"
    exit 1
  fi

  # 创建 PM2 ecosystem 文件，直接传递环境变量
  cat > ecosystem.config.js << PM2EOF
module.exports = {
  apps: [{
    name: "hotel-frontend-pc-$ENV",
    script: "server.js",
    cwd: "$CLOUD_DEPLOY_PATH/current/.next/standalone",
    env: {
      NODE_ENV: "$NODE_ENV",
      PORT: $APP_PORT,
      HOSTNAME: "0.0.0.0",
      NEXT_PUBLIC_BASE_URL: "${NEXT_PUBLIC_BASE_URL}",
      NEXT_PUBLIC_API_BASE_URL: "${NEXT_PUBLIC_API_BASE_URL}",
      NEXT_PUBLIC_API_BASE_URL_PORT: "${NEXT_PUBLIC_API_BASE_URL_PORT}"
    }
  }]
}
PM2EOF

  pm2 start ecosystem.config.js
else
  echo "Starting standard Next.js build..."
  cd "$CLOUD_DEPLOY_PATH/current"
  
  # 创建 PM2 ecosystem 文件
  cat > ecosystem.config.js << PM2EOF
module.exports = {
  apps: [{
    name: "hotel-frontend-app-$ENV",
    script: "npm",
    args: "start",
    cwd: "$CLOUD_DEPLOY_PATH/current",
    env: {
      NODE_ENV: "$NODE_ENV",
      PORT: $APP_PORT,
      HOSTNAME: "0.0.0.0",
      NEXT_PUBLIC_BASE_URL: "${NEXT_PUBLIC_BASE_URL}",
      NEXT_PUBLIC_API_BASE_URL: "${NEXT_PUBLIC_API_BASE_URL}",
      NEXT_PUBLIC_API_BASE_URL_PORT: "${NEXT_PUBLIC_API_BASE_URL_PORT}"
    }
  }]
}
PM2EOF

  pm2 start ecosystem.config.js
fi

pm2 save
pm2 list

# 显示环境变量确认（隐藏敏感信息）
echo "Environment variables configured:"
echo "  - NODE_ENV: $NODE_ENV"
echo "  - NEXT_PUBLIC_BASE_URL: ${NEXT_PUBLIC_BASE_URL}"
echo "  - NEXT_PUBLIC_API_BASE_URL: ${NEXT_PUBLIC_API_BASE_URL}"

# 显示 PM2 日志的最后几行以便调试
echo "Recent PM2 logs:"
pm2 logs "hotel-frontend-app-$ENV" --lines 10 --nostream 2>/dev/null || echo "No logs available yet"

echo "✅ Deployment completed successfully"
EOF

echo "🎉 Deployment to Cloud Server completed!"