import { db } from './firebase.js';
import { getTemplate, listTemplates, recommendTemplate } from './plan-templates.js';
import { generatePlan as aiGeneratePlan } from './ai-service.js';
import { getProfile } from './user-service.js';

function plansRef(uid) {
  return db.collection('users').doc(uid).collection('plans');
}

export async function generatePlan(uid, templateId) {
  const template = getTemplate(templateId);
  if (!template) {
    throw new Error(`Template "${templateId}" not found`);
  }

  const profile = await getProfile(uid);
  const aiResult = await aiGeneratePlan(template, profile || {});

  const plan = {
    templateId,
    templateName: template.name,
    days: template.days,
    daysPerWeek: template.daysPerWeek,
    weeklySchedule: aiResult.weeklySchedule || null,
    gimliMessage: aiResult.gimliMessage || `A fine choice, warrior! The ${template.name} will forge you into iron!`,
    adjustments: aiResult.adjustments || [],
    customized: aiResult.customized || false,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Deactivate existing active plans
  const existing = await plansRef(uid).where('active', '==', true).get();
  const batch = db.batch();
  existing.docs.forEach(doc => {
    batch.update(doc.ref, { active: false, updatedAt: new Date().toISOString() });
  });

  // Create new plan
  const newRef = plansRef(uid).doc();
  batch.set(newRef, plan);
  await batch.commit();

  return { id: newRef.id, ...plan };
}

export async function getActivePlan(uid) {
  const snapshot = await plansRef(uid).where('active', '==', true).limit(1).get();
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
}

export async function getPlan(uid, planId) {
  const doc = await plansRef(uid).doc(planId).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

export async function updatePlan(uid, planId, data) {
  await plansRef(uid).doc(planId).update({
    ...data,
    updatedAt: new Date().toISOString(),
  });
  return getPlan(uid, planId);
}

export { listTemplates, recommendTemplate };
