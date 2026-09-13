FROM node:24-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY server/ ./
ENV NODE_ENV=production
USER node
CMD ["node", "index.js"]

