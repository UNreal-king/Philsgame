const MAX_PARTICLES = 600; // lower if slow machine
const PARTICLE_POOL = [];
const MOVES_BASE = [
  { id:'rock', name:'Rock' },
  { id:'paper', name:'Paper' },
  { id:'scissors', name:'Scissors' }
];
const MOVES_CHAOS = [
  ...MOVES_BASE,
  { id:'fire', name:'Fire' },
  { id:'water', name:'Water' }
];
let moves = [...MOVES_BASE];

let playerScore = 0, computerScore = 0;
let difficulty = 'medium';
let isMuted = false;
let lastPlayerMove = null;
let ultimateUnlocked = false;

/* ---------- DOM ---------- */
const stage = document.getElementById('stage');
const playerScoreEl = document.getElementById('playerScore');
const computerScoreEl = document.getElementById('computerScore');
const resultBox = document.getElementById('resultBox');
const battleText = document.getElementById('battleText');
const flashEl = document.getElementById('flash');
const ultimateBurst = document.getElementById('ultimateBurst');
const leadersOl = document.getElementById('leaders');

/* ---------- canvases ---------- */
const bgCanvas = document.getElementById('bgCanvas');
const particleCanvas = document.getElementById('particleCanvas');
const trailCanvas = document.getElementById('trailCanvas');
const bgCtx = bgCanvas.getContext('2d');
const pCtx = particleCanvas.getContext('2d');
const tCtx = trailCanvas.getContext('2d');

function resizeAll(){
  [bgCanvas, particleCanvas, trailCanvas].forEach(c => {
    c.width = innerWidth;
    c.height = innerHeight;
  });
}
window.addEventListener('resize', resizeAll);
resizeAll();

/* ---------- background procedural (volumetric bands + noise) ---------- */
let bgTick = 0;
function drawBG(){
  bgTick += 0.002;
  const w = bgCanvas.width, h = bgCanvas.height;
  // gradient base
  const g = bgCtx.createLinearGradient(0,0,0,h);
  g.addColorStop(0, '#00111a');
  g.addColorStop(0.35, '#001827');
  g.addColorStop(1, '#00040b');
  bgCtx.fillStyle = g;
  bgCtx.fillRect(0,0,w,h);

  // moving light bands
  for(let i=0;i<6;i++){
    const alpha = 0.12 * Math.abs(Math.sin(bgTick*0.7 + i));
    bgCtx.fillStyle = `rgba(0,245,255,${alpha*0.4})`;
    const bandW = w * (0.08 + 0.05*Math.sin(bgTick + i));
    const x = (w * (i/6)) + (Math.sin(bgTick + i*1.2) * 180);
    bgCtx.fillRect(x, h*0.05*(i%2?1:2), bandW, h*0.9);
  }
  // subtle vignette
  const vignette = bgCtx.createRadialGradient(w*0.5, h*0.35, h*0.3, w*0.5, h*0.35, Math.max(w,h)*0.9);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.55)');
  bgCtx.fillStyle = vignette; bgCtx.fillRect(0,0,w,h);
}

/* animate background */
(function bgLoop(){ drawBG(); requestAnimationFrame(bgLoop); })();

/* ---------- particle system (with trails) ---------- */
let particles = [];
function spawnParticles(x,y,color,qty,spread=8,strength=6){
  const total = Math.min(qty, MAX_PARTICLES - particles.length);
  for(let i=0;i<total;i++){
    particles.push({
      x, y,
      vx: (Math.random()-0.5)*spread * (strength/6),
      vy: (Math.random()-0.8)*spread * (strength/6),
      life: 40 + Math.random()*60,
      maxLife: 40 + Math.random()*60,
      size: 1 + Math.random()*3,
      color: color || randomColor(),
      gravity: 0.06 + Math.random()*0.08,
      trail: []
    });
  }
}

function randomColor(){
  const palette = ['#00ffcc','#00f5ff','#ff00ff','#ffd166','#ff66aa','#66ff99'];
  return palette[Math.floor(Math.random()*palette.length)];
}

