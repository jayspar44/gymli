import { createServices } from './services';

function fakeClient() {
  const calls: any[] = [];
  return {
    calls,
    get: (url: string, cfg?: any) => { calls.push(['get', url, cfg]); return Promise.resolve({ data: { ok: url } }); },
    post: (url: string, body?: any) => { calls.push(['post', url, body]); return Promise.resolve({ data: { ok: url } }); },
    put: (url: string, body?: any) => { calls.push(['put', url, body]); return Promise.resolve({ data: { ok: url } }); },
    delete: (url: string) => { calls.push(['delete', url]); return Promise.resolve({ data: { ok: url } }); },
  } as any;
}

test("getTodaysWorkout hits /workouts/today and unwraps data", async () => {
  const c = fakeClient();
  const s = createServices(c);
  const r = await s.getTodaysWorkout();
  expect(c.calls[0]).toEqual(['get', '/workouts/today', undefined]);
  expect(r).toEqual({ ok: '/workouts/today' });
});

test("getRoutines hits /routines", async () => {
  const c = fakeClient();
  await createServices(c).getRoutines();
  expect(c.calls[0]).toEqual(['get', '/routines', undefined]);
});

test("parseLog posts to /log/parse with the payload", async () => {
  const c = fakeClient();
  const s = createServices(c);
  await s.parseLog({ text: 'bench 3x5' });
  expect(c.calls[0]).toEqual(['post', '/log/parse', { text: 'bench 3x5' }]);
});
