// Dependency-free behavioral tests run the real inline application in a small DOM adapter.
// Native dialog/number-input behavior and layout still need browser/device verification.
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const vm = require('node:vm');
let html = readFileSync(process.env.TAP_COUNTER_HTML || resolve(__dirname, '../../src/index.template.html'), 'utf8');
const payload = html.match(/const b='([A-Za-z0-9+/=]+)'/);
if (payload) html = require('node:zlib').gunzipSync(Buffer.from(payload[1], 'base64')).toString('utf8');
const plain = value => JSON.parse(JSON.stringify(value));

function boot(saved, { storageFails = false, language = 'en' } = {}) {
  const nodes = new Map(), all = [], timers = new Map();
  let nextTimer = 0, now = 1000, stored = saved ? JSON.stringify(saved) : null;
  class Element {
    constructor() {
      this.value = ''; this.textContent = ''; this.hidden = false; this.open = false;
      this.disabled = false; this.required = false; this.dataset = {}; this.style = {};
      this.listeners = {}; this.children = []; this.isConnected = true; this.parentElement = null;
      const classes = new Set();
      this.classList = { add: (...xs) => xs.forEach(x => classes.add(x)), remove: (...xs) => xs.forEach(x => classes.delete(x)), toggle: (x, on) => on ? classes.add(x) : classes.delete(x) };
    }
    setAttribute(k, v) { this[k] = v; }
    addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); }
    dispatch(type, extra = {}) {
      const event = { target: this, currentTarget: this, preventDefault() { this.defaultPrevented = true; }, ...extra };
      for (const fn of this.listeners[type] || []) fn(event);
      if (type === 'cancel' && !event.defaultPrevented) this.close();
      return event;
    }
    showModal() { this.open = true; }
    close() { this.open = false; this.dispatch('close'); }
    focus() { document.activeElement = this; }
    append(node) { node.parentElement = this; this.children.push(node); }
    set innerHTML(value) {
      this.html = value;
      for (const child of this.children) child.isConnected = false;
      this.children = [];
      // Parse the action controls rendered by the real card template.
      for (const match of value.matchAll(/<(button|span)\b([^>]*)>([\s\S]*?)<\/\1>/g)) {
        const child = new Element(), attrs = match[2];
        child.className = attrs.match(/class="([^"]+)"/)?.[1] || '';
        const action = attrs.match(/data-action="([^"]+)"/); if (action) child.dataset.action = action[1];
        child.textContent = match[3].replace(/<[^>]+>/g, '');
        this.append(child);
      }
    }
    get innerHTML() { return this.html || ''; }
    matches(selector) {
      if (selector === '[data-action]') return !!this.dataset.action;
      const action = selector.match(/^\[data-action="([^"]+)"\]$/);
      if (action) return this.dataset.action === action[1];
      return selector.startsWith('.') && (this.className || '').split(' ').includes(selector.slice(1));
    }
    querySelector(selector) { return this.children.find(el => el.matches(selector)) || null; }
    closest(selector) { return this.matches(selector) ? this : this.parentElement?.closest(selector) || null; }
    getBoundingClientRect() { return { left: 0, right: 500, top: 0, bottom: 500 }; }
  }
  for (const match of html.matchAll(/<[^!\/][^>]*>/g)) {
    const tag = match[0], el = new Element();
    for (const attr of tag.matchAll(/(aria-[\w-]+|title)="([^"]*)"/g)) el.setAttribute(attr[1], attr[2]);
    const id = tag.match(/\bid="([^"]+)"/); if (id) nodes.set(id[1], el);
    for (const attr of tag.matchAll(/data-([\w-]+)="([^"]+)"/g)) {
      el.dataset[attr[1].replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = attr[2];
    }
    all.push(el);
  }
  const document = new Element();
  document.body = new Element(); document.documentElement = new Element();
  document.getElementById = id => { assert.ok(nodes.has(id), `Missing DOM node ${id}`); return nodes.get(id); };
  document.createElement = () => new Element();
  document.querySelectorAll = selector => selector === '.counter-card' ? nodes.get('counterGrid').children.filter(el => el.className === 'counter-card') : all.filter(el => {
    const attr = selector.match(/^\[data-([\w-]+)\]$/);
    return attr && Object.hasOwn(el.dataset, attr[1].replace(/-([a-z])/g, (_, c) => c.toUpperCase()));
  });
  nodes.get('appConfig').textContent = '{"version":"test"}';
  const context = vm.createContext({ document, navigator: { language }, HTMLElement: Element, HTMLInputElement: Element,
    localStorage: { getItem: () => stored, setItem: (key, value) => { if (storageFails) throw Error('Storage unavailable'); stored = value; } },
    Date: class extends Date { static now() { return ++now; } },
    setTimeout: fn => { timers.set(++nextTimer, fn); return nextTimer; }, clearTimeout: id => timers.delete(id),
    requestAnimationFrame: fn => fn(),
  });
  context.window = context; context.addEventListener = () => {};
  const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].at(-1)[1];
  // Expose lexical state only in the test VM; production ships no testing hook.
  vm.runInContext(script.replace(/\}\)\(\);\s*$/, 'globalThis.app={state,openCounterDialog,summaryText,changeCount,openFocus,closeFocus,openActions,resetCounter,deleteCounter,effectiveName,moveCounter:typeof moveCounter==="function"?moveCounter:null};})();'), context);
  return { ...context.app, el: id => nodes.get(id), document,
    translated: key => all.find(el => el.dataset.i18n === key)?.textContent,
    cards: () => document.querySelectorAll('.counter-card'),
    clickCard(id, action) { const card = document.querySelectorAll('.counter-card').find(el => el.dataset.id === id); const target = card?.querySelector(`[data-action="${action}"]`); assert.ok(target, `Missing ${action} control for ${id}`); nodes.get('counterGrid').dispatch('click', { target }); },
    move(id, direction) { context.app.openActions(id); const button = nodes.get(direction < 0 ? 'moveUpAction' : 'moveDownAction'); assert.ok(button, 'Missing move control'); if (!button.disabled) button.dispatch('click'); },
    submit() { nodes.get('counterForm').dispatch('submit'); },
    flushTimers() { for (const [id, fn] of [...timers]) { timers.delete(id); fn(); } },
    stored: () => stored && JSON.parse(stored),
    edit(id = 'a', name = 'Apples', count = '7') { context.app.openCounterDialog(id); nodes.get('counterName').value = name; nodes.get('initialCount').value = count; this.submit(); },
    undo() { nodes.get('undoButton').dispatch('click'); },
    cancel() { all.find(el => el.dataset.closeDialog === 'counterDialog').dispatch('click'); },
  };
}
module.exports = { boot, plain, html };
