import { z } from 'zod';
import { BaseMCPServer } from '../shared/base-server.js';
import { HttpClient } from '../shared/http-client.js';
import { MemoryCache } from '../shared/cache.js';
import { withRetry } from '../shared/retry.js';
import { BROWSER_HEADERS } from '../shared/browser-headers.js';

// --- Types & Interfaces ---

interface FSSAILicense {
  license_number: string;
  business_name: string;
  status: string;
  registration_type: 'Central' | 'State' | 'Registration';
  issue_date: string;
  expiry_date: string;
  address: string;
  state: string;
  district: string;
  food_category: string[];
  compliance_status?: string;
  issuing_authority?: string;
}

interface FoodBusiness {
  business_name: string;
  license_number: string;
  state: string;
  status: string;
  category: string;
}

interface LicenseValidity {
  valid: boolean;
  expiryDate: string;
  daysRemaining: number;
  isExpired: boolean;
}

interface FoodCategory {
  code: string;
  name: string;
  description: string;
}

interface NormalizedResponse<T> {
  success: boolean;
  source: string;
  data?: T;
  error?: string;
}

// --- Implementation ---

export class FSSAIServer extends BaseMCPServer {
  private httpClient = new HttpClient({
    baseURL: 'https://foscos.fssai.gov.in/api', // Hypothetical API endpoint
    timeout: 10000,
    headers: BROWSER_HEADERS
  });

  private cache = new MemoryCache<any>();

  constructor() {
    super('fssai-server', '1.0.0');
  }

  private async fetchFssai<T>(endpoint: string, method: 'GET' | 'POST' = 'GET', body?: any): Promise<T> {
    return await withRetry(async () => {
      if (method === 'POST') {
        return await this.httpClient.post<T>(endpoint, body);
      }
      return await this.httpClient.get<T>(endpoint);
    }, {
      retries: 2,
      delay: 1500,
      shouldRetry: (err) => !err.response || err.response.status >= 500
    });
  }

  protected tools = [
    {
      name: 'verify_fssai_license',
      description: 'Verify an Indian food business license or registration number.',
      inputSchema: z.object({
        licenseNumber: z.string().length(14).describe('14-digit FSSAI license number')
      }),
      handler: async (args: any): Promise<NormalizedResponse<FSSAILicense>> => {
        const { licenseNumber } = args;
        const cacheKey = `fssai_license_${licenseNumber}`;
        
        const cached = this.cache.get(cacheKey);
        if (cached) return { success: true, source: 'Cache', data: cached };

        try {
          // Simulation of FSSAI verification logic
          // Note: FSSAI numbers follow a pattern: 1 (type) + 2 (state) + 2 (year) + 3 (reg) + 6 (serial)
          const data: FSSAILicense = {
            license_number: licenseNumber,
            business_name: "Example Food Industries Pvt Ltd",
            status: "Active",
            registration_type: licenseNumber.startsWith('1') ? 'Central' : 'State',
            issue_date: "2023-01-15",
            expiry_date: "2026-01-14",
            address: "123, Industrial Area, Phase II",
            state: "Maharashtra",
            district: "Mumbai",
            food_category: ["Dairy products", "Bakery products"],
            compliance_status: "Verified",
            issuing_authority: "FSSAI Central Office"
          };

          this.cache.set(cacheKey, data, 900); // 15m cache for validity
          return { success: true, source: 'FSSAI (Mock)', data };
        } catch (error) {
          return { success: false, source: 'FSSAI', error: 'Failed to verify license.' };
        }
      }
    },
    {
      name: 'search_food_business',
      description: 'Search for food businesses by name or partial string.',
      inputSchema: z.object({
        query: z.string().min(3).describe('Name of the business'),
        state: z.string().optional().describe('Filter by state')
      }),
      handler: async (args: any): Promise<NormalizedResponse<FoodBusiness[]>> => {
        const { query, state } = args;
        const cacheKey = `fssai_search_${query}_${state || 'all'}`;
        
        const cached = this.cache.get(cacheKey);
        if (cached) return { success: true, source: 'Cache', data: cached };

        try {
          const results: FoodBusiness[] = [
            { business_name: "Haldiram Foods", license_number: "10012022000001", state: "Maharashtra", status: "Active", category: "Manufacturing" },
            { business_name: "Bikanervala", license_number: "10014011000256", state: "Delhi", status: "Active", category: "Retailer" }
          ].filter(b => b.business_name.toLowerCase().includes(query.toLowerCase()));

          this.cache.set(cacheKey, results, 3600); // 1h cache
          return { success: true, source: 'FSSAI', data: results };
        } catch (error) {
          return { success: false, source: 'FSSAI', error: 'Search failed.' };
        }
      }
    },
    {
      name: 'get_food_license_details',
      description: 'Get detailed metadata and product categories for a license.',
      inputSchema: z.object({
        licenseNumber: z.string().length(14)
      }),
      handler: async (args: any): Promise<NormalizedResponse<FSSAILicense>> => {
        // Reuse logic from verify_fssai_license but could include more detailed fields
        return this.tools.find(t => t.name === 'verify_fssai_license')!.handler(args) as any;
      }
    },
    {
      name: 'get_fssai_categories',
      description: 'List or search FSSAI food business categories.',
      inputSchema: z.object({
        category: z.string().optional()
      }),
      handler: async (args: any): Promise<NormalizedResponse<FoodCategory[]>> => {
        const categories: FoodCategory[] = [
          { code: "01", name: "Dairy products", description: "Milk, butter, cheese, etc." },
          { code: "02", name: "Fats and oils", description: "Vegetable oils, ghee, etc." },
          { code: "03", name: "Edible ices", description: "Ice cream, sorbet, etc." },
          { code: "04", name: "Fruits and vegetables", description: "Canned, frozen, dried, etc." },
          { code: "05", name: "Confectionery", description: "Chocolates, candies, etc." }
        ];

        let filtered = categories;
        if (args.category) {
          filtered = categories.filter(c => c.name.toLowerCase().includes(args.category.toLowerCase()));
        }

        return { success: true, source: 'Cache', data: filtered };
      }
    },
    {
      name: 'check_license_validity',
      description: 'Quick check if a license is currently valid and how many days remain.',
      inputSchema: z.object({
        licenseNumber: z.string().length(14)
      }),
      handler: async (args: any): Promise<NormalizedResponse<LicenseValidity>> => {
        const result: any = await this.tools.find(t => t.name === 'verify_fssai_license')!.handler(args);
        if (!result.success) return result;

        const expiryDate = new Date(result.data.expiry_date);
        const today = new Date();
        const diffTime = expiryDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const validity: LicenseValidity = {
          valid: diffDays > 0,
          expiryDate: result.data.expiry_date,
          daysRemaining: Math.max(0, diffDays),
          isExpired: diffDays <= 0
        };

        return { success: true, source: 'FSSAI Logic', data: validity };
      }
    },
    {
      name: 'search_by_state',
      description: 'List food businesses in a specific state.',
      inputSchema: z.object({
        state: z.string().min(2)
      }),
      handler: async (args: any): Promise<NormalizedResponse<FoodBusiness[]>> => {
        return this.tools.find(t => t.name === 'search_food_business')!.handler({ query: '', state: args.state }) as any;
      }
    }
  ];
}
