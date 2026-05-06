import { z } from 'zod';
import { BaseMCPServer } from '../shared/base-server.js';
import { HttpClient } from '../shared/http-client.js';
import { getNseHeaders } from '../shared/browser-headers.js';
import { withRetry } from '../shared/retry.js';
import { MemoryCache } from '../shared/cache.js';
import { Observability } from '../shared/observability.js';

// --- Types & Interfaces ---

interface StockQuote {
  symbol: string;
  company_name: string;
  exchange: string;
  current_price: number;
  previous_close: number;
  change: number;
  change_percent: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  week_52_high: number;
  week_52_low: number;
  market_cap?: number;
  pe_ratio?: number;
  eps?: number;
  last_updated: string;
}

interface HistoricalCandle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface MarketIndex {
  index_name: string;
  current_value: number;
  change: number;
  change_percent: number;
  open: number;
  high: number;
  low: number;
  advances?: number;
  declines?: number;
  unchanged?: number;
}

interface NormalizedResponse<T> {
  success: boolean;
  source?: string;
  data?: T;
  error?: string;
}

// --- Constants & Config ---

const TOP_STOCKS = [
  { symbol: "RELIANCE", company: "Reliance Industries Ltd", sector: "Energy" },
  { symbol: "TCS", company: "Tata Consultancy Services Ltd", sector: "IT" },
  { symbol: "HDFCBANK", company: "HDFC Bank Ltd", sector: "Banking" },
  { symbol: "INFY", company: "Infosys Ltd", sector: "IT" },
  { symbol: "ICICIBANK", company: "ICICI Bank Ltd", sector: "Banking" },
  { symbol: "HINDUNILVR", company: "Hindustan Unilever Ltd", sector: "FMCG" },
  { symbol: "ITC", company: "ITC Ltd", sector: "FMCG" },
  { symbol: "SBIN", company: "State Bank of India", sector: "Banking" },
  { symbol: "BHARTIARTL", company: "Bharti Airtel Ltd", sector: "Telecom" },
  { symbol: "KOTAKBANK", company: "Kotak Mahindra Bank Ltd", sector: "Banking" },
  { symbol: "AXISBANK", company: "Axis Bank Ltd", sector: "Banking" },
  { symbol: "LT", company: "Larsen & Toubro Ltd", sector: "Infrastructure" },
  { symbol: "ASIANPAINT", company: "Asian Paints Ltd", sector: "Consumer Durables" },
  { symbol: "MARUTI", company: "Maruti Suzuki India Ltd", sector: "Auto" },
  { symbol: "TITAN", company: "Titan Company Ltd", sector: "Consumer Durables" },
  { symbol: "BAJFINANCE", company: "Bajaj Finance Ltd", sector: "Finance" },
  { symbol: "WIPRO", company: "Wipro Ltd", sector: "IT" },
  { symbol: "ULTRACEMCO", company: "UltraTech Cement Ltd", sector: "Materials" },
  { symbol: "NESTLEIND", company: "Nestle India Ltd", sector: "FMCG" },
  { symbol: "TECHM", company: "Tech Mahindra Ltd", sector: "IT" },
  { symbol: "SUNPHARMA", company: "Sun Pharmaceutical Industries Ltd", sector: "Pharma" },
  { symbol: "ADANIPORTS", company: "Adani Ports and Special Economic Zone Ltd", sector: "Energy" },
  { symbol: "POWERGRID", company: "Power Grid Corporation of India Ltd", sector: "Energy" },
  { symbol: "NTPC", company: "NTPC Ltd", sector: "Energy" },
  { symbol: "ONGC", company: "Oil & Natural Gas Corporation Ltd", sector: "Energy" },
  { symbol: "COALINDIA", company: "Coal India Ltd", sector: "Energy" },
  { symbol: "TATAMOTORS", company: "Tata Motors Ltd", sector: "Auto" },
  { symbol: "TATASTEEL", company: "Tata Steel Ltd", sector: "Materials" },
  { symbol: "JSWSTEEL", company: "JSW Steel Ltd", sector: "Materials" },
  { symbol: "HINDALCO", company: "Hindalco Industries Ltd", sector: "Materials" },
  { symbol: "GRASIM", company: "Grasim Industries Ltd", sector: "Materials" },
  { symbol: "DIVISLAB", company: "Divi's Laboratories Ltd", sector: "Pharma" },
  { symbol: "DRREDDY", company: "Dr. Reddy's Laboratories Ltd", sector: "Pharma" },
  { symbol: "CIPLA", company: "Cipla Ltd", sector: "Pharma" },
  { symbol: "APOLLOHOSP", company: "Apollo Hospitals Enterprise Ltd", sector: "Healthcare" },
  { symbol: "BAJAJFINSV", company: "Bajaj Finserv Ltd", sector: "Finance" },
  { symbol: "SBILIFE", company: "SBI Life Insurance Company Ltd", sector: "Finance" },
  { symbol: "HDFCLIFE", company: "HDFC Life Insurance Company Ltd", sector: "Finance" },
  { symbol: "BRITANNIA", company: "Britannia Industries Ltd", sector: "FMCG" },
  { symbol: "DABUR", company: "Dabur India Ltd", sector: "FMCG" },
  { symbol: "GODREJCP", company: "Godrej Consumer Products Ltd", sector: "FMCG" },
  { symbol: "PIDILITIND", company: "Pidilite Industries Ltd", sector: "Chemicals" },
  { symbol: "BERGEPAINT", company: "Berger Paints India Ltd", sector: "Consumer Durables" },
  { symbol: "HAVELLS", company: "Havells India Ltd", sector: "Consumer Durables" },
  { symbol: "VOLTAS", company: "Voltas Ltd", sector: "Consumer Durables" },
  { symbol: "MCDOWELL-N", company: "United Spirits Ltd", sector: "FMCG" },
  { symbol: "TATACONSUM", company: "Tata Consumer Products Ltd", sector: "FMCG" },
  { symbol: "INDUSINDBK", company: "IndusInd Bank Ltd", sector: "Banking" },
  { symbol: "FEDERALBNK", company: "Federal Bank Ltd", sector: "Banking" },
  { symbol: "ZOMATO", company: "Zomato Ltd", sector: "IT" },
  { symbol: "PAYTM", company: "One 97 Communications Ltd (Paytm)", sector: "IT" },
  { symbol: "NYKAA", company: "FSN E-Commerce Ventures Ltd (Nykaa)", sector: "Retail" }
];

