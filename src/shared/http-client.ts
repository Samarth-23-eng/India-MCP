import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { BROWSER_HEADERS } from './browser-headers.js';

/**
 * Shared HTTP Client wrapper using Axios.
 */
export class HttpClient {
  private instance: AxiosInstance;

  constructor(config: AxiosRequestConfig = {}) {
    this.instance = axios.create({
      timeout: 10000,
      headers: BROWSER_HEADERS,
      ...config
    });
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.post<T>(url, data, config);
    return response.data;
  }
}

export const defaultHttpClient = new HttpClient();
