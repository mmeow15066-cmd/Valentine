// script.js (debug-enabled)
// Shared behavior across pages
const UNLOCK_KEY = 'valentine_unlocked';
const CORRECT_PASS = '0410';

console.log('[site] script.js loaded');

// Utility to check unlocked state
function isUnlocked(){
  try { return localStorage.getItem(UNLOCK_KEY) === '1'; } catch(e){ console.warn('[site] localStorage read failed', e); return false; }
}

/* -------------------------
   Unlock overlay (present on every page)
   ------------------------- */
function initUnlock(){
  console.log('[site] initUnlock start');
  const overlay = document.getElementById('lock-overlay');
  const input = document.getElementById('password-input');
  const unlockBtn = document.getElementById('unlock-btn');
  const errorP = document.getElementById('lock-error');
  const body = document.body;
  const heartsContainer = document.getElementById('hearts');

  // Small visual debug area (will be appended to lock-box if available)
  let debugEl = null;
  function debug(msg){
    console.log('[site] ' + msg);
    if(!debugEl && document.getElementById('lock-overlay')){
      const box = document.querySelector('#lock-overlay .lock-box');
      if(box){
        debugEl = document.createElement('div');
        debugEl.style.marginTop = '0.6rem';
        debugEl.style.fontSize = '0.8rem';
        debugEl.style.color = '#444';
        debugEl.textContent = 'Debugger: waiting...';
        box.appendChild(debugEl);
      }
    }
    if(debugEl) debugEl.textContent = msg;
  }

  if(!overlay || !input || !unlockBtn){
    console.warn('[site] initUnlock: required elements not found', {overlay: !!overlay, input: !!input, unlockBtn: !!unlockBtn});
    return;
  }

  debug('initUnlock running — elements OK');

  let heartsInterval = null;
  function createHeart(){
    if(!heartsContainer) return;
    const h = document.createElement('div');
    h.className = 'heart';
    h.textContent = '❤';
    h.style.left = (Math.random() * 100) + 'vw';
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
    if(!heartsContainer || heartsInterval) return;
    for(let i=0;i<8;i++) createHeart();
    heartsInterval = setInterval(createHeart, 1200);
  }
  function stopHearts(){
    if(heartsInterval){ clearInterval(heartsInterval); heartsInterval = null; }
  }

  function revealSite(){
    debug('Revealing site');
    body.classList.remove('locked');
    overlay.style.display = 'none';
    document.querySelectorAll('.cover, .container, .hearts, .letter-only, .flower-only').forEach(el=>{
      el.removeAttribute('aria-hidden');
      el.style.display = '';
    });
    startHearts();
    document.dispatchEvent(new Event('site-unlocked'));
    debug('site-unlocked dispatched; localStorage set');
  }

  function hideSite(){
    debug('Hiding site (locked)');
    body.classList.add('locked');
    overlay.style.display = '';
    document.querySelectorAll('.cover, .container, .hearts, .letter-only, .flower-only').forEach(el=>{
      el.setAttribute('aria-hidden','true');
    });
    stopHearts();
  }

  // focus trap
  function trapFocus(){
    const focusable = overlay.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const nodes = Array.prototype.slice.call(focusable);
    if(nodes.length === 0){ debug('trapFocus: no focusable nodes'); return; }
    const first = nodes[0], last = nodes[nodes.length - 1];
    function handleKey(e){
      if(e.key === 'Tab'){
        if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
        else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
      } else if(e.key === 'Escape'){
        input.value = '';
        errorP.textContent = '';
      }
    }
    overlay.addEventListener('keydown', handleKey);
    overlay._keyHandler = handleKey;
    setTimeout(()=> input.focus(), 10);
  }

  // Initialize based on existing state
  try {
    if(isUnlocked()){
      debug('Already unlocked (localStorage)');
      revealSite();
    } else {
      debug('Locked — awaiting password');
      hideSite();
      trapFocus();
    }
  } catch(e){
    console.warn('[site] initUnlock error', e);
    debug('Error during initUnlock — see console');
  }

  // Handler (with debug)
  unlockBtn.addEventListener('click', ()=>{
    const raw = input.value || '';
    const val = raw.trim();
    debug('Attempting unlock with: "' + val + '"');
    // show the typed value in console (not shown on page), for debugging
    console.log('[site] typed value (debug) ->', JSON.stringify(val));

    // Compare strictly
    if(val === CORRECT_PASS){
      debug('Password correct — unlocking');
      try { localStorage.setItem(UNLOCK_KEY, '1'); } catch(e){ console.warn('[site] localStorage write failed', e); debug('localStorage write failed'); }
      revealSite();
    } else {
      debug('Password incorrect');
      errorP.textContent = 'Incorrect password — try again.';
      input.value = '';
      input.focus();
    }
  });

  // also handle Enter key
  input.addEventListener('keydown', (e)=>{
    if(e.key === 'Enter'){
      unlockBtn.click();
      e.preventDefault();
    }
  });

  // Clean up on unload
  window.addEventListener('beforeunload', stopHearts);
  console.log('[site] initUnlock attached handlers');
}
