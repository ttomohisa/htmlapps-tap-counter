const { test } = require('node:test');
const assert = require('node:assert/strict');
const { boot } = require('./helpers/counter-app.cjs');

const expected = {
  ja: { language: 'EN', switchLabel: '英語に切り替え', help: 'ヘルプ', close: '閉じる', privacy: '完全ローカル処理' },
  en: { language: 'JA', switchLabel: 'Switch to Japanese', help: 'Help', close: 'Close', privacy: 'Fully local processing' },
};
const closeButton = app => app.document.querySelectorAll('[data-close-dialog]').find(el => el.dataset.closeDialog === 'helpDialog');

function assertLanguage(app, lang) {
  const copy = expected[lang];
  assert.equal(app.document.documentElement.lang, lang);
  assert.equal(app.el('languageButton').textContent, copy.language);
  for (const attr of ['aria-label', 'title']) {
    assert.equal(app.el('languageButton')[attr], copy.switchLabel);
    assert.equal(app.el('helpButton')[attr], copy.help);
  }
  assert.equal(closeButton(app)['aria-label'], copy.close);
  assert.equal(app.translated('localOnly'), copy.privacy);
}

for (const language of ['ja-JP', 'en-US']) {
  test(`header language and Help labels follow ${language}, repeated toggles, and saved preference`, () => {
    const app = boot(undefined, { language });
    let lang = language.startsWith('ja') ? 'ja' : 'en';
    for (let i = 0; i < 5; i++) {
      assertLanguage(app, lang);
      app.el('helpButton').dispatch('click');
      assert.equal(app.el('helpDialog').open, true);
      closeButton(app).dispatch('click');
      assert.equal(app.el('helpDialog').open, false);
      app.el('languageButton').dispatch('click');
      lang = lang === 'ja' ? 'en' : 'ja';
    }
    assertLanguage(boot(app.stored(), { language }), lang);
  });
}

test('Help close label follows the current language', () => {
  const app = boot(undefined, { language: 'ja' });
  assert.equal(closeButton(app)['aria-label'], '閉じる');
  app.el('languageButton').dispatch('click');
  assert.equal(closeButton(app)['aria-label'], 'Close');
});

test('Help title is localized on initial load in each language', () => {
  for (const language of ['ja', 'en']) {
    const app = boot(undefined, { language });
    assert.equal(app.el('helpButton').title, expected[language].help);
  }
});
