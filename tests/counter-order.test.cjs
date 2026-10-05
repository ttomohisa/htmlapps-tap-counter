const { test } = require('node:test');
const assert = require('node:assert/strict');
const { boot, plain } = require('./helpers/counter-app.cjs');
const counters = () => [
  { id: 'a', name: 'Apples', count: 7, createdAt: 10, updatedAt: 20 },
  { id: 'b', name: 'Pears', count: -2, createdAt: 30, updatedAt: 40 },
  { id: 'c', name: 'Oranges', count: 0, createdAt: 50, updatedAt: 60 },
];
const saved = (items = counters(), lang = 'en') => ({ lang, counters: items, haptics: false, wake: false, preferencesVersion: 2, undo: [] });
const ids = app => plain(app.state.counters.map(c => c.id));
const cardIds = app => app.cards().map(c => c.dataset.id);

for (const [id, direction, expected] of [
  ['a', 1, ['b','a','c']], ['b', -1, ['b','a','c']],
  ['b', 1, ['a','c','b']], ['c', -1, ['a','c','b']],
]) test(`move ${id} ${direction} swaps just its neighbor and preserves all fields`, () => {
  const before = counters(), app = boot(saved());
  app.move(id, direction);
  assert.deepEqual(ids(app), expected);
  assert.deepEqual(cardIds(app), expected);
  for (const c of app.state.counters) assert.deepEqual(plain(c), before.find(item => item.id === c.id));
  assert.deepEqual(plain(app.state.undo), [before]);
  assert.equal(Number(app.el('totalCount').textContent), 5);
  assert.deepEqual(app.stored().counters, plain(app.state.counters));
  assert.deepEqual(ids(boot(app.stored())), expected);
  const lines = app.summaryText().split('\n');
  assert.deepEqual(lines.slice(2, 5), expected.map(id => { const c = before.find(c => c.id === id); return `${c.name}: ${c.count}`; }));
  app.undo(); assert.deepEqual(plain(app.state.counters), before); assert.equal(app.state.undo.length, 0);
});

test('first, middle, last, and single-counter menu boundaries use native disabled buttons', () => {
  const app = boot(saved());
  for (const [id, up, down] of [['a', true, false], ['b', false, false], ['c', false, true]]) {
    app.openActions(id);
    assert.equal(app.el('moveUpAction')?.disabled, up);
    assert.equal(app.el('moveDownAction')?.disabled, down);
  }
  const single = boot(saved([counters()[0]])); single.openActions('a');
  assert.equal(single.el('moveUpAction')?.disabled, true); assert.equal(single.el('moveDownAction')?.disabled, true);
});

test('invalid IDs, directions, boundaries, and one-counter moves preserve history and storage', () => {
  const initial = saved(); initial.undo = [counters().slice(0, 2)];
  const app = boot(initial); assert.equal(typeof app.moveCounter, 'function');
  for (const [id, direction] of [['a', -1], ['c', 1], ['missing', 1], ['a', 0], ['a', 2], ['a', '1']]) app.moveCounter(id, direction);
  assert.deepEqual(plain(app.state.counters), initial.counters); assert.deepEqual(plain(app.state.undo), initial.undo);
  assert.deepEqual(app.stored(), initial);
  const singleInitial = saved([counters()[0]]), single = boot(singleInitial);
  single.moveCounter('a', -1); single.moveCounter('a', 1); assert.deepEqual(single.stored(), singleInitial);
});

test('move closes the menu, focuses the same ID after rendering, announces position, and never increments', () => {
  const app = boot(saved()); app.clickCard('b', 'menu');
  assert.equal(app.el('actionDialog').open, true);
  app.el('moveDownAction')?.dispatch('click'); app.flushTimers();
  assert.deepEqual(ids(app), ['a','c','b']); assert.equal(app.el('actionDialog').open, false);
  const menu = app.cards().find(c => c.dataset.id === 'b').querySelector('[data-action="menu"]');
  assert.equal(app.document.activeElement, menu);
  assert.deepEqual(plain(app.state.counters.map(c => c.count)), [7,0,-2]);
  assert.equal(app.el('appLive').textContent, 'Pears: position 3 of 3');
  app.clickCard('b', 'menu'); assert.equal(app.el('moveDownAction').disabled, true);
  assert.equal(app.state.undo.length, 1);
});

