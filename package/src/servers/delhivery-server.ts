import axios, { AxiosError } from 'axios';
import { z } from 'zod';
import { BaseMCPServer } from '../shared/base-server.js';

const RequestSchema = z;

const DELHIVERY_BASE_URL = 'https://track.delhivery.com';

const STATUS_CODE_MAP: Record<string, { status: string; description: string; action: string; color: string }> = {
  'OS': { status: 'Order Placed', description: 'Shipment has been created in Delhivery system', action: 'Wait for pickup or drop at warehouse', color: 'blue' },
  'MF': { status: 'Manifested', description: 'Shipment details confirmed, ready for pickup', action: 'Awaiting pickup by Delhivery', color: 'blue' },
  'PU': { status: 'Picked Up', description: 'Package has been picked up from sender', action: 'Package in transit', color: 'yellow' },
  'IT': { status: 'In Transit', description: 'Package is moving between facilities', action: 'Track for updates', color: 'yellow' },
  'OT': { status: 'Out for Delivery', description: 'Package is with delivery executive', action: 'Expect delivery today', color: 'orange' },
  'DL': { status: 'Delivered', description: 'Package delivered successfully', action: 'None - delivery complete', color: 'green' },
  'RT': { status: 'RTO Initiated', description: 'Returned to origin - delivery failed/ refused', action: 'Contact customer support', color: 'red' },
  'RTO': { status: 'Returned to Origin', description: 'Package returned to sender', action: 'Check reason - may resend', color: 'red' },
  'RTF': { status: 'RTO Failed', description: 'Return delivery failed', action: 'Contact Delhivery support', color: 'red' },
  'RS': { status: 'Return Scheduled', description: 'Return shipment scheduled', action: 'Await pickup', color: 'blue' },
  'RC': { status: 'Return Collected', description: 'Return package picked up', action: 'In transit back', color: 'yellow' },
  'UD': { status: 'Undelivered', description: 'Delivery attempt failed', action: 'Retry delivery or contact support', color: 'red' },
  'NP': { status: 'Not Picked', description: 'Pickup not completed by courier', action: 'Contact pickup service', color: 'red' },
  'CNI': { status: 'Cancled - Invalid', description: 'Shipment cancelled - invalid address', action: 'Correct address and re-book', color: 'red' },
  'CNR': { status: 'Cancelled', description: 'Shipment cancelled by sender', action: 'None - cancelled', color: 'red' },
  'LO': { status: 'Lost', description: 'Package lost in transit', action: 'File claim with Delhivery', color: 'red' },
  'DA': { status: 'Damaged', description: 'Package reported damaged', action: 'File claim for damage', color: 'red' },
  'WL': { status: 'Waiting for LEO', description: 'Waiting for last mile delivery', action: 'Expected today', color: 'yellow' },
  'IHP': { status: 'In Hub Processing', description: 'Package at delivery hub', action: 'Out for delivery soon', color: 'yellow' },
  'PL': { status: 'In Pipeline', description: 'Package in transit between hubs', action: 'Track for updates', color: 'yellow' },
  'PM': { status: 'Pickup Missed', description: 'Courier missed pickup attempt', action: 'Reschedule pickup', color: 'orange' },
  'OFD': { status: 'Out for Delivery', description: 'Package with delivery agent', action: 'Expect delivery today', color: 'orange' },
  'DLO': { status: 'Delivery Outstanding', description: 'Delivery pending - address issue', action: 'Contact customer', color: 'red' },
  'PD': { status: 'Partially Delivered', description: 'Some items delivered, some pending', action: 'Check items list', color: 'orange' },
  'DV': { status: 'Delivery Exception', description: 'Delivery issue - customs/refused', action: 'Resolve issue', color: 'red' },
  'CC': { status: 'Customs Cleared', description: 'Customs clearance completed', action: 'Continue delivery', color: 'green' },
  'CH': { status: 'Customs Hold', description: 'Held at customs', action: 'Provide documents', color: 'red' },
  'RSCH': { status: 'Rescheduled', description: 'Delivery rescheduled', action: 'New delivery date', color: 'orange' },
  'NV': { status: 'No Visibility', description: 'Tracking not updated', action: 'Contact support', color: 'gray' },
};

