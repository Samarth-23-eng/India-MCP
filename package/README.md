# 🇮🇳 India MCP

<p align="center">
  <strong>Model Context Protocol Servers for Indian APIs</strong>
</p>

<p align="center">
  Let AI agents operate natively in the Indian market
</p>

<p align="center">
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white" alt="TypeScript"></a>
  <a href="https://modelcontextprotocol.io/"><img src="https://img.shields.io/badge/MCP-1.29.0-blue?style=flat" alt="MCP"></a>
  <a href="https://github.com/anomalyco/opencode/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-MIT-green?style=flat" alt="License MIT"></a>
</p>

## Overview

India MCP provides Model Context Protocol servers that wrap popular Indian government and enterprise APIs, enabling AI assistants like Claude, ChatGPT, and others to interact natively with Indian digital infrastructure.

## Servers

| Server | API Wrapped | Tools | Status |
|--------|-------------|-------|--------|
| [GST Server](./src/servers/gst-server.ts) | GST Public APIs (services.gst.gov.in) | 5 | Active |
| [Delhivery Server](./src/servers/delhivery-server.ts) | Delhivery Logistics API | 6 | Active |
| [DigiLocker Server](./src/servers/digilocker-server.ts) | DigiLocker OAuth2 API | 5 | Active |

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure in Claude Desktop

Add server configurations to your Claude Desktop config JSON:

```json
{
  "mcpServers": {
    "india-gst": {
      "command": "npx",
      "args": ["--yes", "ts-node", "--esm", "src/servers/gst-server-entry.ts"],
      "env": {}
    },
    "india-delhivery": {
      "command": "npx",
      "args": ["--yes", "ts-node", "--esm", "src/servers/delhivery-server-entry.ts"],
      "env": {
        "DELHIVERY_TOKEN": "your_token"
      }
    },
    "india-digilocker": {
      "command": "npx",
      "args": ["--yes", "ts-node", "--esm", "src/servers/digilocker-server-entry.ts"],
      "env": {
        "DIGILOCKER_CLIENT_ID": "your_client_id",
        "DIGILOCKER_CLIENT_SECRET": "your_client_secret"
      }
    }
  }
}
```

### 3. Run Locally

```bash
# GST Server (no auth required)
npm run gst

# Delhivery Server (requires token)
DELHIVERY_TOKEN=your_token npm run delhivery

# DigiLocker Server (requires OAuth credentials)
DIGILOCKER_CLIENT_ID=xxx DIGILOCKER_CLIENT_SECRET=xxx npm run digilocker
```

## Environment Variables

### GST Server
| Variable | Required | Description |
|----------|----------|-------------|
| None | No | Uses public GST APIs |

### Delhivery Server
| Variable | Required | Description |
|----------|----------|-------------|
| `DELHIVERY_TOKEN` | Yes | API token from Delhivery dashboard |

### DigiLocker Server
| Variable | Required | Description |
|----------|----------|-------------|
| `DIGILOCKER_CLIENT_ID` | Yes | Client ID from DigiLocker Developer Portal |
| `DIGILOCKER_CLIENT_SECRET` | Yes | Client Secret from DigiLocker Developer Portal |
| `DIGILOCKER_ACCESS_TOKEN` | No | Pre-generated access token (optional) |

## Why India MCP?

The Indian market has unique digital infrastructure that global AI assistants cannot natively access:

- **GST System** — Every business in India must comply with GST. AI agents need to look up HSN codes, validate GSTINs, and calculate taxes.
- **Logistics** — Delhivery, Shiprocket, and Ecom Express handle most last-mile delivery. AI agents need tracking and rate calculation.
- **DigiLocker** — Government documents (Aadhaar, PAN, driving license, vehicle registration) are stored here. AI agents need document access.

This project fills the gap in AI agent coverage for the world's largest market by population.

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

### Adding a New Server

1. Create a new server file following the base server pattern
2. Implement all required tools
3. Add entry point script
4. Update README.md with server details
5. Submit a PR

### Supported APIs

Looking for contributions for these APIs:

- **Zoho Books** — Indian accounting software
- **IndiaMART** — B2B marketplace API
- **NSDL** — Protean (CDSL, NSDL demat)
- **MakeMyTrip** — Travel booking API
- **IRCTC** — Indian Railways API

Check [CONTRIBUTING.md](./CONTRIBUTING.md) for implementation guidelines.

## License

MIT License — see [LICENSE](./LICENSE) for details.

## Links

- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)
- [GST Public Portal](https://services.gst.gov.in)
- [Delhivery API Docs](https://track.delhivery.com)
- [DigiLocker Developer Portal](https://digitallocker.gov.in/developer/)
- [Contributing Guide](./CONTRIBUTING.md)