export class StocksServer extends BaseMCPServer {
  private nseClient = new HttpClient({ baseURL: 'https://www.nseindia.com/api' });
  private yahooClient = new HttpClient({ baseURL: 'https://query1.finance.yahoo.com/v8/finance' });
  private cache = new MemoryCache<any>();
  private obs = new Observability('stocks');

  constructor() {
    super('stocks-server', '1.0.0');
  }

  private async fetchNse<T>(endpoint: string): Promise<T> {
    const fullUrl = `https://www.nseindia.com/api${endpoint}`;
    return await this.obs.trackRequest(fullUrl, () => 
      withRetry(() => this.nseClient.get<T>(endpoint, { headers: getNseHeaders() }))
    );
  }

  private async fetchYahoo<T>(endpoint: string): Promise<T> {
    const fullUrl = `https://query1.finance.yahoo.com/v8/finance${endpoint}`;
    return await this.obs.trackRequest(fullUrl, () => 
      withRetry(() => this.yahooClient.get<T>(endpoint))
    );
  }

  private getMarketStatus() {
    const now = new Date();
    const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const day = istTime.getDay();
    const hours = istTime.getHours();
    const minutes = istTime.getMinutes();
    const currentTimeVal = hours * 100 + minutes;

    const isWeekday = day >= 1 && day <= 5;
    const isMarketHours = currentTimeVal >= 915 && currentTimeVal < 1530;

    const status = (isWeekday && isMarketHours) ? "OPEN" : "CLOSED";

    return {
      market: "NSE",
      status,
      timezone: "Asia/Kolkata",
      currentTime: istTime.toISOString(),
      nextOpen: "Monday-Friday 09:15 IST",
      nextClose: "Monday-Friday 15:30 IST"
    };
  }

