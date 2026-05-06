/**
 * Centralized category definitions for the India-MCP ecosystem.
 * Categories are used for tool/server discovery, filtering, and dashboard grouping.
 */

export type CategoryKey =
  | 'finance'
  | 'legal'
  | 'compliance'
  | 'transport'
  | 'government'
  | 'business'
  | 'markets'
  | 'logistics'
  | 'identity';

export interface Category {
  key: CategoryKey;
  label: string;
  description: string;
  icon: string;
  color: string;
}

export const CATEGORIES: Record<CategoryKey, Category> = {
  finance: {
    key: 'finance',
    label: 'Finance',
    description: 'Banking, payments, IFSC, UPI, and financial verification.',
    icon: '💰',
    color: '#22c55e',
  },
  legal: {
    key: 'legal',
    label: 'Legal',
    description: 'Court cases, orders, cause lists, and judicial records.',
    icon: '⚖️',
    color: '#6366f1',
  },
  compliance: {
    key: 'compliance',
    label: 'Compliance',
    description: 'GST, FSSAI, regulatory filings, and license verification.',
    icon: '📋',
    color: '#f59e0b',
  },
  transport: {
    key: 'transport',
    label: 'Transport',
    description: 'Railways, trains, PNR status, and travel schedules.',
    icon: '🚆',
    color: '#3b82f6',
  },
  government: {
    key: 'government',
    label: 'Government',
    description: 'Official government portals, records, and public data.',
    icon: '🏛️',
    color: '#8b5cf6',
  },
  business: {
    key: 'business',
    label: 'Business',
    description: 'Company verification, due diligence, and B2B intelligence.',
    icon: '🏢',
    color: '#0ea5e9',
  },
  markets: {
    key: 'markets',
    label: 'Markets',
    description: 'NSE/BSE equity data, indices, and market analytics.',
    icon: '📈',
    color: '#10b981',
  },
  logistics: {
    key: 'logistics',
    label: 'Logistics',
    description: 'Shipment tracking, delivery status, and pincode coverage.',
    icon: '📦',
    color: '#f97316',
  },
  identity: {
    key: 'identity',
    label: 'Identity',
    description: 'Aadhaar, DigiLocker documents, and identity verification.',
    icon: '🪪',
    color: '#ec4899',
  },
};

export const CATEGORY_LIST: Category[] = Object.values(CATEGORIES);
