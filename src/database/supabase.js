import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import pino from 'pino';
import { LOGGER_OPTIONS } from '../config/constants.js';

const logger = pino(LOGGER_OPTIONS);

const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  logger.error('Supabase configuration is missing. Check SUPABASE_URL and SUPABASE_ANON_KEY');
  throw new Error('Supabase env vars missing');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
  },
});

export function getClient() {
  return supabase;
}



