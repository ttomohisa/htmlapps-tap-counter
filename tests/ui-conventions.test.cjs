const {test}=require('node:test'),assert=require('node:assert/strict');
const {boot,plain}=require('./helpers/counter-app.cjs');
const initial=()=>({lang:'en',counters:[{id:'a',name:'Apples',count:4,createdAt:10,updatedAt:20}],haptics:false,wake:false,undo:[],preferencesVersion:2});
test('URL and common language precede legacy JSON preference without any startup writes',()=>{
 for(const [options,want] of [[{url:'https://example.test/?lang=ja',sharedLanguage:'en'},'ja'],[{sharedLanguage:'ja'},'ja'],[{},'en']]){
  const app=boot(initial(),options);assert.equal(app.state.lang,want);assert.equal(app.writes.length,0);assert.deepEqual(app.stored(),initial());
 }
 const fresh=boot(null,{language:'fr',languages:['fr','ja-JP','en']});assert.equal(fresh.state.lang,'ja');assert.equal(fresh.writes.length,0);
});
test('quota failure retains current counters and last success; retry persists exact current content',async()=>{
 const app=boot(initial());app.changeCount('a',1);const successTime=app.state.lastSavedAt,stored=app.rawStored();
 app.setStorageFails(true);app.changeCount('a',1);assert.equal(app.state.counters[0].count,6);assert.equal(app.rawStored(),stored);
 assert.equal(app.state.saveState,'error');assert.equal(app.state.lastSavedAt,successTime);assert.equal(app.el('saveRetry').hidden,false);
 app.setStorageFails(false);await app.retrySave();assert.equal(app.state.saveState,'saved');assert.equal(app.stored().counters[0].count,6);assert.equal(boot(app.stored()).state.counters[0].count,6);
});
test('explicit language choice preserves edit drafts, history and saved app bytes',()=>{
 const app=boot(initial(),{url:'https://example.test/?lang=en'});app.openCounterDialog('a');app.el('counterName').value='draft';app.el('initialCount').value='-';
 const before=app.rawStored();app.el('languageButton').dispatch('click');assert.equal(app.state.lang,'ja');assert.equal(app.rawStored(),before);assert.equal(app.el('counterName').value,'draft');assert.equal(app.el('initialCount').value,'-');assert.equal(app.state.undo.length,0);
 assert.equal(app.preferences.get('browser-kitty:ui-language:v1'),'ja');assert.match(app.context.location.href,/lang=ja/);assert.equal(app.el('counterDialogTitle').textContent,'カウンターを編集');
});
test('storage refusal changes language on screen and translates persistent failure without claiming save',()=>{
 const app=boot(initial(),{storageFails:true});app.changeCount('a',1);app.el('languageButton').dispatch('click');assert.equal(app.state.lang,'ja');assert.equal(app.state.saveState,'error');assert.match(app.el('languageNotice').textContent,/この画面だけ/);assert.match(app.el('saveStatus').textContent,/保存できません/);assert.equal(app.stored().counters[0].count,4);
});
test('startup corrupt or unreadable storage is never overwritten by automatic changes',()=>{
 for(const options of [{rawSaved:'broken'}, {readFails:true}]){const app=boot(initial(),options);const before=app.rawStored();app.changeCount(app.state.counters[0].id,1);assert.equal(app.rawStored(),before);assert.equal(app.state.saveState,'error');assert.equal(app.writes.length,0);}
});
test('summary prevents duplicate async shares and always uses its initial counter snapshot',async()=>{
 const app=boot(initial());let resolve;const calls=[];app.context.navigator.share=data=>{calls.push(data);return new Promise(r=>resolve=r);};
 const first=app.shareSummary(),second=app.shareSummary();assert.equal(calls.length,1);app.changeCount('a',1);assert.match(calls[0].text,/Apples: 4/);assert.equal(app.el('shareButton').disabled,true);resolve();await Promise.all([first,second]);assert.equal(app.el('shareButton').disabled,false);assert.equal(app.state.counters[0].count,5);
});

