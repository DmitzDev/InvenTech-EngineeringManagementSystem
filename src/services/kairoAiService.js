/**
 * Legacy compatibility bridge for Kairo AI -> CPEX Copilot
 */
export * from './cpexAiService';
import { askCpexAi, generateOfflineCpexResponse } from './cpexAiService';

export const askKairoAi = askCpexAi;
export const generateOfflineKairoResponse = generateOfflineCpexResponse;
