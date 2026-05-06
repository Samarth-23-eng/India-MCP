# 💡 India-MCP Examples & Workflows

Learn how to configure your favorite AI tools and execute complex Indian market workflows.

---

## 🔧 Client Configurations

### Claude Desktop
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
    }
  }
}
```

### Cursor
Add as **Command** in MCP settings:
`npx -y @samarth-23-eng/india-mcp stocks`

---

## 🔄 Multi-Tool Workflows

### 1. Business Onboarding Verification
**Objective**: Verify a new vendor's legal and financial status.
1. `validate_gstin` (GST Server) → Check if active.
2. `get_ifsc_details` (Banking Server) → Verify branch existence.
3. `validate_upi_vpa` (Banking Server) → Confirm payment address.

### 2. Legal Entity Analysis
**Objective**: Check a listed company's market data and pending litigation.
1. `get_stock_quote` (Stocks Server) → Check price & market cap.
2. `search_case` (eCourts Server) → Search litigation using company name.

### 3. Logistics & Compliance
**Objective**: Verify vehicle for transport and calculate tax.
1. `get_vehicle_details` (RTO Server) → Check fitness and age.
2. `calculate_road_tax` (RTO Server) → Estimate compliance costs.

---

## 📡 JSON-RPC Manual Call
If you are building your own client, use this format:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "get_stock_quote",
    "arguments": {
      "symbol": "TCS"
    }
  }
}
```
