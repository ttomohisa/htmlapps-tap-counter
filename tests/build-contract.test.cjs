const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const read = path => readFileSync(resolve(__dirname, '..', path), 'utf8').replace(/\r\n/g, '\n');

test('canonical verification runs regressions against the freshly built readable output', () => {
  const script = read('scripts/check-repository.ps1');
  assert.match(script, /\$env:TAP_COUNTER_HTML\s*=\s*Join-Path \$Root \$config\.build\.output/);
  assert.match(script, /& node --test @testFiles/);
  assert.match(script, /if \(\$LASTEXITCODE -ne 0\) \{ throw/);
  assert.match(script, /finally\s*\{[\s\S]*?\$env:TAP_COUNTER_HTML\s*=\s*\$previousHtml/);
});

test('Pages build installs the same Node version as build and preview gates', () => {
  for (const workflow of ['build-standalone.yml', 'deploy-pages.yml', 'preview.yml']) {
    const source = read(`.github/workflows/${workflow}`);
    assert.match(source, /uses: actions\/setup-node@v6/);
    assert.match(source, /node-version: 24/);
    assert.match(source, /check-repository\.ps1/);
  }
});

test('patch version is synchronized in config, specification, and source fallback', () => {
  assert.equal(JSON.parse(read('app.config.json')).version, '1.0.3');
  assert.match(read('APP_SPEC.md'), /\*\*Version:\*\* 1\.0\.3/);
  assert.match(read('src/index.template.html'), /config\.version\|\|'1\.0\.3'/);
  assert.match(read('src/index.template.html'), /id="versionBadge">v1\.0\.3<\/span>/);
  assert.match(read('CHANGELOG.md'), /## 1\.0\.3/);
});
