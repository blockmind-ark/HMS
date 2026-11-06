# -------------------------------------------------------------
# Hospital & Pharmacy Management System (HMS)
# Production Container Image for On-Premise / Offline Deployment
# -------------------------------------------------------------

FROM node:20-alpine

# Install libc6-compat and openssl required by Prisma binaries on Alpine Linux
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Copy dependency manifests and Prisma schema first for layer caching
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies required for Prisma & ts-node)
RUN npm ci

# Copy full application source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js with build-time dummy variables to support static generation
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" \
    NEXTAUTH_SECRET="build-secret-dummy-placeholder-key-32chars" \
    NEXTAUTH_URL="http://localhost:3000" \
    npm run build

# Expose Next.js server port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the Next.js production server
CMD ["npm", "start"]

