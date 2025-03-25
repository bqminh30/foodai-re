FROM node:20-alpine AS base
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

# Development stage
FROM base AS development
WORKDIR /app
COPY . .
CMD ["pnpm", "dev"]

# Production build stage
FROM base AS build
WORKDIR /app
COPY . .
RUN pnpm build

# Production stage
FROM node:20-alpine AS production
WORKDIR /app

# Copy necessary files from build stage
COPY --from=build /app/next.config.js ./
COPY --from=build /app/public ./public
COPY --from=build /app/.next ./.next
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json

# Install only production dependencies
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "start"] 