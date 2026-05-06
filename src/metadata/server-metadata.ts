/**
 * Server-level metadata for all India-MCP servers.
 * Describes each server's domain, data sources, and capabilities.
 */

import type { CategoryKey } from './categories.js';
import type { RiskLevel, StabilityLevel, DataSource, ToolTag } from './tool-metadata.js';
import { getToolsByServer } from './tool-metadata.js';

export interface ServerMetadata {
  key: string;
  name: string;
  binName: string;
  categories: CategoryKey[];
  description: string;
  longDescription: string;
  tags: ToolTag[];
  stability: StabilityLevel;
  maxRiskLevel: RiskLevel;
  sources: DataSource[];
  requiresAuth: boolean;
  domains: string[];
  entryFile: string;
  get toolCount(): number;
}

class ServerMeta implements ServerMetadata {
  key!: string;
  name!: string;
  binName!: string;
  categories!: CategoryKey[];
  description!: string;
  longDescription!: string;
  tags!: ToolTag[];
  stability!: StabilityLevel;
  maxRiskLevel!: RiskLevel;
  sources!: DataSource[];
  requiresAuth!: boolean;
  domains!: string[];
  entryFile!: string;

  constructor(config: Omit<ServerMetadata, 'toolCount'>) {
    Object.assign(this, config);
  }

  get toolCount(): number {
    return getToolsByServer(this.key).length;
  }
}

