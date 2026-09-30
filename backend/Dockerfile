FROM node:20-alpine AS build

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.17.1 --activate

COPY backend/package.json ./package.json
RUN pnpm install --no-frozen-lockfile
COPY backend/ ./
RUN pnpm run build && pnpm prune --prod

FROM node:20-alpine AS production
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
EXPOSE 3001
CMD ["node", "dist/main.js"]
