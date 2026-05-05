import axios, { AxiosError } from 'axios';
import { z } from 'zod';
import { BaseMCPServer } from '../shared/base-server.js';

const RequestSchema = z;

const INDIAN_STATES: Record<string, string> = {
  'AP': 'Andhra Pradesh', 'AR': 'Arunachal Pradesh', 'AS': 'Assam', 'BR': 'Bihar',
  'CG': 'Chhattisgarh', 'GA': 'Goa', 'GJ': 'Gujarat', 'HR': 'Haryana', 'HP': 'Himachal Pradesh',
  'JH': 'Jharkhand', 'JK': 'Jammu and Kashmir', 'KA': 'Karnataka', 'KL': 'Kerala',
  'LA': 'Ladakh', 'LD': 'Lakshadweep', 'MH': 'Maharashtra', 'ML': 'Meghalaya', 'MN': 'Manipur',
  'MP': 'Madhya Pradesh', 'MZ': 'Mizoram', 'NL': 'Nagaland', 'OD': 'Odisha',
  'PB': 'Punjab', 'PY': 'Puducherry', 'RJ': 'Rajasthan', 'SK': 'Sikkim', 'TN': 'Tamil Nadu',
  'TS': 'Telangana', 'TR': 'Tripura', 'UK': 'Uttarakhand', 'UP': 'Uttar Pradesh',
  'WB': 'West Bengal', 'AN': 'Andaman and Nicobar', 'CH': 'Chandigarh', 'DL': 'Delhi',
  'DN': 'Dadra and Nagar Haveli',
};