interface DelhiveryConfig {
  token: string;
}

function getConfig(): DelhiveryConfig {
  const token = process.env.DELHIVERY_TOKEN;
  if (!token) {
    throw new Error('DELHIVERY_TOKEN environment variable is required. Set it in .env or pass via command line.');
  }
  return { token };
}

function getAuthHeaders(token: string) {
  return {
    'Authorization': `Token ${token}`,
    'Content-Type': 'application/json',
  };
}

export class DelhiveryServer extends BaseMCPServer {
  constructor() {
    super('delhivery-server', '1.0.0');
  }

  protected tools = [
    {
      name: 'track_shipment',
      description: 'Track a Delhivery shipment by AWB (Air Waybill) number. Returns current status and full scan history.',
      inputSchema: RequestSchema.object({
        waybill: z.string().min(8, 'AWB must be at least 8 characters').max(20, 'AWB too long'),
      }),
      handler: async (args: Record<string, unknown>): Promise<unknown> => {
        const config = getConfig();
        const waybill = args.waybill as string;
        
        try {
          const response = await axios.get(
            `${DELHIVERY_BASE_URL}/api/v1/packages/json/?waybill=${encodeURIComponent(waybill)}`,
            { headers: getAuthHeaders(config.token), timeout: 15000 }
          );
          
          const data = response.data;
          if (!data || !data.ShipmentData || data.ShipmentData.length === 0) {
            return { error: 'AWB not found', waybill, message: 'No shipment found with this AWB number' };
          }
          
          const shipment = data.ShipmentData[0];
          const scans = shipment['@checkpointStatus']?.map((scan: any) => ({
            time: scan['@scanDate'] || scan['@scanTime'],
            location: scan['@city'] || 'Unknown',
            activity: scan['@masterStatus'] || scan['@status'] || 'Unknown',
            description: scan['@status'] || scan['@masterStatus'] || 'Package scanned',
          })) || [];
          
          return {
            waybill: shipment['Waybill'] || waybill,
            status: shipment['@status'] || shipment['@masterStatus'] || 'Unknown',
            current_location: shipment['CurrentCity'] || shipment['@city'] || 'Unknown',
            estimated_delivery: shipment['ED'] || shipment['@expectedDeliveryDate'] || 'Not available',
            scans: scans.reverse().slice(-15),
            weight: shipment['Weight'] || null,
            dimensions: (shipment['dimensions'] as string) || null,
          };
        } catch (error) {
          const axiosError = error as AxiosError;
          if (axiosError.response?.status === 401) {
            return { error: 'Authentication failed', message: 'Invalid or expired Delhivery token' };
          }
          return { error: 'API error', waybill, message: axiosError.message };
        }
      },
    },
    {
      name: 'get_shipping_rate',
      description: 'Get shipping rate estimate between two Indian pincodes for a given weight',
      inputSchema: RequestSchema.object({
        origin_pin: z.string().regex(/^\d{6}$/, 'Must be 6-digit pincode'),
        destination_pin: z.string().regex(/^\d{6}$/, 'Must be 6-digit pincode'),
        weight_kg: z.number().positive().max(30, 'Max weight is 30kg'),
        payment_mode: z.enum(['prepaid', 'cod']),
      }),
      handler: async (args: Record<string, unknown>): Promise<unknown> => {
        const config = getConfig();
        const originPin = args.origin_pin as string;
        const destPin = args.destination_pin as string;
        const weightKg = args.weight_kg as number;
        const paymentMode = args.payment_mode as 'prepaid' | 'cod';
        
        const weightGrams = weightKg * 1000;
        const cod = paymentMode === 'cod' ? 1 : 0;
        const pt = paymentMode === 'cod' ? 'COD' : 'PAID';
        
        try {
          const response = await axios.get(
            `${DELHIVERY_BASE_URL}/api/kinko/v0.2/invoice/charges/?md=S&ss=Delivered&d_pin=${destPin}&o_pin=${originPin}&cgm=${weightGrams}&pt=${pt}&cod=${cod}`,
            { headers: getAuthHeaders(config.token), timeout: 15000 }
          );
          
          const data = response.data;
          if (!data || data.total === 0 || !data.charge) {
            return { error: 'Route not serviceable', origin_pincode: originPin, destination_pincode: destPin };
          }
          
          const charge = Array.isArray(data.charge) ? data.charge[0] : data.charge;
          
          return {
            freight_charge: parseFloat(charge['freight']) || parseFloat(charge['charge']) || 0,
            cod_charge: parseFloat(charge['cod_charge']) || 0,
            total: parseFloat(charge['total_charge']) || parseFloat(charge['total']) || 0,
            estimated_days: charge['delivery_days'] || charge['delivery_days'] || '2-5',
            service_type: charge['servicetype'] || 'Standard',
            rate_type: charge['type'] || 'Forward',
          };
        } catch (error) {
          const axiosError = error as AxiosError;
          if (axiosError.response?.status === 401) {
            return { error: 'Authentication failed', message: 'Invalid token' };
          }
          if (axiosError.response?.status === 400) {
            return { error: 'Invalid request', message: 'Check pincodes and weight' };
          }
          return { error: 'API error', message: axiosError.message };
        }
      },
    },
    {
      name: 'check_serviceability',
      description: 'Check if Delhivery delivers to a given pincode and what services are available',
      inputSchema: RequestSchema.object({
        pincode: z.string().regex(/^\d{6}$/, 'Must be 6-digit pincode'),
        type: z.enum(['forward', 'reverse', 'both']).optional(),
      }),
      handler: async (args: Record<string, unknown>): Promise<unknown> => {
        const config = getConfig();
        const pincode = args.pincode as string;
        
        try {
          const response = await axios.get(
            `${DELHIVERY_BASE_URL}/c/api/pin-codes/json/?filter_codes=${pincode}`,
            { headers: getAuthHeaders(config.token), timeout: 15000 }
          );
          
          const data = response.data;
          if (!data || !data.delivery_pincodes || data.delivery_pincodes.length === 0) {
            return { pincode, is_serviceable: false, error: 'Pincode not found in Delhivery network' };
          }
          
          const pincodeData = data.delivery_pincodes[0];
          
          return {
            pincode: pincodeData['pincode'] || pincode,
            city: pincodeData['city'] || '',
            state: pincodeData['state'] || '',
            is_serviceable: pincodeData['is_oda'] !== false && pincodeData['isCod'] !== false,
            forward_available: pincodeData['is_forward'] !== false,
            reverse_available: pincodeData['is_reverse'] !== false,
            cod_available: pincodeData['isCod'] !== false,
            pickup_available: pincodeData['is_pickup'] !== false,
            estimated_days: pincodeData['days'] || '3-5',
            zone: pincodeData['zone'] || '',
          };
        } catch (error) {
          const axiosError = error as AxiosError;
          if (axiosError.response?.status === 401) {
            return { pincode, error: 'Authentication failed' };
          }
          return { pincode, is_serviceable: false, error: axiosError.message };
        }
      },
    },
    {
      name: 'track_multiple_shipments',
      description: 'Track multiple Delhivery shipments at once (up to 10 AWB numbers)',
      inputSchema: RequestSchema.object({
        waybills: z.array(z.string().min(8).max(20)).min(1).max(10),
      }),
      handler: async (args: Record<string, unknown>): Promise<unknown> => {
        const config = getConfig();
        const waybills = args.waybills as string[];
        
        if (waybills.length > 10) {
          return { error: 'Maximum 10 AWBs allowed', received: waybills.length };
        }
        
        const results = await Promise.all(
          waybills.map(async (waybill) => {
            try {
              const response = await axios.get(
                `${DELHIVERY_BASE_URL}/api/v1/packages/json/?waybill=${encodeURIComponent(waybill)}`,
                { headers: getAuthHeaders(config.token), timeout: 15000 }
              );
              
              const data = response.data;
              if (!data || !data.ShipmentData || data.ShipmentData.length === 0) {
                return { waybill, success: false, error: 'AWB not found' };
              }
              
              const shipment = data.ShipmentData[0];
              return {
                waybill,
                success: true,
                status: shipment['@status'] || shipment['@masterStatus'],
                current_location: shipment['CurrentCity'] || shipment['@city'],
                estimated_delivery: shipment['ED'] || null,
                weight: shipment['Weight'] || null,
              };
            } catch (error) {
              const axiosError = error as AxiosError;
              return { waybill, success: false, error: axiosError.message };
            }
          })
        );
        
        const successful = results.filter(r => (r as any).success).length;
        return { total: waybills.length, successful, failed: waybills.length - successful, results };
      },
    },
    {
      name: 'get_pickup_locations',
      description: 'List all registered pickup locations/warehouses for your Delhivery account',
      inputSchema: RequestSchema.object({
        search: z.string().optional(),
      }),
      handler: async (args: Record<string, unknown>): Promise<unknown> => {
        const config = getConfig();
        const searchQuery = args.search as string | undefined;
        
        try {
          const response = await axios.get(
            `${DELHIVERY_BASE_URL}/api/backend/clientwarehouse/client/`,
            { headers: getAuthHeaders(config.token), timeout: 15000 }
          );
          
          const data = response.data;
          let locations = [];
          
          if (Array.isArray(data)) {
            locations = data;
          } else if (data && data.data && Array.isArray(data.data)) {
            locations = data.data;
          } else if (data && data.warehouses && Array.isArray(data.warehouses)) {
            locations = data.warehouses;
          }
          
          if (searchQuery) {
            const search = searchQuery.toLowerCase();
            locations = locations.filter((loc: any) => 
              (loc.name || '').toLowerCase().includes(search) ||
              (loc.city || '').toLowerCase().includes(search) ||
              (loc.pincode || '').includes(search)
            );
          }
          
          return locations.map((loc: any) => ({
            name: loc.name || loc.warehouse_name || loc.facility_name,
            address: loc.address || loc.address1,
            pincode: loc.pincode || loc.pin,
            city: loc.city,
            state: loc.state,
            phone: loc.phone || loc.contact_no,
            email: loc.email,
            active: loc.active !== false,
          }));
        } catch (error) {
          const axiosError = error as AxiosError;
          if (axiosError.response?.status === 401) {
            return { error: 'Authentication failed', message: 'Invalid token' };
          }
          return { error: 'API error', message: axiosError.message };
        }
      },
    },
    {
      name: 'parse_delivery_status',
      description: 'Convert a raw Delhivery status code into human-readable status with next steps',
      inputSchema: RequestSchema.object({
        status_code: z.string().min(1).max(5),
      }),
      handler: async (args: Record<string, unknown>): Promise<unknown> => {
        const statusCode = (args.status_code as string).toUpperCase().trim();
        
        const exactMatch = STATUS_CODE_MAP[statusCode];
        if (exactMatch) {
          return {
            code: statusCode,
            ...exactMatch,
          };
        }
        
        const prefix = statusCode.substring(0, 2);
        const prefixMatch = STATUS_CODE_MAP[prefix];
        if (prefixMatch) {
          return {
            code: statusCode,
            status: `${prefixMatch.status} (${statusCode})`,
            description: prefixMatch.description,
            action: prefixMatch.action,
            color: prefixMatch.color,
          };
        }
        
        for (const [code, info] of Object.entries(STATUS_CODE_MAP)) {
          if (statusCode.includes(code) || code.includes(statusCode)) {
            return {
              code: statusCode,
              ...info,
              note: `Matched loosely to ${code}`,
            };
          }
        }
        
        return {
          code: statusCode,
          status: 'Unknown Status',
          description: 'Status code not recognized in Delhivery system',
          action: 'Check Delhivery app or contact support',
          color: 'gray',
          suggestion: 'Common codes: OS, MF, PU, IT, OT, DL, RT, RTO, UD',
        };
      },
    },
  ];
}