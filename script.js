// Robust overlay + letter behavior with a temporary TEST UNLOCK button for debugging
// Password (client-side): 0410

const UNLOCK_KEY = 'valentine_unlocked';
const CORRECT_PASS = '0410';

function safeLocalGet() {
  try { return localStorage.getItem(UNLOCK_KEY) === '1'; } catch(e) { return false; }
}
function safeLocalSet() {
  try { localStorage.setItem(UNLOCK_KEY, '1'); } catch(e) {}
}

function hideMainContent() {
  document.querySelectorAll('.cover, .container, .hearts, .letter-only, .flower-only').forEach(el=>{
    if(!el) return;
    el.style.display = 'none';
    el.setAttribute('aria-hidden','true');
  });
  // ensure letter-specific controls hidden too
  const openBtn = document.getElementById('open-letter-btn');
  if(openBtn) openBtn.style.display = 'none';
  const letterFull = document.getElementById('letter-full');
  if(letterFull) letterFull.style.display = 'none';
}

function revealMainContent() {
  document.querySelectorAll('.cover, .container, .hearts, .letter-only, .flower-only').forEach(el=>{
    if(!el) return;
    el.style.display = '';
    el.removeAttribute('aria-hidden');
  });
  // show open-letter button if present, keep actual letter image hidden until button clicked
  const openBtn = document.getElementById('open-letter-btn');
  if(openBtn) openBtn.style.display = '';
  const letterFull = document.getElementById('letter-full');
  if(letterFull) letterFull.style.display = 'none';
}

