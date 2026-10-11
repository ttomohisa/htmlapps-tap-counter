const { test } = require('node:test');
const assert = require('node:assert/strict');
const { boot, plain } = require('./helpers/counter-app.cjs');
const saved = () => ({ lang: 'en', counters: [
  { id: 'a', name: 'Apples', count: 0, createdAt: 10, updatedAt: 20 },
  { id: 'b', name: 'Pears', count: 5, createdAt: 30, updatedAt: 40 },
], haptics: false, wake: false, preferencesVersion: 2, undo: [] });
const launcher = (app, id = 'a') => app.cards().find(card => card.dataset.id === id)?.querySelector('[data-action="focus"]');
const escape = app => app.document.dispatch('keydown', { key: 'Escape', target: app.document.activeElement });

for (const close of [escape, app => app.el('focusExit').dispatch('click')]) test(`Focus ${close === escape ? 'Escape' : 'Exit'} restores the current same-counter launcher after +1, minus and Undo`, () => {
  const app = boot(saved()), original = launcher(app); original.focus(); app.clickCard('a', 'focus');
  app.el('focusTap').dispatch('click'); app.el('focusMinus').dispatch('click'); app.el('focusUndo').dispatch('click');
  const before = plain(app.state.counters), history = plain(app.state.undo);
  close(app);
  assert.equal(app.state.focusId, null); assert.equal(app.state.counters[0].count, 1);
  assert.notEqual(launcher(app), original); assert.equal(original.isConnected, false);
  assert.equal(app.document.activeElement, launcher(app)); assert.equal(launcher(app).focusOptions, undefined, 'Reveal the legitimate dashboard target with ordinary focus');
  assert.deepEqual(plain(app.state.counters), before); assert.deepEqual(plain(app.state.undo), history);
  assert.equal(app.state.wake, false); assert.equal(app.state.haptics, false);
});

test('repeated Focus exits follow the owning counter through rerenders', () => {
  const app = boot(saved());
  for (const id of ['b', 'a', 'b']) {
    launcher(app, id).focus(); app.clickCard(id, 'focus'); escape(app);
    assert.equal(app.document.activeElement, launcher(app, id));
  }
});

test('Undo removing the focused counter returns to the visible Add fallback without extra mutation', () => {
  const app = boot(saved()); app.openCounterDialog(); app.el('counterName').value = 'New'; app.submit();
  const id = app.state.counters.at(-1).id; app.openFocus(id); app.undo();
  assert.equal(app.state.focusId, null); assert.equal(app.document.activeElement, app.el('addButton'));
  assert.deepEqual(plain(app.state.counters), saved().counters); assert.deepEqual(plain(app.state.undo), []);
});

for (const unavailable of ['disabled', 'hidden', 'inert', 'disconnected', 'display', 'visibility']) test(`an unavailable ${unavailable} launcher uses the safe Add fallback`, () => {
  const app = boot(saved()); app.openFocus('a');
  const grid = app.el('counterGrid'), append = grid.append.bind(grid);
  grid.append = card => {
    append(card); const target = card.querySelector('[data-action="focus"]'); if (!target) return;
    if (unavailable === 'disconnected') target.isConnected = false;
    else if (unavailable === 'display') target.style.display = 'none';
    else if (unavailable === 'visibility') target.style.visibility = 'hidden';
    else target[unavailable] = true;
  };
  app.closeFocus(); assert.equal(app.document.activeElement, app.el('addButton'));
});

test('a removed launcher never focuses a disabled or hidden fallback', () => {
  for (const unavailable of ['disabled', 'hidden', 'inert', 'isConnected']) {
    const app = boot(saved()); app.openFocus('a'); app.state.counters = [];
    app.el('addButton')[unavailable] = unavailable === 'isConnected' ? false : true;
    app.closeFocus(); assert.notEqual(app.document.activeElement, app.el('addButton'));
  }
});

