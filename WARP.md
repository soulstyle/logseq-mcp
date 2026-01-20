# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a GTD-focused fork of logseq-mcp that provides an MCP (Model Context Protocol) server for Logseq graph integration. It allows AI assistants like Claude to directly read and write to Logseq graphs, enabling natural language interactions with your personal knowledge management system.

**Key capabilities**: Page CRUD operations, full-text search, graph navigation (links/backlinks), journal management, cultural content logging (articles, books, movies, exhibitions), and planned GTD-specific features.

## Commands

### Build & Run
```bash
npm install          # Install dependencies
npm run build        # Compile TypeScript to dist/
npm start            # Run compiled server (production)
npm run dev          # Watch mode for development (tsc --watch)
```

### Testing the MCP Server
```bash
# Use MCP inspector to test the server interactively
npx @modelcontextprotocol/inspector node dist/index.js
```

### Git Workflow
This is a fork tracking upstream at `dearcloud09/logseq-mcp`:
```bash
git fetch upstream
git merge upstream/main
```

## Architecture

### Core Structure
```
src/
  index.ts              # MCP server entry point
                        # - Defines all 14 MCP tools with Zod schemas
                        # - Tool handlers with input validation
                        # - Security: path traversal protection, DoS limits
                        # - Error sanitization (removes file paths from errors)
  
  graph.ts              # GraphService - all filesystem operations
                        # - Page CRUD: create/read/update/delete/append
                        # - Search with tag/folder filtering
                        # - Graph navigation: links, backlinks, graph traversal
                        # - Journal operations with date handling
                        # - Security: symlink protection, path validation
  
  types.ts              # TypeScript type definitions
                        # - Page, PageMetadata, Block, SearchResult
                        # - Graph, GraphNode, GraphEdge
  
  weather-scraper.ts    # Korean weather scraping (Naver) for daily automation
```

### Logseq Graph Structure
The server operates on a Logseq graph with this structure:
```
{LOGSEQ_GRAPH_PATH}/
  pages/        # Regular pages (.md files)
  journals/     # Daily journals (YYYY_MM_DD.md format)
  logseq/       # Logseq settings
  whiteboards/  # Whiteboards (not yet supported)
```

### MCP Tools Available
**Page Operations**: `list_pages`, `read_page`, `create_page`, `update_page`, `delete_page`, `append_to_page`
**Search & Navigation**: `search_pages`, `get_backlinks`, `get_graph`
**Journal**: `get_journal`, `create_journal`
**Content Logging**: `add_article`, `add_book`, `add_movie`, `add_exhibition`

All tools use Zod schemas for validation with security limits (max content 10MB, max path 500 chars, etc.)

### Key Design Patterns

#### Security Model
- **Path Validation**: Whitelist-based page name validation in `graph.ts:validatePageName()` - blocks `..`, `/`, `\`, null bytes, and other dangerous characters
- **Symlink Protection**: All file reads check `lstat()` to prevent symlink/hardlink attacks
- **DoS Protection**: Content size limits enforced via Zod schemas (MAX_CONTENT_LENGTH = 10MB)
- **Error Sanitization**: `sanitizeErrorMessage()` strips file paths from errors before returning to client

#### Property Handling
Logseq properties are parsed from page content. Format:
```markdown
property1:: value1
property2:: value2
---
content starts here
```

Properties are extracted in `graph.ts:parseProperties()` and formatted in `formatProperties()`.

#### Journal Date Format
- User-facing: `YYYY-MM-DD` (e.g., `2024-01-15`)
- Filesystem: `YYYY_MM_DD.md` (e.g., `2024_01_15.md`)
- Conversion: `formatJournalDate()` and `parseJournalDate()` in `graph.ts`

#### Cultural Content Templates
Korean-centric templates for `add_book`, `add_movie`, `add_exhibition` use `[[문화]]` wikilinks. Customize these in `src/index.ts` (lines 475-568) for other languages.

### Environment Variables
- **Required**: `LOGSEQ_GRAPH_PATH` - absolute path to Logseq graph directory

## GTD Fork Enhancements

This fork extends the original with planned GTD features (see README-GTD.md):
- Block-level operations (delete/update/move blocks)
- Todo status management (TODO → DONE/WAITING, context/tag management)
- GTD weekly review tools (inbox processing, next actions, waiting items)
- Project management (link todos to projects, analyze progress)
- Better journal integration (date range queries, weekly review tracking)

## Development Guidelines

### When Modifying Tools
1. Add/update Zod schema at top of `index.ts` with security limits
2. Add tool definition to `TOOLS` array with clear Korean descriptions
3. Implement handler in switch statement of `CallToolRequestSchema` handler
4. If filesystem operation needed, add method to `GraphService` in `graph.ts`
5. Always validate inputs and sanitize errors

### Security Checklist
- Never trust user input for file paths - always validate with `validatePageName()` or `resolvePath()`
- Check for symlinks with `lstat()` before reading files
- Enforce content size limits via Zod schemas
- Use `sanitizeErrorMessage()` before returning errors
- Test path traversal attempts: `../../../etc/passwd`, absolute paths outside graph

### Korean Features
- Weather scraping uses Naver - requires Korean location (see `weather-scraper.ts`)
- Daily automation via macOS launchd (see `com.logseq.daily-automation.plist.example`)
- Cultural content templates assume Korean wikilink structure

### File Naming Conventions
- TypeScript strict mode enabled
- Use ES2022 with NodeNext modules
- All files use `.js` extensions in imports (ES modules)
- Output goes to `dist/` directory

## Configuration for Warp/Claude

Add to MCP server configuration:
```json
{
  "logseq-gtd": {
    "command": "node",
    "args": ["/Users/soulstream/Local Sites/logseq-mcp-gtd/dist/index.js"],
    "env": {
      "LOGSEQ_GRAPH_PATH": "/path/to/your/logseq/graph"
    }
  }
}
```

## Known Limitations
- **Markdown only** - org-mode not supported
- **Local graphs only** - Logseq Sync requires local file access
- **No whiteboard support** yet
- **No block-level operations** yet (planned for GTD fork)
- **No property search** yet

## Related Projects
- [GTD AI Assistant](https://github.com/soulstyle/GTD-AI-Assistant) - Uses this MCP server for weekly reviews
- Upstream: [dearcloud09/logseq-mcp](https://github.com/dearcloud09/logseq-mcp)