function ensureOverlayExists() {
  let overlay = document.getElementById('lock-overlay');
  if (overlay) return overlay;

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

function addTestUnlockButton() {
  // visible, small test button; remove after you confirm behavior is fixed
  if(document.getElementById('debug-unlock-btn')) return;
  const btn = document.createElement('button');
  btn.id = 'debug-unlock-btn';
  btn.textContent = 'TEST UNLOCK';
  Object.assign(btn.style, {
    position: 'fixed',
    right: '12px',
    bottom: '12px',
    zIndex: 999999,
    padding: '8px 10px',
    background: '#d6455b',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '700',
    fontSize: '12px',
    boxShadow: '0 6px 18px rgba(0,0,0,0.2)'
  });
  btn.addEventListener('click', ()=> {
    safeLocalSet();
    revealSite();
  });
  document.body.appendChild(btn);
}

function revealSite(){
  // Remove overlay and reveal content. Called when unlocked.
  const overlay = document.getElementById('lock-overlay');
  if(overlay) {
    overlay.style.display = 'none';
    overlay.setAttribute('aria-hidden','true');
  }
  revealMainContent();
  document.dispatchEvent(new Event('site-unlocked'));
}

function hideSite(){
  const overlay = ensureOverlayExists();
  overlay.style.display = '';
  overlay.setAttribute('aria-hidden','false');
  // Put overlay at top of DOM so it's above other elements
  try { document.body.appendChild(overlay); } catch(e){}
  hideMainContent();
}

function initUnlockBehaviour(){
  const overlay = ensureOverlayExists();
  const input = document.getElementById('password-input');
  const unlockBtn = document.getElementById('unlock-btn');
  const focusHelper = document.getElementById('focus-helper');
  const err = document.getElementById('lock-error');

  // ensure overlay styles and top stacking
  overlay.style.zIndex = '2147483647';
  overlay.style.pointerEvents = 'auto';

  // mobile helper focus
  if(focusHelper){
    focusHelper.addEventListener('click', ()=> { try { input.focus(); } catch(e){} });
  }

  // focus on touch first interaction (iOS quirks)
  function onInitialTouch(){
    try { input.focus(); } catch(e){}
    overlay.removeEventListener('touchstart', onInitialTouch);
  }
  overlay.addEventListener('touchstart', onInitialTouch, { passive: true });

  // Unlock handler
  unlockBtn.addEventListener('click', ()=>{
    const val = (input.value || '').trim();
    if(val === CORRECT_PASS){
      try { localStorage.setItem(UNLOCK_KEY, '1'); } catch(e){}
      revealSite();
    } else {
      if(err) err.textContent = 'Incorrect password — try again.';
      input.value = '';
      try { input.focus(); } catch(e){}
    }
  });

  input.addEventListener('keydown', (e)=>{
    if(e.key === 'Enter') { unlockBtn.click(); e.preventDefault(); }
  });

  // If already unlocked in localStorage, reveal immediately
  if(safeLocalGet()){
    revealSite();
  } else {
    hideSite();
    // try focusing input shortly after load (helps iOS)
    setTimeout(()=> { try { input.focus(); } catch(e){} }, 60);
  }

  // Add the test unlock button so you can confirm page reveals while we debug
  addTestUnlockButton();
}

/* -------------------------
   Letter behavior
   - Open Letter button shows large image (still blurred)
   - Clicking large image reveals message and attempts to play music (user gesture)
   ------------------------- */
function initLetterBehaviour(){
  const openBtn = document.getElementById('open-letter-btn');
  const letterFull = document.getElementById('letter-full');
  const flowerMessage = document.getElementById('flower-message');
  const musicControls = document.getElementById('music-controls');
  const bgMusic = document.getElementById('bg-music');
  const playBtn = document.getElementById('play-btn');
  const pauseBtn = document.getElementById('pause-btn');
  const volumeSlider = document.getElementById('volume');
  const instructions = document.getElementById('letter-instructions');

  if(!openBtn || !letterFull || !flowerMessage) return;

  const MESSAGE = "i hate the distance and im sorry i couldnt bring you flowers mi vida i promise you ill make it up to you one day";

  flowerMessage.textContent = MESSAGE;
  flowerMessage.style.display = 'none';
  flowerMessage.setAttribute('aria-hidden','true');

  // Show letter image when Open Letter clicked
  openBtn.addEventListener('click', ()=>{
    letterFull.style.display = '';
    openBtn.style.display = 'none';
    // attach click/keyboard handlers on letter to reveal message & play
    if(!letterFull._attached){
      const activate = (e)=>{
        if(e.type === 'keydown' && !(e.key === 'Enter' || e.key === ' ')) return;
        revealMessageAndPlay();
      };
      letterFull.addEventListener('click', activate);
      letterFull.addEventListener('keydown', activate);
      letterFull._attached = true;
      letterFull.setAttribute('tabindex','0');
      letterFull.setAttribute('role','button');
    }
  });

  function revealMessageAndPlay(){
    // unblur image
    letterFull.classList.remove('blurred-img');
    letterFull.classList.add('revealed-img');
    letterFull.removeAttribute('role');

    // show message
    flowerMessage.style.display = '';
    flowerMessage.setAttribute('aria-hidden','false');

    // show music controls
    if(musicControls) { musicControls.style.display = 'block'; musicControls.setAttribute('aria-hidden','false'); }
    if(instructions) instructions.style.display = 'none';

    // play music (user gesture)
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

  if(playBtn){
    playBtn.addEventListener('click', ()=> {
      if(bgMusic) bgMusic.play();
      playBtn.style.display = 'none';
      if(pauseBtn) pauseBtn.style.display = 'inline-block';
    });
  }
  if(pauseBtn){
    pauseBtn.addEventListener('click', ()=> {
      if(bgMusic){ bgMusic.pause(); pauseBtn.style.display='none'; if(playBtn) playBtn.style.display='inline-block'; }
    });
  }
  if(volumeSlider){
    volumeSlider.addEventListener('input', ()=> { if(bgMusic) bgMusic.volume = parseFloat(volumeSlider.value); });
  }

  // Show Open Letter button immediately if already unlocked
  if(safeLocalGet()){
    const ob = document.getElementById('open-letter-btn');
    if(ob) ob.style.display = '';
  } else {
    // when site-unlocked dispatched, show it
    document.addEventListener('site-unlocked', ()=>{
      const ob = document.getElementById('open-letter-btn');
      if(ob) ob.style.display = '';
    }, { once: true });
  }
}

/* -------------------------
   Boot
   ------------------------- */
document.addEventListener('DOMContentLoaded', ()=>{
  try {
    ensureOverlayExists();   // if missing, create it
    initUnlockBehaviour();
    initLetterBehaviour();
  } catch(err){
    console.error('Bootstrap error', err);
    // As a last resort, reveal content so page isn't blank
    document.querySelectorAll('.cover, .container, .hearts, .letter-only, .flower-only').forEach(el=>{
      if(el){ el.style.display = ''; el.removeAttribute('aria-hidden'); }
    });
  }
});