export const SERVER_METADATA: ServerMetadata[] = [
  new ServerMeta({
    key: 'gst',
    name: 'GST',
    binName: 'india-mcp-gst',
    categories: ['compliance', 'finance'],
    description: 'Validate GSTINs, search HSN codes, and calculate taxes.',
    longDescription: 'Provides comprehensive access to India\'s Goods and Services Tax system. Validate any GSTIN for registration status, look up HSN/SAC codes with rates, and compute CGST/SGST/IGST breakdowns. Also surfaces GST filing deadlines for tax compliance workflows.',
    tags: ['compliance', 'government', 'finance', 'verification', 'public-data'],
    stability: 'stable',
    maxRiskLevel: 'low',
    sources: ['GST Portal', 'Offline DB'],
    requiresAuth: false,
    domains: ['taxation', 'compliance', 'business-verification'],
    entryFile: 'gst-server-entry.js',
  }),
  new ServerMeta({
    key: 'railways',
    name: 'Railways',
    binName: 'india-mcp-railways',
    categories: ['transport', 'government'],
    description: 'Live train status, PNR enquiry, schedules, and fare calculation.',
    longDescription: 'Access the world\'s fourth-largest railway network. Search trains between stations, check real-time running status, enquire PNR booking status, get station-wise schedules, and calculate fares across travel classes.',
    tags: ['transport', 'government', 'realtime', 'public-data', 'search'],
    stability: 'stable',
    maxRiskLevel: 'medium',
    sources: ['Indian Railways'],
    requiresAuth: false,
    domains: ['transport', 'travel', 'logistics'],
    entryFile: 'railways-server-entry.js',
  }),
  new ServerMeta({
    key: 'rto',
    name: 'RTO',
    binName: 'india-mcp-rto',
    categories: ['transport', 'government', 'compliance'],
    description: 'Vehicle registration details, challan checks, and road tax calculator.',
    longDescription: 'Interface with India\'s Regional Transport Office data. Decode vehicle registration numbers, retrieve ownership and insurance details, check pending challans, calculate road tax liability, and get RTO office information.',
    tags: ['verification', 'government', 'compliance', 'risk-analysis', 'transport'],
    stability: 'stable',
    maxRiskLevel: 'high',
    sources: ['RTO Portal', 'Offline DB'],
    requiresAuth: false,
    domains: ['automotive', 'transport', 'compliance'],
    entryFile: 'rto-server-entry.js',
  }),
  new ServerMeta({
    key: 'banking',
    name: 'Banking',
    binName: 'india-mcp-banking',
    categories: ['finance', 'business'],
    description: 'IFSC lookups, UPI validation, and bank uptime status.',
    longDescription: 'Core financial infrastructure verification. Look up bank branch details using IFSC codes, validate UPI Virtual Payment Addresses, and check real-time UPI uptime for major Indian banks.',
    tags: ['finance', 'verification', 'realtime', 'public-data'],
    stability: 'stable',
    maxRiskLevel: 'low',
    sources: ['Razorpay IFSC', 'NPCI UPI', 'Offline DB'],
    requiresAuth: false,
    domains: ['payments', 'banking', 'finance'],
    entryFile: 'banking-server-entry.js',
  }),
  new ServerMeta({
    key: 'stocks',
    name: 'Stocks',
    binName: 'india-mcp-stocks',
    categories: ['markets', 'finance'],
    description: 'Real-time NSE/BSE quotes, indices, historical data, and market status.',
    longDescription: 'Comprehensive Indian equity market access. Fetch real-time stock quotes with automatic NSE → Yahoo Finance fallback, track market indices (NIFTY 50, SENSEX), view historical OHLCV candles, get gainers/losers, monitor IPO pipeline, and check if the market is currently open.',
    tags: ['markets', 'realtime', 'finance', 'risk-analysis', 'search'],
    stability: 'stable',
    maxRiskLevel: 'medium',
    sources: ['NSE', 'BSE', 'Yahoo Finance', 'Offline DB'],
    requiresAuth: false,
    domains: ['equity', 'markets', 'investing', 'fintech'],
    entryFile: 'stocks-server-entry.js',
  }),
  new ServerMeta({
    key: 'ecourts',
    name: 'eCourts',
    binName: 'india-mcp-ecourts',
    categories: ['legal', 'government'],
    description: 'Court cases, hearing history, orders, and daily cause lists.',
    longDescription: 'Access the Indian judicial system\'s public records. Search court cases by number and year, retrieve hearing history, fetch court orders (with PDF links where available), and view daily cause lists for courtroom scheduling. Covers District Courts across all states.',
    tags: ['legal', 'government', 'risk-analysis', 'verification', 'public-data'],
    stability: 'stable',
    maxRiskLevel: 'high',
    sources: ['eCourts Portal'],
    requiresAuth: false,
    domains: ['legal', 'compliance', 'due-diligence'],
    entryFile: 'ecourts-server-entry.js',
  }),
  new ServerMeta({
    key: 'fssai',
    name: 'FSSAI',
    binName: 'india-mcp-fssai',
    categories: ['compliance', 'business', 'government'],
    description: 'Food business license verification and category lookup.',
    longDescription: 'Verify India\'s food safety licensing ecosystem through the FSSAI FOSCOS portal. Look up 14-digit FSSAI licenses for validity, business details, and food categories. Search food businesses by name or state, and check license expiry with days-remaining calculation.',
    tags: ['compliance', 'verification', 'government', 'risk-analysis', 'search'],
    stability: 'stable',
    maxRiskLevel: 'medium',
    sources: ['FSSAI FOSCOS', 'Offline DB'],
    requiresAuth: false,
    domains: ['food-safety', 'compliance', 'business-verification'],
    entryFile: 'fssai-server-entry.js',
  }),
  new ServerMeta({
    key: 'delhivery',
    name: 'Delhivery',
    binName: 'india-mcp-delhivery',
    categories: ['logistics', 'business'],
    description: 'Shipment tracking, shipping rates, and pincode serviceability.',
    longDescription: 'Integrate with Delhivery\'s logistics platform. Track individual or bulk shipments by AWB number, calculate shipping rates between pincodes, verify delivery serviceability, and retrieve registered pickup locations. Requires a Delhivery API token.',
    tags: ['logistics', 'realtime', 'verification', 'finance'],
    stability: 'stable',
    maxRiskLevel: 'low',
    sources: ['Delhivery API'],
    requiresAuth: true,
    domains: ['logistics', 'ecommerce', 'supply-chain'],
    entryFile: 'delhivery-server-entry.js',
  }),
  new ServerMeta({
    key: 'digilocker',
    name: 'DigiLocker',
    binName: 'india-mcp-digilocker',
    categories: ['identity', 'government'],
    description: 'Government document access and Aadhaar verification via DigiLocker.',
    longDescription: 'Access India\'s official digital document wallet. Generate OAuth 2.0 authorization URLs, exchange auth codes for tokens, list a user\'s government-issued documents (Aadhaar, PAN, Driving License), fetch individual documents, and verify Aadhaar seeding status. Requires DigiLocker API credentials.',
    tags: ['identity', 'government', 'verification', 'compliance'],
    stability: 'stable',
    maxRiskLevel: 'high',
    sources: ['DigiLocker API'],
    requiresAuth: true,
    domains: ['identity', 'kyc', 'government-documents'],
    entryFile: 'digilocker-server-entry.js',
  }),
];

// --- Lookup helpers ---

export function findServer(key: string): ServerMetadata | undefined {
  return SERVER_METADATA.find((s) => s.key === key);
}

export function getServersByCategory(category: CategoryKey): ServerMetadata[] {
  return SERVER_METADATA.filter((s) => s.categories.includes(category));
}

export function getServersByRisk(level: RiskLevel): ServerMetadata[] {
  return SERVER_METADATA.filter((s) => s.maxRiskLevel === level);
}