/* trail drawing with slight motion blur */
function updateParticles(){
  const w = particleCanvas.width, h = particleCanvas.height;
  // fade previous trail layer a little
  tCtx.fillStyle = 'rgba(0,0,0,0.12)';
  tCtx.fillRect(0,0,w,h);
  // clear particle canvas slightly for crisp particles
  pCtx.clearRect(0,0,w,h);

  for(let i = particles.length-1; i>=0; i--){
    const p = particles[i];
    // physics
    p.vy += p.gravity;
    p.x += p.vx; p.y += p.vy;
    p.vx *= 0.995; p.vy *= 0.998;
    p.life--;
    // add to trail
    p.trail.push({x:p.x,y:p.y,alpha:p.life/p.maxLife});
    if(p.trail.length>8) p.trail.shift();

    // draw trail on trailCanvas
    tCtx.beginPath();
    for(let t=0;t<p.trail.length-1;t++){
      const a = p.trail[t], b = p.trail[t+1];
      tCtx.strokeStyle = hexToRgba(p.color, (0.25 * (t/p.trail.length)));
      tCtx.lineWidth = p.size + (t/2);
      tCtx.moveTo(a.x,a.y); tCtx.lineTo(b.x,b.y);
      tCtx.stroke();
      tCtx.beginPath();
    }

    // draw particle dot
    pCtx.fillStyle = p.color;
    pCtx.globalAlpha = Math.max(0, Math.min(1, p.life/p.maxLife));
    pCtx.fillRect(p.x, p.y, p.size, p.size);
    pCtx.globalAlpha = 1;

    if(p.life <= 0 || p.y > h + 120 || p.x < -80 || p.x > w + 80){
      particles.splice(i,1);
    }
  }
  requestAnimationFrame(updateParticles);
}
updateParticles();

function hexToRgba(hex, a){
  const c = hex.replace('#','');
  const r = parseInt(c.substring(0,2),16);
  const g = parseInt(c.substring(2,4),16);
  const b = parseInt(c.substring(4,6),16);
  return `rgba(${r},${g},${b},${a})`;
}

/* ---------- confetti / fireworks helpers ---------- */
function firework(x,y,color){
  spawnParticles(x,y,color,80,12,9);
  // smaller colored bursts
  for(let i=0;i<6;i++){
    spawnParticles(x + (Math.random()-0.5)*60, y + (Math.random()-0.5)*60, randomColor(), 24, 8, 5);
  }
}
function confettiBurst(x,y){
  for(let i=0;i<80;i++){
    particles.push({
      x,y,
      vx: (Math.random()-0.5)*18,
      vy: (Math.random()-1.5)*14,
      life: 40 + Math.random()*40,
      maxLife: 40 + Math.random()*40,
      size: 2 + Math.random()*4,
      color: randomColor(),
      gravity: 0.12 + Math.random()*0.08,
      trail: []
    });
  }
}

/* ---------- WebAudio synth & SFX ---------- */
const AudioCtx = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioCtx();
let bgOsc = null, bgGain = null;
function startAmbient(){
  if(isMuted) return;
  if(bgOsc) return;
  bgOsc = audioCtx.createOscillator();
  bgGain = audioCtx.createGain();
  bgOsc.type = 'sine'; bgOsc.frequency.value = 50;
  bgGain.gain.value = 0.003;
  bgOsc.connect(bgGain); bgGain.connect(audioCtx.destination); bgOsc.start();
}
function stopAmbient(){
  if(bgOsc){ bgOsc.stop(); bgOsc.disconnect(); bgOsc=null; }
}

/* micro-synth SFX */
function playSynth(freq, time=0.12, type='sawtooth', gainVal=0.12){
  if(isMuted) return;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.value = gainVal;
  o.connect(g); g.connect(audioCtx.destination);
  o.start();
  g.gain.setValueAtTime(gainVal, audioCtx.currentTime + 0);
  g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + time);
  o.stop(audioCtx.currentTime + time + 0.02);
}
function playPerc(freq=220, len=0.14){
  if(isMuted) return;
  const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
  o.type = 'square'; o.frequency.value = freq;
  g.gain.value = 0.15; o.connect(g); g.connect(audioCtx.destination);
  o.start(); g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + len);
  o.stop(audioCtx.currentTime + len + 0.02);
}
function sfxWin(){ playSynth(880,0.24,'sawtooth',0.16); playPerc(480,0.2); }
function sfxLose(){ playSynth(130,0.18,'sawtooth',0.18); playPerc(80,0.18); }
function sfxTie(){ playSynth(440,0.14,'triangle',0.08); }

