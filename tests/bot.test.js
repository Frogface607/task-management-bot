import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { Telegraf } from 'telegraf';
import { parseNaturalDate, formatDeadline, isDateInPast } from '../src/utils/dateParser.js';
import { getOnboardingStep, formatOnboardingMessage } from '../src/utils/onboarding.js';

describe('Edison Quest Bot Tests', () => {
  
  describe('Date Parser', () => {
    it('should parse "завтра в 15:00" correctly', () => {
      const result = parseNaturalDate('завтра в 15:00');
      expect(result).toBeTruthy();
      expect(new Date(result).getHours()).toBe(15);
    });

    it('should parse "через 3 часа" correctly', () => {
      const result = parseNaturalDate('через 3 часа');
      expect(result).toBeTruthy();
      const now = new Date();
      const parsed = new Date(result);
      expect(parsed.getTime()).toBeGreaterThan(now.getTime());
    });

    it('should format deadline correctly', () => {
      const isoDate = '2024-10-02T18:00:00.000Z';
      const formatted = formatDeadline(isoDate);
      expect(formatted).toContain('октября');
      expect(formatted).toContain('18:00');
    });

    it('should detect past dates', () => {
      const pastDate = new Date(Date.now() - 1000 * 60 * 60).toISOString(); // 1 hour ago
      expect(isDateInPast(pastDate)).toBe(true);
      
      const futureDate = new Date(Date.now() + 1000 * 60 * 60).toISOString(); // 1 hour from now
      expect(isDateInPast(futureDate)).toBe(false);
    });
  });

  describe('Onboarding System', () => {
    it('should generate onboarding step 1', () => {
      const step = getOnboardingStep(1);
      expect(step.message).toContain('Добро пожаловать');
      expect(step.keyboard).toBeDefined();
    });

    it('should format onboarding message with user data', () => {
      const userData = {
        username: 'testuser',
        telegramId: '123456',
        workspace: 'Test Workspace'
      };
      
      const step = getOnboardingStep(1);
      const message = formatOnboardingMessage(step.message, userData);
      
      expect(message).toContain('testuser');
      expect(message).toContain('123456');
      expect(message).toContain('Test Workspace');
    });

    it('should have all 4 onboarding steps', () => {
      for (let i = 1; i <= 4; i++) {
        const step = getOnboardingStep(i);
        expect(step.message).toBeTruthy();
        expect(step.keyboard).toBeDefined();
      }
    });
  });

  describe('Quest Formatter', () => {
    it('should format quest list correctly', () => {
      const mockQuests = [
        {
          id: '1',
          title: 'Test Quest',
          status: 'assigned',
          deadline: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
          assigned_to: { username: 'testuser' },
          created_at: new Date().toISOString()
        }
      ];
      
      // Import the function
      const { formatQuestList } = require('../src/utils/questFormatter.js');
      const result = formatQuestList(mockQuests, 'admin');
      
      expect(result).toContain('Test Quest');
      expect(result).toContain('testuser');
      expect(result).toContain('Прогресс:');
    });
  });
});





