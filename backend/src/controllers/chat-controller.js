import { sendMessage, getHistory, clearHistory } from '../services/chat-service.js';

export async function chat(req, res) {
  const { message, context } = req.body;

  if (!message?.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const result = await sendMessage(req.user.uid, message.trim(), context?.screen);
  res.json(result);
}

export async function fetchChatHistory(req, res) {
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);
  const messages = await getHistory(req.user.uid, limit);
  res.json({ messages });
}

export async function deleteChatHistory(req, res) {
  const result = await clearHistory(req.user.uid);
  res.json(result);
}
