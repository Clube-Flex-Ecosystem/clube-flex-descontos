import { loadEnv } from '../../../config/env';
import { createPool, setDatabase } from './client';

const env = loadEnv();
export const pool = createPool(env.DATABASE_URL);
setDatabase(pool);
