import axios from 'axios';
import { z } from 'zod';
import { BaseMCPServer } from '../shared/base-server.js';

const RequestSchema = z;

const HSN_SEARCH_URL = 'https://services.gst.gov.in/services/searchhsnsac';

interface HSNResult {
  hsn_code: string;
  description: string;
  tax_rate: string;
}

interface GSTRateInfo {
  hsn_code: string;
  description: string;
  cgst_rate: number;
  sgst_rate: number;
  igst_rate: number;
  category: string;
}

const COMMON_HSN_CODES: GSTRateInfo[] = [
  { hsn_code: '85171290', description: 'Mobile phones', cgst_rate: 9, sgst_rate: 9, igst_rate: 18, category: 'Electronics' },
  { hsn_code: '85285100', description: 'Computer monitors', cgst_rate: 9, sgst_rate: 9, igst_rate: 18, category: 'Electronics' },
  { hsn_code: '84713010', description: 'Laptops', cgst_rate: 9, sgst_rate: 9, igst_rate: 18, category: 'Electronics' },
  { hsn_code: '84714190', description: 'Computers', cgst_rate: 9, sgst_rate: 9, igst_rate: 18, category: 'Electronics' },
  { hsn_code: '85176290', description: 'Communication equipment', cgst_rate: 9, sgst_rate: 9, igst_rate: 18, category: 'Electronics' },
  { hsn_code: '85287219', description: 'LED TVs', cgst_rate: 9, sgst_rate: 9, igst_rate: 18, category: 'Electronics' },
  { hsn_code: '85182100', description: 'Speaker systems', cgst_rate: 9, sgst_rate: 9, igst_rate: 18, category: 'Electronics' },
  { hsn_code: '85444999', description: 'Electrical wires', cgst_rate: 9, sgst_rate: 9, igst_rate: 18, category: 'Electronics' },
  { hsn_code: '85365020', description: 'Switches', cgst_rate: 9, sgst_rate: 9, igst_rate: 18, category: 'Electronics' },
  { hsn_code: '85392190', description: 'LED bulbs', cgst_rate: 9, sgst_rate: 9, igst_rate: 18, category: 'Electronics' },
  { hsn_code: '10019010', description: 'Wheat', cgst_rate: 0, sgst_rate: 0, igst_rate: 0, category: 'Food' },
  { hsn_code: '10063090', description: 'Rice', cgst_rate: 5, sgst_rate: 5, igst_rate: 5, category: 'Food' },
  { hsn_code: '11010000', description: 'Wheat flour', cgst_rate: 0, sgst_rate: 0, igst_rate: 0, category: 'Food' },
  { hsn_code: '17019990', description: 'Sugar', cgst_rate: 5, sgst_rate: 5, igst_rate: 5, category: 'Food' },
  { hsn_code: '09011120', description: 'Coffee beans', cgst_rate: 5, sgst_rate: 5, igst_rate: 5, category: 'Food' },
  { hsn_code: '09023090', description: 'Tea leaves', cgst_rate: 5, sgst_rate: 5, igst_rate: 5, category: 'Food' },
  { hsn_code: '04029910', description: 'Milk', cgst_rate: 0, sgst_rate: 0, igst_rate: 0, category: 'Food' },
  { hsn_code: '23091000', description: 'Dog food', cgst_rate: 5, sgst_rate: 5, igst_rate: 5, category: 'Food' },
  { hsn_code: '01022100', description: 'Cattle', cgst_rate: 0, sgst_rate: 0, igst_rate: 0, category: 'Food' },
  { hsn_code: '02010000', description: 'Meat', cgst_rate: 0, sgst_rate: 0, igst_rate: 0, category: 'Food' },
  { hsn_code: '62034200', description: 'Trousers', cgst_rate: 5, sgst_rate: 5, igst_rate: 10, category: 'Textiles' },
  { hsn_code: '62046200', description: 'Jeans', cgst_rate: 5, sgst_rate: 5, igst_rate: 10, category: 'Textiles' },
  { hsn_code: '62044220', description: 'Sarees', cgst_rate: 5, sgst_rate: 5, igst_rate: 10, category: 'Textiles' },
  { hsn_code: '61091000', description: 'T-shirts', cgst_rate: 5, sgst_rate: 5, igst_rate: 10, category: 'Textiles' },
  { hsn_code: '61103090', description: 'Pullovers', cgst_rate: 5, sgst_rate: 5, igst_rate: 10, category: 'Textiles' },
  { hsn_code: '62114290', description: 'Winter jackets', cgst_rate: 5, sgst_rate: 5, igst_rate: 10, category: 'Textiles' },
  { hsn_code: '58012290', description: 'Denim fabric', cgst_rate: 5, sgst_rate: 5, igst_rate: 10, category: 'Textiles' },
  { hsn_code: '63025900', description: 'Bed sheets', cgst_rate: 5, sgst_rate: 5, igst_rate: 10, category: 'Textiles' },
  { hsn_code: '30049099', description: 'Medicines', cgst_rate: 6, sgst_rate: 6, igst_rate: 12, category: 'Pharmaceuticals' },
  { hsn_code: '30021500', description: 'Vaccines', cgst_rate: 0, sgst_rate: 0, igst_rate: 0, category: 'Pharmaceuticals' },
  { hsn_code: '30039100', description: 'Syringes', cgst_rate: 12, sgst_rate: 12, igst_rate: 18, category: 'Pharmaceuticals' },
  { hsn_code: '30043926', description: 'Antibiotics', cgst_rate: 6, sgst_rate: 6, igst_rate: 12, category: 'Pharmaceuticals' },
  { hsn_code: '90213900', description: 'Medical equipment', cgst_rate: 12, sgst_rate: 12, igst_rate: 18, category: 'Pharmaceuticals' },
  { hsn_code: '90189099', description: 'Surgical instruments', cgst_rate: 12, sgst_rate: 12, igst_rate: 18, category: 'Pharmaceuticals' },
  { hsn_code: '30051090', description: 'Adhesive bandages', cgst_rate: 12, sgst_rate: 12, igst_rate: 18, category: 'Pharmaceuticals' },
  { hsn_code: '30065090', description: 'First aid kits', cgst_rate: 12, sgst_rate: 12, igst_rate: 18, category: 'Pharmaceuticals' },
  { hsn_code: '27160000', description: 'Electricity', cgst_rate: 0, sgst_rate: 0, igst_rate: 0, category: 'Utilities' },
  { hsn_code: '27111200', description: 'LPG', cgst_rate: 0, sgst_rate: 0, igst_rate: 0, category: 'Utilities' },
  { hsn_code: '27090000', description: 'Crude oil', cgst_rate: 0, sgst_rate: 0, igst_rate: 0, category: 'Utilities' },
  { hsn_code: '998314', description: 'Software licensing services', cgst_rate: 9, sgst_rate: 9, igst_rate: 18, category: 'Software Services' },
  { hsn_code: '998315', description: 'Cloud computing services', cgst_rate: 9, sgst_rate: 9, igst_rate: 18, category: 'Software Services' },
  { hsn_code: '997212', description: 'Rental services', cgst_rate: 9, sgst_rate: 9, igst_rate: 18, category: 'Software Services' },
  { hsn_code: '997331', description: 'Financial services', cgst_rate: 9, sgst_rate: 9, igst_rate: 18, category: 'Software Services' },
  { hsn_code: '996451', description: 'Construction services', cgst_rate: 9, sgst_rate: 9, igst_rate: 18, category: 'Software Services' },
  { hsn_code: '996361', description: 'Food services', cgst_rate: 9, sgst_rate: 9, igst_rate: 18, category: 'Software Services' },
  { hsn_code: '64010000', description: 'Footwear', cgst_rate: 9, sgst_rate: 9, igst_rate: 18, category: 'Apparel' },
  { hsn_code: '64029990', description: 'Shoes', cgst_rate: 9, sgst_rate: 9, igst_rate: 18, category: 'Apparel' },
  { hsn_code: '95030010', description: 'Toys', cgst_rate: 9, sgst_rate: 9, igst_rate: 18, category: 'Consumer Goods' },
  { hsn_code: '95030090', description: 'Games', cgst_rate: 9, sgst_rate: 9, igst_rate: 18, category: 'Consumer Goods' },
  { hsn_code: '39241090', description: 'Plastic utensils', cgst_rate: 9, sgst_rate: 9, igst_rate: 18, category: 'Consumer Goods' },
  { hsn_code: '69120010', description: 'Ceramics', cgst_rate: 9, sgst_rate: 9, igst_rate: 18, category: 'Consumer Goods' },
];

