// Shared behavior across pages
// Password is client-side for this private surprise: 0410
const UNLOCK_KEY = 'valentine_unlocked';
const CORRECT_PASS = '0410';

// Utility: read unlocked state
function isUnlocked(){
  try { return localStorage.getItem(UNLOCK_KEY) === '1'; } catch(e){ return false; }
}

/* -------------------------
   Unlock overlay (present on every page)
   ------------------------- */
function initUnlock(){
  // select existing overlay controls
  let overlay = document.getElementById('lock-overlay');
  let input = document.getElementById('password-input');
  let unlockBtn = document.getElementById('unlock-btn');
  let errorP = document.getElementById('lock-error');
  const body = document.body;
  const heartsContainer = document.getElementById('hearts');

  // If missing, inject fallback overlay (guarantees it exists)
  if(!overlay || !input || !unlockBtn){
    const html = `
      <div id="lock-overlay" class="overlay" role="dialog" aria-modal="true" aria-labelledby="lock-title" aria-describedby="lock-hint" aria-hidden="false">
        <div class="lock-box" role="document">
          <h1 id="lock-title">Enter password</h1>
          <input id="password-input" type="tel" inputmode="numeric" pattern="[0-9]*" placeholder="Password" aria-label="Password" autocomplete="off" />
          <button id="unlock-btn" type="button">Unlock</button>
          <p id="lock-hint" class="hint">Hint: it's a 4-digit code</p>
          <p id="lock-error" class="error" aria-live="polite"></p>
        </div>
      </div>`;
    document.body.insertAdjacentHTML('afterbegin', html);
    overlay = document.getElementById('lock-overlay');
    input = document.getElementById('password-input');
    unlockBtn = document.getElementById('unlock-btn');
    errorP = document.getElementById('lock-error');
  }

  // Ensure overlay is appended to body (on top)
  try { document.body.appendChild(overlay); } catch(e){ /* ignore */ }

  // mobile-friendly: focus input on first touch/click of overlay (fixes iOS focus restrictions)
  let touchedOnce = false;
  overlay.addEventListener('touchstart', function onTouch(){
    if(touchedOnce) return;
    touchedOnce = true;
    try { input.focus(); } catch(e){}
    // remove early listener after first focus
    overlay.removeEventListener('touchstart', onTouch);
  }, { passive: true });

  overlay.addEventListener('click', (e)=>{
    // if user taps the backdrop (not the lock-box), focus input
    if(e.target === overlay) {
      try { input.focus(); } catch(e){}
    }
  });

  // hearts animation
  let heartsInterval = null;
  function createHeart(){
    if(!heartsContainer) return;
    const h = document.createElement('div');
    h.className = 'heart';
    h.textContent = '❤';
    h.style.left = (Math.random()*100) + 'vw';
    const dur = 4 + Math.random() * 3;
    const delay = Math.random() * 0.6;
    h.style.animationDuration = dur + 's';
    h.style.animationDelay = delay + 's';
    const size = 14 + Math.floor(Math.random()*28);
    h.style.fontSize = size + 'px';
    heartsContainer.appendChild(h);
    setTimeout(()=> { if(h && h.parentNode) h.parentNode.removeChild(h); }, (dur + delay) * 1000 + 600);
  }
  function startHearts(){ if(heartsInterval) return; for(let i=0;i<8;i++) createHeart(); heartsInterval = setInterval(createHeart, 1200); }
  function stopHearts(){ if(heartsInterval){ clearInterval(heartsInterval); heartsInterval = null; } }

  // show / hide helpers
  function revealSite(){
    body.classList.remove('locked');
    overlay.style.display = 'none';
    overlay.setAttribute('aria-hidden','true');
    document.querySelectorAll('.cover, .container, .hearts, .letter-only, .flower-only').forEach(el=>{
      el.removeAttribute('aria-hidden');
      el.style.display = '';
    });
    startHearts();
    document.dispatchEvent(new Event('site-unlocked'));
  }
  function hideSite(){
    body.classList.add('locked');
    overlay.style.display = '';
    overlay.setAttribute('aria-hidden','false');
    document.querySelectorAll('.cover, .container, .hearts, .letter-only, .flower-only').forEach(el=>{
      el.setAttribute('aria-hidden','true');
    });
    stopHearts();
  }

  // Focus trap (safe/simple)
  function trapFocus(){
    const focusable = overlay.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const nodes = Array.prototype.slice.call(focusable);
    if(nodes.length === 0) {
      // try to focus input directly after a small delay
      setTimeout(()=> { try { input.focus(); } catch(e){} }, 50);
      return;
    }
    const first = nodes[0], last = nodes[nodes.length - 1];
    function onKey(e){
      if(e.key === 'Tab'){
        if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
        else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
      } else if(e.key === 'Escape'){
        input.value = '';
        if(errorP) errorP.textContent = '';
      }
    }
    overlay.addEventListener('keydown', onKey);
    // focus input (delayed works better on iOS)
    setTimeout(()=> { try { input.focus(); } catch(e){} }, 50);
  }

  // Initialize
  if(isUnlocked()){
    revealSite();
  } else {
    hideSite();
    trapFocus();
  }

  // unlock handler
  unlockBtn.addEventListener('click', ()=>{
    const val = (input.value || '').trim();
    if(val === CORRECT_PASS){
      try { localStorage.setItem(UNLOCK_KEY, '1'); } catch(e){}
      revealSite();
    } else {
      if(errorP) errorP.textContent = 'Incorrect password — try again.';
      input.value = '';
      try { input.focus(); } catch(e){}
    }
  });

  // Enter key
  input.addEventListener('keydown', (e)=>{ if(e.key === 'Enter'){ unlockBtn.click(); e.preventDefault(); } });

  // cleanup
  window.addEventListener('beforeunload', stopHearts);
}

