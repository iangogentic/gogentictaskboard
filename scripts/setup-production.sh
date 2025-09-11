#!/bin/bash

echo "🚀 Setting up Gogentic Portal for production..."

# Check for required environment variables
if [ -z "$DATABASE_URL" ] || [ -z "$DIRECT_URL" ]; then
  echo "❌ Error: DATABASE_URL and DIRECT_URL must be set"
  echo "Please add them to your .env file or set them as environment variables"
  exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo "🗄️ Generating Prisma client..."
npx prisma generate

echo "🔄 Creating migration from current schema..."
npx prisma migrate diff \
  --from-empty \
  --to-schema-datasource ./prisma/schema.prisma \
  --script > prisma/migrations/20250910_init/migration.sql

echo "✅ Marking migration as applied (tables already exist)..."
npx prisma migrate resolve --applied 20250910_init

echo "🌱 Running production seed..."
npm run seed

echo "🏗️ Building application..."
npm run build

echo "✨ Setup complete! You can now run:"
echo "  npm start        - Start production server"
echo "  npm run studio   - Open Prisma Studio"
echo "  npm run dev      - Start development server"