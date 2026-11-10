# Etapa 1: Construcción
FROM node:20.19.0-alpine3.21 AS builder

WORKDIR /app

RUN apk add --no-cache openssl openssl-dev libc6-compat

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --ignore-scripts

COPY . .

RUN npx --no-install prisma generate
RUN npm run build

# Etapa 2: Imagen final de Producción
FROM node:20.19.0-alpine3.21 AS runner

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

ENV NODE_ENV=production

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --omit=dev --ignore-scripts

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/docker-entrypoint.sh ./docker-entrypoint.sh
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

RUN chmod +x ./docker-entrypoint.sh && chown -R node:node /app

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/src/main.js"]
USER node
