import { Writable } from 'node:stream';
import pg from 'pg';
import { createApp } from '../src/http/app';
import { createDatabaseReadinessCheck } from '../src/infrastructure/database/readiness';
import { createLogger } from '../src/infrastructure/logger/logger';
import { testDatabaseUrl } from './database';

/** Captura as linhas JSON emitidas pelo logger. */
export function createLogCapture() {
  const lines: string[] = [];
  const stream = new Writable({
    write(chunk: Buffer, _encoding, callback) {
      lines.push(...chunk.toString().split('\n').filter(Boolean));
      callback();
    },
  });
  return {
    stream,
    lines,
    entries: () => lines.map((line) => JSON.parse(line)),
  };
}

export function createTestApp(databaseUrl = testDatabaseUrl) {
  const pool = new pg.Pool({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 1000,
  });
  const logs = createLogCapture();
  const logger = createLogger(
    { NODE_ENV: 'test', LOG_LEVEL: 'debug' },
    logs.stream,
  );
  const app = createApp({
    logger,
    checkReadiness: createDatabaseReadinessCheck(pool),
  });
  return { app, pool, logs };
}