/* resume audio on gesture (policy) */
(function enableAudioOnGesture(){
  const resume = () => { if(audioCtx.state === 'suspended') audioCtx.resume(); startAmbient(); window.removeEventListener('pointerdown', resume); };
  window.addEventListener('pointerdown', resume);
})();

/* ---------- Render 3D card stage (SVG holograms) ---------- */
function makeCardSVG(id){
  // richer vector forms
  if(id==='rock') return `
    <div class="svgwrap">
      <svg viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg" width="140" height="140">
        <g fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
          <path d="M34 92 q22-48 48-42 q10 2 28 24 q6 10 8 22 q-40 10 -82 -4z" stroke="rgba(255,255,255,0.9)"></path>
          <path d="M40 88 q20-36 40-32 q8 1 22 16" stroke="${Math.random()>0.5? '#00f5ff':'#ff00ff'}" stroke-width="2.4" opacity="0.9"></path>
        </g>
      </svg>
    </div>`;
  if(id==='paper') return `
    <div class="svgwrap">
      <svg viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg" width="140" height="140">
        <g fill="none" stroke="#fff" stroke-width="1.6">
          <rect x="32" y="26" width="76" height="88" rx="8" stroke="rgba(255,255,255,0.9)"></rect>
          <path d="M36 36 h64" stroke="${Math.random()>0.5? '#ffd166':'#00ffcc'}" stroke-width="2.4"></path>
          <path d="M36 56 h60" stroke="${Math.random()>0.5? '#ff00ff':'#00f5ff'}" stroke-width="1.6" opacity="0.8"></path>
        </g>
      </svg>
    </div>`;
  if(id==='scissors') return `
    <div class="svgwrap">
      <svg viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg" width="140" height="140">
        <g fill="none" stroke="#fff" stroke-width="1.6">
          <path d="M20 70 q40-40 70 0" stroke="rgba(255,255,255,0.9)"></path>
          <path d="M20 44 q40 42 70 6" stroke="${Math.random()>0.5? '#ff00ff':'#00f5ff'}" stroke-width="2.2"></path>
          <circle cx="100" cy="42" r="6" fill="${Math.random()>0.5? '#ffd166':'#00ffcc'}"></circle>
        </g>
      </svg>
    </div>`;
  if(id==='fire') return `
    <div class="svgwrap">
      <svg viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg" width="140" height="140">
        <path d="M70 26 q-10 14 -6 28 q8 18 -6 28 q26-6 36-30 q-6 14 -24 22" fill="none" stroke="#ff7b3a" stroke-width="2.2"></path>
      </svg>
    </div>`;
  if(id==='water') return `
    <div class="svgwrap">
      <svg viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg" width="140" height="140">
        <path d="M36 56 q28 48 68 0 q6-8 18-4" fill="none" stroke="#00f0ff" stroke-width="2.2"></path>
      </svg>
    </div>`;
  return '';
}

/* create card elements */
function renderCards(){
  stage.innerHTML = '';
  const spacing = 40;
  const center = Math.floor(moves.length/2);
  moves.forEach((m, i) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.id = m.id;
    card.innerHTML = makeCardSVG(m.id) + `<div class="label">${m.name}</div>`;
    card.onclick = () => playerPick(m.id, card);
    // position in pseudo-3D ring
    const angle = (i - center) * 18;
    card.style.transform = `translateZ(${(Math.abs(i-center)*-40)}px) rotateY(${angle}deg)`;
    stage.appendChild(card);
  });
}
renderCards();

