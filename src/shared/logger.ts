/**
 * Centralized structured logger for the India-MCP ecosystem.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  server?: string;
  requestId?: string;
  endpoint?: string;
  source?: string;
  [key: string]: any;
}

export class Logger {
  private serverName: string;

  constructor(serverName: string = 'system') {
    this.serverName = serverName;
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    const timestamp = new Date().toISOString();
    const structuredLog = {
      timestamp,
      level,
      server: this.serverName,
      message,
      ...context
    };

    // MCP servers use stdout for JSON-RPC, so all logs MUST go to stderr
    console.error(JSON.stringify(structuredLog));
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: LogContext): void {
    this.log('error', message, context);
  }
}

export const defaultLogger = new Logger();
