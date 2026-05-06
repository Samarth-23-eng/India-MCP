# 🇮🇳 India MCP

[![npm version](https://img.shields.io/npm/v/@samarth-23-eng/india-mcp?style=flat)](https://www.npmjs.com/package/@samarth-23-eng/india-mcp)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MCP Compatible](https://img.shields.io/badge/MCP-Compatible-green)](https://modelcontextprotocol.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Collection of MCP (Model Context Protocol) servers for Indian APIs and services. Enable AI agents like Claude, Cursor, and OpenCode to operate natively in the Indian market with real-time data and specialized tools.

---

## 🇮🇳 Why India-MCP?

Indian digital infrastructure is powerful but fragmented. Many government and enterprise portals are:
- **Unstable**: Intermittent downtime and slow response times.
- **Protected**: Require specific headers and session management.
- **Inconsistent**: Varying data formats (HTML, JSON, XML).

**India-MCP** provides a **unified, resilient, and AI-optimized layer** over these services, enabling agents to verify identities, track logistics, analyze markets, and navigate the legal system with a single protocol.

---

## 🚀 Features

- **Production Grade**: Hardened servers with retry logic, request timeouts, and in-memory TTL caching.
- **Resilient Data**: Intelligent fallback strategies (e.g., NSE → Yahoo Finance) for maximum availability.
- **Privacy First**: Browser-compliant headers and respectful API usage patterns.
- **Developer Friendly**: Clean JSON-RPC interfaces and normalized tool responses.
- **Unified Ecosystem**: Shared utilities for banking, legal, and market data.

---

## 🛠 Available Servers

| Server | Domain | Tools | Description |
| :--- | :--- | :---: | :--- |
| **GST** | Taxation | 5 | Validate GSTINs, HSN codes, and tax calculations. |
| **Railways** | Transport | 7 | Live train status, PNR enquiry, and schedules. |
| **RTO** | Automotive | 6 | Vehicle registration details and road tax calculator. |
| **Banking** | Fintech | 3 | IFSC search, UPI validation, and bank status. |
| **Stocks** | Markets | 8 | NSE/BSE real-time quotes, indices, and history. |
| **eCourts** | Legal | 6 | Court cases, orders, and cause list retrieval. |

Detailed catalog: [docs/SERVERS.md](./docs/SERVERS.md) | Full Tool Index: [docs/TOOLS.md](./docs/TOOLS.md)

---

## 📦 Installation

```bash
npm install -g @samarth-23-eng/india-mcp
```

**Quick start — launch any server with one command:**

```bash
india-mcp stocks       # NSE/BSE stock data
india-mcp gst          # GST validation
india-mcp ecourts      # Court case lookup
india-mcp fssai        # Food license verification
india-mcp list         # Show all available servers
india-mcp --help       # Full usage guide
```

Or use `npx` without installing:

```bash
npx @samarth-23-eng/india-mcp stocks
```

---

## 🔌 MCP Client Configuration

### Claude Desktop
Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "india-stocks": {
      "command": "npx",
      "args": ["-y", "@samarth-23-eng/india-mcp", "stocks"]
    },
    "india-ecourts": {
      "command": "npx",
      "args": ["-y", "@samarth-23-eng/india-mcp", "ecourts"]
    },
    "india-gst": {
      "command": "npx",
      "args": ["-y", "@samarth-23-eng/india-mcp", "gst"]
    }
  }
}
```

Detailed guides: [docs/EXAMPLES.md](./docs/EXAMPLES.md)

---

## 🏗 Architecture

India-MCP uses a shared resilience layer to handle the instability of Indian government portals.
- **Retries**: 2 retries with exponential backoff for all network calls.
- **Caching**: TTL-based memory cache to prevent IP blocking.
- **Fallbacks**: Automatic switching to backup data sources.

Technical details: [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)

---

## 🛤 Roadmap

Planned servers:
- [ ] **eCourts (Extended)**: Supreme Court and High Court specific filters.
- [ ] **FSSAI**: Food license validation.
- [ ] **CDSCO**: Medicine registry verification.
- [ ] **Land Records**: Digital Bhulekh access.

---

## 🚀 Release Process

1. **Bump Version**: `npm version patch --no-git-tag-version`
2. **Build**: `npm run build`
3. **Validate**: `npm run validate:publish`
4. **Publish to npm**: `npm publish --access public`
5. **Registry**: `mcp-publisher validate` & `mcp-publisher publish`

---

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) to get started.

---

## 📄 License

MIT © [Samarth-23-eng](https://github.com/Samarth-23-eng)