test('malformed counter records or history pause autosave without replacing saved bytes',()=>{
 const corrupt=[{...initial(),counters:[]},{...initial(),counters:[{id:'a',count:'4',name:'A'}]},{...initial(),counters:[{id:'a',count:2,name:9}]},{...initial(),counters:[initial().counters[0],initial().counters[0]]},{...initial(),undo:[{counters:[]}]},{...initial(),undo:[[{id:'bad',name:'B',count:Infinity}]]}];
 for(const saved of corrupt){const app=boot(saved),before=app.rawStored();assert.equal(app.state.loadBlocked,true);app.changeCount(app.state.counters[0].id,1);assert.equal(app.rawStored(),before);assert.equal(app.state.saveState,'error');}
});

test('read recovery confirms the replacement scope, preserves Cancel, then saves only on approval',async()=>{
 const app=boot(initial(),{rawSaved:'broken'}),before=app.rawStored();app.changeCount('default',1);
 app.el('saveRetry').focus();const cancel=app.retrySave();assert.equal(app.el('appConfirmDialog').open,true);assert.equal(app.document.activeElement,app.el('appConfirmCancel'));assert.match(app.el('appConfirmMessage').textContent,/previous saved data cannot/);
 app.el('languageButton').dispatch('click');assert.match(app.el('appConfirmMessage').textContent,/以前の保存内容/);app.el('appConfirmCancel').dispatch('click');await cancel;assert.equal(app.rawStored(),before);assert.equal(app.state.loadBlocked,true);assert.ok(app.document.activeElement===app.el('saveRetry'),'Retry retains focus after cancellation');
 const confirm=app.retrySave();app.el('appConfirmOk').dispatch('click');await confirm;assert.equal(app.state.loadBlocked,false);assert.equal(app.state.saveState,'saved');assert.equal(app.stored().counters[0].count,1);
});

test('a denied read retry does not erase original storage or present a misleading confirmation',async()=>{
 const app=boot(initial(),{readFails:true});const before=app.rawStored();await app.retrySave();assert.equal(app.rawStored(),before);assert.equal(app.state.loadBlocked,true);assert.equal(app.el('appConfirmDialog').open,false);assert.equal(app.state.saveState,'error');
});

test('destructive confirmation restores a live logical control after cards are replaced',async()=>{
 for(const action of ['resetCounter','deleteCounter']){const app=boot(initial());const original=app.cards()[0].querySelector('[data-action="menu"]');original.focus();app.openActions('a');const pending=app[action]('a');app.el('appConfirmOk').dispatch('click');await pending;
  assert.equal(original.isConnected,false);assert.equal(app.document.activeElement.isConnected,true);assert.ok(app.document.activeElement!==app.document.body,'Focus must remain on a live control');assert.ok(app.document.activeElement===(action==='resetCounter'?app.cards()[0].querySelector('[data-action="menu"]'):app.el('addButton')));assert.equal(app.state.undo.length,1);app.undo();assert.equal(app.state.counters[0].count,4);
 }
});

test('native share cancellation keeps data and copy failure survives language change until retry succeeds',async()=>{
 const app=boot(initial()),before=app.rawStored();app.context.navigator.share=async()=>{throw Object.assign(Error('cancel'),{name:'AbortError'});};await app.shareSummary();assert.equal(app.state.shareFailed,false);assert.equal(app.rawStored(),before);
 app.context.navigator.clipboard={writeText:async()=>{throw Error('denied');}};await app.shareSummary(true);assert.equal(app.state.shareFailed,true);app.el('languageButton').dispatch('click');assert.match(app.el('shareError').textContent,/コピーできません/);
 let copy;app.context.navigator.clipboard.writeText=async text=>copy=text;await app.shareSummary(true);assert.equal(app.state.shareFailed,false);assert.match(copy,/Apples: 4/);assert.equal(app.el('shareButton').disabled,false);
});
