FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx nx build ${APP} --skip-nx-cache

FROM node:22-alpine AS runner
ARG APP
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist/apps/${APP} ./dist/apps/${APP}
COPY --from=builder /app/package.json ./
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/apps/${APP}/main.js"]