const COMMON_RTO_CODES: Record<string, { code: string; name: string; city: string; state: string }> = {
  'KA01': { code: 'KA01', name: 'Bangalore Central', city: 'Bangalore', state: 'Karnataka' },
  'KA02': { code: 'KA02', name: 'Bangalore East', city: 'Bangalore', state: 'Karnataka' },
  'KA03': { code: 'KA03', name: 'Bangalore West', city: 'Bangalore', state: 'Karnataka' },
  'KA04': { code: 'KA04', name: 'Bangalore North', city: 'Bangalore', state: 'Karnataka' },
  'KA05': { code: 'KA05', name: 'Bangalore South', city: 'Bangalore', state: 'Karnataka' },
  'KA06': { code: 'KA06', name: 'Mysore', city: 'Mysore', state: 'Karnataka' },
  'KA07': { code: 'KA07', name: 'Tumkur', city: 'Tumkur', state: 'Karnataka' },
  'KA12': { code: 'KA12', name: 'Belgaum', city: 'Belgaum', state: 'Karnataka' },
  'KA21': { code: 'KA21', name: 'Mangalore', city: 'Mangalore', state: 'Karnataka' },
  'KA22': { code: 'KA22', name: 'Udupi', city: 'Udupi', state: 'Karnataka' },
  'MH01': { code: 'MH01', name: 'Mumbai South', city: 'Mumbai', state: 'Maharashtra' },
  'MH02': { code: 'MH02', name: 'Mumbai West', city: 'Mumbai', state: 'Maharashtra' },
  'MH03': { code: 'MH03', name: 'Mumbai East', city: 'Mumbai', state: 'Maharashtra' },
  'MH04': { code: 'MH04', name: 'Thane', city: 'Thane', state: 'Maharashtra' },
  'MH05': { code: 'MH05', name: 'Kalyan', city: 'Kalyan', state: 'Maharashtra' },
  'MH06': { code: 'MH06', name: 'Pune', city: 'Pune', state: 'Maharashtra' },
  'MH07': { code: 'MH07', name: 'Nashik', city: 'Nashik', state: 'Maharashtra' },
  'MH08': { code: 'MH08', name: 'Aurangabad', city: 'Aurangabad', state: 'Maharashtra' },
  'MH09': { code: 'MH09', name: 'Solapur', city: 'Solapur', state: 'Maharashtra' },
  'MH43': { code: 'MH43', name: 'Nagpur', city: 'Nagpur', state: 'Maharashtra' },
  'DL01': { code: 'DL01', name: 'Delhi Central', city: 'Delhi', state: 'Delhi' },
  'DL02': { code: 'DL02', name: 'Delhi North', city: 'Delhi', state: 'Delhi' },
  'DL03': { code: 'DL03', name: 'Delhi South', city: 'Delhi', state: 'Delhi' },
  'DL04': { code: 'DL04', name: 'Delhi East', city: 'Delhi', state: 'Delhi' },
  'DL05': { code: 'DL05', name: 'Delhi West', city: 'Delhi', state: 'Delhi' },
  'DL06': { code: 'DL06', name: 'Delhi Harbour', city: 'Delhi', state: 'Delhi' },
  'TN01': { code: 'TN01', name: 'Chennai Central', city: 'Chennai', state: 'Tamil Nadu' },
  'TN02': { code: 'TN02', name: 'Chennai West', city: 'Chennai', state: 'Tamil Nadu' },
  'TN03': { code: 'TN03', name: 'Chennai East', city: 'Chennai', state: 'Tamil Nadu' },
  'TN05': { code: 'TN05', name: 'Coimbatore', city: 'Coimbatore', state: 'Tamil Nadu' },
  'TN06': { code: 'TN06', name: 'Madurai', city: 'Madurai', state: 'Tamil Nadu' },
  'TN07': { code: 'TN07', name: 'Salem', city: 'Salem', state: 'Tamil Nadu' },
  'UP01': { code: 'UP01', name: 'Lucknow', city: 'Lucknow', state: 'Uttar Pradesh' },
  'UP02': { code: 'UP02', name: 'Kanpur', city: 'Kanpur', state: 'Uttar Pradesh' },
  'UP03': { code: 'UP03', name: 'Agra', city: 'Agra', state: 'Uttar Pradesh' },
  'UP04': { code: 'UP04', name: 'Varanasi', city: 'Varanasi', state: 'Uttar Pradesh' },
  'UP05': { code: 'UP05', name: 'Allahabad', city: 'Allahabad', state: 'Uttar Pradesh' },
  'UP06': { code: 'UP06', name: 'Meerut', city: 'Meerut', state: 'Uttar Pradesh' },
  'GJ01': { code: 'GJ01', name: 'Ahmedabad', city: 'Ahmedabad', state: 'Gujarat' },
  'GJ05': { code: 'GJ05', name: 'Surat', city: 'Surat', state: 'Gujarat' },
  'GJ06': { code: 'GJ06', name: 'Vadodara', city: 'Vadodara', state: 'Gujarat' },
  'GJ07': { code: 'GJ07', name: 'Rajkot', city: 'Rajkot', state: 'Gujarat' },
  'RJ01': { code: 'RJ01', name: 'Jaipur', city: 'Jaipur', state: 'Rajasthan' },
  'RJ03': { code: 'RJ03', name: 'Jodhpur', city: 'Jodhpur', state: 'Rajasthan' },
  'RJ04': { code: 'RJ04', name: 'Udaipur', city: 'Udaipur', state: 'Rajasthan' },
  'HR01': { code: 'HR01', name: 'Gurgaon', city: 'Gurgaon', state: 'Haryana' },
  'HR02': { code: 'HR02', name: 'Faridabad', city: 'Faridabad', state: 'Haryana' },
  'HR03': { code: 'HR03', name: 'Karnal', city: 'Karnal', state: 'Haryana' },
  'WB01': { code: 'WB01', name: 'Kolkata', city: 'Kolkata', state: 'West Bengal' },
  'WB02': { code: 'WB02', name: 'Kolkata South', city: 'Kolkata', state: 'West Bengal' },
  'WB03': { code: 'WB03', name: 'Howrah', city: 'Howrah', state: 'West Bengal' },
  'TS01': { code: 'TS01', name: 'Hyderabad', city: 'Hyderabad', state: 'Telangana' },
  'TS02': { code: 'TS02', name: 'Hyderabad Central', city: 'Hyderabad', state: 'Telangana' },
  'TS03': { code: 'TS03', name: 'Secunderabad', city: 'Secunderabad', state: 'Telangana' },
  'AP01': { code: 'AP01', name: 'Visakhapatnam', city: 'Visakhapatnam', state: 'Andhra Pradesh' },
  'AP02': { code: 'AP02', name: 'Vijayawada', city: 'Vijayawada', state: 'Andhra Pradesh' },
  'BR01': { code: 'BR01', name: 'Patna', city: 'Patna', state: 'Bihar' },
  'BR02': { code: 'BR02', name: 'Gaya', city: 'Gaya', state: 'Bihar' },
};

const RTO_OFFICE_DATA: Record<string, { code: string; name: string; city: string; state: string; address?: string; phone?: string }> = {
  'KA01': { code: 'KA01', name: 'Bangalore Central RTO', city: 'Bangalore', state: 'Karnataka', address: 'No. 1, Tank Road, Bangalore', phone: '080-22268881' },
  'MH01': { code: 'MH01', name: 'Mumbai RTO', city: 'Mumbai', state: 'Maharashtra', address: 'Sir J.J. Hospital Road, Byculla, Mumbai', phone: '022-23741666' },
  'DL01': { code: 'DL01', name: 'Delhi Central RTO', city: 'Delhi', state: 'Delhi', address: 'Shahzada Bagh, Phase-1, Delhi', phone: '011-23928171' },
};