/* -------------------------
   Timers used on index page
   ------------------------- */
function initTimers(){
  const sinceEl = document.getElementById('since');
  const countdownEl = document.getElementById('countdown');
  if(!sinceEl && !countdownEl) return;
  const startDate = new Date(Date.UTC(2025, 9, 4, 0, 0, 0)); // 04 Oct 2025 UTC

  function pad(n){ return n.toString().padStart(2,'0'); }

  function updateTimers(){
    const now = new Date();
    let diffMs = now - startDate; if(diffMs < 0) diffMs = 0;
    const days = Math.floor(diffMs / (1000*60*60*24));
    const hours = Math.floor((diffMs % (1000*60*60*24)) / (1000*60*60));
    const minutes = Math.floor((diffMs % (1000*60*60)) / (1000*60));
    const seconds = Math.floor((diffMs % (1000*60)) / 1000);
    if(sinceEl) sinceEl.textContent = `${days} days ${pad(hours)}:${pad(minutes)}:${pad(seconds)} since 04 Oct 2025`;

    const year = now.getFullYear();
    let nextAnn = new Date(year, 9, 4, 0, 0, 0);
    if(nextAnn <= now) nextAnn = new Date(year + 1, 9, 4, 0, 0, 0);
    let rem = nextAnn - now; if(rem < 0) rem = 0;
    const rd = Math.floor(rem / (1000*60*60*24));
    const rh = Math.floor((rem % (1000*60*60*24)) / (1000*60*60));
    const rm = Math.floor((rem % (1000*60*60)) / (1000*60));
    const rs = Math.floor((rem % (1000*60)) / 1000);
    if(countdownEl) countdownEl.textContent = `${rd} days ${pad(rh)}:${pad(rm)}:${pad(rs)} until ${nextAnn.toLocaleDateString()}`;
  }

  updateTimers();
  const timersInterval = setInterval(updateTimers, 1000);
  window.addEventListener('beforeunload', ()=> clearInterval(timersInterval));
}