  protected tools = [
    {
      name: 'get_system_metrics',
      description: 'Get real-time observability metrics for the India-MCP ecosystem.',
      inputSchema: z.object({}),
      handler: async (): Promise<NormalizedResponse<any>> => {
        return { success: true, data: this.obs.getSystemSnapshot() };
      }
    },
    {
      name: 'get_market_status',
      description: 'Get the current status of the Indian Stock Market (NSE).',
      inputSchema: z.object({}),
      handler: async (): Promise<NormalizedResponse<any>> => {
        return { success: true, data: this.getMarketStatus() };
      }
    },
    {
      name: 'get_stock_quote',
      description: 'Get real-time stock price and trading data for any NSE/BSE listed company.',
      inputSchema: z.object({
        symbol: z.string(),
        exchange: z.enum(['NSE', 'BSE']).optional()
      }),
      handler: async (args: any): Promise<NormalizedResponse<StockQuote>> => {
        let symbol = String(args.symbol ?? '').trim().toUpperCase();
        symbol = symbol.replace('.NS', '').replace('.BSE', '');
        
        const cacheKey = `quote_${symbol}`;
        const cached = this.cache.get(cacheKey);
        if (cached) {
          this.obs.recordCache(true, cacheKey);
          return { success: true, source: "Cache", data: cached };
        }
        this.obs.recordCache(false, cacheKey);

        try {
          const data: any = await this.fetchNse(`/quote-equity?symbol=${symbol}`);
          const quote: StockQuote = {
            symbol,
            company_name: data.info.companyName,
            exchange: 'NSE',
            current_price: data.priceInfo.lastPrice,
            previous_close: data.priceInfo.close,
            change: data.priceInfo.change,
            change_percent: data.priceInfo.pChange,
            open: data.priceInfo.open,
            high: data.priceInfo.intraDayHighLow.max,
            low: data.priceInfo.intraDayHighLow.min,
            volume: data.metadata.totalTradedVolume,
            week_52_high: data.metadata.weekHighLow.max,
            week_52_low: data.metadata.weekHighLow.min,
            market_cap: data.metadata.marketCap,
            last_updated: data.metadata.lastUpdateTime
          };
          this.cache.set(cacheKey, quote, 15);
          return { success: true, source: "NSE", data: quote };
        } catch (error) {
          this.obs.logWarn(`NSE failed for ${symbol}, trying Yahoo fallback...`);
          try {
            const yahooData: any = await this.fetchYahoo(`/chart/${symbol}.NS?interval=1d&range=1d`);
            const meta = yahooData.chart.result[0].meta;
            const quote: StockQuote = {
              symbol,
              company_name: symbol,
              exchange: 'NSE (Yahoo Fallback)',
              current_price: meta.regularMarketPrice,
              previous_close: meta.previousClose,
              change: meta.regularMarketPrice - meta.previousClose,
              change_percent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
              open: meta.regularMarketDayOpen,
              high: meta.regularMarketDayHigh,
              low: meta.regularMarketDayLow,
              volume: meta.regularMarketVolume,
              week_52_high: meta.fiftyTwoWeekHigh,
              week_52_low: meta.fiftyTwoWeekLow,
              last_updated: new Date(meta.regularMarketTime * 1000).toISOString()
            };
            this.cache.set(cacheKey, quote, 15);
            return { success: true, source: "Yahoo Finance", data: quote };
          } catch (err) {
            return { success: false, error: `Market data unavailable for ${symbol}. Try again during market hours.` };
          }
        }
      }
    },
    {
      name: 'search_stock',
      description: 'Search for Indian stocks by company name or partial symbol.',
      inputSchema: z.object({
        query: z.string()
      }),
      handler: async (args: any): Promise<NormalizedResponse<any[]>> => {
        const query = String(args.query ?? '').trim().toUpperCase();
        const cacheKey = `search_${query}`;
        const cached = this.cache.get(cacheKey);
        if (cached) {
          this.obs.recordCache(true, cacheKey);
          return { success: true, source: "Cache", data: cached };
        }
        this.obs.recordCache(false, cacheKey);

        try {
          const data: any = await this.fetchNse(`/search/autocomplete?q=${query}`);
          const results = data.symbols.map((s: any) => ({
            symbol: s.symbol,
            company_name: s.symbol_res_name,
            exchange: 'NSE'
          }));
          this.cache.set(cacheKey, results, 300);
          return { success: true, source: "NSE", data: results };
        } catch (error) {
          const fallback = TOP_STOCKS.filter(s => 
            s.symbol.includes(query) || s.company.toUpperCase().includes(query)
          ).slice(0, 20);
          return { success: true, source: "Offline Fallback", data: fallback };
        }
      }
    },
    {
      name: 'get_market_indices',
      description: 'Get current values of major Indian market indices.',
      inputSchema: z.object({
        indices: z.array(z.string()).optional()
      }),
      handler: async (args: any): Promise<NormalizedResponse<MarketIndex[]>> => {
        const cacheKey = 'indices_all';
        const cached = this.cache.get(cacheKey);
        let results: MarketIndex[] = cached;

        if (!results) {
          this.obs.recordCache(false, cacheKey);
          try {
            const data: any = await this.fetchNse('/allIndices');
            results = data.data.map((i: any) => ({
              index_name: i.index,
              current_value: i.last,
              change: i.variation,
              change_percent: i.percentChange,
              open: i.open,
              high: i.high,
              low: i.low,
              advances: i.advances,
              declines: i.declines,
              unchanged: i.unchanged
            }));
            this.cache.set(cacheKey, results, 30);
          } catch (error) {
            return { success: false, error: "Failed to fetch market indices." };
          }
        } else {
          this.obs.recordCache(true, cacheKey);
        }

        const requested = args.indices as string[] | undefined;
        if (requested && requested.length > 0) {
          results = results.filter(r => requested.some(q => r.index_name.toUpperCase().includes(q.toUpperCase())));
        }

        return { success: true, source: cached ? "Cache" : "NSE", data: results };
      }
    },
    {
      name: 'get_stock_history',
      description: 'Get historical price data for a stock.',
      inputSchema: z.object({
        symbol: z.string(),
        period: z.enum(['1W', '1M', '3M', '6M', '1Y', '3Y']).optional()
      }),
      handler: async (args: any): Promise<NormalizedResponse<any>> => {
        let symbol = String(args.symbol ?? '').trim().toUpperCase();
        symbol = symbol.replace('.NS', '');
        const period = (args.period as string) || '1M';
        const rangeMap: Record<string, string> = {
          '1W': '7d', '1M': '1mo', '3M': '3mo', '6M': '6mo', '1Y': '1y', '3Y': '3y'
        };

        const cacheKey = `history_${symbol}_${period}`;
        const cached = this.cache.get(cacheKey);
        if (cached) {
          this.obs.recordCache(true, cacheKey);
          return { success: true, source: "Cache", data: cached };
        }
        this.obs.recordCache(false, cacheKey);

        try {
          const data: any = await this.fetchYahoo(`/chart/${symbol}.NS?interval=1d&range=${rangeMap[period]}`);
          const result = data.chart.result[0];
          const timestamps = result.timestamp;
          const quotes = result.indicators.quote[0];

          const history: HistoricalCandle[] = timestamps.map((t: number, i: number) => ({
            date: new Date(t * 1000).toISOString().split('T')[0],
            open: quotes.open[i],
            high: quotes.high[i],
            low: quotes.low[i],
            close: quotes.close[i],
            volume: quotes.volume[i]
          })).filter((d: any) => d.close !== null);

          const prices = history.map(h => h.close);
          const responseData = {
            symbol,
            period,
            data: history,
            summary: {
              start_price: prices[0],
              end_price: prices[prices.length - 1],
              change_percent: ((prices[prices.length - 1] - prices[0]) / prices[0]) * 100,
              highest: Math.max(...history.map(h => h.high)),
              lowest: Math.min(...history.map(h => h.low)),
              avg_volume: history.reduce((acc, h) => acc + h.volume, 0) / history.length
            }
          };
          this.cache.set(cacheKey, responseData, 3600);
          return { success: true, source: "Yahoo Finance", data: responseData };
        } catch (error) {
          return { success: false, error: `Failed to fetch historical data for ${symbol}.` };
        }
      }
    },
    {
      name: 'get_top_gainers_losers',
      description: 'Get top gaining and losing stocks on NSE.',
      inputSchema: z.object({
        type: z.enum(['gainers', 'losers', 'both']).optional(),
        limit: z.number().optional()
      }),
      handler: async (args: any): Promise<NormalizedResponse<any>> => {
        const cacheKey = 'gainers_losers';
        const cached = this.cache.get(cacheKey);
        let data: any = cached;

        if (!data) {
          this.obs.recordCache(false, cacheKey);
          try {
            data = await this.fetchNse('/live-analysis-gainers-losers?index=securities');
            this.cache.set(cacheKey, data, 30);
          } catch (error) {
            return { success: false, error: "Failed to fetch gainers and losers." };
          }
        } else {
          this.obs.recordCache(true, cacheKey);
        }

        const limit = (args.limit as number) || 10;
        return {
          success: true,
          source: cached ? "Cache" : "NSE",
          data: {
            gainers: data.gainers.data.slice(0, limit).map((s: any) => ({
              symbol: s.symbol,
              price: s.ltp,
              change: s.change,
              change_percent: s.pChange,
              volume: s.totalTradedVolume
            })),
            losers: data.losers.data.slice(0, limit).map((s: any) => ({
              symbol: s.symbol,
              price: s.ltp,
              change: s.change,
              change_percent: s.pChange,
              volume: s.totalTradedVolume
            }))
          }
        };
      }
    },
    {
      name: 'get_ipo_status',
      description: 'Get information about Indian IPOs.',
      inputSchema: z.object({
        status: z.enum(['upcoming', 'open', 'listed', 'all']).optional()
      }),
      handler: async (): Promise<NormalizedResponse<any>> => {
        const cacheKey = 'ipo_data';
        const cached = this.cache.get(cacheKey);
        if (cached) {
          this.obs.recordCache(true, cacheKey);
          return { success: true, source: "Cache", data: cached };
        }
        this.obs.recordCache(false, cacheKey);

        try {
          const data: any = await this.fetchNse('/ipo-current-allotment');
          this.cache.set(cacheKey, data.data, 300);
          return { success: true, source: "NSE", data: data.data };
        } catch (error) {
          return { success: false, error: "Failed to fetch IPO data." };
        }
      }
    },
    {
      name: 'get_sector_performance',
      description: 'Get performance summary of major NSE sectors.',
      inputSchema: z.object({
        sector: z.string().optional()
      }),
      handler: async (): Promise<NormalizedResponse<any[]>> => {
        const cacheKey = 'sector_performance';
        const cached = this.cache.get(cacheKey);
        if (cached) {
          this.obs.recordCache(true, cacheKey);
          return { success: true, source: "Cache", data: cached };
        }
        this.obs.recordCache(false, cacheKey);

        try {
          const data: any = await this.fetchNse('/sector-data');
          const results = data.map((s: any) => ({
            sector_name: s.index,
            current_value: s.last,
            change_percent: s.percentChange
          }));
          this.cache.set(cacheKey, results, 60);
          return { success: true, source: "NSE", data: results };
        } catch (error) {
          return { success: false, error: "Failed to fetch sector performance." };
        }
      }
    }
  ];
}