/* ---------- game logic (rules builder) ---------- */
function buildRules(currentMoves){
  const simple = { rock:['scissors'], paper:['rock'], scissors:['paper'], fire:['paper','scissors'], water:['fire','rock'] };
  const rules = {};
  currentMoves.forEach(m => {
    rules[m.id] = (simple[m.id] || []).filter(x => currentMoves.some(cm => cm.id === x));
  });
  return rules;
}
function evaluate(playerId, compId){
  if(playerId === compId) return 'tie';
  const rules = buildRules(moves);
  if((rules[playerId]||[]).includes(compId)) return 'player';
  if((rules[compId]||[]).includes(playerId)) return 'computer';
  return Math.random() > 0.5 ? 'player' : 'computer';
}

/* AI */
function aiPick(lastPlayer){
  if(difficulty === 'easy') return moves[Math.floor(Math.random()*moves.length)].id;
  if(difficulty === 'hard'){
    const all = moves.map(m=>m.id); const rules = buildRules(moves);
    if(lastPlayer){
      const winners = all.filter(mid => (rules[mid]||[]).includes(lastPlayer));
      if(winners.length && Math.random() < 0.78) return winners[Math.floor(Math.random()*winners.length)];
    }
    return moves[Math.floor(Math.random()*moves.length)].id;
  }
  // medium
  if(Math.random() < 0.52 && lastPlayer){
    const rules = buildRules(moves);
    const winners = moves.map(m=>m.id).filter(mid => (rules[mid]||[]).includes(lastPlayer));
    if(winners.length) return winners[Math.floor(Math.random()*winners.length)];
  }
  return moves[Math.floor(Math.random()*moves.length)].id;
}

/* ---------- user actions ---------- */
let lastPlayer = null;
function playerPick(id, cardEl){
  // visual selection
  document.querySelectorAll('.card').forEach(c=>c.classList.remove('selected'));
  cardEl.classList.add('selected');
  cardEl.animate([{transform:'translateY(-10px)'},{transform:'translateY(0)'}], {duration:420, easing:'cubic-bezier(.2,.9,.3,1)'});
  // AI decides
  const compId = aiPick(lastPlayer);
  const res = evaluate(id, compId);
  lastPlayer = id;
  applyResult(id, compId, res);
}

/* ---------- apply result (UI + particles + audio) ---------- */
function applyResult(pId, cId, outcome){
  const pMove = moves.find(m=>m.id===pId) || {name:pId};
  const cMove = moves.find(m=>m.id===cId) || {name:cId};

  if(outcome === 'player'){
    playerScore++; playerScoreEl.textContent = `Player: ${playerScore}`;
    resultBox.textContent = `🔥 YOU WIN — ${pMove.name} beats ${cMove.name}`;
    battleText.textContent = 'VICTORY';
    battleText.classList.add('show');
    setTimeout(()=>battleText.classList.remove('show'),520);
    sfxWin();
    firework(innerWidth*0.6, innerHeight*0.42, '#00ffcc'); confettiBurst(innerWidth*0.6, innerHeight*0.45);
    flash('win');
    // subtle stage glow
    stage.animate([{filter:'drop-shadow(0 0 0 rgba(0,0,0,0.0))'},{filter:'drop-shadow(0 0 40px rgba(0,255,204,0.14))'},{filter:'drop-shadow(0 0 0 rgba(0,0,0,0.0))'}],{duration:700});
  } else if(outcome === 'computer'){
    computerScore++; computerScoreEl.textContent = `Computer: ${computerScore}`;
    resultBox.textContent = `💀 YOU LOSE — ${cMove.name} beats ${pMove.name}`;
    battleText.textContent = 'DEFEAT';
    battleText.classList.add('show');
    setTimeout(()=>battleText.classList.remove('show'),520);
    sfxLose();
    firework(innerWidth*0.35, innerHeight*0.42, '#ff3366');
    flash('lose');
  } else {
    resultBox.textContent = `😐 TIE — ${pMove.name} ties with ${cMove.name}`;
    battleText.textContent = 'TIE';
    battleText.classList.add('show');
    setTimeout(()=>battleText.classList.remove('show'),520);
    sfxTie();
    spawnParticles(innerWidth*0.5, innerHeight*0.48, '#ffffff', 20, 6, 3);
    flash('tie');
  }

  // ultimate celebration if unlocked & win
  if(ultimateUnlocked && outcome === 'player'){
    ultimateCelebrate();
  }
}

