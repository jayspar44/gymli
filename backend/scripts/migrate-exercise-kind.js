import { db } from '../src/services/firebase.js';

async function migrate() {
  const snap = await db.collection('exercises').get();
  const batch = db.batch();
  let n = 0;
  snap.docs.forEach(doc => {
    const d = doc.data();
    const patch = {};
    if (!d.kind) patch.kind = 'weighted';
    if (!d.aliases) patch.aliases = [];
    if (Object.keys(patch).length) { batch.update(doc.ref, patch); n++; }
  });
  await batch.commit();
  console.log(`Backfilled ${n} exercises`);
  process.exit(0);
}
migrate();