function decodeRegistrationNumber(reg: string): Record<string, unknown> {
  const normalized = reg.replace(/[\s-]/g, '').toUpperCase();
  
  if (normalized.length < 4) {
    return { registration: normalized, is_valid_format: false, error: 'Registration too short' };
  }
  
  const stateCode = normalized.substring(0, 2);
  const stateName = INDIAN_STATES[stateCode] || 'Unknown State';
  
  let rtoCode = '';
  let rtoLocation = 'Unknown';
  let vehicleSeries = '';
  let vehicleNumber = '';
  
  if (normalized.length >= 4) {
    rtoCode = normalized.substring(0, 4);
    const rtoInfo = COMMON_RTO_CODES[rtoCode];
    if (rtoInfo) {
      rtoLocation = rtoInfo.name;
    } else {
      rtoCode = stateCode + '00';
    }
  }
  
  if (normalized.length >= 6) {
    vehicleSeries = normalized.substring(4, normalized.length - 4);
    vehicleNumber = normalized.substring(normalized.length - 4);
  } else {
    vehicleNumber = normalized.substring(4);
  }
  
  const isValid = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{0,4}[0-9]{4}$/.test(normalized);
  
  return {
    registration: normalized,
    state_code: stateCode,
    state_name: stateName,
    rto_code: rtoCode,
    rto_location: rtoLocation,
    vehicle_series: vehicleSeries,
    vehicle_number: vehicleNumber,
    is_valid_format: isValid,
    format_explanation: `${stateCode}=${stateName}, ${rtoCode}=${rtoLocation}, ${vehicleSeries}=Series, ${vehicleNumber}=Number`,
  };
}

function calculateRoadTax(state: string, vType: string, cost: number, fuel: string): Record<string, unknown> {
  const rates: Record<string, any> = {
    'KA': { two_wheeler: 0.13, car: 0.13, suv: 0.14, commercial: 0.15 },
    'MH': { two_wheeler: 0.12, car: 0.10, suv: 0.12, commercial: 0.14 },
    'DL': { two_wheeler: 0.05, car: 0.07, suv: 0.12, commercial: 0.12 },
    'TN': { two_wheeler: 0.10, car: 0.12, suv: 0.15, commercial: 0.15 },
    'UP': { two_wheeler: 0.07, car: 0.08, suv: 0.10, commercial: 0.12 },
  };
  
  const defaultRate = { two_wheeler: 0.08, car: 0.08, suv: 0.10, commercial: 0.12 };
  const stateRates = rates[state] || defaultRate;
  let taxRate = stateRates[vType] || 0.08;
  
  if (fuel === 'electric') {
    taxRate = 0;
  }
  
  if (vType === 'suv' && cost > 10000000) {
    taxRate = Math.min(taxRate + 0.02, 0.20);
  }
  
  const roadTax = Math.round(cost * taxRate);
  const greenTax = fuel === 'diesel' ? Math.round(cost * 0.005) : 0;
  const totalCost = roadTax + greenTax + 300;
  
  const notes: string[] = [];
  if (fuel === 'electric') notes.push('EV exempt from road tax');
  if (fuel === 'diesel') notes.push('Green tax applicable');
  
  return {
    state: INDIAN_STATES[state] || state,
    state_code: state,
    vehicle_type: vType,
    vehicle_cost: cost,
    fuel_type: fuel,
    road_tax_rate: (taxRate * 100).toFixed(0) + '%',
    road_tax_amount: roadTax,
    additional_charges: { green_tax: greenTax, hypothecation_fee: 100, smart_card_fee: 200 },
    total_registration_cost: totalCost,
    notes,
  };
}

function getVehicleStats(stateCode?: string): Record<string, unknown> {
  const stats = {
    total_india: { total_vehicles: '340M+', two_wheelers: '75%', cars: '18%', others: '7%' },
    by_state: [
      { state: 'Uttar Pradesh', vehicles: '35M+', rank: 1 },
      { state: 'Maharashtra', vehicles: '30M+', rank: 2 },
      { state: 'Tamil Nadu', vehicles: '28M+', rank: 3 },
      { state: 'Karnataka', vehicles: '25M+', rank: 4 },
      { state: 'Rajasthan', vehicles: '22M+', rank: 5 },
    ],
  };
  
  if (stateCode) {
    const name = INDIAN_STATES[stateCode];
    return { state: name, vehicles: 'See official data', note: 'State-specific data from vahan.parivahan.gov.in' };
  }
  
  return stats;
}

export class RTOServer extends BaseMCPServer {
  constructor() {
    super('rto-server', '1.0.0');
  }

