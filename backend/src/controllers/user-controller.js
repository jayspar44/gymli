import { getProfile, createOrUpdateProfile } from '../services/user-service.js';

export async function getUserProfile(req, res) {
  try {
    const profile = await getProfile(req.user.uid);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.json(profile);
  } catch (error) {
    req.log.error(error, 'Failed to get user profile');
    res.status(500).json({ error: 'Failed to get profile' });
  }
}

export async function upsertUserProfile(req, res) {
  try {
    const data = {
      ...req.body,
      email: req.user.email,
      displayName: req.body.displayName || req.user.name || '',
      photoURL: req.body.photoURL || req.user.picture || '',
    };

    const profile = await createOrUpdateProfile(req.user.uid, data);
    res.json(profile);
  } catch (error) {
    req.log.error(error, 'Failed to upsert user profile');
    res.status(500).json({ error: 'Failed to save profile' });
  }
}