/* -------------------------
   Letter page behavior (image blurred -> reveal message & play)
   ------------------------- */
function initLetterPage(){
  const letterFull = document.getElementById('letter-full');
  const flowerMessage = document.getElementById('flower-message');
  const inlineFlowers = document.getElementById('inline-flowers');
  const musicControls = document.getElementById('music-controls');
  const bgMusic = document.getElementById('bg-music');
  const playBtn = document.getElementById('play-btn');
  const pauseBtn = document.getElementById('pause-btn');
  const volumeSlider = document.getElementById('volume');
  const instructions = document.getElementById('letter-instructions');

  if(!letterFull || !flowerMessage) return;

  const MESSAGE = "i hate the distance and im sorry i couldnt bring you flowers mi vida i promise you ill make it up to you one day";

  function prepareForReveal(){
    flowerMessage.textContent = MESSAGE;
    flowerMessage.setAttribute('aria-hidden','true');
    flowerMessage.classList.remove('show');

    if(inlineFlowers) inlineFlowers.setAttribute('aria-hidden','false');

    if(!letterFull._listenerAdded){
      const activate = (e)=>{
        if(e.type === 'keydown' && !(e.key === 'Enter' || e.key === ' ')) return;
        revealMessageAndPlay();
      };
      letterFull.addEventListener('click', activate);
      letterFull.addEventListener('keydown', activate);
      letterFull._listenerAdded = true;
      letterFull.setAttribute('tabindex','0');
      letterFull.setAttribute('role','button');
    }
  }

  function revealMessageAndPlay(){
    letterFull.classList.remove('blurred-img');
    letterFull.classList.add('revealed-img');
    letterFull.removeAttribute('role');

    flowerMessage.setAttribute('aria-hidden','false');
    flowerMessage.classList.add('show');

    if(musicControls){
      musicControls.style.display = 'block';
      musicControls.setAttribute('aria-hidden','false');
    }
    if(instructions) instructions.style.display = 'none';

    if(bgMusic){
      try { bgMusic.volume = parseFloat((volumeSlider && volumeSlider.value) || '0.8'); } catch(e){}
      bgMusic.currentTime = 0;
      bgMusic.play().then(()=> {
        if(playBtn) playBtn.style.display = 'none';
        if(pauseBtn) pauseBtn.style.display = 'inline-block';
      }).catch(()=> {
        if(playBtn) playBtn.style.display = 'inline-block';
        if(pauseBtn) pauseBtn.style.display = 'none';
      });
    }
  }

  // player controls
  if(playBtn){
    playBtn.addEventListener('click', ()=> {
      if(bgMusic) bgMusic.play().then(()=> {
        playBtn.style.display = 'none';
        if(pauseBtn) pauseBtn.style.display = 'inline-block';
      }).catch(()=>{});
    });
  }
  if(pauseBtn){
    pauseBtn.addEventListener('click', ()=> {
      if(bgMusic) { bgMusic.pause(); pauseBtn.style.display='none'; if(playBtn) playBtn.style.display='inline-block'; }
    });
  }
  if(volumeSlider){
    volumeSlider.addEventListener('input', ()=> { if(bgMusic) bgMusic.volume = parseFloat(volumeSlider.value); });
  }

  if(isUnlocked()){
    prepareForReveal();
  } else {
    document.addEventListener('site-unlocked', prepareForReveal, { once: true });
  }

  // inline flower click -> open in new tab on small screens
  if(inlineFlowers){
    const img = document.getElementById('flowers-inline');
    if(img){
      img.addEventListener('click', ()=>{
        if(window.innerWidth < 900 && img.src) window.open(img.src, '_blank');
      });
    }
  }
}

/* -------------------------
   Bootstrap
   ------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  initUnlock();
  initTimers();
  initLetterPage();
});
