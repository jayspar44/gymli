FROM node:22-slim

WORKDIR /app

COPY package*.json ./
# npm install (not ci) so Linux-only optional deps resolve even though the
# lockfile is generated on macOS; --omit=dev keeps the image lean.
RUN npm install --omit=dev --no-audit --no-fund

COPY . .

EXPOSE 8080
ENV PORT=8080

CMD ["node", "src/index.js"]
