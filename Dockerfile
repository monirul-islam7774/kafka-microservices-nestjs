# One image, three services. Pick the service at runtime: SERVICE=order-service|payment-service|notification-service
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
USER node
ENV SERVICE=order-service
CMD ["sh", "-c", "node dist/${SERVICE}/main.js"]
