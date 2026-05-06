import axios, { AxiosError } from 'axios';
import { z } from 'zod';
import { BaseMCPServer } from '../shared/base-server.js';

const RequestSchema = z;

const PRIMARY_API = 'https://indianrailapi.com/api/v2';
const BACKUP_API = 'https://api.railwayapi.site';

const STATION_CODE_MAP: { code: string; name: string; city: string; state: string }[] = [
  { code: 'CST', name: 'Chhatrapati Shivaji Terminus', city: 'Mumbai', state: 'Maharashtra' },
  { code: 'CSTM', name: 'Chhatrapati Shivaji Terminus Mumbai', city: 'Mumbai', state: 'Maharashtra' },
  { code: 'BCT', name: 'Mumbai Central', city: 'Mumbai', state: 'Maharashtra' },
  { code: 'LTT', name: 'Lokmanya Tilak Terminus', city: 'Mumbai', state: 'Maharashtra' },
  { code: 'BDTS', name: 'Bandra Terminus', city: 'Mumbai', state: 'Maharashtra' },
  { code: 'NDLS', name: 'New Delhi Railway Station', city: 'Delhi', state: 'Delhi' },
  { code: 'NZM', name: 'Hazrat Nizamuddin', city: 'Delhi', state: 'Delhi' },
  { code: 'DLI', name: 'Old Delhi', city: 'Delhi', state: 'Delhi' },
  { code: 'HNZ', name: 'Hazrat Nizamuddin Railway Station', city: 'Delhi', state: 'Delhi' },
  { code: 'ANVT', name: 'Anand Vihar Terminal', city: 'Delhi', state: 'Delhi' },
  { code: 'SBC', name: 'Bangalore City Railway Station', city: 'Bangalore', state: 'Karnataka' },
  { code: 'YPR', name: 'Yeswantpur Junction', city: 'Bangalore', state: 'Karnataka' },
  { code: 'KSR', name: 'Bangalore City', city: 'Bangalore', state: 'Karnataka' },
  { code: 'BNC', name: 'Bangalore Cantt', city: 'Bangalore', state: 'Karnataka' },
  { code: 'KJM', name: 'Krantivira Sangolli Rayanna', city: 'Bangalore', state: 'Karnataka' },
  { code: 'MAS', name: 'Chennai Central', city: 'Chennai', state: 'Tamil Nadu' },
  { code: 'MS', name: 'Chennai Egmore', city: 'Chennai', state: 'Tamil Nadu' },
  { code: 'MSB', name: 'Chennai Beach', city: 'Chennai', state: 'Tamil Nadu' },
  { code: 'BBQ', name: 'Chennai Beach', city: 'Chennai', state: 'Tamil Nadu' },
  { code: 'MX', name: 'Chennai Express', city: 'Chennai', state: 'Tamil Nadu' },
  { code: 'HWH', name: 'Howrah Junction', city: 'Kolkata', state: 'West Bengal' },
  { code: 'KOAA', name: 'Kolkata', city: 'Kolkata', state: 'West Bengal' },
  { code: 'SDAH', name: 'Sealdah', city: 'Kolkata', state: 'West Bengal' },
  { code: 'KGP', name: 'Kharagpur', city: 'Kolkata', state: 'West Bengal' },
  { code: 'SC', name: 'Secunderabad Junction', city: 'Hyderabad', state: 'Telangana' },
  { code: 'HYB', name: 'Hyderabad Deccan', city: 'Hyderabad', state: 'Telangana' },
  { code: 'NED', name: 'Nanded Railway Station', city: 'Hyderabad', state: 'Telangana' },
  { code: 'KCG', name: 'Kachehped', city: 'Hyderabad', state: 'Telangana' },
  { code: 'PUNE', name: 'Pune Junction', city: 'Pune', state: 'Maharashtra' },
  { code: 'ADI', name: 'Ahmedabad Junction', city: 'Ahmedabad', state: 'Gujarat' },
  { code: 'BL', name: 'Ahmedabad Junction', city: 'Ahmedabad', state: 'Gujarat' },
  { code: 'SWM', name: 'Sabarmati Junction', city: 'Ahmedabad', state: 'Gujarat' },
  { code: 'JP', name: 'Jaipur Junction', city: 'Jaipur', state: 'Rajasthan' },
  { code: 'JAI', name: 'Jaipur', city: 'Jaipur', state: 'Rajasthan' },
  { code: 'LKO', name: 'Lucknow Junction', city: 'Lucknow', state: 'Uttar Pradesh' },
  { code: 'LJN', name: 'Lucknow', city: 'Lucknow', state: 'Uttar Pradesh' },
  { code: 'CNB', name: 'Kanpur Central', city: 'Kanpur', state: 'Uttar Pradesh' },
  { code: 'CN', name: 'Kanpur', city: 'Kanpur', state: 'Uttar Pradesh' },
  { code: 'VNZ', name: 'Varanasi Junction', city: 'Varanasi', state: 'Uttar Pradesh' },
  { code: 'BSB', name: 'Varanasi', city: 'Varanasi', state: 'Uttar Pradesh' },
  { code: 'GKP', name: 'Gorakhpur', city: 'Gorakhpur', state: 'Uttar Pradesh' },
  { code: 'ALD', name: 'Prayagraj Junction', city: 'Allahabad', state: 'Uttar Pradesh' },
  { code: 'PRG', name: 'Prayagraj', city: 'Allahabad', state: 'Uttar Pradesh' },
  { code: 'MB', name: 'Meerut City', city: 'Meerut', state: 'Uttar Pradesh' },
  { code: 'MTC', name: 'Meerut', city: 'Meerut', state: 'Uttar Pradesh' },
  { code: 'BCT', name: 'Bhimavaram Town', city: 'Bhimavaram', state: 'Andhra Pradesh' },
  { code: 'BVR', name: 'Bhimavaram', city: 'Bhimavaram', state: 'Andhra Pradesh' },
  { code: 'KK', name: 'Kolkata', city: 'Kolkata', state: 'West Bengal' },
  { code: 'ASN', name: 'Asansol', city: 'Asansol', state: 'West Bengal' },
  { code: 'DHN', name: 'Dhanbad', city: 'Dhanbad', state: 'Jharkhand' },
  { code: 'RNC', name: 'Ranchi', city: 'Ranchi', state: 'Jharkhand' },
  { code: 'BRKG', name: 'Bhubaneswar', city: 'Bhubaneswar', state: 'Odisha' },
  { code: 'BBS', name: 'Bhubaneswar', city: 'Bhubaneswar', state: 'Odisha' },
  { code: 'PURI', name: 'Puri', city: 'Puri', state: 'Odisha' },
  { code: 'VSKP', name: 'Visakhapatnam', city: 'Visakhapatnam', state: 'Andhra Pradesh' },
  { code: 'VGA', name: 'Visakhapatnam', city: 'Visakhapatnam', state: 'Andhra Pradesh' },
  { code: 'Vijayawada', name: 'Vijayawada', city: 'Vijayawada', state: 'Andhra Pradesh' },
  { code: 'BZA', name: 'Vijayawada', city: 'Vijayawada', state: 'Andhra Pradesh' },
  { code: 'GNT', name: 'Guntur Junction', city: 'Guntur', state: 'Andhra Pradesh' },
  { code: 'TPTY', name: 'Tirupati', city: 'Tirupati', state: 'Andhra Pradesh' },
  { code: 'TP', name: 'Tirupati', city: 'Tirupati', state: 'Andhra Pradesh' },
  { code: 'CMR', name: 'Coimbatore Junction', city: 'Coimbatore', state: 'Tamil Nadu' },
  { code: 'CBE', name: 'Coimbatore', city: 'Coimbatore', state: 'Tamil Nadu' },
  { code: 'MDU', name: 'Madurai Junction', city: 'Madurai', state: 'Tamil Nadu' },
  { code: 'MX', name: 'Madurai', city: 'Madurai', state: 'Tamil Nadu' },
  { code: 'TCR', name: 'Thrissur', city: 'Thrissur', state: 'Kerala' },
  { code: 'TCR', name: 'Thrissur', city: 'Thrissur', state: 'Kerala' },
  { code: 'KCVL', name: 'Kochuveli', city: 'Thiruvananthapuram', state: 'Kerala' },
  { code: 'TVC', name: 'Thiruvananthapuram', city: 'Thiruvananthapuram', state: 'Kerala' },
  { code: 'ERS', name: 'Ernakulam Junction', city: 'Kochi', state: 'Kerala' },
  { code: 'ERN', name: 'Ernakulam', city: 'Kochi', state: 'Kerala' },
  { code: 'MAQ', name: 'Mangalore Central', city: 'Mangalore', state: 'Karnataka' },
  { code: 'MAQ', name: 'Mangalore', city: 'Mangalore', state: 'Karnataka' },
  { code: 'PNQ', name: 'Pune', city: 'Pune', state: 'Maharashtra' },
  { code: 'SV', name: 'Solapur', city: 'Solapur', state: 'Maharashtra' },
  { code: 'SUR', name: 'Solapur', city: 'Solapur', state: 'Maharashtra' },
  { code: 'ST', name: 'Surat', city: 'Surat', state: 'Gujarat' },
  { code: 'ST', name: 'Surat', city: 'Surat', state: 'Gujarat' },
  { code: 'BRC', name: 'Vadodara', city: 'Vadodara', state: 'Gujarat' },
  { code: 'BRC', name: 'Vadodara', city: 'Vadodara', state: 'Gujarat' },
  { code: 'RTM', name: 'Ratlam', city: 'Ratlam', state: 'Madhya Pradesh' },
  { code: 'RTM', name: 'Ratlam', city: 'Ratlam', state: 'Madhya Pradesh' },
  { code: 'BPL', name: 'Bhopal Junction', city: 'Bhopal', state: 'Madhya Pradesh' },
  { code: 'BHO', name: 'Bhopal', city: 'Bhopal', state: 'Madhya Pradesh' },
  { code: 'JBP', name: 'Jabalpur Junction', city: 'Jabalpur', state: 'Madhya Pradesh' },
  { code: 'JBL', name: 'Jabalpur', city: 'Jabalpur', state: 'Madhya Pradesh' },
  { code: 'UHP', name: 'Udaipur City', city: 'Udaipur', state: 'Rajasthan' },
  { code: 'UDZ', name: 'Udaipur', city: 'Udaipur', state: 'Rajasthan' },
  { code: 'DDN', name: 'Dehradun', city: 'Dehradun', state: 'Uttarakhand' },
  { code: 'DED', name: 'Dehradun', city: 'Dehradun', state: 'Uttarakhand' },
  { code: 'ASR', name: 'Amritsar Junction', city: 'Amritsar', state: 'Punjab' },
  { code: 'AMR', name: 'Amritsar', city: 'Amritsar', state: 'Punjab' },
  { code: 'LDH', name: 'Ludhiana', city: 'Ludhiana', state: 'Punjab' },
  { code: 'LDH', name: 'Ludhiana', city: 'Ludhiana', state: 'Punjab' },
  { code: 'JAT', name: 'Jammu Tawi', city: 'Jammu', state: 'Jammu and Kashmir' },
  { code: 'JAT', name: 'Jammu', city: 'Jammu', state: 'Jammu and Kashmir' },
  { code: 'SGNR', name: 'Shri Mata Vaishno Devi Katra', city: 'Katra', state: 'Jammu and Kashmir' },
  { code: 'SVD', name: 'Katra', city: 'Katra', state: 'Jammu and Kashmir' },
  { code: 'GHY', name: 'Guwahati', city: 'Guwahati', state: 'Assam' },
  { code: 'GHY', name: 'Guwahati', city: 'Guwahati', state: 'Assam' },
  { code: 'NJP', name: 'New Jalpaiguri', city: 'Siliguri', state: 'West Bengal' },
  { code: 'NJP', name: 'Siliguri', city: 'Siliguri', state: 'West Bengal' },
  { code: 'DMV', name: 'Dimapur', city: 'Dimapur', state: 'Nagaland' },
  { code: 'DMR', name: 'Dimapur', city: 'Dimapur', state: 'Nagaland' },
  { code: 'AII', name: 'Ajmer Junction', city: 'Ajmer', state: 'Rajasthan' },
  { code: 'AJ', name: 'Ajmer', city: 'Ajmer', state: 'Rajasthan' },
  { code: 'BKN', name: 'Bikaner Junction', city: 'Bikaner', state: 'Rajasthan' },
  { code: 'BKN', name: 'Bikaner', city: 'Bikaner', state: 'Rajasthan' },
  { code: 'HJR', name: 'Lucknow', city: 'Lucknow', state: 'Uttar Pradesh' },
];

