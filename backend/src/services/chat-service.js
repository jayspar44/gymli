import { db } from './firebase.js';
import { chat as aiChat } from './ai-service.js';
import { getProfile } from './user-service.js';
import logger from '../logger.js';

function chatRef(uid) {
  return db.collection('users').doc(uid).collection('chat_sessions');
}

export async function sendMessage(uid, message, screenContext) {
  const profile = await getProfile(uid);

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

  // Build context for AI
  const context = {
    screen: screenContext || 'unknown',
    streak: profile?.streak || 0,
    planName: profile?.activePlanName || 'none',
    lastWorkoutDate: profile?.lastWorkoutDate || 'never',
    experienceLevel: profile?.experienceLevel || 'unknown',
    goals: profile?.goals || 'unknown',
  };

  // Get AI response
  const response = await aiChat(history, context);

  // Save to Firestore
  const chatDoc = {
    userMessage: message,
    assistantMessage: response,
    screen: screenContext || null,
    createdAt: new Date().toISOString(),
  };

  await chatRef(uid).add(chatDoc);

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