test('move announcements resolve current position after immediate Undo and subsequent moves', () => {
  const app = boot(saved()); app.move('b', 1); app.undo(); app.flushTimers();
  assert.equal(app.el('appLive').textContent, 'Pears: position 2 of 3');
  app.move('b', -1); app.move('b', 1); app.move('b', 1); app.flushTimers();
  assert.deepEqual(ids(app), ['a','c','b']); assert.equal(app.state.undo.length, 3);
  assert.equal(app.el('appLive').textContent, 'Pears: position 3 of 3');
  app.undo(); app.undo(); app.undo(); assert.deepEqual(ids(app), ['a','b','c']);
});

test('reorder interleaves with edits, count changes, and confirmed deletion as one Undo each', async () => {
  const app = boot(saved()), snapshots = [plain(app.state.counters)];
  app.move('b', 1); snapshots.push(plain(app.state.counters));
  app.edit('b', 'Edited pears', '17'); snapshots.push(plain(app.state.counters));
  app.clickCard('b', 'decrement'); snapshots.push(plain(app.state.counters));
  app.move('b', -1); snapshots.push(plain(app.state.counters));
  const deletion = app.deleteCounter('a'); app.el('appConfirmOk').dispatch('click'); await deletion;
  assert.deepEqual(ids(app), ['b','c']); assert.equal(app.state.undo.length, 5);
  for (const snapshot of snapshots.reverse()) { app.undo(); assert.deepEqual(plain(app.state.counters), snapshot); }
  assert.equal(app.state.undo.length, 0);
});

for (const lang of ['en', 'ja']) test(`default identity remains Counter 1 after moving, reload, editing and language switch (${lang})`, () => {
  const initial = saved([{ id: 'default', name: '', count: 0, createdAt: 1, updatedAt: 2 }, ...counters()], lang);
  const app = boot(initial), name = lang === 'ja' ? 'カウンター 1' : 'Counter 1';
  app.move('default', 1); app.move('default', 1); app.flushTimers();
  assert.equal(app.state.counters[2].name, ''); assert.equal(app.state.counters[2].updatedAt, 2);
  assert.match(app.summaryText(), new RegExp(`${name}: 0`));
  app.openActions('default'); assert.equal(app.el('actionDialogTitle').textContent, name);
  app.openCounterDialog('default'); assert.equal(app.el('counterName').value, name); app.submit();
  assert.equal(app.state.undo.length, 2); assert.equal(app.state.counters[2].name, '');
  const restored = boot(app.stored()); restored.openCounterDialog('default'); assert.equal(restored.el('counterName').value, name); restored.cancel();
  restored.el('languageButton').dispatch('click'); restored.openFocus('default');
  assert.equal(restored.el('focusName').textContent, lang === 'ja' ? 'Counter 1' : 'カウンター 1');
  assert.equal(restored.state.counters[2].name, '');
  app.undo(); app.undo(); assert.deepEqual(plain(app.state.counters), initial.counters);
});

test('custom names including the default ID remain unchanged; Japanese move copy is localized', () => {
  const initial = saved([{ ...counters()[0], id: 'default', name: '私のカウンター' }, ...counters().slice(1)], 'ja');
  const app = boot(initial); app.move('default', 1); app.flushTimers();
  assert.equal(app.state.counters[1].name, '私のカウンター');
  assert.equal(app.el('appLive').textContent, '私のカウンター: 3個中2番目');
  assert.equal(app.translated('moveUp'), '上へ移動');
  assert.equal(app.translated('moveDown'), '下へ移動');
});

test('storage failure leaves reordering and Undo usable in memory', () => {
  const app = boot(saved(), { storageFails: true }); app.move('b', -1);
  assert.deepEqual(ids(app), ['b','a','c']); assert.equal(app.state.undo.length, 1);
  app.undo(); assert.deepEqual(plain(app.state.counters), counters());
});

test('moving never changes the active Focus ID, current value, or Lock behavior', () => {
  const app = boot(saved()); app.move('b', -1); app.openFocus('b');
  assert.equal(app.state.focusId, 'b'); assert.equal(Number(app.el('focusCount').textContent), -2);
  app.el('focusLock').dispatch('click'); app.el('focusTap').dispatch('click'); app.el('focusMinus').dispatch('click');
  assert.equal(app.state.counters[0].count, -2); assert.equal(app.state.undo.length, 1);
  app.closeFocus(); assert.deepEqual(cardIds(app), ['b','a','c']); app.undo(); assert.deepEqual(ids(app), ['a','b','c']);
});
