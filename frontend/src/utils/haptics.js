import { Capacitor } from '@capacitor/core';

let HapticsModule = null;

async function getHaptics() {
  if (HapticsModule) return HapticsModule;
  if (!Capacitor.isNativePlatform()) return null;
  try {
    const mod = await import('@capacitor/haptics');
    HapticsModule = mod.Haptics;
    return HapticsModule;
  } catch {
    return null;
  }
}

export async function impactLight() {
  const h = await getHaptics();
  h?.impact({ style: 'LIGHT' });
}

export async function impactMedium() {
  const h = await getHaptics();
  h?.impact({ style: 'MEDIUM' });
}

export async function notifySuccess() {
  const h = await getHaptics();
  h?.notification({ type: 'SUCCESS' });
}

export async function notifyWarning() {
  const h = await getHaptics();
  h?.notification({ type: 'WARNING' });
}