test('closing Focus does not steal focus from a newer dashboard owner', () => {
  const app = boot(saved()); app.openFocus('a'); app.el('languageButton').focus(); app.closeFocus();
  assert.equal(app.document.activeElement, app.el('languageButton'));
});

test('closing Focus leaves an active modal owner untouched', () => {
  const app = boot(saved()); app.openFocus('a'); app.el('helpButton').dispatch('click'); app.el('helpClose').focus();
  app.closeFocus(); assert.equal(app.el('helpDialog').open, true); assert.equal(app.document.activeElement, app.el('helpClose'));
});

test('an active modal owns Escape rather than the underlying Focus keyboard handler', () => {
  const app = boot(saved()); app.openFocus('a'); app.el('helpButton').dispatch('click'); app.el('helpClose').focus();
  const event = escape(app); assert.equal(app.state.focusId, 'a'); assert.equal(event.defaultPrevented, undefined);
});

test('a queued Focus-entry callback cannot steal focus after exit or from a newer owner', () => {
  const app = boot(saved(), { deferFrames: true }); launcher(app).focus(); app.openFocus('a');
  app.el('focusExit').focus(); app.closeFocus(); const target = app.document.activeElement;
  app.flushFrames(); assert.equal(app.document.activeElement, target); assert.equal(target, launcher(app));
  app.openFocus('a'); app.el('languageButton').focus(); app.flushFrames();
  assert.equal(app.document.activeElement, app.el('languageButton'));
  app.openFocus('a'); app.el('helpButton').dispatch('click'); app.el('helpClose').focus(); app.flushFrames();
  assert.equal(app.document.activeElement, app.el('helpClose'));
});

test('an old queued entry cannot override the latest Focus session', () => {
  const app = boot(saved(), { deferFrames: true }); launcher(app, 'a').focus(); app.openFocus('a');
  app.el('focusExit').focus(); app.closeFocus(); launcher(app, 'b').focus(); app.openFocus('b');
  app.flushFrames(); assert.equal(app.state.focusId, 'b'); assert.equal(app.document.activeElement, app.el('focusTap'));
  app.closeFocus(); assert.equal(app.document.activeElement, launcher(app, 'b'));
});

test('a close before the entry frame returns to the freshly rendered launcher', () => {
  const app = boot(saved(), { deferFrames: true }); launcher(app).focus(); app.openFocus('a');
  app.closeFocus(); const target = launcher(app); assert.ok(app.document.activeElement === target);
  app.flushFrames(); assert.ok(app.document.activeElement === target);
});

test('a newer focus acquired during dashboard rendering is not replaced', () => {
  const app = boot(saved()); app.openFocus('a');
  const grid = app.el('counterGrid'), append = grid.append.bind(grid);
  grid.append = card => { append(card); app.el('languageButton').focus(); };
  app.closeFocus(); assert.ok(app.document.activeElement === app.el('languageButton'));
});

test('Lock and repeated close preserve counter state and newer focus', () => {
  const app = boot(saved()); app.openFocus('b'); app.el('focusLock').dispatch('click');
  const before = plain(app.state.counters); app.el('focusTap').dispatch('click'); app.el('focusMinus').dispatch('click');
  app.closeFocus(); assert.ok(app.document.activeElement === launcher(app, 'b')); assert.equal(app.state.focusLocked, false);
  app.el('languageButton').focus(); app.closeFocus(); assert.ok(app.document.activeElement === app.el('languageButton'));
  assert.deepEqual(plain(app.state.counters), before); assert.deepEqual(plain(app.state.undo), []);
});

test('Help describes returning keyboard focus in both languages', () => {
  const { html } = require('./helpers/counter-app.cjs');
  assert.ok(html.includes('終了すると、開いたカウンターの「集中」ボタンにキーボードフォーカスが戻ります。'));
  assert.ok(html.includes('Closing Focus returns keyboard focus to that counter’s Focus button.'));
});
