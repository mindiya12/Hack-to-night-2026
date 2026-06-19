FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

EXPOSE 3000

CMD ["sh", "-c", "find .next -mindepth 1 -delete 2>/dev/null || true; npm run dev"]