const CLASS_DESCRIPTIONS: Record<string, string> = {
  'SL': 'Sleeper Class',
  '3A': 'Third AC',
  '2A': 'Second AC',
  '1A': 'First AC',
  'CC': 'Chair Car',
  'EC': 'Executive Chair Car',
  '2S': 'Second Sitting',
  'FC': 'First Class',
  '3E': 'Three Tier Economy',
};

function formatDate(dateStr: string): boolean {
  const regex = /^\d{2}-\d{2}-\d{4}$/;
  return regex.test(dateStr);
}

function logApiCall(endpoint: string, params?: Record<string, string>): void {
  const paramsStr = params ? `?${new URLSearchParams(params).toString()}` : '';
  console.error(`[Railways API] GET ${endpoint}${paramsStr}`);
}

async function apiCall(endpoint: string, useBackup = false): Promise<unknown> {
  const baseUrl = useBackup ? BACKUP_API : PRIMARY_API;
  logApiCall(`${baseUrl}${endpoint}`);

  try {
    const response = await axios.get(`${baseUrl}${endpoint}`, { timeout: 8000 });
    return response.data;
  } catch (error) {
    if (!useBackup) {
      console.error(`[Railways API] Primary failed, retrying with backup: ${(error as Error).message}`);
      return apiCall(endpoint, true);
    }
    throw error;
  }
}

