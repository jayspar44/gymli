import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
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

// Use a named database when FIRESTORE_DATABASE_ID is set (e.g. 'dev' for the dev
// environment). Leave unset (or empty) to use the default database in production.
const databaseId = process.env.FIRESTORE_DATABASE_ID;
const db = databaseId ? getFirestore(databaseId) : getFirestore();
// Optional fields (e.g. per-exercise notes, kind-specific set fields) are often
// undefined; without this the Admin SDK throws on any undefined value at write time.
db.settings({ ignoreUndefinedProperties: true });
const auth = admin.auth();

export { admin, db, auth };
