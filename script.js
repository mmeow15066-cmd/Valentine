// Shared behavior across pages
// Password remains client-side for this private surprise: 0410
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
  const overlay = document.getElementById('lock-overlay');
  const input = document.getElementById('password-input');
  const unlockBtn = document.getElementById('unlock-btn');
  const errorP = document.getElementById('lock-error');
  const body = document.body;
  const heartsContainer = document.getElementById('hearts');

  // If overlay or controls are missing, inject a simple fallback overlay so site is always protected
  if(!overlay || !input || !unlockBtn){
    // build fallback overlay and attach to top of body
    const html = `
      <div id="lock-overlay" class="overlay" role="dialog" aria-modal="true" aria-labelledby="lock-title" aria-describedby="lock-hint" aria-hidden="false">
        <div class="lock-box" role="document">
          <h1 id="lock-title">Enter password</h1>
          <input id="password-input" type="password" inputmode="numeric" pattern="[0-9]*" placeholder="Password" aria-label="Password" autocomplete="off" />
          <button id="unlock-btn" type="button">Unlock</button>
          <p id="lock-hint" class="hint">Hint: it's a 4-digit code</p>
          <p id="lock-error" class="error" aria-live="polite"></p>
        </div>
      </div>`;
    document.body.insertAdjacentHTML('afterbegin', html);
  }

  // re-select (now guaranteed)
  const ov = document.getElementById('lock-overlay');
  const pwInput = document.getElementById('password-input');
  const btn = document.getElementById('unlock-btn');
  const err = document.getElementById('lock-error');

  if(!ov || !pwInput || !btn) return;

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
  function startHearts(){
    if(heartsInterval) return;
    for(let i=0;i<8;i++) createHeart();
    heartsInterval = setInterval(createHeart, 1200);
  }
  function stopHearts(){ if(heartsInterval){ clearInterval(heartsInterval); heartsInterval = null; } }

  // reveal/hide helpers
  function revealSite(){
    body.classList.remove('locked');
    ov.style.display = 'none';
    ov.setAttribute('aria-hidden','true');
    document.querySelectorAll('.cover, .container, .hearts, .letter-only, .flower-only').forEach(el=>{
      el.removeAttribute('aria-hidden');
      el.style.display = '';
    });
    startHearts();
    document.dispatchEvent(new Event('site-unlocked'));
  }
  function hideSite(){
    body.classList.add('locked');
    ov.style.display = '';
    ov.setAttribute('aria-hidden','false');
    document.querySelectorAll('.cover, .container, .hearts, .letter-only, .flower-only').forEach(el=>{
      el.setAttribute('aria-hidden','true');
    });
    stopHearts();
  }

  // Focus trap (simple)
  function trapFocus(){
    const focusable = ov.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const nodes = Array.prototype.slice.call(focusable);
    if(nodes.length === 0) return;
    const first = nodes[0], last = nodes[nodes.length - 1];
    function onKey(e){
      if(e.key === 'Tab'){
        if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
        else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
      } else if(e.key === 'Escape'){
        pwInput.value = '';
        err.textContent = '';
      }
    }
    ov.addEventListener('keydown', onKey);
    setTimeout(()=> {
      // focus input (works on desktop & mobile)
      try { pwInput.focus(); } catch(e){}
      // On some mobile browsers focus may need a small delay
      setTimeout(()=> { try { pwInput.focus(); } catch(e){} }, 50);
    }, 10);
  }

  // Initialize: reveal immediately if previously unlocked, otherwise hide and trap focus
  if(isUnlocked()){
    revealSite();
  } else {
    hideSite();
    trapFocus();
  }

  // unlock handler
  btn.addEventListener('click', ()=>{
    const val = (pwInput.value || '').trim();
    if(val === CORRECT_PASS){
      try { localStorage.setItem(UNLOCK_KEY, '1'); } catch(e){}
      revealSite();
    } else {
      err.textContent = 'Incorrect password — try again.';
      pwInput.value = '';
      try { pwInput.focus(); } catch(e){}
    }
  });

  // Enter key
  pwInput.addEventListener('keydown', (e)=>{ if(e.key === 'Enter'){ btn.click(); e.preventDefault(); } });

  // stop hearts on unload
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
      // ensure letter image focusable
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
