/**
 * Reusable workflow definitions for the India-MCP ecosystem.
 * Workflows describe multi-server tool chains for common AI agent tasks.
 */

import type { CategoryKey } from './categories.js';

export interface WorkflowStep {
  server: string;
  tool: string;
  description: string;
  inputFrom?: string;   // key of a prior step's output to pipe in
  required: boolean;
}

export interface WorkflowMetadata {
  key: string;
  name: string;
  description: string;
  useCases: string[];
  categories: CategoryKey[];
  estimatedTime: string;
  steps: WorkflowStep[];
  tags: string[];
  examplePrompt: string;
}

export const WORKFLOW_METADATA: WorkflowMetadata[] = [
  {
    key: 'business_due_diligence',
    name: 'Business Due Diligence',
    description: 'Verify a company\'s legal, tax, and financial legitimacy before onboarding.',
    useCases: [
      'Vendor onboarding checks',
      'B2B partner verification',
      'Investor due diligence',
      'Loan eligibility assessment',
    ],
    categories: ['compliance', 'finance', 'legal', 'business'],
    estimatedTime: '30–60 seconds',
    steps: [
      { server: 'gst', tool: 'validate_gstin', description: 'Verify the business\'s GSTIN is active and registered.', required: true },
      { server: 'banking', tool: 'check_vpa_format', description: 'Validate the UPI payment address is well-formed.', required: false },
      { server: 'banking', tool: 'get_ifsc_details', description: 'Confirm the bank account branch exists via IFSC.', required: false },
      { server: 'fssai', tool: 'verify_fssai_license', description: 'Check FSSAI license if the company is in food sector.', required: false },
      { server: 'ecourts', tool: 'search_case', description: 'Search for pending litigation using company name.', required: false },
    ],
    tags: ['verification', 'compliance', 'finance', 'legal'],
    examplePrompt: 'Verify this vendor: GSTIN 27AAPFU0939F1ZV, bank SBIN0001234, UPI vendor@okaxis',
  },
  {
    key: 'stock_research',
    name: 'Stock Research',
    description: 'Comprehensive equity analysis combining real-time prices, history, and sector context.',
    useCases: [
      'Investment decision support',
      'Portfolio monitoring',
      'Market trend analysis',
      'Pre-market briefing',
    ],
    categories: ['markets', 'finance'],
    estimatedTime: '15–30 seconds',
    steps: [
      { server: 'stocks', tool: 'get_market_status', description: 'Check if markets are currently open.', required: true },
      { server: 'stocks', tool: 'get_stock_quote', description: 'Fetch real-time price and volume.', required: true },
      { server: 'stocks', tool: 'get_stock_history', description: 'Pull historical candle data for trend analysis.', required: false },
      { server: 'stocks', tool: 'get_sector_performance', description: 'Compare against sector peers.', required: false },
      { server: 'stocks', tool: 'get_market_indices', description: 'Benchmark against NIFTY 50 / SENSEX.', required: false },
      { server: 'gst', tool: 'validate_gstin', description: 'Verify the company\'s GST registration for legitimacy.', required: false },
    ],
    tags: ['markets', 'finance', 'risk-analysis', 'realtime'],
    examplePrompt: 'Give me a complete analysis of RELIANCE stock including sector comparison and index benchmarks.',
  },
  {
    key: 'transport_verification',
    name: 'Transport & Vehicle Verification',
    description: 'Full verification of a vehicle or logistics operator before hire or payment.',
    useCases: [
      'Fleet onboarding',
      'Logistics partner verification',
      'Vehicle insurance check',
      'Challan compliance review',
    ],
    categories: ['transport', 'compliance', 'finance'],
    estimatedTime: '20–45 seconds',
    steps: [
      { server: 'rto', tool: 'decode_registration_number', description: 'Decode the registration plate to extract state and RTO.', required: true },
      { server: 'rto', tool: 'get_vehicle_info', description: 'Fetch full ownership, insurance, and fitness details.', required: true },
      { server: 'rto', tool: 'check_vehicle_challan', description: 'Check for pending traffic fines.', required: true },
      { server: 'rto', tool: 'calculate_road_tax', description: 'Estimate road tax liability.', required: false },
      { server: 'banking', tool: 'get_ifsc_details', description: 'Verify operator\'s bank branch for payment setup.', required: false },
    ],
    tags: ['verification', 'compliance', 'transport', 'risk-analysis'],
    examplePrompt: 'Verify vehicle MH01AB1234 — check ownership, insurance, and any pending challans.',
  },
  {
    key: 'legal_compliance',
    name: 'Legal & Regulatory Compliance',
    description: 'Check an entity\'s full regulatory standing across GST, FSSAI, and court records.',
    useCases: [
      'Regulatory audit preparation',
      'Restaurant / food chain compliance',
      'Pre-acquisition due diligence',
      'NGO or trust verification',
    ],
    categories: ['legal', 'compliance', 'government'],
    estimatedTime: '45–90 seconds',
    steps: [
      { server: 'gst', tool: 'validate_gstin', description: 'Confirm GST registration is active.', required: true },
      { server: 'gst', tool: 'get_filing_deadlines', description: 'Surface any upcoming filing obligations.', required: false },
      { server: 'fssai', tool: 'verify_fssai_license', description: 'Verify food safety license for F&B businesses.', required: false },
      { server: 'fssai', tool: 'check_license_validity', description: 'Check days remaining on FSSAI license.', required: false },
      { server: 'ecourts', tool: 'search_case', description: 'Search for active court cases filed against the entity.', required: false },
      { server: 'ecourts', tool: 'get_case_history', description: 'Review full litigation history for risk assessment.', required: false },
    ],
    tags: ['compliance', 'legal', 'government', 'risk-analysis', 'verification'],
    examplePrompt: 'Run a full regulatory compliance check on this food company: GSTIN 27AAPFU0939F1ZV, FSSAI 10012022000001',
  },
];

// --- Lookup helpers ---

export function findWorkflow(key: string): WorkflowMetadata | undefined {
  return WORKFLOW_METADATA.find((w) => w.key === key);
}

export function getWorkflowsByCategory(category: CategoryKey): WorkflowMetadata[] {
  return WORKFLOW_METADATA.filter((w) => w.categories.includes(category));
}

export function getWorkflowsForServer(server: string): WorkflowMetadata[] {
  return WORKFLOW_METADATA.filter((w) => w.steps.some((s) => s.server === server));
}
