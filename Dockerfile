# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build for production
RUN npm run build

# Production Stage
FROM nginx:alpine AS runner

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Optional: Copy custom nginx config if we had one (using default for now)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
