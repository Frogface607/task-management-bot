// Mobile optimization tests
import { formatMobileQuest, formatShortDeadline, formatMobileStats } from '../src/utils/mobileOptimizer.js';
import { formatQuestList, formatReminderMessage } from '../src/utils/questFormatter.js';

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
    toBeLessThan: (expected) => {
      if (actual >= expected) {
        throw new Error(`Expected ${actual} to be less than ${expected}`);
      }
    }
  };
}

console.log('📱 Running Mobile Optimization Tests...\n');

// Mobile quest formatting tests
test('should format mobile quest correctly', () => {
  const mockQuest = {
    id: '1',
    title: 'Test Quest',
    status: 'assigned',
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(), // 2 hours from now
    assigned_to: { username: 'testuser' },
    xp_reward: 100
  };
  
  const result = formatMobileQuest(mockQuest);
  
  expect(result).toContain('🟡 **Test Quest**');
  expect(result).toContain('@testuser');
  expect(result).toContain('+100 XP');
  expect(result).toContain('[👁 Детали]');
  expect(result).toContain('[🔔 Напомнить]');
});

test('should format short deadline correctly', () => {
  const now = new Date();
  
  // Test "in 2 hours"
  const in2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString();
  expect(formatShortDeadline(in2Hours)).toContain('2ч');
  
  // Test "in 30 minutes" - might round to 1 hour
  const in30Mins = new Date(now.getTime() + 30 * 60 * 1000).toISOString();
  const result30 = formatShortDeadline(in30Mins);
  expect(result30).toContain('ч'); // Should contain hours (rounded)
  
  // Test "in 3 days"
  const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
  expect(formatShortDeadline(in3Days)).toContain('3д');
  
  // Test overdue
  const overdue = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
  expect(formatShortDeadline(overdue)).toContain('Просрочен');
});

test('should format mobile stats correctly', () => {
  const stats = {
    total: 10,
    completed: 7,
    active: 2,
    overdue: 1,
    totalXp: 1000,
    completedXp: 700
  };
  
  const result = formatMobileStats(stats);
  
  expect(result).toContain('📊 **Статистика**');
  expect(result).toContain('Квесты: 10');
  expect(result).toContain('✅ Выполнено: 7');
  expect(result).toContain('🔄 Активных: 2');
  expect(result).toContain('⚠️ Просрочено: 1');
  expect(result).toContain('💎 **XP: 1000**');
});

test('should format quest list for mobile', () => {
  const mockQuests = [
    {
      id: '1',
      title: 'Mobile Quest 1',
      status: 'assigned',
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(),
      assigned_to: { username: 'user1' },
      xp_reward: 100,
      created_at: new Date().toISOString()
    },
    {
      id: '2',
      title: 'Mobile Quest 2',
      status: 'in_progress',
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      assigned_to: { username: 'user2' },
      xp_reward: 200,
      created_at: new Date().toISOString()
    }
  ];
  
  const result = formatQuestList(mockQuests, 'admin', true); // mobile = true
  
  expect(result).toContain('📊 **Мои квесты (2 активных)**');
  expect(result).toContain('🟡 **Mobile Quest 1**');
  expect(result).toContain('🟢 **Mobile Quest 2**');
  expect(result).toContain('@user1');
  expect(result).toContain('@user2');
});

test('should format reminder message for mobile', () => {
  const mockQuest = {
    title: 'Test Reminder Quest',
    deadline: new Date(Date.now() + 1000 * 60 * 60 * 3).toISOString(),
    xp_reward: 150
  };
  
  const result = formatReminderMessage(mockQuest, 'admin', true); // mobile = true
  
  expect(result).toContain('⏰ **Напоминание от @admin**');
  expect(result).toContain('🎯 **Test Reminder Quest**');
  expect(result).toContain('💎 +150 XP');
  expect(result).toContain('💪 Не забудь выполнить!');
});

test('should be shorter than desktop version', () => {
  const mockQuests = [
    {
      id: '1',
      title: 'Short Quest',
      status: 'assigned',
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(),
      assigned_to: { username: 'user' },
      xp_reward: 100,
      created_at: new Date().toISOString()
    }
  ];
  
  const mobileResult = formatQuestList(mockQuests, 'admin', true);
  const desktopResult = formatQuestList(mockQuests, 'admin', false);
  
  expect(mobileResult.length).toBeLessThan(desktopResult.length);
});

// Results
console.log(`\n📊 Mobile Test Results: ${testsPassed}/${testsTotal} tests passed`);

if (testsPassed === testsTotal) {
  console.log('🎉 All mobile optimization tests passed!');
  process.exit(0);
} else {
  console.log('💥 Some mobile tests failed!');
  process.exit(1);
}
