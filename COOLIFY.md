# Coolify Deployment Guide

This guide explains how to deploy the logseq-mcp-gtd HTTP API on Coolify for use with N8N and other HTTP clients.

## Prerequisites

1. A Coolify instance (self-hosted or cloud)
2. Your Logseq graph accessible to the Coolify server (via network share, volume, or sync)
3. Git repository pushed to GitHub/GitLab/Gitea

## What This Deploys

This deployment creates a **REST API** that exposes all Logseq MCP tools as HTTP endpoints. Perfect for:
- N8N workflows
- Zapier/Make.com integrations
- Custom web applications
- Any HTTP client

## Deployment Steps

### 1. Prepare Your Logseq Graph

Since Coolify runs on a remote server, you need to make your Logseq graph accessible:

**Option A: Network Mount (Recommended for home servers)**
- Mount your Logseq graph directory on the Coolify host
- Example: NFS/SMB share from your Mac to the Coolify server

**Option B: Git Sync**
- Use Logseq's git sync feature to sync to a repository
- Clone the repository on the Coolify server
- Mount that directory as a volume

**Option C: Cloud Sync + Local Copy**
- Sync Logseq to a cloud service (Dropbox, etc.)
- Set up sync client on Coolify server
- Mount the synced directory

### 2. Create New Application in Coolify

1. Log into your Coolify dashboard
2. Click "New Resource" → "Application"
3. Select your Git provider and repository
4. Choose the branch (e.g., `main`)

### 3. Configure Build Settings

- **Build Pack**: Dockerfile
- **Dockerfile Location**: `./Dockerfile`
- **Port**: 7842

### 4. Configure Environment Variables

Add these environment variables:
```
LOGSEQ_GRAPH_PATH=/logseq-graph
PORT=7842
API_KEY=your-secret-api-key-here
```

**Important:** Set a strong API_KEY to secure your Logseq data!

### 5. Configure Persistent Storage

Add a volume mount to connect your Logseq graph:

- **Source**: Path on Coolify host (e.g., `/mnt/logseq-graph` or `/data/logseq`)
- **Destination**: `/logseq-graph`
- **Mode**: Read-Write (RW)

### 6. Deploy

Click "Deploy" and monitor the build logs.

## Using the API

### API Endpoint

Once deployed, your API will be accessible at:
```
http://your-server-ip:7842
```

### Testing the API

Test the deployment with curl:
```bash
curl http://your-server-ip:7842/health

# Should return:
# {"status":"ok","timestamp":"..."}
```

With authentication:
```bash
curl -H "Authorization: Bearer your-api-key" \
  http://your-server-ip:7842/api/pages
```

### Using with N8N

See [N8N.md](./N8N.md) for detailed integration guide with workflow examples.

## Testing the Deployment

### Test Local Build First

Before deploying to Coolify, test locally:

```bash
# Build the image
docker build -t logseq-http-api .

# Run with your local Logseq graph
docker run -p 7842:7842 \
  -v /path/to/your/logseq/graph:/logseq-graph:rw \
  -e LOGSEQ_GRAPH_PATH=/logseq-graph \
  -e PORT=7842 \
  -e API_KEY=test-key \
  logseq-http-api

# Test in another terminal
curl http://localhost:7842/health
curl -H "Authorization: Bearer test-key" \
  http://localhost:7842/api/pages
```

### Verify on Coolify

After deployment:

1. Check container logs in Coolify dashboard - should see "Logseq MCP HTTP API running on port 7842"
2. Test the health endpoint: `curl http://your-server:7842/health`
3. Verify file access: `docker exec -it logseq-mcp-http ls -la /logseq-graph`
4. Test API endpoint: `curl -H "Authorization: Bearer your-api-key" http://your-server:7842/api/pages`

## Troubleshooting

### Container exits immediately
- Check logs for error messages
- Verify LOGSEQ_GRAPH_PATH is set correctly
- Ensure the graph directory is mounted

### Permission errors
- Ensure the volume mount has correct permissions
- The container runs as `node` user (UID 1000)
- May need to chown the Logseq graph directory: `chown -R 1000:1000 /path/to/logseq-graph`

### Cannot read/write files
- Check LOGSEQ_GRAPH_PATH environment variable
- Verify volume mount in Coolify settings
- Test: `docker exec logseq-mcp-http ls -la /logseq-graph`

### API returns 401 Unauthorized
- Verify API_KEY environment variable is set
- Check Authorization header format: `Bearer your-api-key`
- Try without authentication if API_KEY is not set

### Connection refused
- Verify port 7842 is exposed in Coolify
- Check firewall rules
- Ensure container is running: `docker ps | grep logseq`

## Security Considerations

1. **File System Access**: The container has read-write access to your Logseq graph - ensure proper file permissions
2. **Network Isolation**: Consider running in an isolated Docker network
3. **Authentication**: MCP currently has no built-in auth - secure the host and SSH access
4. **Backups**: Ensure your Logseq graph is backed up before deploying

## Updates

To update the deployed version:
1. Push changes to your Git repository
2. In Coolify, click "Redeploy" on the application
3. Coolify will pull latest code and rebuild

Or use webhooks for automatic deployment on git push.
