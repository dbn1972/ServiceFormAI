FROM node:20-alpine AS build

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.17.1 --activate

COPY backend/package.json ./package.json
RUN pnpm install --no-frozen-lockfile
COPY backend/ ./
RUN pnpm run build

COPY packages/validation-engine/tsconfig.json packages/validation-engine/tsconfig.cjs.json ./packages/validation-engine/
COPY packages/validation-engine/src ./packages/validation-engine/src
RUN ./node_modules/.bin/tsc -p packages/validation-engine/tsconfig.json \
	&& ./node_modules/.bin/tsc -p packages/validation-engine/tsconfig.cjs.json \
	&& pnpm prune --prod

FROM node:20-alpine AS production
ENV NODE_ENV=production
WORKDIR /app
COPY deployment/cloudsphere/init-storage.cjs ./init-storage.cjs
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/packages/validation-engine/dist ./packages/validation-engine/dist
EXPOSE 3001
CMD ["node", "dist/main.js"]
