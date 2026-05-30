import { db } from './firebase.js';
import logger from '../logger.js';

export async function logInteraction(record) {
  try {
    if (!record) return;
    await db.collection('interactionLogs').add({
      uid: record.uid || null,
      surface: record.surface || 'unknown',
      sessionId: record.sessionId || null,
      inputText: record.inputText || '',
      envelope: record.envelope || null,
      confidence: record.envelope?.confidence ?? record.confidence ?? null,
      appliedActions: record.appliedActions || null,
      userCorrection: record.userCorrection || null,
      exerciseResolution: record.exerciseResolution || null,
      model: record.model || null,
      catalogVersion: record.catalogVersion || null,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    logger.warn({ err }, 'Failed to write interaction log');
  }
}
