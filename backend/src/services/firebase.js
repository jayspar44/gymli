import admin from 'firebase-admin';
import logger from '../logger.js';

let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } catch {
    logger.error('Failed to parse FIREBASE_SERVICE_ACCOUNT - check env var format');
    process.exit(1);
  }
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: serviceAccount
      ? admin.credential.cert(serviceAccount)
      : admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();
const auth = admin.auth();

export { admin, db, auth };
