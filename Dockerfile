FROM node:22-bookworm

RUN apt-get update && apt-get install -y curl python3 python3-venv && rm -rf /var/lib/apt/lists/*

RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.local/bin:$PATH"

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ENV PORT=8080

EXPOSE 8080

CMD ["node", "server/server.js"]