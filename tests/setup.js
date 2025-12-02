// Test setup file
import 'dotenv/config';

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.TELEGRAM_BOT_TOKEN = 'test_token';
process.env.ADMIN_TELEGRAM_ID = 'test_admin';

// Mock Supabase client
jest.mock('../src/database/supabase.js', () => ({
  getClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: null, error: null })
        })
      }),
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => ({
        eq: () => Promise.resolve({ data: null, error: null })
      })
    })
  })
}));

// Mock logger
jest.mock('pino', () => () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));





