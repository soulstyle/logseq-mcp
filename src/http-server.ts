#!/usr/bin/env node

/**
 * HTTP API Wrapper for Logseq MCP Server
 * 
 * Exposes all MCP tools as REST API endpoints for use with N8N and other HTTP clients.
 */

import express from 'express';
import cors from 'cors';
import { z } from 'zod';
import { GraphService } from './graph.js';

const GRAPH_PATH = process.env.LOGSEQ_GRAPH_PATH;
if (!GRAPH_PATH) {
  console.error('Error: LOGSEQ_GRAPH_PATH environment variable is required');
  process.exit(1);
}

const PORT = parseInt(process.env.PORT || '7842', 10);
const API_KEY = process.env.API_KEY; // Optional API key for authentication

const graph = new GraphService(GRAPH_PATH);
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// API Key authentication middleware (if API_KEY is set)
const authenticate = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!API_KEY) {
    return next();
  }

  const authHeader = req.headers.authorization;
  const providedKey = authHeader?.replace('Bearer ', '');

  if (providedKey !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
};

app.use(authenticate);

// Security constants
const MAX_PATH_LENGTH = 500;
const MAX_NAME_LENGTH = 200;
const MAX_QUERY_LENGTH = 1000;
const MAX_TAG_LENGTH = 100;
const MAX_TAGS_COUNT = 50;
const MAX_CONTENT_LENGTH = 10 * 1024 * 1024; // 10MB

// Schemas
const ListPagesSchema = z.object({
  folder: z.enum(['pages', 'journals']).optional(),
});

const ReadPageSchema = z.object({
  path: z.string().max(MAX_PATH_LENGTH),
});

const CreatePageSchema = z.object({
  name: z.string().max(MAX_NAME_LENGTH),
  content: z.string().max(MAX_CONTENT_LENGTH),
  properties: z.record(z.string().max(10000)).optional(),
});

const UpdatePageSchema = z.object({
  path: z.string().max(MAX_PATH_LENGTH),
  content: z.string().max(MAX_CONTENT_LENGTH),
  properties: z.record(z.string().max(10000)).optional(),
});

const DeletePageSchema = z.object({
  path: z.string().max(MAX_PATH_LENGTH),
});

const AppendToPageSchema = z.object({
  path: z.string().max(MAX_PATH_LENGTH),
  content: z.string().max(MAX_CONTENT_LENGTH),
});

const SearchPagesSchema = z.object({
  query: z.string().max(MAX_QUERY_LENGTH),
  tags: z.array(z.string().max(MAX_TAG_LENGTH)).max(MAX_TAGS_COUNT).optional(),
  folder: z.enum(['pages', 'journals']).optional(),
});

const GetBacklinksSchema = z.object({
  path: z.string().max(MAX_PATH_LENGTH),
});

const GetGraphSchema = z.object({
  center: z.string().max(MAX_NAME_LENGTH).optional(),
  depth: z.number().int().min(0).max(10).optional(),
});

const GetJournalSchema = z.object({
  date: z.string().max(10).optional(),
});

const CreateJournalSchema = z.object({
  date: z.string().max(10).optional(),
  template: z.string().max(MAX_CONTENT_LENGTH).optional(),
});

const AppendToJournalSchema = z.object({
  date: z.string().max(10).optional(),
  content: z.string().max(MAX_CONTENT_LENGTH),
});

const AddArticleSchema = z.object({
  title: z.string().max(500),
  summary: z.string().max(2000).optional(),
  tags: z.string().max(500).optional(),
  url: z.string().max(2000).optional(),
  highlights: z.string().max(10000).optional(),
  date: z.string().max(10).optional(),
});

const AddBookSchema = z.object({
  title: z.string().max(500),
  author: z.string().max(200).optional(),
  tags: z.string().max(500).optional(),
  memo: z.string().max(10000).optional(),
  date: z.string().max(10).optional(),
});

const AddMovieSchema = z.object({
  title: z.string().max(500),
  director: z.string().max(200).optional(),
  memo: z.string().max(10000).optional(),
  date: z.string().max(10).optional(),
});

const AddExhibitionSchema = z.object({
  title: z.string().max(500),
  venue: z.string().max(200).optional(),
  artist: z.string().max(200).optional(),
  memo: z.string().max(10000).optional(),
  date: z.string().max(10).optional(),
});

// Error handler
const asyncHandler = (fn: Function) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API documentation
app.get('/', (req, res) => {
  res.json({
    name: 'Logseq MCP HTTP API',
    version: '1.0.0',
    endpoints: {
      'GET /health': 'Health check',
      'GET /api/pages': 'List all pages',
      'GET /api/pages/:path': 'Read a specific page',
      'POST /api/pages': 'Create a new page',
      'PUT /api/pages/:path': 'Update a page',
      'DELETE /api/pages/:path': 'Delete a page',
      'POST /api/pages/:path/append': 'Append content to a page',
      'POST /api/search': 'Search pages',
      'GET /api/backlinks/:path': 'Get backlinks for a page',
      'GET /api/graph': 'Get graph data',
      'GET /api/journal': 'Get journal entry',
      'POST /api/journal': 'Create journal entry',
      'POST /api/journal/append': 'Append to journal (creates if needed)',
      'POST /api/content/article': 'Add article to journal',
      'POST /api/content/book': 'Add book to journal',
      'POST /api/content/movie': 'Add movie to journal',
      'POST /api/content/exhibition': 'Add exhibition to journal',
    },
    authentication: API_KEY ? 'Bearer token required' : 'None',
  });
});