export class RailwaysServer extends BaseMCPServer {
  constructor() {
    super('railways-server', '1.0.0');
  }

  protected tools = [
    {
      name: 'get_pnr_status',
      description: 'Check PNR status for an Indian Railways ticket. Returns booking status, passenger details, coach and seat/berth allocation, and journey details.',
      inputSchema: RequestSchema.object({
        pnr: z.string().regex(/^\d{10}$/, 'PNR must be exactly 10 digits'),
      }),
      handler: async (args: Record<string, unknown>): Promise<unknown> => {
        const pnr = String(args.pnr ?? '').trim();

        if (!pnr || pnr.length !== 10 || !/^\d{10}$/.test(pnr)) {
          return { error: 'PNR must be exactly 10 digits', example: '6622006888' };
        }

        try {
          const data = await apiCall(`/pnr/${pnr}`) as any;

          if (data.error || data.response_code !== 200) {
            return { error: data.message || 'PNR not found or API unavailable', pnr };
          }

          const chartPrepared = data.chart_prepared !== 'NO';
          
          return {
            pnr: data.pnr,
            train_number: data.train_no,
            train_name: data.train_name,
            from_station: data.from_station,
            to_station: data.to_station,
            date_of_journey: data.doj,
            class: data.class,
            chart_prepared: chartPrepared ? 'Yes' : 'No (check later)',
            passengers: (data.passengers || []).map((p: any) => ({
              number: p.no,
              booking_status: p.booking_status || p.current_status,
              current_status: p.current_status || p.booking_status,
              coach: p.coach || null,
              berth: p.berth || p.seat || null,
            })),
          };
        } catch (error) {
          const axiosError = error as AxiosError;
          return { error: 'Railway API unavailable. Please try again.', details: axiosError.message };
        }
      },
    },
    {
      name: 'search_trains',
      description: 'Search for trains running between two Indian railway stations on a given date.',
      inputSchema: RequestSchema.object({
        from_station: z.string().min(2, 'From station code required').max(10),
        to_station: z.string().min(2, 'To station code required').max(10),
        date: z.string().regex(/^\d{2}-\d{2}-\d{4}$/, 'Date must be DD-MM-YYYY'),
      }),
      handler: async (args: Record<string, unknown>): Promise<unknown> => {
        const from_station = String(args.from_station ?? '').trim().toUpperCase();
        const to_station = String(args.to_station ?? '').trim().toUpperCase();
        const date = String(args.date ?? '').trim();

        if (!from_station || !to_station) {
          return { error: 'Station codes required', example: 'from: "NDLS", to: "BCT"' };
        }

        if (!formatDate(date)) {
          return { error: 'Date must be in DD-MM-YYYY format', example: 'date: "25-12-2024"' };
        }

        try {
          const data = await apiCall(`/trains/between?from=${from_station}&to=${to_station}&date=${date}`) as any;

          if (data.error || !data.train) {
            return { error: data.message || 'No trains found', from_station, to_station, date };
          }

          const trains = Array.isArray(data.train) ? data.train : [data.train];
          
          return trains
            .map((t: any) => ({
              train_number: t.train_number,
              train_name: t.train_name,
              from_station: t.from_station_code,
              departure_time: t.departure_time,
              to_station: t.to_station_code,
              arrival_time: t.arrival_time,
              duration: t.travel_time,
              days_of_operation: t.days,
              available_classes: t.classes || 'All Classes',
              distance_km: t.distance,
            }))
            .sort((a: any, b: any) => a.departure_time.localeCompare(b.departure_time));
        } catch (error) {
          const axiosError = error as AxiosError;
          return { error: 'Railway API unavailable. Please try again.', details: axiosError.message };
        }
      },
    },
    {
      name: 'get_train_schedule',
      description: 'Get the complete schedule and all stops for a train with arrival/departure times and platform numbers.',
      inputSchema: RequestSchema.object({
        train_number: z.string().min(4, 'Train number required').max(10),
      }),
      handler: async (args: Record<string, unknown>): Promise<unknown> => {
        const train_number = String(args.train_number ?? '').trim();

        if (!train_number || train_number.length < 3) {
          return { error: 'Valid train number required', example: 'train_number: "12002"' };
        }

        try {
          const data = await apiCall(`/train/${train_number}`) as any;

          if (data.error || data.response_code !== 200) {
            return { error: data.message || 'Train not found', train_number };
          }

          return {
            train_number: data.train_number,
            train_name: data.train_name,
            type: data.train_type,
            origin: data.start_point,
            destination: data.end_point,
            total_distance: data.total_distance,
            running_days: data.running_days,
            stops: (data.route || []).map((s: any) => ({
              station_code: s.station_code,
              station_name: s.station_name,
              arrival: s.scharr,
              departure: s.schdep,
              day: s.day,
              distance: s.distance,
              platform: s.platform || 'TBD',
              halt_minutes: s.haltime || 0,
            })),
          };
        } catch (error) {
          const axiosError = error as AxiosError;
          return { error: 'Railway API unavailable. Please try again.', details: axiosError.message };
        }
      },
    },
    {
      name: 'get_live_status',
      description: 'Get real-time running status of a train — current location, delay information, and expected arrival at remaining stations.',
      inputSchema: RequestSchema.object({
        train_number: z.string().min(4, 'Train number required').max(10),
        date: z.string().regex(/^\d{2}-\d{2}-\d{4}$/, 'Date must be DD-MM-YYYY'),
      }),
      handler: async (args: Record<string, unknown>): Promise<unknown> => {
        const train_number = String(args.train_number ?? '').trim();
        const date = String(args.date ?? '').trim();

        if (!train_number || train_number.length < 3) {
          return { error: 'Valid train number required' };
        }

        if (!formatDate(date)) {
          return { error: 'Date must be in DD-MM-YYYY format', example: '25-12-2024' };
        }

        try {
          const data = await apiCall(`/live/${train_number}?date=${date}`) as any;

          if (data.error || data.response_code !== 200) {
            return { error: data.message || 'Train not found or no live data', train_number, date };
          }

          return {
            train_number: data.train_number,
            train_name: data.train_name,
            current_station: data.current_station,
            next_station: data.next_station,
            delay_minutes: data.delay || 0,
            last_updated: data.last_updated,
            upcoming_stops: (data.upcoming_stations || []).map((s: any) => ({
              station: s.station,
              scheduled_arrival: s.scharr,
              expected_arrival: s.predicted_arrival || s.scharr,
              delay_minutes: s.delay || 0,
            })),
          };
        } catch (error) {
          const axiosError = error as AxiosError;
          return { error: 'Railway API unavailable. Please try again.', details: axiosError.message };
        }
      },
    },
    {
      name: 'get_fare',
      description: 'Get ticket fare for a journey between two stations for a specific train and class.',
      inputSchema: RequestSchema.object({
        train_number: z.string().min(4, 'Train number required'),
        from_station: z.string().min(2, 'From station code required'),
        to_station: z.string().min(2, 'To station code required'),
        date: z.string().regex(/^\d{2}-\d{2}-\d{4}$/, 'Date must be DD-MM-YYYY'),
        travel_class: z.enum(['SL', '3A', '2A', '1A', 'CC', 'EC', '2S']),
      }),
      handler: async (args: Record<string, unknown>): Promise<unknown> => {
        const train_number = String(args.train_number ?? '').trim();
        const from_station = String(args.from_station ?? '').trim().toUpperCase();
        const to_station = String(args.to_station ?? '').trim().toUpperCase();
        const date = String(args.date ?? '').trim();
        const travel_class = String(args.travel_class ?? 'SL').trim().toUpperCase();

        if (!train_number || !from_station || !to_station) {
          return { error: 'Train number and station codes required' };
        }

        if (!formatDate(date)) {
          return { error: 'Date must be in DD-MM-YYYY format' };
        }

        const validClasses = ['SL', '3A', '2A', '1A', 'CC', 'EC', '2S'];
        if (!validClasses.includes(travel_class)) {
          return { error: 'Invalid class. Use: SL, 3A, 2A, 1A, CC, EC, or 2S' };
        }

        try {
          const data = await apiCall(`/fare/${train_number}/${from_station}/${to_station}/${date}/${travel_class}`) as any;

          if (data.error || data.response_code !== 200) {
            return { error: data.message || 'Fare not available', train_number, from_station, to_station };
          }

          return {
            train_number: data.train_number,
            from_station: data.from_station_code,
            to_station: data.to_station_code,
            travel_class: data.class,
            class_description: CLASS_DESCRIPTIONS[travel_class] || travel_class,
            base_fare: data.base_fare,
            reservation_charge: data.reservation_charge || 0,
            superfast_charge: data.superfast_charge || 0,
            total_fare: data.total_fare,
            distance_km: data.distance,
          };
        } catch (error) {
          const axiosError = error as AxiosError;
          return { error: 'Railway API unavailable. Please try again.', details: axiosError.message };
        }
      },
    },
    {
      name: 'get_station_info',
      description: 'Get information about an Indian railway station including its code, zone, division, and list of trains passing through it.',
      inputSchema: RequestSchema.object({
        station_code: z.string().min(2, 'Station code required').max(10),
      }),
      handler: async (args: Record<string, unknown>): Promise<unknown> => {
        const station_code = String(args.station_code ?? '').trim().toUpperCase();

        if (!station_code || station_code.length < 2) {
          return { error: 'Valid station code required', example: 'station_code: "NDLS"' };
        }

        try {
          const data = await apiCall(`/station/${station_code}`) as any;

          if (data.error || data.response_code !== 200) {
            return { error: data.message || 'Station not found', station_code };
          }

          return {
            station_code: data.station_code,
            station_name: data.station_name,
            city: data.city || data.zone,
            state: data.state,
            zone: data.zone,
            division: data.division || 'N/A',
            latitude: data.latitude || null,
            longitude: data.longitude || null,
            elevation: data.elevation || null,
            trains_count: data.trains_count || 0,
            is_junction: data.is_junction === 'Y',
          };
        } catch (error) {
          const axiosError = error as AxiosError;
          return { error: 'Railway API unavailable. Please try again.', details: axiosError.message };
        }
      },
    },
    {
      name: 'search_station_by_name',
      description: 'Search for Indian railway station codes by city or station name. Useful when you know the city but not the station code.',
      inputSchema: RequestSchema.object({
        query: z.string().min(2, 'Search query required'),
      }),
      handler: async (args: Record<string, unknown>): Promise<unknown> => {
        const query = String(args.query ?? '').trim().toLowerCase();

        if (!query || query.length < 2) {
          return { error: 'Search query must be at least 2 characters' };
        }

        const results = STATION_CODE_MAP.filter(s =>
          s.name.toLowerCase().includes(query) ||
          s.city.toLowerCase().includes(query) ||
          s.code.toLowerCase().includes(query) ||
          s.state.toLowerCase().includes(query)
        ).map(s => ({
          station_code: s.code,
          station_name: s.name,
          city: s.city,
          state: s.state,
        }));

        if (results.length === 0) {
          return {
            stations: [],
            suggestion: 'Try a different city name or check spelling',
            popular: ['CST', 'NDLS', 'MAS', 'HWH', 'SC', 'SBC', 'PUNE', 'ADI', 'JP', 'LKO'],
          };
        }

        return { stations: results.slice(0, 20) };
      },
    },
  ];
}