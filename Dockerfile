FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates fonts-liberation \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --omit=dev \
  && npx playwright install --with-deps chromium

COPY . .

EXPOSE 5000
CMD ["npm", "start"]
