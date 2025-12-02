import { parse as chronoParse } from 'chrono-node';

/**
 * Parse natural language date input to ISO string
 * @param {string} input - Natural language input like "завтра в 15:00", "через 3 часа"
 * @returns {string|null} - ISO string or null if parsing failed
 */
export function parseNaturalDate(input) {
  if (!input || typeof input !== 'string') return null;
  
  const cleanInput = input.trim().toLowerCase();
  
  // Handle common Russian patterns
  const russianPatterns = {
    'сегодня': () => {
      const today = new Date();
      today.setHours(18, 0, 0, 0); // Default to 18:00
      return today.toISOString();
    },
    'завтра': () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(18, 0, 0, 0); // Default to 18:00
      return tomorrow.toISOString();
    },
    'через час': () => {
      const in1Hour = new Date();
      in1Hour.setHours(in1Hour.getHours() + 1);
      return in1Hour.toISOString();
    },
    'через 2 часа': () => {
      const in2Hours = new Date();
      in2Hours.setHours(in2Hours.getHours() + 2);
      return in2Hours.toISOString();
    },
    'через 3 часа': () => {
      const in3Hours = new Date();
      in3Hours.setHours(in3Hours.getHours() + 3);
      return in3Hours.toISOString();
    },
    'через день': () => {
      const in1Day = new Date();
      in1Day.setDate(in1Day.getDate() + 1);
      in1Day.setHours(18, 0, 0, 0);
      return in1Day.toISOString();
    },
    'через неделю': () => {
      const in1Week = new Date();
      in1Week.setDate(in1Week.getDate() + 7);
      in1Week.setHours(18, 0, 0, 0);
      return in1Week.toISOString();
    }
  };
  
  // Check for exact Russian patterns first
  for (const [pattern, handler] of Object.entries(russianPatterns)) {
    if (cleanInput === pattern) {
      return handler();
    }
  }
  
  // Try to extract time from "сегодня в XX:XX" or "завтра в XX:XX"
  const todayMatch = cleanInput.match(/сегодня в (\d{1,2}):(\d{2})/);
  if (todayMatch) {
    const [, hours, minutes] = todayMatch;
    const today = new Date();
    today.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return today.toISOString();
  }
  
  const tomorrowMatch = cleanInput.match(/завтра в (\d{1,2}):(\d{2})/);
  if (tomorrowMatch) {
    const [, hours, minutes] = tomorrowMatch;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return tomorrow.toISOString();
  }
  
  // Try chrono-node for more complex parsing
  try {
    const parsed = chronoParse(input, new Date(), { forwardDate: true });
    if (parsed && parsed.length > 0) {
      const result = parsed[0];
      if (result.start) {
        return result.start.date().toISOString();
      }
    }
  } catch (error) {
    console.warn('Chrono parsing failed:', error);
  }
  
  return null;
}

/**
 * Format deadline for display
 * @param {string} isoString - ISO date string
 * @returns {string} - Formatted date string
 */
export function formatDeadline(isoString) {
  if (!isoString) return 'Не указан';
  
  try {
    const date = new Date(isoString);
    return date.toLocaleString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return 'Неверная дата';
  }
}

/**
 * Check if date is in the past
 * @param {string} isoString - ISO date string
 * @returns {boolean} - True if date is in the past
 */
export function isDateInPast(isoString) {
  if (!isoString) return false;
  
  try {
    const date = new Date(isoString);
    const now = new Date();
    return date < now;
  } catch (error) {
    return false;
  }
}

/**
 * Generate quick deadline options
 * @returns {Array} - Array of deadline options
 */
export function getQuickDeadlineOptions() {
  const now = new Date();
  
  return [
    {
      label: 'Сегодня 18:00',
      value: (() => {
        const today = new Date(now);
        today.setHours(18, 0, 0, 0);
        return today.toISOString();
      })()
    },
    {
      label: 'Сегодня 21:00',
      value: (() => {
        const today = new Date(now);
        today.setHours(21, 0, 0, 0);
        return today.toISOString();
      })()
    },
    {
      label: 'Завтра 12:00',
      value: (() => {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(12, 0, 0, 0);
        return tomorrow.toISOString();
      })()
    },
    {
      label: 'Завтра 18:00',
      value: (() => {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(18, 0, 0, 0);
        return tomorrow.toISOString();
      })()
    },
    {
      label: 'Через 3 часа',
      value: (() => {
        const in3Hours = new Date(now);
        in3Hours.setHours(in3Hours.getHours() + 3);
        return in3Hours.toISOString();
      })()
    },
    {
      label: 'Через день',
      value: (() => {
        const in1Day = new Date(now);
        in1Day.setDate(in1Day.getDate() + 1);
        in1Day.setHours(18, 0, 0, 0);
        return in1Day.toISOString();
      })()
    }
  ];
}
