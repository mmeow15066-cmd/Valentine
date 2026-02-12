// Shared script for all pages (robust lock + letter behavior)
// Password (client-side): 0410
const UNLOCK_KEY = 'valentine_unlocked';
const CORRECT_PASS = '0410';

// helper to safely read localStorage
function isUnlocked(){
  try { return localStorage.getItem(UNLOCK_KEY) === '1'; } catch(e){ return false; }
}

// hide all main content explicitly (called while locked)
function hideAllContent(){
  // hide top-level content elements explicitly
  document.querySelectorAll('.cover, .container, .hearts, .letter-only, .flower-only').forEach(el=>{
    if(el) el.style.display = 'none';
    if(el) el.setAttribute('aria-hidden','true');
  });
  // ensure letter-specific elements hidden too (if present)
  const openBtn = document.getElementById('open-letter-btn');
  if(openBtn) openBtn.style.display = 'none';
  const letterFull = document.getElementById('letter-full');
  if(letterFull) letterFull.style.display = 'none';
}

// reveal main content (but keep letter image hidden until Open Letter button clicked)
function revealAllContent(){
  document.querySelectorAll('.cover, .container, .hearts, .letter-only, .flower-only').forEach(el=>{
    if(el) el.style.display = '';
    if(el) el.removeAttribute('aria-hidden');
  });
  // show Open Letter button (if present) but keep letter image hidden
  const openBtn = document.getElementById('open-letter-btn');
  if(openBtn) openBtn.style.display = '';
  const letterFull = document.getElementById('letter-full');
  if(letterFull) letterFull.style.display = 'none';
}

// init the lock overlay and behavior
function initUnlock(){
  console.log('[site] initUnlock');
  let overlay = document.getElementById('lock-overlay');
  let input = document.getElementById('password-input');
  let unlockBtn = document.getElementById('unlock-btn');
  const focusHelper = document.getElementById('focus-helper');
  const errorP = document.getElementById('lock-error');
  const hearts = document.getElementById('hearts');

  if(!overlay || !input || !unlockBtn){
    // If overlay missing, bail (HTML files include it). Nothing to do.
    console.warn('[site] overlay or controls missing — expected in HTML');
    return;
  }

  // force overlay on top and append to body to prevent z-index issues
  document.body.appendChild(overlay);

  // mobile helper: focus input when helper tapped
  if(focusHelper){
    focusHelper.addEventListener('click', ()=> { try { input.focus(); } catch(e){} });
  }

  // ensure overlay blocks page until unlock: explicitly hide content
  function hideSite(){
    overlay.style.display = '';
    overlay.setAttribute('aria-hidden','false');
    hideAllContent();
  }
  function revealSite(){
    overlay.style.display = 'none';
    overlay.setAttribute('aria-hidden','true');
    revealAllContent();
    document.dispatchEvent(new Event('site-unlocked'));
  }

  // initial state
  if(isUnlocked()){
    revealSite();
  } else {
    hideSite();
    // try to focus input (delayed for iOS)
    setTimeout(()=>{ try { input.focus(); } catch(e){} }, 50);
    // also handle touchstart to focus on some iOS
    overlay.addEventListener('touchstart', function touchFocusOnce(){
      try { input.focus(); } catch(e){}
      overlay.removeEventListener('touchstart', touchFocusOnce);
    }, { passive: true });
  }

  // unlock handler
  unlockBtn.addEventListener('click', ()=> {
    const v = (input.value || '').trim();
    console.log('[site] trying unlock:', JSON.stringify(v));
    if(v === CORRECT_PASS){
      try { localStorage.setItem(UNLOCK_KEY, '1'); } catch(e){}
      revealSite();
    } else {
      if(errorP) errorP.textContent = 'Incorrect password — try again.';
      input.value = '';
      try { input.focus(); } catch(e){}
    }
  });
  // Enter key on input
  input.addEventListener('keydown', (e)=>{
    if(e.key === 'Enter'){
      unlockBtn.click();
      e.preventDefault();
    }
  });
}

