FROM oven/bun:1.1

WORKDIR /app

COPY package.json .
COPY bun.lockb .

RUN bun install --frozen-lockfile

COPY . .

ENV NODE_ENV=production

EXPOSE 4000

CMD ["bun", "run", "src/index.ts"]