  protected tools = [
    {
      name: 'decode_registration_number',
      description: 'Decode an Indian vehicle registration number to extract state, RTO district, registration year, and vehicle series.',
      inputSchema: RequestSchema.object({
        registration: z.string().min(4).max(20),
      }),
      handler: async (args: Record<string, unknown>): Promise<unknown> => {
        const reg = String(args.registration ?? '');
        if (!reg) return { error: 'Registration is required' };
        return decodeRegistrationNumber(reg);
      },
    },
    {
      name: 'get_vehicle_info',
      description: 'Get vehicle registration details including owner name, make, model, fuel type, insurance validity.',
      inputSchema: RequestSchema.object({
        registration: z.string().min(4),
      }),
      handler: async (args: Record<string, unknown>): Promise<unknown> => {
        const reg = String(args.registration ?? '').trim().toUpperCase();
        if (!reg) return { error: 'Registration required' };
        
        try {
          console.error('[RTO API] GET vehicle info: ' + reg);
          const response = await axios.get('https://api.vehicleinfo.in/api/rc-info/' + reg, { timeout: 10000 });
          if (response.data && response.data.rc) {
            return response.data.rc;
          }
        } catch (error) {
          console.error('[RTO API] Failed: ' + (error as Error).message);
        }
        
        const decoded = decodeRegistrationNumber(reg);
        return {
          registration: decoded.registration,
          note: 'Live data unavailable. Decoded from registration.',
          decoded: decoded,
          suggestion: 'Visit https://vahan.parivahan.gov.in',
        };
      },
    },
    {
      name: 'check_vehicle_challan',
      description: 'Check pending traffic challans for a vehicle.',
      inputSchema: RequestSchema.object({
        registration: z.string().min(4),
      }),
      handler: async (args: Record<string, unknown>): Promise<unknown> => {
        const reg = String(args.registration ?? '').trim().toUpperCase();
        if (!reg) return { error: 'Registration required' };
        
        try {
          const response = await axios.get('https://api.vehicleinfo.in/api/challan/' + reg, { timeout: 10000 });
          if (response.data && response.data.challans) {
            return { registration: reg, challans: response.data.challans };
          }
        } catch (error) {
          console.error('[RTO Challan API] Failed: ' + (error as Error).message);
        }
        
        return {
          registration: reg,
          note: 'Challan API unavailable.',
          manual_check: 'Visit https://echallan.parivahan.gov.in',
          states_with_online: ['Delhi', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Telangana', 'UP'],
        };
      },
    },
    {
      name: 'get_rto_info',
      description: 'Get details about an RTO office by its code.',
      inputSchema: RequestSchema.object({
        rto_code: z.string().min(2).max(10),
      }),
      handler: async (args: Record<string, unknown>): Promise<unknown> => {
        const code = String(args.rto_code ?? '').trim().toUpperCase();
        if (!code) return { error: 'RTO code required' };
        
        const data = RTO_OFFICE_DATA[code];
        if (data) return { ...data, services: ['Registration', 'Transfer', 'Fitness', 'NOC', 'Duplicate RC'] };
        
        const basic = COMMON_RTO_CODES[code];
        if (basic) return { ...basic, note: 'Basic info only' };
        
        return { error: 'RTO code not found', example: 'KA01, MH06, DL01' };
      },
    },
    {
      name: 'calculate_road_tax',
      description: 'Calculate estimated road tax for a vehicle based on state, vehicle type, and cost.',
      inputSchema: RequestSchema.object({
        state_code: z.string().length(2),
        vehicle_type: z.enum(['two_wheeler', 'car', 'suv', 'commercial']),
        vehicle_cost: z.number().positive(),
        fuel_type: z.enum(['petrol', 'diesel', 'electric', 'cng']),
      }),
      handler: async (args: Record<string, unknown>): Promise<unknown> => {
        const state = String(args.state_code ?? '').trim().toUpperCase();
        const vType = String(args.vehicle_type ?? 'car');
        const cost = Number(args.vehicle_cost ?? 0);
        const fuel = String(args.fuel_type ?? 'petrol');
        
        if (!state || state.length !== 2) return { error: 'Valid state code required (2 letters)' };
        if (isNaN(cost)) return { error: 'Valid vehicle cost required' };
        
        return calculateRoadTax(state, vType, cost, fuel);
      },
    },
    {
      name: 'get_vehicle_statistics',
      description: 'Get vehicle registration statistics for Indian states.',
      inputSchema: RequestSchema.object({
        state_code: z.string().length(2).optional(),
      }),
      handler: async (args: Record<string, unknown>): Promise<unknown> => {
        const stateCode = args.state_code ? String(args.state_code).trim().toUpperCase() : undefined;
        return getVehicleStats(stateCode);
      },
    },
  ];
}