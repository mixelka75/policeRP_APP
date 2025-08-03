// src/constants/logs.ts
// Константы для событий логов, которые должны быть исключены из отображения для администраторов
export const EXCLUDED_LOG_ACTIONS = [
  'GET_SKIN',
  'GET_SKIN_BY_DISCORD', 
  'GET_AVATAR_BY_NICKNAME',
  'TOKEN_REFRESH',
  'VIEW_STATISTICS',
  'VIEW_OWN_PASSPORT',
  'VIEW_FINES_ON_ME'
] as const;

export type ExcludedLogAction = typeof EXCLUDED_LOG_ACTIONS[number];