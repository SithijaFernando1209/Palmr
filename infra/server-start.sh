#!/bin/sh
set -e

echo "🌴 Starting Palmr Server..."

TARGET_UID=${PALMR_UID:-1000}
TARGET_GID=${PALMR_GID:-1000}

if [ -n "$PALMR_UID" ] || [ -n "$PALMR_GID" ]; then
    echo "🔧 Runtime UID/GID: $TARGET_UID:$TARGET_GID"
    
    echo "🔐 Updating file ownership..."
    chown -R $TARGET_UID:$TARGET_GID /app/palmr-app 2>/dev/null || echo "⚠️ Some ownership changes may have failed"
    chown -R $TARGET_UID:$TARGET_GID /home/palmr 2>/dev/null || echo "⚠️ Some home directory ownership changes may have failed"
    
    if [ -d "/app/server" ]; then
        chown -R $TARGET_UID:$TARGET_GID /app/server 2>/dev/null || echo "⚠️ Some data directory ownership changes may have failed"
    fi
    
    echo "✅ UID/GID configuration completed"
fi

cd /app/palmr-app

export DATABASE_URL="file:/app/server/prisma/palmr.db"

echo "📂 Data directory: /app/server"
echo "💾 Database: $DATABASE_URL"

echo "📁 Creating data directories..."
mkdir -p /app/server/prisma /app/server/uploads /app/server/temp-uploads

if [ "$(id -u)" = "0" ]; then
    echo "🔐 Ensuring proper ownership before database operations..."
    chown -R $TARGET_UID:$TARGET_GID /app/server/prisma 2>/dev/null || true
fi

run_as_user() {
    if [ "$(id -u)" = "0" ]; then
        su-exec $TARGET_UID:$TARGET_GID "$@"
    else
        "$@"
    fi
}

if [ ! -f "/app/server/prisma/configs.json" ]; then
    echo "📄 Copying configuration files..."
    cp -f /app/infra/configs.json /app/server/prisma/configs.json 2>/dev/null || echo "⚠️ Failed to copy configs.json"
    cp -f /app/infra/providers.json /app/server/prisma/providers.json 2>/dev/null || echo "⚠️ Failed to copy providers.json"
    cp -f /app/infra/check-missing.js /app/server/prisma/check-missing.js 2>/dev/null || echo "⚠️ Failed to copy check-missing.js"
    
    if [ "$(id -u)" = "0" ]; then
        chown $TARGET_UID:$TARGET_GID /app/server/prisma/configs.json /app/server/prisma/providers.json /app/server/prisma/check-missing.js 2>/dev/null || true
    fi
fi

if [ ! -f "/app/server/prisma/palmr.db" ]; then
    echo "🚀 First run detected - setting up database...(testing)"
    
    echo "🗄️ Creating database schema..."
    run_as_user npx prisma db push --schema=./prisma/schema.prisma --skip-generate
    
    echo "🌱 Seeding database..."
    run_as_user node ./prisma/seed.js
    
    echo "✅ Database setup completed!"
else
    echo "♻️ Existing database found...will be used."
    
    echo "🔧 Checking for schema updates..."
    run_as_user npx prisma db push --schema=./prisma/schema.prisma --skip-generate
    
    echo "🔍 Checking if new tables need seeding..."
    NEEDS_SEEDING=$(run_as_user node ./prisma/check-missing.js check-seeding 2>/dev/null || echo "true")
    
    if [ "$NEEDS_SEEDING" = "true" ]; then
        echo "🌱 New tables detected or missing data, running seed..."
        
        MISSING_PROVIDERS=$(run_as_user node ./prisma/check-missing.js check-providers 2>/dev/null || echo "Error checking providers")
        MISSING_CONFIGS=$(run_as_user node ./prisma/check-missing.js check-configs 2>/dev/null || echo "Error checking configurations")

        if [ "$MISSING_PROVIDERS" != "No missing providers" ] && [ "$MISSING_PROVIDERS" != "Error checking providers" ]; then
            echo "🔍 $MISSING_PROVIDERS"
        fi
        
        if [ "$MISSING_CONFIGS" != "No missing configurations" ] && [ "$MISSING_CONFIGS" != "Error checking configurations" ]; then
            echo "⚙️ $MISSING_CONFIGS"
        fi
        
        run_as_user node ./prisma/seed.js
        echo "✅ Seeding completed!"
    else
        echo "✅ All tables have data, no seeding needed"
    fi
fi

echo "🚀 Starting Palmr server..."

if [ "$(id -u)" = "0" ]; then
    echo "🔽 Dropping privileges to UID:GID $TARGET_UID:$TARGET_GID"
    exec su-exec $TARGET_UID:$TARGET_GID node dist/server.js
else
    exec node dist/server.js
fi
