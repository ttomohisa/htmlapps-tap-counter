const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const {resolve}=require('node:path');
const {gunzipSync}=require('node:zlib');

const read=path=>readFileSync(resolve(__dirname,'..',path),'utf8');

test('tracked distribution and root standalone match and contain the patch',()=>{
 const html=read('dist/index.html');
 assert.equal(read('tap-counter.html'),html);
 const config=JSON.parse(read('app.config.json'));
 assert.equal(config.version,'1.0.4');
 assert.match(html,/data-count-length/);
 assert.match(html,/storageFailed/);
 assert.match(html,/wakeRequestGeneration/);
 assert.match(html,/connect-src 'none'/);
 assert.ok(html.includes(`"version":"${config.version}"`));
});

test('tracked self-extract gzip restores the exact readable HTML',()=>{
 const wrapper=read('dist/index.self-extract.html');
 const payload=wrapper.match(/const b='([A-Za-z0-9+/=]+)'/);
 assert.ok(payload,'expected base64 gzip payload');
 const bytes=gunzipSync(Buffer.from(payload[1],'base64')).toString('utf8');
 assert.equal(bytes,read('dist/index.html'));
});
