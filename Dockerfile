FROM node:18-alpine

WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy application files
COPY server.js .
COPY public/ ./public/

# Expose minimal port mapped by Cloud Run
EXPOSE 8080

CMD ["npm", "start"]
