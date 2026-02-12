// script.js v5 — lock + timers + letter behavior
const UNLOCK_KEY = 'valentine_unlocked';
const CORRECT_PASS = '0410';

function safeLocalGet(){ try{ return localStorage.getItem(UNLOCK_KEY) === '1'; }catch(e){ return false; } }
function safeLocalSet(){ try{ localStorage.setItem(UNLOCK_KEY,'1'); }catch(e){} }

function hideAllContent(){
  document.querySelectorAll('.cover, .container, .hearts, .letter-only, .flower-only').forEach(el=>{
    if(el){ el.style.display='none'; el.setAttribute('aria-hidden','true'); }
  });
  const openBtn = document.getElementById('open-letter-btn'); if(openBtn) openBtn.style.display='none';
  const letterFull = document.getElementById('letter-full'); if(letterFull) letterFull.style.display='none';
}

function revealAllContent(){
  document.querySelectorAll('.cover, .container, .hearts, .letter-only, .flower-only').forEach(el=>{
    if(el){ el.style.display=''; el.removeAttribute('aria-hidden'); }
  });
  const openBtn = document.getElementById('open-letter-btn'); if(openBtn) openBtn.style.display='';
  const letterFull = document.getElementById('letter-full'); if(letterFull) letterFull.style.display='none';
}

function ensureOverlay(){
  let overlay = document.getElementById('lock-overlay');
  if(overlay) return overlay;
  const html = `
    <div id="lock-overlay" class="overlay" role="dialog" aria-modal="true" aria-labelledby="lock-title" aria-describedby="lock-hint" aria-hidden="false">
      <div class="lock-box" role="document">
        <h1 id="lock-title">Enter password</h1>
        <button id="focus-helper" class="focus-helper" type="button" aria-hidden="true">Tap here to enter the password</button>
        <input id="password-input" type="password" inputmode="numeric" pattern="[0-9]*" placeholder="Password" aria-label="Password" autocomplete="off" />
        <button id="unlock-btn" type="button">Unlock</button>
        <p id="lock-hint" class="hint">Hint: it's a 4-digit code</p>
        <p id="lock-error" class="error" aria-live="polite"></p>
      </div>
    </div>`;
  document.body.insertAdjacentHTML('afterbegin', html);
  return document.getElementById('lock-overlay');
}

function revealSite(){
  const overlay = document.getElementById('lock-overlay');
  if(overlay){ overlay.style.display='none'; overlay.setAttribute('aria-hidden','true'); }
  revealAllContent();
  document.dispatchEvent(new Event('site-unlocked'));
}

function hideSite(){
  const overlay = ensureOverlay(); overlay.style.display=''; overlay.setAttribute('aria-hidden','false');
  try{ document.body.appendChild(overlay); }catch(e){}
  hideAllContent();
}

function initUnlock(){
  const overlay = ensureOverlay();
  const input = document.getElementById('password-input');
  const unlockBtn = document.getElementById('unlock-btn');
  const focusHelper = document.getElementById('focus-helper');
  const err = document.getElementById('lock-error');

  overlay.style.zIndex = '2147483647';
  overlay.style.pointerEvents = 'auto';

  if(focusHelper) focusHelper.addEventListener('click', ()=>{ try{ input.focus(); }catch(e){} });

  overlay.addEventListener('touchstart', function once(){ try{ input.focus(); }catch(e){} overlay.removeEventListener('touchstart', once); }, { passive:true });

  unlockBtn.addEventListener('click', ()=>{
    const v = (input.value||'').trim();
    if(v === CORRECT_PASS){ safeLocalSet(); revealSite(); }
    else { if(err) err.textContent = 'Incorrect password — try again.'; input.value=''; try{ input.focus(); }catch(e){} }
  });
  input.addEventListener('keydown',(e)=>{ if(e.key === 'Enter'){ unlockBtn.click(); e.preventDefault(); } });

  if(safeLocalGet()) revealSite();
  else { hideSite(); setTimeout(()=>{ try{ input.focus(); }catch(e){} },60); }
}

