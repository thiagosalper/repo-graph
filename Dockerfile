FROM oven/bun:latest 

WORKDIR /app

COPY package.json ./
COPY tsconfig.json ./

RUN bun install 

COPY src ./src 
COPY public ./public

EXPOSE 3002

CMD ["bun", "run", "src/index.ts"]