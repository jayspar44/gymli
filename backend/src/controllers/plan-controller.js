import {
  generatePlan,
  getActivePlan,
  getPlan,
  updatePlan,
  listTemplates,
  recommendTemplate,
} from '../services/plan-service.js';
import { getProfile } from '../services/user-service.js';

export async function createPlan(req, res) {
  try {
    const { templateId } = req.body;
    if (!templateId) {
      return res.status(400).json({ error: 'templateId is required' });
    }

    const plan = await generatePlan(req.user.uid, templateId);
    res.json(plan);
  } catch (error) {
    req.log.error(error, 'Failed to generate plan');
    res.status(500).json({ error: error.message || 'Failed to generate plan' });
  }
}

export async function fetchActivePlan(req, res) {
  try {
    const plan = await getActivePlan(req.user.uid);
    if (!plan) {
      return res.status(404).json({ error: 'No active plan' });
    }
    res.json(plan);
  } catch (error) {
    req.log.error(error, 'Failed to get active plan');
    res.status(500).json({ error: 'Failed to get plan' });
  }
}

export async function fetchPlan(req, res) {
  try {
    const plan = await getPlan(req.user.uid, req.params.id);
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    res.json(plan);
  } catch (error) {
    req.log.error(error, 'Failed to get plan');
    res.status(500).json({ error: 'Failed to get plan' });
  }
}

export async function modifyPlan(req, res) {
  try {
    const plan = await updatePlan(req.user.uid, req.params.id, req.body);
    res.json(plan);
  } catch (error) {
    req.log.error(error, 'Failed to update plan');
    res.status(500).json({ error: 'Failed to update plan' });
  }
}

export async function fetchTemplates(req, res) {
  try {
    const templates = listTemplates();
    const profile = await getProfile(req.user.uid);
    const recommended = recommendTemplate(profile);
    res.json({ templates, recommended });
  } catch (error) {
    req.log.error(error, 'Failed to list templates');
    res.status(500).json({ error: 'Failed to list templates' });
  }
}
