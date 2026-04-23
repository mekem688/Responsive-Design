FROM node:20-alpine

RUN npm install -g pnpm@10

WORKDIR /app

COPY . .

RUN pnpm install --frozen-lockfile

RUN pnpm run build

EXPOSE 3000

CMD ["node", "artifacts/api-server/dist/index.mjs"]