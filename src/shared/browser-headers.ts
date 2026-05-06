/**
 * Reusable browser-like headers for scraping/API calls that require them (especially NSE).
 */
export const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  "Referer": "https://www.nseindia.com/",
  "Origin": "https://www.nseindia.com",
  "Connection": "keep-alive",
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "same-origin"
};

/**
 * Returns headers with specific Referer if needed.
 */
export function getNseHeaders(referer: string = "https://www.nseindia.com/") {
  return {
    ...BROWSER_HEADERS,
    "Referer": referer
  };
}
