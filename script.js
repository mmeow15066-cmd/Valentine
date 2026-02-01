// Shared behavior across pages

// Password unlock on index page
const UNLOCK_KEY = 'valentine_unlocked';
const CORRECT_PASS = '0410';

function initUnlock(){
  const overlay = document.getElementById('lock-overlay');
  const input = document.getElementById('password-input');
  const unlockBtn = document.getElementById('unlock-btn');
  const errorP = document.getElementById('lock-error');
  const body = document.body;
  const heartsContainer = document.getElementById('hearts');

  if(!overlay || !input || !unlockBtn) return;

  function startHearts(){
    if(!heartsContainer) return;
    for(let i=0;i<10;i++) createHeart();
    setInterval(()=> createHeart(), 1200);
  }
  function createHeart(){
    const h = document.createElement('div');
    h.className = 'heart';
    h.innerHTML = '❤';
    const left = Math.random() * 100;
    h.style.left = left + 'vw';
    const dur = 4 + Math.random() * 3;
    const delay = Math.random() * 0.6;
    h.style.animationDuration = dur + 's';
    h.style.animationDelay = delay + 's';
    const size = 14 + Math.floor(Math.random()*28);
    h.style.fontSize = size + 'px';
    heartsContainer.appendChild(h);
    setTimeout(()=> { if(h && h.parentNode) h.parentNode.removeChild(h); }, (dur + delay) * 1000 + 500);
  }

  function setUnlocked(){
    body.classList.remove('locked');
    overlay.style.display = 'none';
    document.querySelectorAll('.cover, .container, .hearts').forEach(el=>{
      el.setAttribute('aria-hidden', 'false');
      el.style.display = '';
    });
    try { localStorage.setItem(UNLOCK_KEY, '1'); } catch(e){}
    startHearts();
  }

  try {
    if(localStorage.getItem(UNLOCK_KEY) === '1') { setUnlocked(); }
    else input.focus();
  } catch(e) { input.focus(); }

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
}

// Timers used on index page
function initTimers(){
  const startDate = new Date(Date.UTC(2025, 9, 4, 0, 0, 0));
  const sinceEl = document.getElementById('since');
  const countdownEl = document.getElementById('countdown');

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

  setInterval(updateTimers, 1000);
  updateTimers();
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

  // message text exactly as requested
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
      bgMusic.play().then(()=> {
        if(playBtn) playBtn.style.display = 'none';
        if(pauseBtn) pauseBtn.style.display = 'inline-block';
      }).catch(()=> {
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
}

/* -------------------------
   Flowers page behavior
   ------------------------- */
function initFlowersPage(){
  const flowersFull = document.getElementById('flowers-full');
  const flowerMessage = document.getElementById('flower-message');

  // message text exactly as requested
  const MESSAGE = "i hate the distance and im sorry i couldnt bring you flowers mi vida i promise you ill make it up to you one day";

  if(!flowersFull) return;

  // reveal message immediately when page shows (with a small delay so transition runs)
  if(flowerMessage){
    // set text and make it readable for screen readers
    flowerMessage.textContent = MESSAGE;
    flowerMessage.setAttribute('aria-hidden', 'false');

    // small timeout so the CSS transition animates
    setTimeout(()=> {
      flowerMessage.classList.add('show');
    }, 60);
  }

  // optional: clicking the image opens it in a new tab on small screens
  flowersFull.addEventListener('click', ()=>{
    if(window.innerWidth < 900) window.open(flowersFull.src, '_blank');
  });
}
