// Shared behavior across pages
// Safe to include on every page — each init function returns early if required elements are missing.

const UNLOCK_KEY = 'valentine_unlocked';
const CORRECT_PASS = '0410'; // NOTE: client-side password is visible in source. That's expected for a local surprise.

// ---- Unlock / overlay ----
function initUnlock(){
  const overlay = document.getElementById('lock-overlay');
  const input = document.getElementById('password-input');
  const unlockBtn = document.getElementById('unlock-btn');
  const errorP = document.getElementById('lock-error');
  const body = document.body;
  const heartsContainer = document.getElementById('hearts');

  if(!overlay || !input || !unlockBtn) return;

  let heartsInterval = null;
  let createdHeartCount = 0;

  function createHeart(){
    const h = document.createElement('div');
    h.className = 'heart';
    h.textContent = '❤';
    const left = Math.random() * 100;
    h.style.left = left + 'vw';
    const dur = 4 + Math.random() * 3;
    const delay = Math.random() * 0.6;
    h.style.animationDuration = dur + 's';
    h.style.animationDelay = delay + 's';
    const size = 14 + Math.floor(Math.random()*28);
    h.style.fontSize = size + 'px';
    heartsContainer.appendChild(h);
    createdHeartCount++;
    // remove after animation finishes
    setTimeout(()=> { if(h && h.parentNode) h.parentNode.removeChild(h); }, (dur + delay) * 1000 + 600);
  }

  function startHearts(){
    if(!heartsContainer || heartsInterval) return;
    for(let i=0;i<10;i++) createHeart();
    heartsInterval = setInterval(createHeart, 1200);
  }
  function stopHearts(){
    if(heartsInterval) { clearInterval(heartsInterval); heartsInterval = null; }
  }

  function showContent(){
    body.classList.remove('locked');
    // Remove the overlay from the accessibility tree
    overlay.style.display = 'none';
    // Reveal UI for screen readers
    document.querySelectorAll('.cover, .container, .hearts').forEach(el=>{
      el.removeAttribute('aria-hidden');
      el.style.display = '';
    });
  }

  function hideContent(){
    body.classList.add('locked');
    overlay.style.display = '';
    document.querySelectorAll('.cover, .container, .hearts').forEach(el=>{
      el.setAttribute('aria-hidden','true');
      // do not set inline display here; CSS handles hiding when body.locked is present
    });
  }

  function setUnlocked(){
    showContent();
    try { localStorage.setItem(UNLOCK_KEY, '1'); } catch(e){}
    startHearts();
    // show a small relock control for convenience (non-intrusive)
    addRelockButton();
  }

  function addRelockButton(){
    if(document.getElementById('relock-btn')) return;
    const btn = document.createElement('button');
    btn.id = 'relock-btn';
    btn.textContent = 'Lock';
    btn.title = 'Re-lock the page';
    btn.className = 'btn';
    btn.style.position = 'fixed';
    btn.style.right = '14px';
    btn.style.bottom = '14px';
    btn.style.zIndex = 50;
    btn.addEventListener('click', ()=>{
      try { localStorage.removeItem(UNLOCK_KEY); } catch(e){}
      stopHearts();
      hideContent();
      input.value = '';
      errorP.textContent = '';
      overlay.focus();
      // remove relock button
      btn.remove();
      // ensure overlay is focusable
      trapFocusInOverlay();
    });
    document.body.appendChild(btn);
  }

  // Focus trap for overlay (simple)
  function trapFocusInOverlay(){
    const focusable = overlay.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const focusableArray = Array.prototype.slice.call(focusable);
    if(focusableArray.length === 0) return;
    let first = focusableArray[0];
    let last = focusableArray[focusableArray.length - 1];
    function keyHandler(e){
      if(e.key === 'Tab'){
        if(e.shiftKey && document.activeElement === first){
          e.preventDefault();
          last.focus();
        } else if(!e.shiftKey && document.activeElement === last){
          e.preventDefault();
          first.focus();
        }
      } else if(e.key === 'Escape'){
        // Clear input and error on Escape for a better UX
        input.value = '';
        errorP.textContent = '';
      }
    }
    overlay.addEventListener('keydown', keyHandler);
    // store handler so it can be removed if overlay removed
    overlay._keyHandler = keyHandler;
    // move focus to input
    setTimeout(()=> input.focus(), 10);
  }

  // If unlocked previously, reveal content
  try {
    if(localStorage.getItem(UNLOCK_KEY) === '1') { setUnlocked(); }
    else {
      hideContent();
      // ensure overlay is visible and trap focus there
      trapFocusInOverlay();
    }
  } catch(e) {
    hideContent();
    trapFocusInOverlay();
  }

  // Unlock handler
  unlockBtn.addEventListener('click', ()=>{
    const val = input.value.trim();
    if(val === CORRECT_PASS){
      setUnlocked();
    } else {
      errorP.textContent = 'Incorrect password — try again.';
      input.value = '';
      input.focus();
    }
  });
  input.addEventListener('keydown', (e)=>{ if(e.key === 'Enter') unlockBtn.click(); });

  // Clean up when navigating away (stop intervals)
  window.addEventListener('beforeunload', ()=> { stopHearts(); });

}

