# --- Builder Stage ---
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies required for native packages
RUN apk add --no-cache libc6-compat

# Copy package files for dependency resolution
COPY package.json ./

# Install npm dependencies
RUN npm install

# Copy the rest of the application source code
COPY . .

# Set default build-time environment variables for Next.js compilation
# NOTE: Next.js bakes NEXT_PUBLIC_* variables into the client bundle at build-time.
ARG NEXT_PUBLIC_DIRECTUS_URL=https://directus-production-ec98.up.railway.app
ENV NEXT_PUBLIC_DIRECTUS_URL=$NEXT_PUBLIC_DIRECTUS_URL

# Disable Next.js telemetry to speed up build and save bandwidth
ENV NEXT_TELEMETRY_DISABLED 1

# Build the Next.js application for production
RUN npm run build

# --- Runner Stage ---
FROM node:20-alpine AS runner

WORKDIR /app

# Configure production environment variables
ENV NODE_ENV production
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED 1

# Copy build output, node_modules, and public assets
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next

# Expose the application port
EXPOSE 3000

# Start the Next.js production server (this runs 'next start -H 0.0.0.0')
CMD ["npm", "run", "start"]
