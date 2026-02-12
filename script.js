// script.js — lock, timers, letter reveal
const UNLOCK_KEY = 'valentine_unlocked';
const CORRECT_PASS = '0410';

function safeLocalGet(){ try{ return localStorage.getItem(UNLOCK_KEY) === '1'; }catch(e){ return false; } }
function safeLocalSet(){ try{ localStorage.setItem(UNLOCK_KEY,'1'); }catch(e){} }

// Init overlay lock
function initUnlock(){
  const overlay = document.getElementById('lock-overlay');
  const input = document.getElementById('password-input');
  const btn = document.getElementById('unlock-btn');
  const helper = document.getElementById('focus-helper');
  const err = document.getElementById('lock-error');

  if(!overlay || !input || !btn) return;

  overlay.style.zIndex = '999999';
  overlay.style.pointerEvents = 'auto';
  try{ document.body.appendChild(overlay); } catch(e){}

  if(helper) helper.addEventListener('click', ()=> { try{ input.focus(); } catch(e){} });

  overlay.addEventListener('touchstart', function onT(){ try{ input.focus(); }catch(e){} overlay.removeEventListener('touchstart', onT); }, { passive:true });

  function revealSite(){
    overlay.style.display = 'none';
    overlay.setAttribute('aria-hidden','true');
    // show open-letter button in case we're on letter page
    const openBtn = document.getElementById('open-letter-btn');
    if(openBtn) openBtn.style.display = '';
    document.dispatchEvent(new Event('site-unlocked'));
  }
  function showOverlay(){
    overlay.style.display = '';
    overlay.setAttribute('aria-hidden','false');
  }

  btn.addEventListener('click', ()=>{
    const v = (input.value||'').trim();
    if(v === CORRECT_PASS){
      safeLocalSet();
      revealSite();
    } else {
      if(err) err.textContent = 'Incorrect password — try again.';
      input.value = '';
      try{ input.focus(); }catch(e){}
    }
  });

  input.addEventListener('keydown', (e)=>{ if(e.key === 'Enter'){ btn.click(); e.preventDefault(); }});

  if(safeLocalGet()){
    revealSite();
  } else {
    showOverlay();
    setTimeout(()=>{ try{ input.focus(); }catch(e){} }, 60);
  }
}

// Timers
function initTimers(){
  const sinceEl = document.getElementById('since');
  const countdownEl = document.getElementById('countdown');
  if(!sinceEl && !countdownEl) return;

  const startDate = new Date(Date.UTC(2025,9,4,0,0,0)); // adjust if needed

  function pad(n){ return n.toString().padStart(2,'0'); }
  function update(){
    const now = new Date();
    let diffMs = now - startDate; if(diffMs < 0) diffMs = 0;
    const days = Math.floor(diffMs / (1000*60*60*24));
    const hours = Math.floor((diffMs % (1000*60*60*24))/(1000*60*60));
    const minutes = Math.floor((diffMs % (1000*60*60))/(1000*60));
    const seconds = Math.floor((diffMs % (1000*60))/1000);
    if(sinceEl) sinceEl.textContent = `${days} days ${pad(hours)}:${pad(minutes)}:${pad(seconds)} since 04 Oct 2025`;

    const year = now.getFullYear();
    let nextAnn = new Date(year,9,4,0,0,0);
    if(nextAnn <= now) nextAnn = new Date(year+1,9,4,0,0,0);
    let rem = nextAnn - now; if(rem < 0) rem = 0;
    const rd = Math.floor(rem/(1000*60*60*24));
    const rh = Math.floor((rem % (1000*60*60*24))/(1000*60*60));
    const rm = Math.floor((rem % (1000*60*60))/(1000*60));
    const rs = Math.floor((rem % (1000*60))/1000);
    if(countdownEl) countdownEl.textContent = `${rd} days ${pad(rh)}:${pad(rm)}:${pad(rs)} until ${nextAnn.toLocaleDateString()}`;
  }

  update();
  setInterval(update, 1000);
}

// Letter page behavior
function initLetterPage(){
  const openBtn = document.getElementById('open-letter-btn');
  const letterFull = document.getElementById('letter-full');
  const messageEl = document.getElementById('flower-message');
  const musicControls = document.getElementById('music-controls');
  const bgMusic = document.getElementById('bg-music');
  const playBtn = document.getElementById('play-btn');
  const pauseBtn = document.getElementById('pause-btn');
  const volume = document.getElementById('volume');
  const instructions = document.getElementById('letter-instructions');

  if(!openBtn || !letterFull || !messageEl) return;

  // hidden message left empty on purpose (note visible separately)
  messageEl.textContent = '';
  messageEl.style.display = 'none';
  messageEl.setAttribute('aria-hidden','true');

  openBtn.addEventListener('click', ()=>{
    letterFull.style.display = '';
    openBtn.style.display = 'none';
    if(!letterFull._ready){
      const handler = (e)=>{ if(e.type==='keydown' && !(e.key==='Enter' || e.key===' ')) return; reveal(); };
      letterFull.addEventListener('click', handler);
      letterFull.addEventListener('keydown', handler);
      letterFull._ready = true;
      letterFull.setAttribute('tabindex','0');
      letterFull.setAttribute('role','button');
    }
  });

  function reveal(){
    letterFull.classList.remove('blurred-img');
    letterFull.classList.add('revealed-img');
    letterFull.removeAttribute('role');
    if(messageEl.textContent && messageEl.textContent.trim() !== ''){
      messageEl.style.display = '';
      messageEl.setAttribute('aria-hidden','false');
    }
    if(musicControls){ musicControls.style.display = 'block'; musicControls.setAttribute('aria-hidden','false'); }
    if(instructions) instructions.style.display = 'none';
    if(bgMusic){
      try{ bgMusic.volume = parseFloat((volume && volume.value) || '0.8'); }catch(e){}
      bgMusic.currentTime = 0;
      bgMusic.play().catch(()=>{});
    }
  }

  // show open button when unlocked
  if(safeLocalGet()){ openBtn.style.display = ''; }
  else document.addEventListener('site-unlocked', ()=>{ openBtn.style.display = ''; }, { once:true });

  if(playBtn) playBtn.addEventListener('click', ()=>{ if(bgMusic) bgMusic.play(); playBtn.style.display='none'; if(pauseBtn) pauseBtn.style.display='inline-block'; });
  if(pauseBtn) pauseBtn.addEventListener('click', ()=>{ if(bgMusic){ bgMusic.pause(); pauseBtn.style.display='none'; if(playBtn) playBtn.style.display='inline-block'; }});
  if(volume) volume.addEventListener('input', ()=>{ if(bgMusic) bgMusic.volume = parseFloat(volume.value); });
}

// Boot
document.addEventListener('DOMContentLoaded', ()=>{
  try{
    initUnlock();
    initTimers();
    initLetterPage();
  }catch(e){
    console.error('init error', e);
  }
});