/* ---------- flash overlay ---------- */
function flash(kind){
  flashEl.className = 'flash ' + (kind === 'win' ? 'win' : (kind === 'lose' ? 'lose' : 'tie'));
  flashEl.style.opacity = '1';
  setTimeout(()=>{ flashEl.style.opacity = '0'; }, 380);
}

/* ---------- ultimate celebration ---------- */
function ultimateCelebrate(){
  // big confetti + layered fireworks + audio sweep
  for(let i=0;i<6;i++){
    setTimeout(()=>firework(Math.random()*innerWidth, innerHeight*0.35 + Math.random()*80, ['#ff00ff','#00ffcc','#ffd166'][Math.floor(Math.random()*3)]), i*160);
  }
  for(let i=0;i<120;i++){
    setTimeout(()=>spawnParticles(Math.random()*innerWidth, Math.random()*innerHeight*0.6, randomColor(), 6, 10, 6), i*12);
  }
  // audio sweep
  for(let i=0;i<6;i++){
    setTimeout(()=>playSynth(240 + i*120, 0.14, 'sawtooth', 0.08), i*80);
  }
  // animated burst visuals
  const burst = document.createElement('div');
  burst.style.position = 'absolute';
  burst.style.left = '0'; burst.style.top='0'; burst.style.width='100%'; burst.style.height='100%';
  burst.style.pointerEvents = 'none';
  ultimateBurst.appendChild(burst);
  setTimeout(()=>ultimateBurst.removeChild(burst), 3000);
}