// ---- Timers used on index page ----
function initTimers(){
  const startDate = new Date(Date.UTC(2025, 9, 4, 0, 0, 0)); // 04 Oct 2025 UTC
  const sinceEl = document.getElementById('since');
  const countdownEl = document.getElementById('countdown');
  if(!sinceEl && !countdownEl) return;

  function pad(n){ return n.toString().padStart(2,'0'); }

  function updateTimers(){
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
    if(nextAnn <= now) nextAnn = new Date(year + 1, 9, 4, 0, 0, 0);
    let rem = nextAnn - now;
    if(rem < 0) rem = 0;
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
   Letter page behavior
   ------------------------- */
function initLetterPage(){
  const letterFull = document.getElementById('letter-full');
  const flowerMessage = document.getElementById('flower-message');
  const musicControls = document.getElementById('music-controls');
  const bgMusic = document.getElementById('bg-music');
  const playBtn = document.getElementById('play-btn');
  const pauseBtn = document.getElementById('pause-btn');
  const volumeSlider = document.getElementById('volume');
  const instructions = document.getElementById('letter-instructions');

  if(!letterFull) return;

  const MESSAGE = "i hate the distance and im sorry i couldnt bring you flowers mi vida i promise you ill make it up to you one day";

  function revealMessageAndPlay(){
    if(flowerMessage){
      flowerMessage.textContent = MESSAGE;
      flowerMessage.setAttribute('aria-hidden', 'false');
      setTimeout(()=> flowerMessage.classList.add('show'), 40);
    }
    if(musicControls){
      musicControls.style.display = 'block';
      musicControls.setAttribute('aria-hidden','false');
    }
    if(bgMusic){
      try { bgMusic.volume = parseFloat((volumeSlider && volumeSlider.value) || '0.8'); } catch(e){}
      bgMusic.currentTime = 0;
      // play in response to user gesture (click) — should be allowed
      bgMusic.play().then(()=> {
        if(playBtn) playBtn.style.display = 'none';
        if(pauseBtn) pauseBtn.style.display = 'inline-block';
      }).catch(()=> {
        // play blocked or audio missing — show play button so user can attempt manually
        if(playBtn) playBtn.style.display = 'inline-block';
        if(pauseBtn) pauseBtn.style.display = 'none';
      });
    }
    if(instructions) instructions.style.display = 'none';
  }

  // Clicking letter reveals message and attempts to play (user gesture)
  letterFull.addEventListener('click', revealMessageAndPlay);

  // buttons
  if(playBtn){
    playBtn.addEventListener('click', ()=> {
      if(bgMusic) bgMusic.play().then(()=> {
        playBtn.style.display = 'none';
        if(pauseBtn) pauseBtn.style.display = 'inline-block';
      }).catch(()=>{ /* ignore */});
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
}

/* -------------------------
   Flowers page behavior
   ------------------------- */
function initFlowersPage(){
  const flowersFull = document.getElementById('flowers-full');
  const flowerMessage = document.getElementById('flower-message');
  if(!flowersFull) return;

  const MESSAGE = "i hate the distance and im sorry i couldnt bring you flowers mi vida i promise you ill make it up to you one day";

  if(flowerMessage){
    flowerMessage.textContent = MESSAGE;
    flowerMessage.setAttribute('aria-hidden', 'false');
    setTimeout(()=> flowerMessage.classList.add('show'), 60);
  }

  // optional: clicking the image opens it in a new tab on small screens
  flowersFull.addEventListener('click', ()=>{
    if(window.innerWidth < 900 && flowersFull.src) window.open(flowersFull.src, '_blank');
  });
}

// ----------------------
// Bootstrapping
// ----------------------
document.addEventListener('DOMContentLoaded', () => {
  // init all shared behaviors (each will return early if not relevant)
  initUnlock();
  initTimers();
  initLetterPage();
  initFlowersPage();
});
