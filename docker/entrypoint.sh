#!/bin/sh
set -e

echo "Running database migrations..."
(cd packages/db && node ../../node_modules/prisma/build/index.js migrate deploy)

echo "Starting web server..."
exec node apps/web/server.js
