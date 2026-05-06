# 🇮🇳 India-MCP Server Catalog

A unified collection of Model Context Protocol (MCP) servers tailored for the Indian digital ecosystem.

| Server | Domain | Tools | Status | Description |
| :--- | :--- | :---: | :--- | :--- |
| **GST** | Taxation | 5 | ✅ Live | Validate GSTINs, HSN codes, and tax calculations. |
| **Railways** | Transport | 7 | ✅ Live | Live train status, PNR enquiry, and schedules. |
| **RTO** | Automotive | 6 | ✅ Live | Vehicle registration details and road tax calculator. |
| **Banking** | Fintech | 3 | ✅ Live | IFSC search, UPI validation, and bank status. |
| **Stocks** | Markets | 8 | ✅ Live | NSE/BSE real-time quotes, indices, and history. |
| **eCourts** | Legal | 6 | ✅ Live | Court cases, orders, and cause list retrieval. |

---

## 🏛 Domain Coverage

### 💰 Finance & Taxation
- **GST Server**: Direct integration with GST concepts for business compliance.
- **Banking Server**: Infrastructure for verifying payment endpoints (UPI/IFSC).
- **Stocks Server**: Real-time equity and index data from Indian exchanges.

### 🚆 Infrastructure & Mobility
- **Railways Server**: Access to the world's fourth-largest railway network data.
- **RTO Server**: Verification of automotive and registration records.

### ⚖️ Legal & Governance
- **eCourts Server**: Transparency into the Indian judicial system (District & High Courts).

---

## 🏗 Quality Standards

Every server in this catalog adheres to the **India-MCP Production Standard**:
1. **Resilience**: Minimum 2 retries on all government portal requests.
2. **Caching**: Intelligent TTL caching for frequently accessed records.
3. **Normalization**: Consistent JSON schemas across all tools.
4. **Security**: Browser-compliant headers to ensure stable connectivity.
