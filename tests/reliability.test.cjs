const {test}=require('node:test');
const assert=require('node:assert/strict');
const {boot,plain}=require('./helpers/counter-app.cjs');

const saved=(lang='en',count=7)=>({lang,counters:[{id:'a',name:'Apples',count,createdAt:10,updatedAt:20}],haptics:false,wake:false,preferencesVersion:2,undo:[]});

test('increment and decrement update the existing card without losing keyboard focus',()=>{
  const app=boot(saved()),card=app.cards()[0],increment=card.querySelector('[data-action="increment"]');
  increment.focus();
  app.clickCard('a','increment');app.clickCard('a','increment');
  assert.equal(app.state.counters[0].count,9);
  assert.equal(app.cards()[0],card,'the card should not be replaced for individual counts');
  assert.equal(app.document.activeElement,increment);
  assert.equal(card.querySelector('.counter-value').textContent,'9');
  assert.equal(app.el('totalCount').textContent,9);
  app.clickCard('a','decrement');
  assert.equal(app.state.counters[0].count,8);
  assert.equal(app.document.activeElement,increment);
  assert.equal(card.querySelector('.counter-value').textContent,'8');
  app.undo();
  assert.equal(app.state.counters[0].count,9);
  assert.equal(app.document.activeElement.dataset.action,'increment','Undo should restore the focused control');
});

test('Focus keyboard handler leaves Enter/Space on buttons to native activation',()=>{
  const app=boot(saved());
  app.openFocus('a');
  for(const id of ['focusTap','focusMinus','focusUndo','focusLock','focusExit']){
    for(const key of ['Enter',' ']){
      const event=app.document.dispatch('keydown',{key,target:app.el(id)});
      assert.equal(event.defaultPrevented,undefined,`${id} ${key} must keep the native button action`);
      assert.equal(app.state.counters[0].count,7);
    }
  }
  const key=app.document.dispatch('keydown',{key:'Enter',target:app.document.body});
  assert.equal(key.defaultPrevented,true,'Enter outside focused buttons can still count');
  assert.equal(app.state.counters[0].count,8);
  app.el('focusMinus').dispatch('click');assert.equal(app.state.counters[0].count,7);
  app.el('focusUndo').dispatch('click');assert.equal(app.state.counters[0].count,8);
  app.el('focusLock').dispatch('click');assert.equal(app.state.focusLocked,true);
  app.el('focusExit').dispatch('click');assert.equal(app.state.focusId,null);
});

test('dialog autofocus cannot steal input after the user moves to the numeric field',()=>{
  const app=boot(saved(),{deferFrames:true});
  app.openCounterDialog('a');
  assert.equal(app.document.activeElement,app.el('counterName'));
  app.el('initialCount').focus();
  app.flushFrames();
  assert.equal(app.document.activeElement,app.el('initialCount'));
  app.cancel();
});

test('confirmation autofocus cannot override a new focus owner after opening',async()=>{
  const app=boot(saved(),{deferFrames:true});
  const pending=app.resetCounter('a');
  assert.equal(app.document.activeElement,app.el('appConfirmCancel'));
  app.el('appConfirmOk').focus();
  app.flushFrames();
  assert.equal(app.document.activeElement,app.el('appConfirmOk'));
  app.el('appConfirmCancel').dispatch('click');
  await pending;
});

test('storage write failures remain visible across language switches',()=>{
  const app=boot(saved(),{storageFails:true});
  app.changeCount('a',1);
  assert.equal(app.state.counters[0].count,8);
  assert.equal(app.state.storageFailed,true);
  assert.match(app.el('saveStatus').textContent,/cannot be saved/i);
  assert.equal(app.el('saveStatus').classList.contains('storage-warning'),true);
  app.el('languageButton').dispatch('click');
  assert.match(app.el('saveStatus').textContent,/保存できません/);
  assert.equal(app.el('saveStatus').classList.contains('storage-warning'),true);
});
test('storage read failures show a warning on the initial page',()=>{
  const app=boot(null,{storageReadFails:true,language:'ja'});
  assert.equal(app.state.storageFailed,true);
  assert.match(app.el('saveStatus').textContent,/保存できません/);
  assert.equal(app.state.counters.length,1);
});

test('last counter replacement stays translated after language changes and Undo',async()=>{
  const app=boot(saved('en',3));
  const pending=app.deleteCounter('a');app.el('appConfirmOk').dispatch('click');await pending;
  assert.equal(app.state.counters.length,1);
  assert.equal(app.state.counters[0].name,'');
  assert.equal(app.effectiveName(app.state.counters[0]),'Counter 1');
  app.el('languageButton').dispatch('click');
  assert.equal(app.effectiveName(app.state.counters[0]),'カウンター 1');
  app.undo();
  assert.deepEqual(plain(app.state.counters),saved('en',3).counters);
});

test('all modal close controls and Focus exit have localized accessible names',()=>{
  for(const lang of ['en','ja']){
    const app=boot(saved(lang));
    const close=lang==='ja'?'閉じる':'Close';
    for(const id of ['counterDialog','actionDialog','settingsDialog','helpDialog']){
      const button=app.document.querySelectorAll('[data-close-dialog]').find(el=>el.dataset.closeDialog===id&&el.dataset.i18nAria);
      assert.ok(button,id+' close control');
      assert.equal(button['aria-label'],close);
    }
    assert.equal(app.el('appConfirmClose')['aria-label'],close);
    assert.equal(app.el('focusExit')['aria-label'],lang==='ja'?'集中モードを終了':'Exit Focus mode');
  }
});

const mockSentinel=()=>({released:false,callbacks:[],release(){this.released=true;for(const cb of this.callbacks)cb();return Promise.resolve()},addEventListener(name,callback){if(name==='release')this.callbacks.push(callback)}});

test('a pending Wake Lock is released if Focus closes before acquisition resolves',async()=>{
  let resolve;
  const wakeLock={request:()=>new Promise(r=>{resolve=r})};
  const data=saved();data.wake=true;
  const app=boot(data,{wakeLock});
  app.openFocus('a');assert.equal(typeof resolve,'function');
  app.closeFocus();
  const stale=mockSentinel();resolve(stale);
  await Promise.resolve();await Promise.resolve();await Promise.resolve();
  assert.equal(stale.released,true,'stale acquired lock must be released');
  assert.equal(app.state.wakeLock,null);
  assert.equal(app.el('focusWakeIndicator').classList.contains('active'),false);
});

test('an old Wake Lock request cannot override the next Focus session',async()=>{
  const requests=[];
  const wakeLock={request:()=>new Promise(r=>requests.push(r))};
  const data=saved();data.wake=true;
  const app=boot(data,{wakeLock});
  app.openFocus('a');app.closeFocus();app.openFocus('a');
  assert.equal(requests.length,2);
  const current=mockSentinel(),stale=mockSentinel();
  requests[1](current);await Promise.resolve();
  requests[0](stale);await Promise.resolve();await Promise.resolve();
  assert.equal(stale.released,true);
  assert.equal(current.released,false);
  assert.equal(app.state.wakeLock,current);
  app.closeFocus();assert.equal(current.released,true);
});
