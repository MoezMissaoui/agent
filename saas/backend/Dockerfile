FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

ENV PORT=8547
EXPOSE 8547

CMD ["npm", "run", "start:dev"]