/* ---------- leaderboard (localStorage) ---------- */
function loadLeaders(){ try{ return JSON.parse(localStorage.getItem('neon_arena_leaders')||'[]') } catch(e){ return [] } }
function saveLeader(name, score){
  const list = loadLeaders();
  list.push({ name: (name||'Anon'), score: score, date: new Date().toISOString() });
  list.sort((a,b)=>b.score - a.score);
  localStorage.setItem('neon_arena_leaders', JSON.stringify(list.slice(0,30)));
  renderLeaders();
}
function renderLeaders(){
  const list = loadLeaders();
  if(!list.length){ leadersOl.innerHTML = '<li>No scores yet — play!</li>'; return; }
  leadersOl.innerHTML = list.slice(0,12).map(l => `<li>${escapeHtml(l.name)} — ${l.score}</li>`).join('');
}
function clearLeaders(){ localStorage.removeItem('neon_arena_leaders'); renderLeaders(); }
function escapeHtml(s){ return (s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
renderLeaders();

/* ---------- UI bindings ---------- */
document.getElementById('resetBtn').onclick = () => {
  playerScore = 0; computerScore = 0;
  playerScoreEl.textContent = 'Player: 0'; computerScoreEl.textContent = 'Computer: 0';
  resultBox.textContent = 'Reset — Ready.';
  spawnParticles(innerWidth*0.5, innerHeight*0.5, '#ffffff', 40, 10, 6);
};
document.getElementById('saveBtn').onclick = () => {
  const name = document.getElementById('playerName').value.trim() || 'Legend';
  saveLeader(name, playerScore);
};
document.getElementById('clearBoard').onclick = clearLeaders;
document.getElementById('difficulty').onchange = (e) => {
  difficulty = e.target.value; document.getElementById('modeTag').textContent = difficulty;
};
document.getElementById('chaosBtn').onclick = (e) => {
  if(moves.length === MOVES_BASE.length){
    moves = MOVES_CHAOS; e.target.textContent = 'Normal';
    document.getElementById('modeTag').textContent = 'Chaos';
  } else {
    moves = [...MOVES_BASE]; e.target.textContent = 'Chaos';
    document.getElementById('modeTag').textContent = 'Normal';
  }
  renderCardsWithPulse();
};
document.getElementById('muteBtn').onclick = (e) => {
  isMuted = !isMuted;
  e.target.textContent = isMuted ? 'Unmute' : 'Mute';
  if(isMuted) stopAmbient(); else startAmbient();
};

/* audio upload */
document.getElementById('audioUpload').addEventListener('change', async (ev) => {
  const file = ev.target.files && ev.target.files[0];
  if(!file) return;
  const audio = new Audio(URL.createObjectURL(file));
  audio.loop = true; audio.volume = 0.6;
  try{ await audio.play(); } catch(e){}
  // pause ambient so custom track is heard
  stopAmbient();
  isMuted = false;
  document.getElementById('muteBtn').textContent = 'Mute';
});

/* title easter egg (7 clicks) */
let clickCount = 0, clickTimer = null;
document.getElementById('title').addEventListener('click', () => {
  clickCount++;
  if(clickTimer) clearTimeout(clickTimer);
  clickTimer = setTimeout(()=>clickCount=0, 1200);
  if(clickCount >= 7){
    ultimateUnlocked = !ultimateUnlocked; clickCount = 0;
    resultBox.textContent = ultimateUnlocked ? 'ULTIMATE MODE UNLOCKED' : 'ULTIMATE MODE LOCKED';
    firework(innerWidth*0.5, innerHeight*0.3, ultimateUnlocked? '#00ffcc' : '#ff66aa');
    sfxWin();
  }
});

/* keyboard quickpick */
window.addEventListener('keydown', (e) => {
  if(e.key === '1' || e.key.toLowerCase() === 'q') simulateClick(0);
  if(e.key === '2' || e.key.toLowerCase() === 'w') simulateClick(1);
  if(e.key === '3' || e.key.toLowerCase() === 'e') simulateClick(2);
});
function simulateClick(i){ const c = document.querySelectorAll('.card')[i]; if(c) c.click(); }

/* ---------- helpers: card rendering with pulse ---------- */
function renderCardsWithPulse(){
  renderCards();
  // small entrance pulse
  const cards = document.querySelectorAll('.card');
  cards.forEach((c, idx) => {
    c.style.opacity = 0; c.style.transform += ' translateY(30px)';
    setTimeout(()=>{ c.animate([{opacity:0, transform:'translateY(30px)'},{opacity:1, transform:'translateY(0)'}],{duration:520, easing:'cubic-bezier(.2,.9,.3,1)'}); c.style.opacity=1; }, idx*80);
  });
}
renderCardsWithPulse();

/* ---------- helpers: small wrappers ---------- */
function spawnParticles(x,y,color,qty,spread,strength){ spawnParticlesCore(x,y,color,qty,spread,strength); } // alias
function spawnParticlesCore(x,y,color,qty=20,spread=8,strength=6){ const total = Math.min(qty, MAX_PARTICLES - particles.length); for(let i=0;i<total;i++){ particles.push({ x, y, vx: (Math.random()-0.5)*spread*(strength/6), vy: (Math.random()-0.8)*spread*(strength/6), life: 40 + Math.random()*60, maxLife: 40 + Math.random()*60, size: 1 + Math.random()*3, color: color||randomColor(), gravity: 0.06 + Math.random()*0.08, trail: [] }); } }

/* small fireworks alias used earlier */
function spawnSparks(x,y,color,count,spread,strength){ spawnParticlesCore(x,y,color,count,spread||8,strength||6); }

/* wrapper for firework/confetti used earlier */
function firework(x,y,color){ spawnParticles(x,y,color,120,18,8); for(let i=0;i<6;i++) spawnParticles(x + (Math.random()-0.5)*80, y + (Math.random()-0.5)*80, randomColor(), 28, 10, 5); }
function confettiBurst(x,y){ for(let i=0;i<120;i++){ particles.push({ x,y, vx: (Math.random()-0.5)*18, vy: (Math.random()-1.5)*14, life: 40 + Math.random()*40, maxLife: 40 + Math.random()*40, size:2 + Math.random()*4, color: randomColor(), gravity: 0.12 + Math.random()*0.08, trail: [] }); } }

/* ---------- final touches: small intro bursts ---------- */
setTimeout(()=>{ firework(innerWidth*0.32, innerHeight*0.40, '#ff66aa'); firework(innerWidth*0.68, innerHeight*0.42, '#00ffcc'); }, 600);

document.addEventListener("DOMContentLoaded", () => {
  https://unreal-king.github.io/Philsgame/
});

