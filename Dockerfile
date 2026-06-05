FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json yarn.lock .yarnrc.yml ./
RUN corepack enable \
 && corepack prepare yarn@4.5.0 --activate \
 && yarn install --immutable

COPY . .
RUN yarn build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=80

COPY package.json ./
COPY server.mjs ./
COPY --from=builder /app/dist ./dist

EXPOSE 80
USER node
CMD ["node", "server.mjs"]