function initTimers(){
  const sinceEl = document.getElementById('since');
  const countdownEl = document.getElementById('countdown');
  if(!sinceEl && !countdownEl) return;

  // Adjust this date to your real relationship start (year, monthIndex, day)
  const startDate = new Date(Date.UTC(2025, 9, 4, 0, 0, 0)); // 4 Oct 2025 UTC

  function pad(n){ return n.toString().padStart(2,'0'); }

  function update(){
    const now = new Date();
    let diffMs = now - startDate;
    if(diffMs < 0) diffMs = 0;
    const days = Math.floor(diffMs / (1000*60*60*24));
    const hours = Math.floor((diffMs % (1000*60*60*24)) / (1000*60*60));
    const minutes = Math.floor((diffMs % (1000*60*60)) / (1000*60));
    const seconds = Math.floor((diffMs % (1000*60)) / 1000);
    if(sinceEl) sinceEl.textContent = `${days} days ${pad(hours)}:${pad(minutes)}:${pad(seconds)} since 04 Oct 2025`;

    const year = now.getFullYear();
    let nextAnn = new Date(year, 9, 4, 0, 0, 0);
    if(nextAnn <= now) nextAnn = new Date(year+1, 9, 4, 0, 0, 0);
    let rem = nextAnn - now; if(rem < 0) rem = 0;
    const rd = Math.floor(rem / (1000*60*60*24));
    const rh = Math.floor((rem % (1000*60*60*24)) / (1000*60*60));
    const rm = Math.floor((rem % (1000*60*60)) / (1000*60));
    const rs = Math.floor((rem % (1000*60)) / 1000);
    if(countdownEl) countdownEl.textContent = `${rd} days ${pad(rh)}:${pad(rm)}:${pad(rs)} until ${nextAnn.toLocaleDateString()}`;
  }

  update();
  setInterval(update, 1000);
}

function initLetter(){
  const openBtn = document.getElementById('open-letter-btn');
  const letterFull = document.getElementById('letter-full');
  const flowerMessage = document.getElementById('flower-message');
  const musicControls = document.getElementById('music-controls');
  const bgMusic = document.getElementById('bg-music');
  const playBtn = document.getElementById('play-btn');
  const pauseBtn = document.getElementById('pause-btn');
  const volume = document.getElementById('volume');
  const instructions = document.getElementById('letter-instructions');

  if(!openBtn || !letterFull || !flowerMessage) return;
  const MESSAGE = "i hate the distance and im sorry i couldnt bring you flowers mi vida i promise you ill make it up to you one day";
  flowerMessage.textContent = MESSAGE; flowerMessage.style.display='none'; flowerMessage.setAttribute('aria-hidden','true');

  openBtn.addEventListener('click', ()=>{
    letterFull.style.display=''; openBtn.style.display='none';
    if(!letterFull._attached){ const act=(e)=>{ if(e.type==='keydown' && !(e.key==='Enter'||e.key===' ')) return; reveal(); }; letterFull.addEventListener('click', act); letterFull.addEventListener('keydown', act); letterFull._attached=true; letterFull.setAttribute('tabindex','0'); letterFull.setAttribute('role','button'); }
  });

  function reveal(){
    letterFull.classList.remove('blurred-img'); letterFull.classList.add('revealed-img'); letterFull.removeAttribute('role');
    flowerMessage.style.display=''; flowerMessage.setAttribute('aria-hidden','false');
    if(musicControls){ musicControls.style.display='block'; musicControls.setAttribute('aria-hidden','false'); }
    if(instructions) instructions.style.display='none';
    if(bgMusic){ try{ bgMusic.volume = parseFloat((volume && volume.value) || '0.8'); }catch(e){} bgMusic.currentTime=0; bgMusic.play().catch(()=>{}); }
  }

  if(playBtn) playBtn.addEventListener('click', ()=>{ if(bgMusic) bgMusic.play(); playBtn.style.display='none'; if(pauseBtn) pauseBtn.style.display='inline-block'; });
  if(pauseBtn) pauseBtn.addEventListener('click', ()=>{ if(bgMusic){ bgMusic.pause(); pauseBtn.style.display='none'; if(playBtn) playBtn.style.display='inline-block'; } });
  if(volume) volume.addEventListener('input', ()=>{ if(bgMusic) bgMusic.volume = parseFloat(volume.value); });

  if(safeLocalGet()){ const ob=document.getElementById('open-letter-btn'); if(ob) ob.style.display=''; }
  else document.addEventListener('site-unlocked', ()=>{ const ob=document.getElementById('open-letter-btn'); if(ob) ob.style.display=''; }, { once:true });
}

document.addEventListener('DOMContentLoaded', ()=>{
  try{
    initUnlock();
    hideAllContent();
    initTimers();
    initLetter();
  }catch(e){
    console.error('bootstrap error', e);
    // fallback: reveal content so page is not blank
    document.querySelectorAll('.cover, .container, .hearts, .letter-only, .flower-only').forEach(el=>{ if(el){ el.style.display=''; el.removeAttribute('aria-hidden'); }});
  }
});
