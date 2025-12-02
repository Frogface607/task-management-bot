// Константы и конфигурация
export const DEFAULT_TIMEZONE = process.env.TIMEZONE || "Asia/Irkutsk";

export const ROLE_NAMES = {
  OWNER: "Владелец",
  MANAGER: "Менеджер",
  ACCOUNTANT: "Бухгалтер",
  SENIOR_ACCOUNTANT: "Старший бухгалтер",
  JUNIOR_ACCOUNTANT: "Младший бухгалтер",
  ASSISTANT: "Помощник",
};

export const TASK_STATUSES = {
  NEW: "new",
  ASSIGNED: "assigned",
  IN_PROGRESS: "in_progress",
  PENDING_REVIEW: "pending_review",
  APPROVED: "approved",
  REJECTED: "rejected",
};

export const ISSUE_STATUSES = {
  NEW: "new",
  IN_PROGRESS: "in_progress",
  RESOLVED: "resolved",
};

export const LOGGER_OPTIONS = {
  level: process.env.LOG_LEVEL || "info",
  transport: process.env.NODE_ENV !== "production" ? { target: "pino-pretty" } : undefined,
};



