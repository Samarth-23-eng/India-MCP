/**
 * Generic retry helper for asynchronous operations.
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    retries: number;
    delay: number;
    shouldRetry?: (error: any) => boolean;
  } = { retries: 2, delay: 1000 }
): Promise<T> {
  let lastError: any;
  
  for (let i = 0; i <= options.retries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on the last attempt
      if (i === options.retries) break;
      
      // Check if we should retry based on error status
      if (options.shouldRetry && !options.shouldRetry(error)) {
        throw error;
      }
      
      // Default behavior: don't retry 4xx errors except 429 (rate limit)
      if (error.response && error.response.status >= 400 && error.response.status < 500 && error.response.status !== 429) {
        throw error;
      }

      console.error(`Attempt ${i + 1} failed. Retrying in ${options.delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, options.delay * (i + 1))); // Exponential backoff
    }
  }
  
  throw lastError;
}
