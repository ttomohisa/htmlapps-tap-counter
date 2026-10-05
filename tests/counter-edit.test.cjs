const { test } = require('node:test');
const assert = require('node:assert/strict');
const { boot, plain } = require('./helpers/counter-app.cjs');
const counters = () => [{ id: 'a', name: 'Apples', count: 7, createdAt: 10, updatedAt: 20 }, { id: 'b', name: 'Pears', count: -2, createdAt: 30, updatedAt: 40 }];
const saved = (items = counters()) => ({ lang: 'en', counters: items, haptics: false, wake: false, preferencesVersion: 2, undo: [] });

test('Edit opens with the current value and edit-specific accessible label', () => {
  const app = boot(saved()); app.openCounterDialog('b');
  assert.equal(app.el('initialCountField').hidden, false);
  assert.equal(String(app.el('initialCount').value), '-2');
  assert.equal(app.el('initialCount').required, true);
  assert.equal(app.el('counterDialogTitle').textContent, 'Edit counter');
  assert.equal(app.el('counterValueLabel').textContent, 'Current value');
});

test('value-only edit refreshes totals, summary, persistence, announcement, and one Undo', () => {
  const original = counters(), app = boot(saved()); app.edit('a', 'Apples', '42'); app.flushTimers();
  assert.equal(app.state.counters[0].count, 42); assert.equal(app.state.counters[0].name, 'Apples');
  assert.equal(app.state.counters[0].id, 'a'); assert.equal(app.state.counters[0].createdAt, 10);
  assert.ok(app.state.counters[0].updatedAt > 20); assert.deepEqual(plain(app.state.counters[1]), original[1]);
  assert.equal(app.state.undo.length, 1); assert.equal(Number(app.el('totalCount').textContent), 40);
  assert.match(app.summaryText(), /Apples: 42[\s\S]*Pears: -2[\s\S]*Total: 40/);
  assert.equal(app.el('appLive').textContent, 'Apples: 42');
  assert.equal(app.stored().counters[0].count, 42); assert.equal(app.stored().undo.length, 1);
  assert.deepEqual(plain(boot(app.stored()).state.counters), plain(app.state.counters));
  app.undo(); assert.deepEqual(plain(app.state.counters), original); assert.equal(app.state.undo.length, 0);
});

test('name-only and combined edits are restored together by one Undo', () => {
  for (const [name, count] of [['Oranges', '7'], ['Oranges', '-15']]) {
    const app = boot(saved()); app.edit('a', name, count);
    assert.equal(app.state.counters[0].name, name); assert.equal(app.state.counters[0].count, Number(count));
    assert.equal(app.state.undo.length, 1); app.undo(); assert.deepEqual(plain(app.state.counters), counters());
  }
});

for (const value of ['-999999', '0', '999999']) test(`edit accepts integer boundary/value ${value}`, () => {
  const app = boot(saved()); app.edit('a', 'Apples', value);
  assert.equal(app.state.counters[0].count, Number(value)); assert.equal(app.state.undo.length, 1);
});

for (const value of ['', ' ', '1.5', '-1.5', '1000000', '-1000000', 'abc', 'Infinity', 'NaN']) test(`invalid edit ${JSON.stringify(value)} changes no state or history`, () => {
  const app = boot(saved()), before = app.stored(); app.edit('a', 'Changed name', value);
  assert.deepEqual(plain(app.state.counters), counters()); assert.equal(app.state.undo.length, 0);
  assert.deepEqual(app.stored(), before); assert.equal(app.el('counterDialog').open, true);
  assert.match(app.el('toast').textContent, /whole number.*-999999.*999999/);
});

test('blank name rejects an otherwise valid value atomically', () => {
  const app = boot(saved()); app.edit('a', '  ', '90');
  assert.deepEqual(plain(app.state.counters), counters()); assert.equal(app.state.undo.length, 0);
  assert.equal(app.el('counterDialog').open, true);
});

