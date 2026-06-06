import * as routineService from '../services/routine-service.js';

export async function listRoutines(req, res, next) {
  try { res.json(await routineService.getRoutines(req.user.uid)); }
  catch (err) { next(err); }
}

export async function createRoutine(req, res, next) {
  try { res.status(201).json(await routineService.createRoutine(req.user.uid, req.body)); }
  catch (err) { next(err); }
}

export async function getRoutine(req, res, next) {
  try {
    const r = await routineService.getRoutine(req.user.uid, req.params.id);
    if (!r) return res.status(404).json({ error: 'Routine not found' });
    res.json(r);
  } catch (err) { next(err); }
}

export async function updateRoutine(req, res, next) {
  try { res.json(await routineService.updateRoutine(req.user.uid, req.params.id, req.body)); }
  catch (err) { next(err); }
}

export async function deleteRoutine(req, res, next) {
  try { res.json(await routineService.deleteRoutine(req.user.uid, req.params.id)); }
  catch (err) { next(err); }
}
