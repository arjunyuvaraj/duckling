FROM node:22-slim

WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY server ./server

RUN mkdir -p server/data

EXPOSE 8787

CMD ["node", "server/index.js"]
