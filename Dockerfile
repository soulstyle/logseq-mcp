# Use Node.js LTS version
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (needed for building)
RUN npm ci

# Copy TypeScript config and source
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --production

# Create directory for Logseq graph mount point
RUN mkdir -p /logseq-graph

# Set environment variable (can be overridden)
ENV LOGSEQ_GRAPH_PATH=/logseq-graph
ENV PORT=7842

# Expose port for HTTP API
EXPOSE 7842

# Run the HTTP server by default
CMD ["node", "dist/http-server.js"]
