# Logseq MCP HTTP API

This is an HTTP API wrapper for the Logseq MCP server, enabling integration with N8N, Zapier, Make.com, and any HTTP client.

## Overview

The original Logseq MCP server communicates via stdio (standard input/output) for use with AI assistants like Claude Desktop and Warp. This HTTP version exposes the same functionality as a REST API.

## Features

All MCP tools available as HTTP endpoints:

- **Page Operations**: List, read, create, update, delete, append
- **Search**: Full-text search with tag and folder filtering
- **Navigation**: Get backlinks and graph data
- **Journals**: Create and read daily journal entries
- **Cultural Content**: Log articles, books, movies, exhibitions to journals

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run HTTP server (default port 7842)
LOGSEQ_GRAPH_PATH=/path/to/your/logseq/graph npm run start:http

# With API key
LOGSEQ_GRAPH_PATH=/path/to/your/logseq/graph \
API_KEY=your-secret-key \
npm run start:http
```

Visit `http://localhost:7842` to see available endpoints.

### Docker

```bash
# Build
docker build -t logseq-http-api .

# Run
docker run -p 7842:7842 \
  -v /path/to/your/logseq/graph:/logseq-graph:rw \
  -e LOGSEQ_GRAPH_PATH=/logseq-graph \
  -e API_KEY=your-secret-key \
  logseq-http-api
```

### Docker Compose

```bash
# Edit docker-compose.yml to set your Logseq graph path
docker-compose up -d
```

## Deployment

### Coolify

See [COOLIFY.md](./COOLIFY.md) for complete Coolify deployment guide.

**Quick steps:**
1. Push code to Git repository
2. Create new application in Coolify
3. Set environment variables: `LOGSEQ_GRAPH_PATH`, `PORT`, `API_KEY`
4. Mount Logseq graph as volume
5. Deploy

### N8N Integration

See [N8N.md](./N8N.md) for detailed N8N workflow examples.

**Quick example:**
```javascript
// HTTP Request Node in N8N
Method: POST
URL: http://your-server:7842/api/pages
Headers: { "Authorization": "Bearer your-api-key" }
Body: {
  "name": "New Page",
  "content": "# Hello from N8N"
}
```

## API Documentation

### Authentication

If `API_KEY` environment variable is set, include it in requests:
```
Authorization: Bearer your-api-key
```

### Endpoints

#### Health Check
```http
GET /health
```

#### List Pages
```http
GET /api/pages
GET /api/pages?folder=journals
```

#### Read Page
```http
GET /api/pages/my-page-name
```

#### Create Page
```http
POST /api/pages
Content-Type: application/json

{
  "name": "My Page",
  "content": "# Content here",
  "properties": {
    "tags": "work"
  }
}
```

#### Update Page
```http
PUT /api/pages/my-page-name
Content-Type: application/json

{
  "content": "# Updated content"
}
```

#### Delete Page
```http
DELETE /api/pages/my-page-name
```

#### Append to Page
```http
POST /api/pages/my-page-name/append
Content-Type: application/json

{
  "content": "\n- New item"
}
```

#### Search
```http
POST /api/search
Content-Type: application/json

{
  "query": "search term",
  "tags": ["work"],
  "folder": "pages"
}
```

#### Get Journal
```http
GET /api/journal
GET /api/journal?date=2024-01-15
```

#### Add Article to Journal
```http
POST /api/content/article
Content-Type: application/json

{
  "title": "Article Title",
  "url": "https://example.com",
  "summary": "Brief summary",
  "tags": "reading, tech"
}
```

See [N8N.md](./N8N.md) for complete API reference.

## Configuration

### Environment Variables

- **LOGSEQ_GRAPH_PATH** (required): Absolute path to your Logseq graph directory
- **PORT** (optional): HTTP server port (default: 7842)
- **API_KEY** (optional): API key for authentication

### Security

- **API Key**: Always set an API_KEY in production
- **CORS**: Currently allows all origins (modify `src/http-server.ts` to restrict)
- **Content Limits**: Maximum 10MB per request
- **File Access**: Server only accesses files within LOGSEQ_GRAPH_PATH

## Architecture

```
src/
  index.ts         - Original MCP server (stdio)
  http-server.ts   - HTTP API wrapper (REST)
  graph.ts         - Core Logseq operations
  types.ts         - TypeScript types
```

The HTTP server (`http-server.ts`) wraps the same `GraphService` used by the MCP server, ensuring identical functionality.

## Original MCP Mode

To run as original MCP server for Claude Desktop/Warp:

```bash
npm run start
```

Configure in your MCP client:
```json
{
  "logseq-gtd": {
    "command": "node",
    "args": ["/path/to/dist/index.js"],
    "env": {
      "LOGSEQ_GRAPH_PATH": "/path/to/graph"
    }
  }
}
```

## Development

```bash
# Watch mode
npm run dev

# In another terminal, run HTTP server
npm run start:http

# Test with curl
curl http://localhost:7842/health
```

## License

See LICENSE file.

## Related Projects

- [GTD AI Assistant](https://github.com/soulstyle/GTD-AI-Assistant)
- Upstream: [dearcloud09/logseq-mcp](https://github.com/dearcloud09/logseq-mcp)
