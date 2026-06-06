import { handleParse } from '../services/log-parse-service.js';

export async function parseLogEntry(req, res, next) {
  try {
    const { text, session, units, sessionId } = req.body || {};
    if (!text || !String(text).trim()) return res.status(400).json({ error: 'text is required' });
    const envelope = await handleParse(req.user.uid, { text, session, units, sessionId });
    res.json(envelope);
  } catch (err) { next(err); }
}
