import { db } from './firebase.js';
import { chat as aiChat, GEMINI_MODEL } from './ai-service.js';
import { buildCoachingContext, formatContextForAI } from './coaching-context-service.js';
import { logInteraction } from './interaction-log-service.js';
import logger from '../logger.js';

const contextCache = new Map();

function chatRef(uid) {
  return db.collection('users').doc(uid).collection('chat_sessions');
}

export async function sendMessage(uid, message, screenContext) {
  // Build or retrieve cached coaching context (10 min TTL)
  let cachedCtx = contextCache.get(uid);
  const now = Date.now();
  if (!cachedCtx || now - cachedCtx.timestamp > 10 * 60 * 1000) {
    const ctx = await buildCoachingContext(uid);
    const formatted = formatContextForAI(ctx);
    cachedCtx = { text: formatted, timestamp: now };
    contextCache.set(uid, cachedCtx);
  }

  // Load recent chat history for context
  const historySnap = await chatRef(uid)
    .orderBy('createdAt', 'desc')
    .limit(20)
    .get();

  const history = [];
  historySnap.docs.reverse().forEach(doc => {
    const data = doc.data();
    history.push({ role: 'user', content: data.userMessage });
    if (data.assistantMessage) {
      history.push({ role: 'assistant', content: data.assistantMessage });
    }
  });

  // Add current message
  history.push({ role: 'user', content: message });

  // Get AI response with full coaching context
  const response = await aiChat(history, { screen: screenContext }, cachedCtx.text);

  // Save to Firestore
  const chatDoc = {
    userMessage: message,
    assistantMessage: response,
    screen: screenContext || null,
    createdAt: new Date().toISOString(),
  };

  await chatRef(uid).add(chatDoc);

  logInteraction({
    uid, surface: 'global-chat',
    inputText: message,
    envelope: { reply: response, actions: [{ type: 'answer', text: response }] },
    model: GEMINI_MODEL,
  });

  return {
    message: response,
    timestamp: chatDoc.createdAt,
  };
}

export async function getHistory(uid, limit = 50) {
  const snap = await chatRef(uid)
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .get();

  const messages = [];
  snap.docs.reverse().forEach(doc => {
    const data = doc.data();
    messages.push({
      id: doc.id,
      role: 'user',
      content: data.userMessage,
      timestamp: data.createdAt,
    });
    if (data.assistantMessage) {
      messages.push({
        id: `${doc.id}-response`,
        role: 'assistant',
        content: data.assistantMessage,
        timestamp: data.createdAt,
      });
    }
  });

  return messages;
}

export async function clearHistory(uid) {
  const snap = await chatRef(uid).get();
  const batch = db.batch();
  snap.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();
  logger.info({ uid }, 'Chat history cleared');
  return { cleared: true };
}
