const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),zlib=require('node:zlib'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),read=name=>fs.readFileSync(path.join(root,name));
const lock=JSON.parse(read('components/ui-conventions.lock.json'));
assert.equal(lock.version,'1.0.0');
for(const [name,hash] of Object.entries(lock.files))assert.equal(crypto.createHash('sha256').update(read('components/'+name)).digest('hex'),hash,name);
const readable=read('dist/index.html'),loader=read('dist/index.self-extract.html').toString('utf8');
const encoded=loader.match(/const b='([A-Za-z0-9+/=]+)'/);assert.ok(encoded,'self-extract payload');
assert.deepEqual(zlib.gunzipSync(Buffer.from(encoded[1],'base64')),readable);
assert.deepEqual(read('tap-counter.html'),readable);
const html=readable.toString('utf8');
for(const name of Object.keys(lock.files))assert.ok(html.includes(read('components/'+name).toString('utf8')),'exact embed '+name);
const scripts=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].filter(match=>!/application\/json/.test(match[1]));
const classic=scripts.filter(match=>! /type="module"/.test(match[1])).map(match=>match[2]).join('\n');
const parsed=cp.spawnSync(process.execPath,['--input-type=commonjs','--check'],{input:classic,encoding:'utf8'});assert.equal(parsed.status,0,parsed.stderr);
for(const match of scripts.filter(match=>/type="module"/.test(match[1]))){const result=cp.spawnSync(process.execPath,['--input-type=module','--check'],{input:match[2],encoding:'utf8'});assert.equal(result.status,0,result.stderr);}
assert.ok(!/__BK_UI_(?:JS|CSS)__/.test(html),'resolved shared placeholders');
console.log('Exact shared hashes/embeds, root/readable/self-extract parity, native combined script syntax passed.');
