# Logseq MCP Server - GTD Fork

This is a GTD (Getting Things Done) focused fork of [dearcloud09/logseq-mcp](https://github.com/dearcloud09/logseq-mcp).

## Why This Fork?

This fork extends the original with GTD-specific features for weekly reviews and task management:

### Planned Enhancements

- [ ] **Block-level operations**
  - Delete individual todo blocks
  - Update specific block content
  - Move blocks between pages
  
- [ ] **Todo status management**
  - Change TODO → DONE
  - Change TODO → WAITING
  - Add/remove contexts (@work, @home, etc.)
  - Add/remove tags

- [ ] **GTD Weekly Review tools**
  - Get inbox items (#inbox tag)
  - Get next actions (#next tag)
  - Get waiting items (WAITING status)
  - Process inbox (remove #inbox, add context/project)
  - Mark todos as done with logbook
  
- [ ] **Project management**
  - Link todos to projects
  - Get all todos for a project
  - Analyze project progress

- [ ] **Better journal integration**
  - Append to specific blocks in journal
  - Find todos in date range
  - Weekly review completion tracking

## Installation

Same as original:

```bash
npm install
npm run build
```

## Configuration

For Warp, add to MCP servers:

```json
{
  "Logseq GTD": {
    "command": "node",
    "args": ["/Users/soulstream/Local Sites/logseq-mcp-gtd/dist/index.js"],
    "env": {
      "LOGSEQ_GRAPH_PATH": "/path/to/your/logseq/graph"
    }
  }
}
```

## Development

```bash
# Watch mode for development
npm run dev

# Build for production
npm run build

# Test with MCP inspector
npx @modelcontextprotocol/inspector node dist/index.js
```

## Upstream

This fork tracks [dearcloud09/logseq-mcp](https://github.com/dearcloud09/logseq-mcp) as `upstream`.

To sync with upstream:
```bash
git fetch upstream
git merge upstream/main
```

## License

Same as upstream: [Polyform Noncommercial 1.0.0](LICENSE) - Free for personal and noncommercial use.

## Related Projects

- [GTD AI Assistant](https://github.com/soulstyle/GTD-AI-Assistant) - AI-powered weekly review system using this MCP server
- Original: [dearcloud09/logseq-mcp](https://github.com/dearcloud09/logseq-mcp)
