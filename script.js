// Visual unlock (client-side) — password set to '0410'
const UNLOCK_KEY = 'valentine_unlocked';
const CORRECT_PASS = '0410';

// DOM elements (some may be null until DOM is parsed)
const overlay = document.getElementById('lock-overlay');
const input = document.getElementById('password-input');
const unlockBtn = document.getElementById('unlock-btn');
const errorP = document.getElementById('lock-error');
const body = document.body;
const heartsContainer = document.getElementById('hearts');

// Letter modal & music elements
const loveletterImg = document.getElementById('loveletter-img');
const letterModal = document.getElementById('letter-modal');
const modalClose = document.getElementById('modal-close');
const liliesImg = document.getElementById('lilies');
const musicControls = document.getElementById('music-controls');
const playBtn = document.getElementById('play-btn');
const pauseBtn = document.getElementById('pause-btn');
const volumeSlider = document.getElementById('volume');
const bgMusic = document.getElementById('bg-music');
const flowerMessage = document.getElementById('flower-message');

// Reveal everything after unlocking
function setUnlocked(){
  body.classList.remove('locked');
  if(overlay) overlay.style.display = 'none';
  document.querySelectorAll('.cover, .container, .hearts').forEach(el=>{
    el.setAttribute('aria-hidden', 'false');
    el.style.display = '';
  });
  try { localStorage.setItem(UNLOCK_KEY, '1'); } catch(e){}
  startHearts();
}

function checkUnlockedOnLoad(){
  try {
    if(localStorage.getItem(UNLOCK_KEY) === '1'){
      setUnlocked();
      return;
    }
  } catch(e){}
  if(input) input.focus();
}

if(unlockBtn){
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
}
if(input){
  input.addEventListener('keydown', (e)=>{
    if(e.key === 'Enter') unlockBtn.click();
  });
}

checkUnlockedOnLoad();

// TIMERS - start date 04 Oct 2025
const startDate = new Date(Date.UTC(2025, 9, 4, 0, 0, 0));
const sinceEl = document.getElementById('since');
const countdownEl = document.getElementById('countdown');

function pad(n){ return n.toString().padStart(2,'0'); }

function updateTimers(){
  const now = new Date();

  // Time since start
  let diffMs = now - startDate;
  if(diffMs < 0) diffMs = 0;
  const days = Math.floor(diffMs / (1000*60*60*24));
  const hours = Math.floor((diffMs % (1000*60*60*24)) / (1000*60*60));
  const minutes = Math.floor((diffMs % (1000*60*60)) / (1000*60));
  const seconds = Math.floor((diffMs % (1000*60)) / 1000);
  if(sinceEl) sinceEl.textContent = `${days} days ${pad(hours)}:${pad(minutes)}:${pad(seconds)} since 04 Oct 2025`;

  // Countdown to next anniversary
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

// Print the letter image
const printBtn = document.getElementById('print-letter');
if(printBtn){
  printBtn.addEventListener('click', ()=>{
    const img = document.querySelector('.letter img');
    const imgSrc = img ? img.src : '';
    const w = window.open('', '_blank');
    w.document.write('<html><head><title>Love Letter</title></head><body style="margin:0;display:flex;align-items:center;justify-content:center;background:#fff;"><img src="'+imgSrc+'" style="max-width:100%;height:auto;"/><script>window.onload=function(){setTimeout(()=>window.print(),200);}<\/script></body></html>');
    w.document.close();
  });
}

/* ---------------------------
   Letter modal & music logic
   --------------------------- */

// Open modal when the love letter image is clicked
if(loveletterImg){
  loveletterImg.addEventListener('click', () => {
    openLetterModal();
  });
}

function openLetterModal(){
  if(!letterModal) return;
  letterModal.setAttribute('aria-hidden','false');

  // show lilies with animation
  if(liliesImg) liliesImg.classList.add('show');

  // set and reveal the flower message (exact text requested)
  if(flowerMessage){
    flowerMessage.textContent = "i hate the distance and im sorry i couldnt bring you flowers mi vida i promise you ill make it up to you one day";
    flowerMessage.setAttribute('aria-hidden','false');
    // allow CSS transition to run
    setTimeout(()=> flowerMessage.classList.add('show'), 40);
  }

  // reveal music controls
  if(musicControls){
    musicControls.setAttribute('aria-hidden','false');
    musicControls.style.display = 'block';
  }

  // Try to play audio (click is a user gesture so this should usually work)
  if(bgMusic){
    bgMusic.volume = parseFloat((volumeSlider && volumeSlider.value) || '0.8');
    bgMusic.currentTime = 0;
    bgMusic.play().then(()=> {
      if(playBtn) playBtn.style.display = 'none';
      if(pauseBtn) pauseBtn.style.display = 'inline-block';
    }).catch((err)=> {
      // autoplay blocked — show play button so user can manually start
      if(playBtn) playBtn.style.display = 'inline-block';
      if(pauseBtn) pauseBtn.style.display = 'none';
      console.warn('Audio play prevented:', err);
    });
  }
}

// Close modal
if(modalClose){
  modalClose.addEventListener('click', closeLetterModal);
}
if(letterModal){
  letterModal.addEventListener('click', (e)=>{
    if(e.target === letterModal) closeLetterModal();
  });
}
function closeLetterModal(){
  if(!letterModal) return;
  letterModal.setAttribute('aria-hidden','true');

  // hide lilies and message
  if(liliesImg) liliesImg.classList.remove('show');
  if(flowerMessage){
    flowerMessage.classList.remove('show');
    // hide for screen readers as well after transition
    setTimeout(()=> flowerMessage.setAttribute('aria-hidden','true'), 400);
  }

  if(bgMusic){
    bgMusic.pause();
    bgMusic.currentTime = 0;
    if(playBtn) playBtn.style.display = 'inline-block';
    if(pauseBtn) pauseBtn.style.display = 'none';
  }
}

// Music controls (safe checks)
if(playBtn){
  playBtn.addEventListener('click', ()=>{
    if(bgMusic){
      bgMusic.play().then(()=> {
        playBtn.style.display = 'none';
        if(pauseBtn) pauseBtn.style.display = 'inline-block';
      }).catch(()=>{});
    }
  });
}
if(pauseBtn){
  pauseBtn.addEventListener('click', ()=>{
    if(bgMusic){
      bgMusic.pause();
      if(pauseBtn) pauseBtn.style.display = 'none';
      if(playBtn) playBtn.style.display = 'inline-block';
    }
  });
}
if(volumeSlider){
  volumeSlider.addEventListener('input', ()=>{
    if(bgMusic) bgMusic.volume = parseFloat(volumeSlider.value);
  });
}

/* HEARTS animation */
function startHearts(){
  if(!heartsContainer) return;
  for(let i=0;i<12;i++) createHeart(i);
  setInterval(()=> createHeart(Math.random()), 1200);
}

function createHeart(seed){
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
  setTimeout(()=> {
    if(h && h.parentNode) h.parentNode.removeChild(h);
  }, (dur + delay) * 1000 + 200);
}