// List pages
app.get('/api/pages', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { folder } = ListPagesSchema.parse(req.query);
  const pages = await graph.listPages(folder);
  res.json(pages);
}));

// Read page
app.get('/api/pages/:path(*)', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { path } = ReadPageSchema.parse({ path: req.params.path });
  const page = await graph.readPage(path);
  res.json(page);
}));

// Create page
app.post('/api/pages', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { name, content, properties } = CreatePageSchema.parse(req.body);
  const page = await graph.createPage(name, content, properties);
  res.status(201).json(page);
}));

// Update page
app.put('/api/pages/:path(*)', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { content, properties } = UpdatePageSchema.omit({ path: true }).parse(req.body);
  const page = await graph.updatePage(req.params.path, content, properties);
  res.json(page);
}));

// Delete page
app.delete('/api/pages/:path(*)', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { path } = DeletePageSchema.parse({ path: req.params.path });
  await graph.deletePage(path);
  res.json({ message: `Page deleted: ${path}` });
}));

// Append to page
app.post('/api/pages/:path(*)/append', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { content } = AppendToPageSchema.omit({ path: true }).parse(req.body);
  const page = await graph.appendToPage(req.params.path, content);
  res.json(page);
}));

// Search pages
app.post('/api/search', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { query, tags, folder } = SearchPagesSchema.parse(req.body);
  const results = await graph.searchPages(query, { tags, folder });
  res.json(results);
}));

// Get backlinks
app.get('/api/backlinks/:path(*)', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { path } = GetBacklinksSchema.parse({ path: req.params.path });
  const backlinks = await graph.getBacklinks(path);
  res.json(backlinks);
}));

// Get graph
app.get('/api/graph', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { center, depth } = GetGraphSchema.parse({
    center: req.query.center,
    depth: req.query.depth ? parseInt(req.query.depth as string, 10) : undefined,
  });
  const graphData = await graph.getGraph({ center, depth });
  res.json(graphData);
}));

// Get journal
app.get('/api/journal', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { date } = GetJournalSchema.parse(req.query);
  const journal = await graph.getJournalPage(date);
  res.json(journal);
}));

// Create journal
app.post('/api/journal', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { date, template } = CreateJournalSchema.parse(req.body);
  const journal = await graph.createJournalPage(date, template);
  res.status(201).json(journal);
}));

// Append to journal (creates if doesn't exist)
app.post('/api/journal/append', asyncHandler(async (req: express.Request, res: express.Response) => {
  const { date, content } = AppendToJournalSchema.parse(req.body);
  const journal = await graph.appendToJournalPage(date, content);
  res.status(201).json(journal);
}));

// Add article
app.post('/api/content/article', asyncHandler(async (req: express.Request, res: express.Response) => {
  const data = AddArticleSchema.parse(req.body);
  const today = data.date || new Date().toISOString().split('T')[0];
  
  let content = `- [[문화]] 아티클: [[${data.title}]]`;
  if (data.url) content += `\n  - URL: ${data.url}`;
  if (data.summary) content += `\n  - 요약: ${data.summary}`;
  if (data.tags) content += `\n  - 태그: ${data.tags}`;
  if (data.highlights) content += `\n  - 하이라이트:\n${data.highlights.split('\n').map(l => `    - ${l}`).join('\n')}`;
  
  const journal = await graph.appendToJournalPage(today, content);
  res.status(201).json(journal);
}));

// Add book
app.post('/api/content/book', asyncHandler(async (req: express.Request, res: express.Response) => {
  const data = AddBookSchema.parse(req.body);
  const today = data.date || new Date().toISOString().split('T')[0];
  
  let content = `- [[문화]] 책: [[${data.title}]]`;
  if (data.author) content += `\n  - 저자: ${data.author}`;
  if (data.tags) content += `\n  - 태그: ${data.tags}`;
  if (data.memo) content += `\n  - 메모: ${data.memo}`;
  
  const journal = await graph.appendToJournalPage(today, content);
  res.status(201).json(journal);
}));

// Add movie
app.post('/api/content/movie', asyncHandler(async (req: express.Request, res: express.Response) => {
  const data = AddMovieSchema.parse(req.body);
  const today = data.date || new Date().toISOString().split('T')[0];
  
  let content = `- [[문화]] 영화: [[${data.title}]]`;
  if (data.director) content += `\n  - 감독: ${data.director}`;
  if (data.memo) content += `\n  - 메모: ${data.memo}`;
  
  const journal = await graph.appendToJournalPage(today, content);
  res.status(201).json(journal);
}));

// Add exhibition
app.post('/api/content/exhibition', asyncHandler(async (req: express.Request, res: express.Response) => {
  const data = AddExhibitionSchema.parse(req.body);
  const today = data.date || new Date().toISOString().split('T')[0];
  
  let content = `- [[문화]] 전시: [[${data.title}]]`;
  if (data.venue) content += `\n  - 장소: ${data.venue}`;
  if (data.artist) content += `\n  - 작가: ${data.artist}`;
  if (data.memo) content += `\n  - 메모: ${data.memo}`;
  
  const journal = await graph.appendToJournalPage(today, content);
  res.status(201).json(journal);
}));

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  
  if (err instanceof z.ZodError) {
    return res.status(400).json({
      error: 'Validation error',
      details: err.errors,
    });
  }
  
  res.status(500).json({
    error: err.message || 'Internal server error',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Logseq MCP HTTP API running on port ${PORT}`);
  console.log(`Graph path: ${GRAPH_PATH}`);
  console.log(`Authentication: ${API_KEY ? 'Enabled' : 'Disabled'}`);
});
