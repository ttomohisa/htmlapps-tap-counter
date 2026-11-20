'use strict';
// Native Chromium checks run only in the existing unprivileged PR build job.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');
const PHONE_WIDTH = 520;
const HELP = "#helpButton", LANGUAGE = "#languageButton", CLOSE = "#helpClose";
const artifacts = path.resolve('test-results/mobile-layout');

async function exerciseActions(page, width, label) {
  await page.locator('.counter-main').first().click();
  assert.equal((await page.locator('.counter-value').first().innerText()).trim(), '1', label + ': counting action');
  assert.equal(await page.locator('#undoButton').isVisible(), true, label + ': Undo remains available');
  const increment=page.locator('.counter-card').first().locator('[data-action="increment"]');
  await increment.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');
  assert.equal((await page.locator('.counter-value').first().innerText()).trim(),'3',label+': repeated Enter increments without lost focus');
  assert.equal(await increment.evaluate(el=>document.activeElement===el),true,label+': increment button keeps keyboard focus');
}


async function setFirstCounter(page,value) {
  await page.locator('.counter-card').first().locator('[data-action="menu"]').click();
  await page.locator('#renameAction').click();
  await page.locator('#initialCount').fill(String(value));
  await page.locator('#counterSaveButton').click();
  const actual=(await page.locator('.counter-value').first().innerText()).trim();
  if(actual!==String(value)){
    const details=await page.evaluate(()=>({
      dialogOpen:document.querySelector('#counterDialog').open,
      name:document.querySelector('#counterName').value,
      value:document.querySelector('#initialCount').value,
      formValid:document.querySelector('#counterForm').checkValidity(),
      toast:document.querySelector('#toast').textContent,
      active:document.activeElement?.id,
      storage:localStorage.getItem('tap-counter:v1')?.slice(0,250)
    }));
    throw new Error(`Edited count ${actual} != ${value}: ${JSON.stringify(details)}`);
  }
}
async function assertCountFits(page,label) {
  const measurement=await page.locator('.counter-value').first().evaluate(el=>{
    const range=document.createRange();range.selectNodeContents(el);
    const text=range.getBoundingClientRect(),button=el.closest('button').getBoundingClientRect();
    return {left:text.left,right:text.right,buttonLeft:button.left,buttonRight:button.right};
  });
  assert.ok(measurement.left>=measurement.buttonLeft-1&&measurement.right<=measurement.buttonRight+1,
    label+': count text must fit tap target '+JSON.stringify(measurement));
}
async function exerciseFocusKeyboard(page,label){
  await setFirstCounter(page,10);
  await page.locator('.counter-card').first().locator('[data-action="focus"]').click();
  await page.locator('#focusMinus').focus();await page.keyboard.press('Enter');
  assert.equal((await page.locator('#focusCount').innerText()).trim(),'9',label+': focused Minus Enter decrements');
  await page.locator('#focusUndo').focus();await page.keyboard.press('Space');
  assert.equal((await page.locator('#focusCount').innerText()).trim(),'10',label+': focused Undo Space undoes');
  await page.locator('#focusLock').focus();await page.keyboard.press('Enter');
  assert.equal(await page.locator('#focusTap').isDisabled(),true,label+': focused Lock Enter locks');
  await page.locator('#focusLock').focus();await page.keyboard.press('Enter');
  assert.equal(await page.locator('#focusTap').isEnabled(),true,label+': focused Unlock Enter unlocks');
  await page.locator('#focusTap').focus();await page.keyboard.press('Enter');
  assert.equal((await page.locator('#focusCount').innerText()).trim(),'11',label+': focused tap Enter adds only once');
  await page.locator('#focusExit').focus();await page.keyboard.press('Enter');
  assert.equal(await page.locator('#focusView').evaluate(el=>el.classList.contains('open')),false,label+': focused Exit Enter closes Focus');
}
async function main() {
  fs.mkdirSync(artifacts, {recursive:true});
  const browser = await chromium.launch();
  try {
    const cases = [];
    for (const language of ['ja', 'en']) {
      for (const [width, height] of [[1360,900], [761,568], [PHONE_WIDTH + 1,568], [PHONE_WIDTH,568], [360,568], [351,568], [320,568], [393,252]]) cases.push({file:'dist/index.html', language, width, height});
    }
    // Also load the compressed and root download variants, without duplicating the full matrix.
    cases.push({file:'dist/index.self-extract.html', language:'en', width:360, height:640});
    cases.push({file:'tap-counter.html', language:'ja', width:1360, height:900});
    for (const {file, language, width, height} of cases) {
      const context = await browser.newContext({viewport:{width,height}, locale:language, reducedMotion:'reduce'});
      const page = await context.newPage();
      const errors = [], requests = [];
      const label = `${file} ${language} ${width}x${height}`;
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      page.on('request', request => { if (/^https?:/.test(request.url())) requests.push(request.url()); });
      try {
        await page.goto(pathToFileURL(path.resolve(file)).href);
        await page.locator(HELP).waitFor();
        if (await page.locator('html').getAttribute('lang') !== language) await page.locator(LANGUAGE).click();
        assert.equal((await page.locator('[data-i18n="localOnly"]').textContent()).trim(), language === 'en' ? 'Fully local processing' : '完全ローカル処理', label + ': privacy wording');
        assert.equal(await page.locator('body > footer').isVisible(), width > PHONE_WIDTH, label + ': informational footer breakpoint');
        assert.equal(await page.locator('.page-intro h2').count(),0,label + ': hero title is removed at all sizes');
        for (const selector of ['.page-intro', '.page-intro p', '.privacy-badge']) {
          assert.equal(await page.locator(selector).isVisible(), width > PHONE_WIDTH, label + ': intro visibility for ' + selector);
        }
        assert.equal(await page.locator('.summary-bar').isVisible(), true, label + ': primary counter controls remain visible');
        const layout=await page.evaluate(()=>{
          const box=s=>document.querySelector(s).getBoundingClientRect();
          const summary=document.querySelector('.summary-bar'),stat=document.querySelector('.summary-stat'),undo=document.querySelector('#undoButton');
          const style=getComputedStyle(summary),statStyle=getComputedStyle(stat),header=box('.app-header'),main=box('.main'),summaryBox=box('.summary-bar');
          return {summaryBorder:style.borderTopWidth,summaryBg:style.backgroundColor,statBg:statStyle.backgroundColor,
            statsBox:box('.summary-stats').toJSON(),toolbarBox:box('.toolbar').toJSON(),
            undoAria:undo.getAttribute('aria-label'),undoVisibleText:getComputedStyle(undo.querySelector('span')).display!=='none',
            headerBottom:header.bottom,mainTop:main.top,summaryTop:summaryBox.top,
            intro:document.querySelector('.page-intro').getBoundingClientRect().toJSON(),
            buttonWidths:[...document.querySelectorAll('.toolbar button')].map(el=>({width:el.clientWidth,scrollWidth:el.scrollWidth}))};
        });
        assert.equal(layout.summaryBorder,'0px',label+': summary should not be an outlined card');
        assert.equal(layout.summaryBg,'rgba(0, 0, 0, 0)',label+': summary has no opaque panel');
        assert.equal(layout.statBg,'rgba(0, 0, 0, 0)',label+': stat tiles have no filled background');
        assert.equal(layout.undoAria,language==='ja'?'元に戻す':'Undo',label+': Undo remains accessible when text is hidden');
        assert.equal(layout.undoVisibleText,width>350,label+': compact phone shortcut keeps controls on one row');
        if(width<=760)assert.ok(layout.toolbarBox.y>=layout.statsBox.bottom-1,label+': mobile controls sit below the summary');
        if(width<=520)assert.ok(layout.summaryTop-layout.headerBottom<=24,label+': dashboard starts close to mobile header');
        else{
          assert.ok(layout.intro.y-layout.headerBottom<=24,label+': desktop intro starts close to header');
          assert.ok(layout.summaryTop-layout.intro.bottom<=24,label+': desktop intro has compact bottom spacing');
        }
        for(const button of layout.buttonWidths)assert.ok(button.scrollWidth<=button.width+1,label+': toolbar button fits available width');
        const cardStyling=await page.locator('.counter-card').first().evaluate(el=>{
          const style=getComputedStyle(el);return {shadow:style.boxShadow,border:style.borderColor};
        });
        assert.equal(cardStyling.shadow,'none',label+': counter cards have no raised shadow');
        const gutter=await page.locator('.main').evaluate(el=>getComputedStyle(el).paddingLeft);
        assert.equal(gutter,width<=760?'16px':'24px',label+': gutter follows 8px layout scale');
        await exerciseActions(page, width, label);
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), label + ': page width');
        // Responsive changes must not leave the informational footer in a stale state.
        await page.setViewportSize({width:PHONE_WIDTH + 1, height});
        assert.equal(await page.locator('body > footer').isVisible(), true, label + ': wider resize');
        assert.equal(await page.locator('.page-intro').isVisible(), true, label + ': hero returns above phone breakpoint');
        await page.setViewportSize({width:PHONE_WIDTH, height});
        assert.equal(await page.locator('body > footer').isVisible(), false, label + ': phone resize');
        assert.equal(await page.locator('.page-intro').isVisible(), false, label + ': hero stays hidden at phone breakpoint');
        await page.setViewportSize({width,height});
        if (file === 'dist/index.html' && [1360,320].includes(width)) await page.screenshot({path:path.join(artifacts, `${language}-${width}.png`), fullPage:true});

        await page.locator(HELP).click();
        const body = page.locator('#helpDialog .dialog-body');
        await body.evaluate(el => { el.scrollTop = el.scrollHeight; });
        const finalItem = page.locator('#helpDialog .dialog-body p:visible, #helpDialog .dialog-body li:visible').last();
        const finalBox = await finalItem.boundingBox(), bodyBox = await body.boundingBox();
        assert.ok(finalBox && bodyBox && finalBox.y >= bodyBox.y - 1 && finalBox.y + finalBox.height <= bodyBox.y + bodyBox.height + 1, label + ': final Help guidance reachable');
        assert.ok(await body.evaluate(el => el.scrollWidth <= el.clientWidth + 1), label + ': Help width');
        const header = await page.locator('#helpDialog .dialog-head, #helpDialog .dialog-header').boundingBox();
        assert.ok(header && header.y >= 0 && header.y + header.height <= height, label + ': Help header visible');
        const beforeScroll = await page.evaluate(() => scrollY);
        await page.mouse.move(2, Math.floor(height / 2));
        await page.mouse.wheel(0,400);
        await page.waitForTimeout(100);
        assert.equal(await page.evaluate(() => scrollY), beforeScroll, label + ': modal background locked');
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('#helpDialog').isVisible(), false, label + ': Escape closes Help');
        await page.locator(HELP).click();
        await page.locator('#helpDialog').locator(CLOSE).first().click();
        assert.equal(await page.locator('#helpDialog').isVisible(), false, label + ': Help reopens and closes');
        if(file==='dist/index.html'){
          for(const value of [999999,-999999]){await setFirstCounter(page,value);await assertCountFits(page,label+' '+value);}
          if(width===393&&height===252){
            await page.locator('.counter-card').first().locator('[data-action="focus"]').click();
            const focusFit=await page.locator('#focusTap').evaluate(el=>{
              const parent=el.getBoundingClientRect(),counter=el.querySelector('.focus-count').getBoundingClientRect(),
                instruction=el.querySelector('.focus-instruction').getBoundingClientRect();
              return {top:parent.top,bottom:parent.bottom,countTop:counter.top,countBottom:counter.bottom,
                      instructionTop:instruction.top,instructionBottom:instruction.bottom};
            });
            assert.ok(focusFit.countTop>=focusFit.top-1&&focusFit.instructionBottom<=focusFit.bottom+1,
              label+': landscape Focus text must fit '+JSON.stringify(focusFit));
            await page.locator('#focusExit').click();
          }
          if(width===320||(width===393&&height===252))await exerciseFocusKeyboard(page,label);
        }
        assert.deepEqual(errors, [], label + ': console errors');
        assert.deepEqual(requests, [], label + ': no external runtime requests');
        console.log('PASS ' + label);
      } catch (error) {
        await page.screenshot({path:path.join(artifacts,'failure.png'), fullPage:true}).catch(() => {});
        throw new Error(label + ': ' + error.message, {cause:error});
      } finally { await context.close(); }
    }
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