// init letter page behavior (Open Letter -> show image -> click image to reveal message & play)
function initLetterPage(){
  const openBtn = document.getElementById('open-letter-btn');
  const letterFull = document.getElementById('letter-full');
  const flowerMessage = document.getElementById('flower-message');
  const inlineFlowers = document.getElementById('inline-flowers');
  const musicControls = document.getElementById('music-controls');
  const bgMusic = document.getElementById('bg-music');
  const playBtn = document.getElementById('play-btn');
  const pauseBtn = document.getElementById('pause-btn');
  const volumeSlider = document.getElementById('volume');
  const instructions = document.getElementById('letter-instructions');

  if(!openBtn || !letterFull || !flowerMessage) return;

  const MESSAGE = "i hate the distance and im sorry i couldnt bring you flowers mi vida i promise you ill make it up to you one day";

  function prepare(){
    // ensure message text ready but hidden
    flowerMessage.textContent = MESSAGE;
    flowerMessage.style.display = 'none';
    flowerMessage.setAttribute('aria-hidden','true');

    if(inlineFlowers) inlineFlowers.setAttribute('aria-hidden','false');

    // open button click shows image (still blurred)
    openBtn.addEventListener('click', ()=>{
      letterFull.style.display = '';
      openBtn.style.display = 'none';
      // attach reveal handlers
      if(!letterFull._listenerAdded){
        const activate = (e)=>{
          if(e.type === 'keydown' && !(e.key === 'Enter' || e.key === ' ')) return;
          reveal();
        };
        letterFull.addEventListener('click', activate);
        letterFull.addEventListener('keydown', activate);
        letterFull._listenerAdded = true;
        letterFull.setAttribute('tabindex','0');
        letterFull.setAttribute('role','button');
      }
    });
  }

  function reveal(){
    // unblur and reveal message
    letterFull.classList.remove('blurred-img');
    letterFull.classList.add('revealed-img');
    letterFull.removeAttribute('role');

    flowerMessage.style.display = '';
    flowerMessage.setAttribute('aria-hidden','false');
    flowerMessage.classList.add('show');

    if(musicControls){
      musicControls.style.display = 'block';
      musicControls.setAttribute('aria-hidden','false');
    }
    if(instructions) instructions.style.display = 'none';

    // attempt to play music (user gesture)
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

  // play/pause handlers
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

  // prepare when unlocked
  if(isUnlocked()){
    prepare();
    // when page loads unlocked, show Open Letter button (letter Full stays hidden)
    const openBtnLocal = document.getElementById('open-letter-btn');
    if(openBtnLocal) openBtnLocal.style.display = '';
  } else {
    document.addEventListener('site-unlocked', ()=> {
      prepare();
      const openBtnLocal = document.getElementById('open-letter-btn');
      if(openBtnLocal) openBtnLocal.style.display = '';
    }, { once: true });
  }

  // allow inline flower click to open large image on small screens
  if(inlineFlowers){
    const img = document.getElementById('flowers-inline');
    if(img){
      img.addEventListener('click', ()=>{
        if(window.innerWidth < 900 && img.src) window.open(img.src, '_blank');
      });
    }
  }
}

// bootstrap
document.addEventListener('DOMContentLoaded', () => {
  initUnlock();
  // hide all content first, then init timers and letter logic
  hideAllContent();
  initLetterPage();
  // initTimers (keeps same behavior if present)
  (function initTimers(){
    const sinceEl = document.getElementById('since');
    const countdownEl = document.getElementById('countdown');
    if(!sinceEl && !countdownEl) return;
    const startDate = new Date(Date.UTC(2025, 9, 4, 0, 0, 0));
    function pad(n){ return n.toString().padStart(2,'0'); }
    function update(){
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
    update();
    setInterval(update, 1000);
  })();
});
