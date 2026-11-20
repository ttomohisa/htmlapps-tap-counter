const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');

const source = readFileSync(resolve(__dirname, '../.github/workflows/release.yml'), 'utf8');

test('release workflow is initiated on main merges and has a manual recovery path', () => {
  // A merged PR updates main, which triggers this workflow via push.
  assert.match(source, /push:\s*\n\s*branches:\s*\[main\]/);
  assert.match(source, /workflow_dispatch:/);
  assert.doesNotMatch(source, /pull_request_target:/, 'release must not build unmerged PR code with a write token');
});

test('the write token is restricted to the publication job', () => {
  assert.match(source, /permissions:\s*\n\s*contents: read/);
  assert.match(source, /\n  release:\s*\n[\s\S]*?permissions:\s*\n\s*contents: write/);
  assert.match(source, /persist-credentials: false/);
  assert.match(source, /concurrency:[\s\S]*?cancel-in-progress: false/);
});

test('release validates SemVer, tests the HTML build, and attaches both standalone artifacts', () => {
  assert.match(source, /app\.config\.json/);
  assert.match(source, /tag=v\$version/);
  assert.match(source, /scripts\/check-repository\.ps1/);
  assert.match(source, /dist\/index\.html/);
  assert.match(source, /dist\/index\.self-extract\.html/);
  assert.match(source, /gh release view/);
  assert.match(source, /gh release create/);
  assert.match(source, /--target "\$TARGET_SHA"/);
  assert.match(source, /--generate-notes/);
  assert.match(source, /\$GITHUB_REPOSITORY/);
});
