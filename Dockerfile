# ESTÁGIO 1: Build
FROM node:20-alpine3.22 AS builder

WORKDIR /app
COPY package.json package-lock.json tsconfig.json ./
COPY src ./src

RUN npm install --legacy-peer-deps
RUN npm run build

FROM node:20-alpine3.22

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --omit=dev --legacy-peer-deps

COPY --from=builder /app/dist ./dist

EXPOSE 3002
CMD ["npm", "start"]