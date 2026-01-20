# N8N Integration Guide

This guide shows how to use the Logseq HTTP API with N8N workflows.

## API Endpoint

Once deployed on Coolify, your API will be available at:
```
http://your-server-ip:7842
```

## Authentication

If you set an `API_KEY` environment variable during deployment, include it in requests:
```
Authorization: Bearer your-api-key-here
```

## Available Endpoints

### Page Operations

#### List Pages
```http
GET /api/pages?folder=pages
GET /api/pages?folder=journals
```

#### Read Page
```http
GET /api/pages/my-page-name
GET /api/pages/pages/subfolder/page-name
```

#### Create Page
```http
POST /api/pages
Content-Type: application/json

{
  "name": "My New Page",
  "content": "# Hello World\n\nThis is my page content.",
  "properties": {
    "tags": "work, project",
    "status": "in-progress"
  }
}
```

#### Update Page
```http
PUT /api/pages/my-page-name
Content-Type: application/json

{
  "content": "# Updated Content\n\nThis replaces the entire page.",
  "properties": {
    "status": "completed"
  }
}
```

#### Append to Page
```http
POST /api/pages/my-page-name/append
Content-Type: application/json

{
  "content": "\n- New bullet point added to the end"
}
```

#### Delete Page
```http
DELETE /api/pages/my-page-name
```

### Search & Navigation

#### Search Pages
```http
POST /api/search
Content-Type: application/json

{
  "query": "meeting notes",
  "tags": ["work"],
  "folder": "pages"
}
```

#### Get Backlinks
```http
GET /api/backlinks/my-page-name
```

#### Get Graph
```http
GET /api/graph?center=my-page-name&depth=2
```

### Journal Operations

#### Get Journal Entry
```http
GET /api/journal
GET /api/journal?date=2024-01-15
```

#### Create Journal Entry
```http
POST /api/journal
Content-Type: application/json

{
  "date": "2024-01-15",
  "template": "## Daily Log\n\n- [ ] Task 1\n- [ ] Task 2"
}
```

### Cultural Content

#### Add Article
```http
POST /api/content/article
Content-Type: application/json

{
  "title": "Interesting Article About AI",
  "summary": "This article discusses the future of AI",
  "tags": "ai, technology",
  "url": "https://example.com/article",
  "highlights": "Key point 1\nKey point 2",
  "date": "2024-01-15"
}
```

#### Add Book
```http
POST /api/content/book
Content-Type: application/json

{
  "title": "The Great Gatsby",
  "author": "F. Scott Fitzgerald",
  "tags": "fiction, classic",
  "memo": "Beautiful prose and tragic story"
}
```

#### Add Movie
```http
POST /api/content/movie
Content-Type: application/json

{
  "title": "Inception",
  "director": "Christopher Nolan",
  "memo": "Mind-bending plot, excellent cinematography"
}
```

#### Add Exhibition
```http
POST /api/content/exhibition
Content-Type: application/json

{
  "title": "Modern Art Showcase",
  "venue": "National Gallery",
  "artist": "Various Artists",
  "memo": "Impressive collection of contemporary works"
}
```

## N8N Workflow Examples

### Example 1: Create Daily Journal Entry

**Trigger:** Schedule (every day at 6 AM)

**HTTP Request Node:**
- Method: POST
- URL: `http://your-server:7842/api/journal`
- Authentication: Bearer Token (if API_KEY is set)
- Body:
```json
{
  "template": "## 🌅 Daily Plan\n\n- [ ] Review inbox\n- [ ] \n\n## 📝 Notes\n\n"
}
```

### Example 2: Save RSS Articles to Logseq

**Trigger:** RSS Feed

**HTTP Request Node:**
- Method: POST
- URL: `http://your-server:7842/api/content/article`
- Authentication: Bearer Token
- Body:
```json
{
  "title": "{{ $json.title }}",
  "url": "{{ $json.link }}",
  "summary": "{{ $json.description }}",
  "tags": "rss, reading"
}
```

### Example 3: Search and Send to Slack

**Trigger:** Webhook

**HTTP Request Node 1:**
- Method: POST
- URL: `http://your-server:7842/api/search`
- Body:
```json
{
  "query": "{{ $json.search_term }}",
  "folder": "pages"
}
```

**Code Node:** Format results

**Slack Node:** Send formatted results to channel

### Example 4: Create Page from Form Submission

**Trigger:** Webhook (form submission)

**HTTP Request Node:**
- Method: POST
- URL: `http://your-server:7842/api/pages`
- Body:
```json
{
  "name": "{{ $json.title }}",
  "content": "# {{ $json.title }}\n\nCreated: {{ $now }}\n\n{{ $json.content }}",
  "properties": {
    "source": "n8n",
    "created-by": "{{ $json.author }}"
  }
}
```

### Example 5: Weekly Review - Gather Tasks

**Trigger:** Schedule (every Monday at 9 AM)

**HTTP Request Node 1:** Search for TODO items
```json
{
  "query": "TODO",
  "folder": "pages"
}
```

**Code Node:** Process and format results

**HTTP Request Node 2:** Create weekly review page
```json
{
  "name": "Weekly Review {{ $now.format('YYYY-MM-DD') }}",
  "content": "# Weekly Review\n\n{{ $json.formatted_tasks }}"
}
```

## N8N HTTP Request Node Settings

### Basic Setup

1. **Method:** GET/POST/PUT/DELETE (depending on endpoint)
2. **URL:** `http://your-server:7842/api/...`
3. **Authentication:** 
   - Type: Generic Credential Type
   - Generic Auth Type: Header Auth
   - Name: `Authorization`
   - Value: `Bearer your-api-key`

### Headers
For POST/PUT requests:
```
Content-Type: application/json
```

### Response

All successful requests return JSON:
- GET requests: Return the requested data
- POST requests: Return created resource (201 status)
- PUT requests: Return updated resource
- DELETE requests: Return success message

### Error Handling

- **400**: Validation error (check request body)
- **401**: Unauthorized (check API_KEY)
- **404**: Page not found
- **500**: Server error (check logs)

## Testing with curl

Before building N8N workflows, test endpoints with curl:

```bash
# List pages
curl http://your-server:7842/api/pages

# With authentication
curl -H "Authorization: Bearer your-api-key" \
  http://your-server:7842/api/pages

# Create a page
curl -X POST http://your-server:7842/api/pages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "name": "Test Page",
    "content": "# Test\n\nThis is a test page."
  }'

# Search
curl -X POST http://your-server:7842/api/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "query": "meeting"
  }'

# Add article to today's journal
curl -X POST http://your-server:7842/api/content/article \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-api-key" \
  -d '{
    "title": "Interesting Article",
    "url": "https://example.com",
    "summary": "Key points from the article"
  }'
```

## Tips

1. **Use Variables**: Store your API URL and key in N8N credentials for reuse
2. **Error Handling**: Add error workflows to handle failed requests
3. **Rate Limiting**: Be mindful of request frequency if automating
4. **Logging**: Log successful operations to track what N8N creates
5. **Idempotency**: Check if page exists before creating to avoid duplicates
