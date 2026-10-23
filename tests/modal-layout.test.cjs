const { test } = require('node:test');
const assert = require('node:assert/strict');
const { boot, plain, html } = require('./helpers/counter-app.cjs');

// CSS contracts and DOM-adapter event regressions, not native layout evidence.
// Wheel/touch scrolling and dialog tails still require browser/device verification.
const css = html.match(/<style>([\s\S]*?)<\/style>/)[1];
function declarations(selector) {
  const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
  return rules.filter(([, selectors]) => selectors.split(',').map(s => s.trim()).includes(selector))
    .map(([, , body]) => body).join(';');
}
const saved = () => ({ lang: 'en', counters: [{ id: 'a', name: 'Apples', count: 7, createdAt: 10, updatedAt: 20 }], haptics: false, wake: false, preferencesVersion: 2, undo: [] });

for (const root of ['html', 'body']) test(`CSS contract: ${root} stops background scrolling only for native modal dialogs`, () => {
  assert.match(declarations(`${root}:has(dialog:modal)`), /(?:^|;)\s*overflow\s*:\s*hidden\s*(?:;|$)/);
  assert.doesNotMatch(declarations(root), /(?:^|;)\s*overflow(?:-[xy])?\s*:\s*(?:hidden|clip)/);
  assert.equal(declarations(`${root}:has(dialog[open])`), '', 'Nonmodal dialogs must not lock the dashboard');
});

test('CSS contract: existing bounded dialog bodies and the mobile bottom sheet stay scrollable', () => {
  assert.match(declarations('.dialog-body'), /(?:^|;)overflow:auto(?:;|$)/);
  assert.match(declarations('.dialog-body'), /max-height:calc\(100dvh - 86px\)/);
  assert.match(declarations('dialog'), /max-height:min\(760px,calc\(100dvh - 28px\)\)/);
  assert.match(css, /@media\(max-width:520px\)\{[\s\S]*?dialog\{[^}]*margin:auto 0 0/);
  assert.match(html, /<form class="dialog-body" id="counterForm">[\s\S]*?id="counterSaveButton"[\s\S]*?<\/form>/);
  assert.match(html, /<div class="dialog-body" id="helpBody">[\s\S]*?APP:HELP:END/);
});

test('privacy badge keeps the decorative inline shield and local-only processing copy', () => {
  assert.match(html, /class="privacy-badge"><svg[^>]*aria-hidden="true"><path d="M12 3 5 6v5c0 4\.6 2\.9 8\.1 7 10 4\.1-1\.9 7-5\.4 7-10V6z"\/>/);
  for (const lang of ['ja', 'en']) {
    const initial = saved(); initial.lang = lang;
    assert.equal(boot(initial).translated('localOnly'), lang === 'ja' ? '完全ローカル処理' : 'Fully local processing');
  }
  assert.match(html, /connect-src 'none'/);
});

test('Help omits implementation commentary and retains user instructions', () => {
  assert.doesNotMatch(html, /data-help-lang="ja"[^>]*>[\s\S]*?ダイアログ内をスクロール[\s\S]*?背景のページは動きません/);
  assert.doesNotMatch(html, /data-help-lang="en"[^>]*>[\s\S]*?Scroll inside the dialog[\s\S]*?background page stays still/);
});

for (const [dialog, open] of [
  ['helpDialog', app => app.el('helpButton').dispatch('click')],
  ['settingsDialog', app => app.el('settingsButton').dispatch('click')],
  ['counterDialog', app => app.el('addButton').dispatch('click')],
  ['actionDialog', app => app.openActions('a')],
]) test(`dialog events: ${dialog} reopens and dismisses without changing counters or device preferences`, () => {
  const initial = saved(), app = boot(initial);
  for (const close of [
    () => app.document.querySelectorAll('[data-close-dialog]').find(el => el.dataset.closeDialog === dialog).dispatch('click'),
    () => app.el(dialog).dispatch('cancel'),
    () => app.el(dialog).dispatch('click', { clientX: -1, clientY: -1 }),
  ]) {
    open(app); assert.equal(app.el(dialog).open, true);
    close(); assert.equal(app.el(dialog).open, false);
    assert.deepEqual(plain(app.state.counters), initial.counters);
    assert.deepEqual(plain(app.state.undo), []);
    assert.equal(app.state.wake, false); assert.equal(app.state.haptics, false);
    assert.equal(app.document.body.style.overflow, undefined, 'Modal lifecycle must not overwrite Focus inline styles');
  }
});

test('dialog events: menu-to-confirmation cancellation preserves state through every dismissal', async () => {
  const initial = saved(), app = boot(initial);
  for (const close of [
    () => app.el('appConfirmCancel').dispatch('click'),
    () => app.el('appConfirmClose').dispatch('click'),
    () => app.el('appConfirmDialog').dispatch('cancel'),
    () => app.el('appConfirmDialog').dispatch('click', { clientX: -1, clientY: -1 }),
  ]) {
    app.openActions('a');
    const reset = app.resetCounter('a');
    assert.equal(app.el('actionDialog').open, false); assert.equal(app.el('appConfirmDialog').open, true);
    close(); await reset;
    assert.equal(app.el('appConfirmDialog').open, false);
    assert.deepEqual(app.stored(), initial);
  }
});

test('dialog events: closing a modal preserves the existing Focus body lock until Focus exits', () => {
  const app = boot(saved()); app.openFocus('a');
  assert.equal(app.document.body.style.overflow, 'hidden');
  app.el('helpButton').dispatch('click'); app.el('helpDialog').dispatch('cancel');
  assert.equal(app.document.body.style.overflow, 'hidden');
  app.closeFocus(); assert.equal(app.document.body.style.overflow, '');
  assert.equal(app.state.wake, false); assert.equal(app.state.haptics, false);
});

function phoneCss(css, width) {
  const marker = `@media(max-width:${width}px)`;
  const start = css.indexOf(marker);
  assert.ok(start >= 0, `Existing phone breakpoint must remain: ${width}px`);
  const opening = css.indexOf('{', start);
  let depth = 1;
  for (let end = opening + 1; end < css.length; end++) {
    if (css[end] === '{') depth++;
    if (css[end] === '}' && --depth === 0) return css.slice(opening + 1, end);
  }
  assert.fail('Unclosed phone breakpoint');
}

test('phone layouts hide only the informational footer at the compact breakpoint', () => {
  assert.match(phoneCss(css, 520), /(?:^|})footer\{[^}]*display:none(?:;|})/);
  assert.doesNotMatch(phoneCss(css, 760), /(?:^|})footer\{[^}]*display:none/);
  assert.doesNotMatch(css.slice(0, css.indexOf('@media')), /(?:^|})footer\{[^}]*display:none/);
  assert.doesNotMatch(html.match(/<footer\b[^>]*>[\s\S]*?<\/footer>/)[0], /<(?:button|input|select)\b/);
});
