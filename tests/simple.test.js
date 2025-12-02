// Simple test runner without Jest
import { parseNaturalDate, formatDeadline, isDateInPast } from '../src/utils/dateParser.js';
import { getOnboardingStep, formatOnboardingMessage } from '../src/utils/onboarding.js';

let testsPassed = 0;
let testsTotal = 0;

function test(name, fn) {
  testsTotal++;
  try {
    fn();
    console.log(`✅ ${name}`);
    testsPassed++;
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
  }
}

function expect(actual) {
  return {
    toBe: (expected) => {
      if (actual !== expected) {
        throw new Error(`Expected ${expected}, got ${actual}`);
      }
    },
    toBeTruthy: () => {
      if (!actual) {
        throw new Error(`Expected truthy value, got ${actual}`);
      }
    },
    toContain: (substring) => {
      if (!actual.includes(substring)) {
        throw new Error(`Expected "${actual}" to contain "${substring}"`);
      }
    },
    toBeGreaterThan: (expected) => {
      if (actual <= expected) {
        throw new Error(`Expected ${actual} to be greater than ${expected}`);
      }
    }
  };
}

console.log('🧪 Running Edison Quest Bot Tests...\n');

// Date Parser Tests
test('should parse "завтра в 15:00" correctly', () => {
  const result = parseNaturalDate('завтра в 15:00');
  expect(result).toBeTruthy();
  expect(new Date(result).getHours()).toBe(15);
});

test('should parse "через 3 часа" correctly', () => {
  const result = parseNaturalDate('через 3 часа');
  expect(result).toBeTruthy();
  const now = new Date();
  const parsed = new Date(result);
  expect(parsed.getTime()).toBeGreaterThan(now.getTime());
});

test('should format deadline correctly', () => {
  const isoDate = '2024-10-02T18:00:00.000Z';
  const formatted = formatDeadline(isoDate);
  expect(formatted).toContain('октября');
  // Check for either 18:00 or 21:00 (timezone difference)
  expect(formatted.includes('18:00') || formatted.includes('21:00')).toBe(true);
});

test('should detect past dates', () => {
  const pastDate = new Date(Date.now() - 1000 * 60 * 60).toISOString(); // 1 hour ago
  expect(isDateInPast(pastDate)).toBe(true);
  
  const futureDate = new Date(Date.now() + 1000 * 60 * 60).toISOString(); // 1 hour from now
  expect(isDateInPast(futureDate)).toBe(false);
});

// Onboarding Tests
test('should generate onboarding step 1', () => {
  const step = getOnboardingStep(1);
  expect(step.message).toContain('Добро пожаловать');
  expect(step.keyboard).toBeTruthy();
});

test('should format onboarding message with user data', () => {
  const userData = {
    username: 'testuser',
    telegramId: '123456',
    workspace: 'Test Workspace'
  };
  
  // Test step 2 which has placeholders
  const step = getOnboardingStep(2);
  const message = formatOnboardingMessage(step.message, userData);
  
  expect(message).toContain('testuser');
  expect(message).toContain('123456');
  expect(message).toContain('Test Workspace');
});

test('should have all 4 onboarding steps', () => {
  for (let i = 1; i <= 4; i++) {
    const step = getOnboardingStep(i);
    expect(step.message).toBeTruthy();
    expect(step.keyboard).toBeTruthy();
  }
});

// Results
console.log(`\n📊 Test Results: ${testsPassed}/${testsTotal} tests passed`);

if (testsPassed === testsTotal) {
  console.log('🎉 All tests passed!');
  process.exit(0);
} else {
  console.log('💥 Some tests failed!');
  process.exit(1);
}
