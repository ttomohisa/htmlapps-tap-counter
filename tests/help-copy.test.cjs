const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const removed = [
  "<p><strong>小さい画面：</strong>ヘルプや入力欄が収まらないときは、ダイアログ内をスクロールしてください。開いている間は背景のページは動きません。</p>",
  "<p><strong>Small screens:</strong> Scroll inside the dialog when Help or form fields do not fit. The background page stays still while it is open.</p>",
  "終了すると、開いたカウンターの「集中」ボタンにキーボードフォーカスが戻ります。Undoでそのカウンターが消えた場合は「追加」に戻ります。",
  " Closing Focus returns keyboard focus to that counter’s Focus button. If Undo removed the counter, focus returns to Add."
];
for (const file of ["src/index.template.html", "tap-counter.html"]) {
  test(`${file}: user help omits implementation commentary`, () => {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    for (const text of removed) assert.ok(!html.includes(text), `Remove implementation copy from ${file}`);
  });
}
