# 🇮🇳 India MCP — Model Context Protocol Servers for Indian APIs

<p align="center">
  <strong>Let AI agents operate natively in the Indian market</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@samarth-23-eng/india-mcp"><img src="https://img.shields.io/npm/v/@samarth-23-eng/india-mcp?style=flat" alt="npm"></a>
  <a href="https://github.com/Samarth-23-eng/India-MCP/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat" alt="License"></a>
  <a href="https://modelcontextprotocol.io/"><img src="https://img.shields.io/badge/MCP-Compatible-green?style=flat" alt="MCP"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white" alt="TypeScript"></a>
</p>

India MCP provides Model Context Protocol (MCP) servers that wrap popular Indian government and enterprise APIs. Enable AI assistants like Claude Desktop, Cursor, and others to interact natively with Indian digital infrastructure.

## Available Servers

| Server | Registry | Tools | Description |
|--------|----------|------|-------------|
| **GST** | [`@samarth-23-eng/india-mcp-gst`](https://www.npmjs.com/package/@samarth-23-eng/india-mcp-gst) | 5 | Validate GSTINs, search HSN/SAC codes, calculate GST, get filing deadlines |
| **Railways** | [`@samarth-23-eng/india-mcp-railways`](https://www.npmjs.com/package/@samarth-23-eng/india-mcp-railways) | 7 | Search trains, PNR status, schedules, live status, fare enquiry |
| **RTO** | [`@samarth-23-eng/india-mcp-rto`](https://www.npmjs.com/package/@samarth-23-eng/india-mcp-rto) | 6 | Decode vehicle registration, road tax calculator, RTO info |
| **Delhivery** | [`@samarth-23-eng/india-mcp-delhivery`](https://www.npmjs.com/package/@samarth-23-eng/india-mcp-delhivery) | 6 | Track shipments, shipping rates, pincode serviceability |
| **DigiLocker** | [`@samarth-23-eng/india-mcp-digilocker`](https://www.npmjs.com/package/@samarth-23-eng/india-mcp-digilocker) | 5 | Access government documents, verify Aadhaar linking |

## Installation

Install all servers:
```bash
npm install @samarth-23-eng/india-mcp
```

Or install individual servers:
```bash
npm install @samarth-23-eng/india-mcp-gst
npm install @samarth-23-eng/india-mcp-railways
npm install @samarth-23-eng/india-mcp-rto
```

## Quick Start

### Claude Desktop Configuration

Add to your Claude Desktop `config.json`:

```json
{
  "mcpServers": {
    "india-gst": {
      "command": "npx",
      "args": ["@samarth-23-eng/india-mcp-gst"],
      "env": {}
    },
    "india-railways": {
      "command": "npx",
      "args": ["@samarth-23-eng/india-mcp-railways"],
      "env": {}
    },
    "india-rto": {
      "command": "npx",
      "args": ["@samarth-23-eng/india-mcp-rto"],
      "env": {}
    },
    "india-delhivery": {
      "command": "npx",
      "args": ["@samarth-23-eng/india-mcp-delhivery"],
      "env": {
        "DELHIVERY_TOKEN": "your_token_here"
      }
    },
    "india-digilocker": {
      "command": "npx",
      "args": ["@samarth-23-eng/india-mcp-digilocker"],
      "env": {
        "DIGILOCKER_CLIENT_ID": "your_client_id",
        "DIGILOCKER_CLIENT_SECRET": "your_client_secret"
      }
    }
  }
}
```

### Run Locally

```bash
# GST Server (no auth required)
npm run gst

# Railways Server (no auth required)
npm run railways

# RTO Server (no auth required)
npm run rto

# Delhivery Server (requires token)
DELHIVERY_TOKEN=your_token npm run delhivery

# DigiLocker Server (requires OAuth credentials)
DIGILOCKER_CLIENT_ID=xxx DIGILOCKER_CLIENT_SECRET=xxx npm run digilocker
```

## Environment Variables

| Variable | Server | Required | Description |
|----------|--------|----------|-------------|
| None | GST | No | Uses public GST APIs — no auth needed |
| `DELHIVERY_TOKEN` | Delhivery | Yes | Get from [Delhivery Dashboard](https://track.delhivery.com/settings/api) |
| `DIGILOCKER_CLIENT_ID` | DigiLocker | Yes | Get from [DigiLocker Developer Portal](https://digitallocker.gov.in/developer/) |
| `DIGILOCKER_CLIENT_SECRET` | DigiLocker | Yes | Get from [DigiLocker Developer Portal](https://digitallocker.gov.in/developer/) |

## Why India MCP?

India has unique digital infrastructure that global AI assistants cannot natively access:

- **GST System** — Every business in India must comply with GST. AI agents need to look up HSN codes, validate GSTINs, and calculate taxes.
- **Railways** — Indian Railways handles 8,000+ trains daily. AI agents need train search, PNR status, and live tracking.
- **RTO** — Vehicle registration, road tax, and challan checking are essential for automotive AI use cases.
- **Logistics** — Delhivery, Shiprocket handle most last-mile delivery in India.
- **DigiLocker** — Government documents (Aadhaar, PAN, driving license, vehicle registration) are stored here.

This project fills the gap in AI agent coverage for the world's largest market by population.

## Roadmap

Looking to add more servers. Contributions welcome:

- **India Post** — Track speed post shipments
- **EPFO/PF** — Provident fund information
- **IndiaMART** — B2B lead fetching
- **MakeMyTrip/IRCTC** — Travel booking
- **Razorpay** — Payment gateway integration

See [CONTRIBUTING.md](./CONTRIBUTING.md) for adding new servers.

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines on:

- Adding new MCP servers
- Code style and conventions
- PR submission checklist

## License

MIT License — see [LICENSE](./LICENSE) for details.

## Links

- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)
- [GST Public Portal](https://services.gst.gov.in)
- [Delhivery API Docs](https://track.delhivery.com)
- [DigiLocker Developer Portal](https://digitallocker.gov.in/developer/)
- [GitHub Issues](https://github.com/Samarth-23-eng/India-MCP/issues)

---

<!-- mcp-name: io.github.Samarth-23-eng/india-mcp -->