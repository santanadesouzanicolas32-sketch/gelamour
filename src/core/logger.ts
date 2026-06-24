type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

class Logger {
  private readonly prefix: string;

  constructor(prefix = 'Gelamour') {
    this.prefix = prefix;
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
    };

    const style = {
      debug: 'color: #6B7280',
      info:  'color: #3B82F6',
      warn:  'color: #F59E0B',
      error: 'color: #EF4444; font-weight: bold',
    }[level];

    const formatted = `[${this.prefix}] ${entry.timestamp} ${message}`;

    if (level === 'error') {
      console.error(`%c${formatted}`, style, context ?? '');
    } else if (level === 'warn') {
      console.warn(`%c${formatted}`, style, context ?? '');
    } else {
      console.log(`%c${formatted}`, style, context ?? '');
    }
  }

  debug(msg: string, ctx?: Record<string, unknown>): void { this.log('debug', msg, ctx); }
  info(msg: string, ctx?: Record<string, unknown>): void  { this.log('info',  msg, ctx); }
  warn(msg: string, ctx?: Record<string, unknown>): void  { this.log('warn',  msg, ctx); }
  error(msg: string, ctx?: Record<string, unknown>): void { this.log('error', msg, ctx); }

  child(prefix: string): Logger { return new Logger(`${this.prefix}:${prefix}`); }
}

export const logger = new Logger();
