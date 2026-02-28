import { getDailyTip } from '../services/tip-service.js';

export async function fetchDailyTip(req, res) {
  try {
    const tip = await getDailyTip(req.user.uid);
    res.json({ tip });
  } catch (err) {
    req.log.error(err, 'Failed to fetch daily tip');
    res.status(500).json({ error: 'Failed to fetch tip' });
  }
}
