const { test } = require('node:test');
const assert = require('node:assert/strict');
const { boot, plain } = require('./helpers/counter-app.cjs');
const initial = () => ({ lang: 'en', counters: [{ id: 'a', name: 'Apples', count: 0, createdAt: 10, updatedAt: 20 }], haptics: false, wake: false, preferencesVersion: 2,
  undo: [[{ id: 'a', name: 'Apples', count: 1, createdAt: 10, updatedAt: 15 }]] });

for (const storageFails of [false, true]) test(`reset at zero consumes no Undo and preserves timestamps (storageFails=${storageFails})`, async () => {
  const before = initial(), app = boot(before, { storageFails }); app.openActions('a');
  const reset = app.resetCounter('a');
  // Resolve the old unnecessary confirmation too, so the regression fails on the actual mutation.
  if (app.el('appConfirmDialog').open) app.el('appConfirmOk').dispatch('click');
  await reset;
  assert.deepEqual(plain(app.state.counters), before.counters);
  assert.deepEqual(plain(app.state.undo), before.undo); assert.deepEqual(app.stored(), before);
  assert.equal(app.el('actionDialog').open, false); app.undo(); assert.equal(app.state.counters[0].count, 1);
});

test('repeated zero reset skips confirmation and does not create an Undo button', async () => {
  const before = initial(); before.undo = []; const app = boot(before);
  for (let i = 0; i < 3; i++) { const reset = app.resetCounter('a'); assert.equal(app.el('appConfirmDialog').open, false); await reset; }
  assert.equal(app.el('undoButton').disabled, true); assert.deepEqual(app.stored(), before);
});

for (const count of [7, -4]) test(`nonzero reset ${count} still requires confirmation and creates exactly one Undo`, async () => {
  const before = initial(); before.counters[0].count = count; const app = boot(before);
  const reset = app.resetCounter('a'); assert.equal(app.el('appConfirmDialog').open, true);
  assert.equal(app.state.counters[0].count, count); assert.equal(app.state.undo.length, 1);
  app.el('appConfirmOk').dispatch('click'); await reset;
  assert.equal(app.state.counters[0].count, 0); assert.equal(app.state.undo.length, 2);
  assert.ok(app.state.counters[0].updatedAt > 20); app.undo(); assert.deepEqual(plain(app.state.counters), before.counters);
});

for (const cancellation of ['cancel', 'escape', 'close']) test(`canceling a real reset via ${cancellation} changes no counter, storage, or history`, async () => {
  const before = initial(); before.counters[0].count = 7; const app = boot(before);
  const reset = app.resetCounter('a');
  if (cancellation === 'escape') app.el('appConfirmDialog').dispatch('cancel');
  else app.el(cancellation === 'close' ? 'appConfirmClose' : 'appConfirmCancel').dispatch('click');
  await reset; assert.deepEqual(plain(app.state.counters), before.counters); assert.deepEqual(plain(app.state.undo), before.undo); assert.deepEqual(app.stored(), before);
});