test('unchanged save preserves timestamps and existing history, including implicit default names', () => {
  for (const items of [counters(), [{ id: 'a', name: '', count: 7, createdAt: 10, updatedAt: 20 }]]) {
    const initial = saved(items); initial.undo = [[{ ...items[0], count: 6 }]];
    const app = boot(initial); app.edit('a', items[0].name || 'Counter 1', '7');
    assert.deepEqual(plain(app.state.counters), items); assert.deepEqual(plain(app.state.undo), initial.undo);
    assert.equal(app.el('counterDialog').open, false); assert.deepEqual(app.stored(), initial);
  }
});

test('Cancel, Escape, and reopening discard draft values without adding Undo', () => {
  for (const cancel of [app => app.cancel(), app => app.el('counterDialog').dispatch('cancel')]) {
    const app = boot(saved()); app.openCounterDialog('a'); app.el('counterName').value = 'Draft'; app.el('initialCount').value = '90';
    cancel(app); assert.equal(app.el('counterDialog').open, false);
    assert.deepEqual(plain(app.state.counters), counters()); assert.equal(app.state.undo.length, 0);
    app.openCounterDialog('a'); assert.equal(app.el('counterName').value, 'Apples'); assert.equal(String(app.el('initialCount').value), '7');
  }
});

test('Add still starts at zero with its existing label and accepts a starting count', () => {
  const app = boot(saved()); app.openCounterDialog('a'); app.cancel(); app.openCounterDialog();
  assert.equal(app.el('counterDialogTitle').textContent, 'Add counter'); assert.equal(String(app.el('initialCount').value), '0');
  assert.equal(app.el('initialCount').required, false); assert.equal(app.el('counterValueLabel').textContent, 'Starting value');
  app.el('counterName').value = 'New'; app.el('initialCount').value = '-3'; app.submit();
  assert.equal(app.state.counters[2].count, -3); assert.equal(app.state.undo.length, 1);
  app.undo(); assert.deepEqual(plain(app.state.counters), counters());
});

test('Japanese edit copy and validation stay localized', () => {
  const initial = saved(); initial.lang = 'ja'; const app = boot(initial); app.openCounterDialog('a');
  assert.equal(app.el('counterDialogTitle').textContent, 'カウンターを編集');
  assert.equal(app.el('counterValueLabel').textContent, '現在値');
  app.el('initialCount').value = ''; app.submit(); assert.match(app.el('toast').textContent, /整数/);
});

test('storage failure leaves editing and Undo usable for this session', () => {
  const app = boot(saved(), { storageFails: true }); app.edit('a', 'Edited', '15');
  assert.equal(app.state.counters[0].count, 15); assert.equal(app.state.undo.length, 1);
  assert.equal(app.el('counterDialog').open, false); app.undo(); assert.deepEqual(plain(app.state.counters), counters());
});

test('Focus starts with the edited value; Lock, decrement, and Undo preserve their behavior', () => {
  const app = boot(saved()); app.edit('a', 'Edited', '15'); app.openFocus('a');
  assert.equal(Number(app.el('focusCount').textContent), 15); assert.equal(app.el('focusName').textContent, 'Edited');
  app.el('focusLock').dispatch('click'); app.el('focusTap').dispatch('click'); app.el('focusMinus').dispatch('click');
  assert.equal(app.state.counters[0].count, 15); assert.equal(app.state.undo.length, 1);
  app.el('focusLock').dispatch('click'); app.el('focusMinus').dispatch('click'); assert.equal(app.state.counters[0].count, 14);
  app.el('focusUndo').dispatch('click'); assert.equal(app.state.counters[0].count, 15);
  app.closeFocus(); app.undo(); assert.deepEqual(plain(app.state.counters), counters());
});

test('an immediate Undo announces the restored value instead of the discarded edit', () => {
  const app = boot(saved()); app.edit('a', 'Edited', '42'); app.undo(); app.flushTimers();
  assert.equal(app.el('appLive').textContent, 'Apples: 7');
  assert.equal(app.el('focusLive').textContent, 'Apples: 7');
});

test('a pending edit announcement is skipped if Undo removes the added counter', () => {
  const app = boot(saved()); app.openCounterDialog(); app.el('counterName').value = 'New'; app.submit();
  const id = app.state.counters[2].id; app.edit(id, 'Edited new', '42'); app.undo(); app.undo(); app.flushTimers();
  assert.deepEqual(plain(app.state.counters), counters()); assert.equal(app.el('appLive').textContent, '');
});
