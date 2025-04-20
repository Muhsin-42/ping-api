FROM oven/bun:1.1

WORKDIR /app

COPY package.json .
# We'll skip copying the lockfile since it doesn't exist
# and install dependencies normally

RUN bun install

COPY . .

ENV NODE_ENV=production

EXPOSE 4000

CMD ["bun", "run", "src/index.ts"]
