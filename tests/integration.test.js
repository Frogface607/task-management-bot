// Integration tests for Edison Quest Bot
import { parseNaturalDate, formatDeadline, isDateInPast } from '../src/utils/dateParser.js';
import { getOnboardingStep, formatOnboardingMessage, getHelpMessage } from '../src/utils/onboarding.js';

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
    },
    toBeLessThan: (expected) => {
      if (actual >= expected) {
        throw new Error(`Expected ${actual} to be less than ${expected}`);
      }
    }
  };
}

console.log('🔗 Running Integration Tests...\n');

// Date Parser Integration Tests
test('should handle complex date parsing scenarios', () => {
  const testCases = [
    { input: 'завтра в 15:00', shouldBeFuture: true },
    { input: 'через 2 часа', shouldBeFuture: true },
    { input: 'через день', shouldBeFuture: true },
    { input: 'в пятницу в 12:00', shouldBeFuture: true }
  ];
  
  testCases.forEach(({ input, shouldBeFuture }) => {
    const result = parseNaturalDate(input);
    expect(result).toBeTruthy();
    
    if (shouldBeFuture) {
      const now = new Date();
      const parsed = new Date(result);
      expect(parsed.getTime()).toBeGreaterThan(now.getTime());
    }
  });
});

test('should handle edge cases in date parsing', () => {
  // Test invalid input
  const invalidResult = parseNaturalDate('invalid date');
  expect(invalidResult).toBe(null);
  
  // Test empty input
  const emptyResult = parseNaturalDate('');
  expect(emptyResult).toBe(null);
  
  // Test null input
  const nullResult = parseNaturalDate(null);
  expect(nullResult).toBe(null);
});

test('should format various date formats correctly', () => {
  const testDates = [
    '2024-10-02T18:00:00.000Z',
    '2024-12-25T12:00:00.000Z',
    '2024-01-01T00:00:00.000Z'
  ];
  
  testDates.forEach(date => {
    const formatted = formatDeadline(date);
    expect(formatted).toContain('2024');
    expect(formatted.length).toBeGreaterThan(10); // Should be a readable format
  });
});

// Onboarding Integration Tests
test('should handle complete onboarding flow', () => {
  const userData = {
    username: 'integration_test_user',
    telegramId: '999999999',
    workspace: 'Integration Test Workspace'
  };
  
  // Test all 4 steps
  for (let stepNum = 1; stepNum <= 4; stepNum++) {
    const step = getOnboardingStep(stepNum);
    expect(step.message).toBeTruthy();
    expect(step.keyboard).toBeTruthy();
    
    // Test message formatting
    const formattedMessage = formatOnboardingMessage(step.message, userData);
    
    // Only test placeholders for step 2 which has them
    if (stepNum === 2) {
      expect(formattedMessage).toContain('integration_test_user');
      expect(formattedMessage).toContain('999999999');
      expect(formattedMessage).toContain('Integration Test Workspace');
    }
  }
});

test('should handle help message generation', () => {
  const helpMessage = getHelpMessage();
  expect(helpMessage).toContain('Справка');
  expect(helpMessage).toContain('команды');
  expect(helpMessage).toContain('квесты');
  expect(helpMessage.length).toBeGreaterThan(100); // Should be comprehensive
});

// Performance Tests
test('should handle date parsing performance', () => {
  const startTime = Date.now();
  
  // Parse 100 dates
  for (let i = 0; i < 100; i++) {
    parseNaturalDate('завтра в 15:00');
  }
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  expect(duration).toBeLessThan(1000); // Should complete in less than 1 second
});

test('should handle onboarding message generation performance', () => {
  const startTime = Date.now();
  const userData = { username: 'perf_test', telegramId: '123', workspace: 'test' };
  
  // Generate 50 onboarding messages
  for (let i = 0; i < 50; i++) {
    const step = getOnboardingStep(1);
    formatOnboardingMessage(step.message, userData);
  }
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  expect(duration).toBeLessThan(500); // Should complete in less than 0.5 seconds
});

// Results
console.log(`\n📊 Integration Test Results: ${testsPassed}/${testsTotal} tests passed`);

if (testsPassed === testsTotal) {
  console.log('🎉 All integration tests passed!');
  process.exit(0);
} else {
  console.log('💥 Some integration tests failed!');
  process.exit(1);
}