const INDIAN_STATES: Record<string, string> = {
  '01': 'Jammu and Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '25': 'Daman and Diu',
  '26': 'Dadra and Nagar Haveli',
  '27': 'Maharashtra',
  '28': 'Andhra Pradesh',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman and Nicobar Islands',
  '36': 'Telangana',
  '37': ' Ladakh',
};

function validateGSTINChecksum(gstin: string): boolean {
  if (gstin.length !== 15) return false;
  
  const pos = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
  const charToNum = (c: string) => {
    if (c >= '0' && c <= '9') return parseInt(c, 10);
    if (c >= 'A' && c <= 'Z') return c.charCodeAt(0) - 55;
    if (c >= 'a' && c <= 'z') return c.charCodeAt(0) - 87;
    return 0;
  };
  
  const weights = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 18, 19, 20, 21, 23, 24, 25, 26, 27, 28, 29, 30, 31, 33];
  
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    sum += charToNum(gstin[pos[i]]) * weights[i];
  }
  
  const mod = sum % 36;
  const checkChar = String.fromCharCode(mod + 50);
  
  return checkChar === gstin[14].toUpperCase();
}

export class GSTServer extends BaseMCPServer {
  constructor() {
    super('gst-server', '1.0.0');
  }

  protected tools = [
    {
      name: 'search_hsn_code',
      description: 'Search HSN/SAC codes for products or services to determine correct GST tax rates',
      inputSchema: RequestSchema.object({
        query: z.string().min(1, 'Search query is required'),
      }),
      handler: async (args: Record<string, unknown>): Promise<unknown> => {
        const query = String(args.query ?? '').trim().toLowerCase();
        
        if (!query) {
          return { results: [], error: 'Search query is required' };
        }
        
        try {
          const response = await axios.get(HSN_SEARCH_URL, {
            params: {
              search: query,
              searchtype: 'HSNcode',
            },
            timeout: 10000,
          });
          
          const results: HSNResult[] = [];
          
          if (response.data && response.data.list && Array.isArray(response.data.list)) {
            const items = response.data.list;
            for (let i = 0; i < Math.min(items.length, 20); i++) {
              const item = items[i];
              results.push({
                hsn_code: item.hsnCd || item.hsn_code || item.code || '',
                description: item.dscr || item.desc || item.description || item.nm || '',
                tax_rate: item.txr || item.tax_rate || item.gstRate || '',
              });
            }
          }
          
          if (results.length === 0) {
            const lowerQuery = query.toLowerCase();
            for (const hsn of COMMON_HSN_CODES) {
              if (hsn.description.toLowerCase().includes(lowerQuery) ||
                  lowerQuery.includes(hsn.category.toLowerCase())) {
                results.push({
                  hsn_code: hsn.hsn_code,
                  description: hsn.description,
                  tax_rate: `${hsn.igst_rate}%`,
                });
              }
            }
          }
          
          return results.slice(0, 20);
        } catch (error) {
          const lowerQuery = query.toLowerCase();
          const fallbackResults: HSNResult[] = [];
          
          for (const hsn of COMMON_HSN_CODES) {
            if (hsn.description.toLowerCase().includes(lowerQuery) ||
                hsn.category.toLowerCase().includes(lowerQuery) ||
                hsn.hsn_code.includes(query)) {
              fallbackResults.push({
                hsn_code: hsn.hsn_code,
                description: hsn.description,
                tax_rate: `${hsn.igst_rate}%`,
              });
            }
          }
          
          return fallbackResults.slice(0, 20);
        }
      },
    },
    {
      name: 'get_gst_rate_by_hsn',
      description: 'Get the GST tax rate (CGST + SGST + IGST) for a given HSN code',
      inputSchema: RequestSchema.object({
        hsn_code: z.string().min(4, 'HSN code must be at least 4 digits'),
      }),
      handler: async (args: Record<string, unknown>): Promise<unknown> => {
        const hsnCode = String(args.hsn_code ?? '').trim();
        
        if (!hsnCode) {
          return { error: 'HSN code is required' };
        }
        
        const found = COMMON_HSN_CODES.find(
          h => h.hsn_code === hsnCode || hsnCode.startsWith(h.hsn_code.slice(0, 4))
        );
        
        if (found) {
          return {
            hsn_code: found.hsn_code,
            description: found.description,
            cgst_rate: found.cgst_rate,
            sgst_rate: found.sgst_rate,
            igst_rate: found.igst_rate,
            total_gst: found.igst_rate,
            category: found.category,
          };
        }
        
        const first4 = hsnCode.slice(0, 4);
        
        if (first4.startsWith('85')) {
          return {
            hsn_code: hsnCode,
            description: 'Electronic goods (generic)',
            cgst_rate: 9,
            sgst_rate: 9,
            igst_rate: 18,
            total_gst: 18,
            category: 'Electronics',
          };
        }
        if (first4.startsWith('10') || first4.startsWith('11')) {
          return {
            hsn_code: hsnCode,
            description: 'Food products (generic)',
            cgst_rate: 0,
            sgst_rate: 0,
            igst_rate: 0,
            total_gst: 0,
            category: 'Food',
          };
        }
        if (first4.startsWith('62')) {
          return {
            hsn_code: hsnCode,
            description: 'Textiles and apparel (generic)',
            cgst_rate: 5,
            sgst_rate: 5,
            igst_rate: 10,
            total_gst: 10,
            category: 'Textiles',
          };
        }
        if (first4.startsWith('30')) {
          return {
            hsn_code: hsnCode,
            description: 'Pharmaceuticals (generic)',
            cgst_rate: 6,
            sgst_rate: 6,
            igst_rate: 12,
            total_gst: 12,
            category: 'Pharmaceuticals',
          };
        }
        if (first4.startsWith('99')) {
          return {
            hsn_code: hsnCode,
            description: 'Services (generic)',
            cgst_rate: 9,
            sgst_rate: 9,
            igst_rate: 18,
            total_gst: 18,
            category: 'Services',
          };
        }
        
        return {
          hsn_code: hsnCode,
          description: 'Standard rate goods',
          cgst_rate: 9,
          sgst_rate: 9,
          igst_rate: 18,
          total_gst: 18,
          category: 'General Goods',
        };
      },
    },
    {
      name: 'calculate_gst',
      description: 'Calculate GST amount for a given price and GST rate',
      inputSchema: RequestSchema.object({
        amount: z.number().positive('Amount must be positive'),
        gst_rate: z.number().min(0).max(28, 'GST rate cannot exceed 28%'),
        transaction_type: z.enum(['intrastate', 'interstate']),
      }),
      handler: async (args: Record<string, unknown>): Promise<unknown> => {
        const amount = Number(args.amount ?? 0);
        const gst_rate = Number(args.gst_rate ?? 0);
        const transaction_type = String(args.transaction_type ?? 'intrastate');
        
        if (isNaN(amount) || isNaN(gst_rate)) {
          return { error: 'Invalid amount or gst_rate' };
        }
        
        const baseAmount = Math.round(amount * 100) / 100;
        
        if (transaction_type === 'interstate') {
          const igst = Math.round(baseAmount * gst_rate) / 100;
          const totalTax = Math.round(igst * 100) / 100;
          const totalAmount = Math.round((baseAmount + totalTax) * 100) / 100;
          
          return {
            base_amount: baseAmount,
            cgst: 0,
            sgst: 0,
            igst: totalTax,
            total_tax: totalTax,
            total_amount: totalAmount,
            breakdown: {
              transaction: 'Interstate (IGST applicable)',
              rate: `${gst_rate}%`,
              calculation: `Base: ${baseAmount} × ${gst_rate}% = ${igst}`,
            },
          };
        } else {
          const halfRate = gst_rate / 2;
          const cgst = Math.round(baseAmount * halfRate) / 100;
          const sgst = Math.round(baseAmount * halfRate) / 100;
          const totalTax = Math.round((cgst + sgst) * 100) / 100;
          const totalAmount = Math.round((baseAmount + totalTax) * 100) / 100;
          
          return {
            base_amount: baseAmount,
            cgst: Math.round(cgst * 100) / 100,
            sgst: Math.round(sgst * 100) / 100,
            igst: 0,
            total_tax: totalTax,
            total_amount: totalAmount,
            breakdown: {
              transaction: 'Intrastate (CGST + SGST applicable)',
              rate: `${gst_rate}% (${halfRate}% CGST + ${halfRate}% SGST)`,
              calculation: `Base: ${baseAmount} × ${halfRate}% = ${cgst} (each)`,
            },
          };
        }
      },
    },
    {
      name: 'validate_gstin',
      description: 'Validate a GSTIN number format and extract business information encoded in it',
      inputSchema: RequestSchema.object({
        gstin: z.string().length(15, 'GSTIN must be 15 characters').regex(/^[0-9A-Za-z]+$/, 'Invalid GSTIN format'),
      }),
      handler: async (args: Record<string, unknown>): Promise<unknown> => {
        const gstin = String(args.gstin ?? '').trim().toUpperCase();
        
        if (!gstin) {
          return { valid: false, error: 'GSTIN is required' };
        }
        
        if (gstin.length !== 15) {
          return {
            valid: false,
            error: 'GSTIN must be exactly 15 characters',
          };
        }
        
        const stateCode = gstin.slice(0, 2);
        const panNumber = gstin.slice(2, 12);
        const entityNumber = gstin[12];
        const entityTypeChar = gstin[13];
        const checkDigit = gstin[14];
        
        const entityTypes: Record<string, string> = {
          '1': 'Private Limited Company',
          '2': 'Public Limited Company',
          '3': 'Hindu Undivided Family',
          '4': 'Partnership Firm',
          '5': 'Limited Liability Partnership',
          '6': 'Society/Trust/Club',
          '7': 'Government/PSU',
          '8': 'Proprietorship',
          '9': 'Others',
        };
        
        const stateName = INDIAN_STATES[stateCode] || 'Unknown State';
        
        const isFormatValid = /^[0-9]{2}[A-Z]{10}[0-9][A-Z][0-9A-Z]$/i.test(gstin);
        
        const isChecksumValid = validateGSTINChecksum(gstin);
        
        const valid = isFormatValid && isChecksumValid;
        
        return {
          valid,
          state_code: stateCode,
          state_name: stateName,
          pan_number: panNumber,
          entity_type: entityTypes[entityTypeChar] || 'Unknown',
          registration_number: entityNumber,
          check_digit_valid: isChecksumValid,
          format_valid: isFormatValid,
          message: valid ? 'Valid GSTIN' : isChecksumValid ? 'Invalid format' : 'Invalid check digit',
        };
      },
    },
    {
      name: 'get_filing_deadlines',
      description: 'Get GST filing deadlines for the current and next month for different return types',
      inputSchema: RequestSchema.object({
        return_type: z.enum(['GSTR1', 'GSTR3B', 'GSTR9', 'all']).optional(),
      }),
      handler: async (args: Record<string, unknown>): Promise<unknown> => {
        const return_type = String(args.return_type ?? 'all').trim();
        
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        
        const getDeadline = (day: number, monthOffset: number): Date => {
          const month = new Date(currentYear, currentMonth + monthOffset, 1);
          let dueDate = new Date(month.getFullYear(), month.getMonth(), day);
          
          if (day > 28) {
            dueDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);
          }
          
          const dayOfWeek = dueDate.getDay();
          if (dayOfWeek === 0) {
            dueDate.setDate(dueDate.getDate() - 1);
          } else if (dayOfWeek === 6) {
            dueDate.setDate(dueDate.getDate() - 1);
          }
          
          return dueDate;
        };
        
        const deadlines = [
          {
            return_type: 'GSTR1',
            period: 'Monthly - Current Month',
            due_date: getDeadline(11, 1),
            description: 'Details of outward supplies',
            penalty_per_day: '₹50 per day (₹25 if turnover < ₹5 Cr)',
          },
          {
            return_type: 'GSTR3B',
            period: 'Monthly - Current Month',
            due_date: getDeadline(20, 1),
            description: 'Summary return with tax payment',
            penalty_per_day: '₹50 per day (₹25 if turnover < ₹5 Cr)',
          },
          {
            return_type: 'GSTR1',
            period: 'Monthly - Next Month',
            due_date: getDeadline(11, 2),
            description: 'Details of outward supplies',
            penalty_per_day: '₹50 per day (₹25 if turnover < ₹5 Cr)',
          },
          {
            return_type: 'GSTR3B',
            period: 'Monthly - Next Month',
            due_date: getDeadline(20, 2),
            description: 'Summary return with tax payment',
            penalty_per_day: '₹50 per day (₹25 if turnover < ₹5 Cr)',
          },
          {
            return_type: 'GSTR9',
            period: 'Annual',
            due_date: new Date(currentYear, 11, 31),
            description: 'Annual consolidated return',
            penalty_per_day: '₹100 per day',
          },
        ];
        
        const formatDate = (d: Date): string => {
          return d.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            weekday: 'short',
          });
        };
        
        const filterDeadline = (d: any): boolean => {
          if (return_type === 'all') return true;
          return d.return_type === return_type;
        };
        
        const result = deadlines
          .filter(filterDeadline)
          .map((d) => ({
            return_type: d.return_type,
            period: d.period,
            due_date: formatDate(d.due_date),
            description: d.description,
            penalty_per_day: d.penalty_per_day,
          }));
        
        return result;
      },
    },
  ];
}