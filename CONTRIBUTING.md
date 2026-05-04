# Contributing to India MCP

Thank you for your interest in contributing to India MCP! This guide will help you add new MCP servers for Indian APIs.

## Table of Contents

- [Getting Started](#getting-started)
- [Adding a New Server](#adding-a-new-server)
- [Server Template](#server-template)
- [PR Checklist](#pr-checklist)
- [Wanted Servers](#wanted-servers)

## Getting Started

1. Fork this repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/india-mcp.git`
3. Install dependencies: `npm install`
4. Create a branch: `git checkout -b add-server-name`

## Adding a New Server

### Step 1: Create Server Directory

```bash
mkdir src/servers/{server-name}
```

### Step 2: Copy Base Server Template

Create your server file at `src/servers/{server-name}/server.ts`:

```typescript
import axios from 'axios';
import { z } from 'zod';
import { BaseMCPServer } from '../../shared/base-server.js';

const RequestSchema = z;
const API_BASE_URL = 'https://api.example.com';

export class ServerNameServer extends BaseMCPServer {
  constructor() {
    super('server-name-server', '1.0.0');
  }

  protected tools = [
    {
      name: 'tool_name',
      description: 'Description of what the tool does',
      inputSchema: RequestSchema.object({
        param1: z.string(),
        param2: z.number().optional(),
      }),
      handler: async (args: Record<string, unknown>): Promise<unknown> => {
        const param1 = args.param1 as string;
        const param2 = args.param2 as number | undefined;
        
        // API call or logic here
        return { param1, param2, result: 'success' };
      },
    },
  ];
}
```

### Step 3: Create Entry Point

Create at `src/servers/{server-name}/entry.ts`:

```typescript
import { ServerNameServer } from './server.js';

async function main() {
  const server = new ServerNameServer();
  await server.start();
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
```

### Step 4: Add Script to package.json

```json
"scripts": {
  "server-name": "ts-node --esm src/servers/{server-name}/entry.ts"
}
```

### Step 5: Update Documentation

- Add server to README.md table
- Create server.json in server directory
- Update this CONTRIBUTING.md with new server info

## Server Template

For reference, see the completed servers:

- [GST Server](./src/servers/gst-server.ts) — Government API, no auth
- [Delhivery Server](./src/servers/delhivery-server.ts) — Bearer token auth
- [DigiLocker Server](./src/servers/digilocker-server.ts) — OAuth2 flow

## PR Checklist

Before submitting a PR, ensure:

- [ ] Server file compiles without TypeScript errors
- [ ] All tools have input validation with proper error messages
- [ ] API errors are handled gracefully (401, 429, 404)
- [ ] Entry point imports and starts server correctly
- [ ] package.json script works with `npm run server-name`
- [ ] README.md updated with server in table
- [ ] server.json created with proper metadata
- [ ] .env.example updated with required variables

## Wanted Servers

Looking for contributions for these APIs:

### 1. Zoho Books
- **Purpose**: Indian accounting software
- **API Docs**: https://www.zoho.com/books/api/v3/
- **Auth**: OAuth2
- **Tags**: accounting, invoicing, taxes

### 2. IndiaMART
- **Purpose**: B2B marketplace
- **API Docs**: https://seller.indiamart.com/

- **Auth**: API key
- **Tags**: b2b, marketplace, leads

### 3. NSDL (Protean)
- **Purpose**: Demat account operations
- **API Docs**: https://nsdl.co.in/
- **Auth**: Username/password + OTP
- **Tags**: demat, securities, investments

### 4. MakeMyTrip
- **Purpose**: Flight and hotel booking
- **API Docs**: https://developer.makemytrip.com/
- **Auth**: API key
- **Tags**: travel, booking, flights

### 5. IRCTC
- **Purpose**: Indian Railways booking
- **API Docs**: https://www.irctc.co.in/
- **Auth**: Login-based
- **Tags**: railways, tickets, travel

### 6. Shiprocket
- **Purpose**: Shipping aggregator
- **API Docs**: https://apidocs.shiprocket.ai/
- **Auth**: API key
- **Tags**: shipping, logistics, ecommerce

### 7. Razorpay
- **Purpose**: Payment gateway
- **API Docs**: https://razorpay.com/docs/api/
- **Auth**: Key/secret
- **Tags**: payments, banking, fintech

### 8. Instamojo
- **Purpose**:_payment gateway
- **Auth**: API key
- **Tags**: payments, small business

### 9. ClearTax
- **Purpose**: Tax filing
- **Auth**: OAuth2
- **Tags**: tax, filing, compliance

### 10. Paisabazaar
- **Purpose**: Financial products aggregation
- **Auth**: API key
- **Tags**: loans, credit, finance

## Code Style

- Use TypeScript with strict mode
- Use Zod for input validation
- Handle all error cases gracefully
- Include helpful error messages with hints
- Document environment variables clearly

## Questions?

- Open an issue for bugs or feature requests
- Discu ss in PR comments for code review

Thank you for contributing!