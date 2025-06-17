# =========================
# Backend Dockerfile  
# =========================
FROM node:18-alpine

# 1. Create and set working directory
WORKDIR /usr/src/app

# 2. Copy package.json and package-lock.json for dependency installation
COPY package*.json ./

# 3. Install only production dependencies
RUN npm ci --only=production

# 4. Copy all backend source code
COPY . .

# 5. Expose port 7000 (updated to match your current setup)
EXPOSE 7000

# 6. Healthcheck (optional but recommended)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:7000', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# 7. Start the application
CMD ["node", "index.js"] 