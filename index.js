/* ========== All-in-one JS =========== */
const MOVES_BASE = [
  {id:'rock', emoji:'', name:'Rock'},
  {id:'paper', emoji:'', name:'Paper'},
  {id:'scissors', emoji:'', name:'Scissors'}
];
const MOVES_CHAOS = [ ...MOVES_BASE, {id:'fire', emoji:'', name:'Fire'}, {id:'water', emoji:'', name:'Water'} ];
let moves = [...MOVES_BASE];
let playerScore=0, computerScore=0; let lastResult='Ready'; let isMuted=false; let difficulty='medium'; let ultimateUnlocked=false; let lastPlayerMove=null;

/* DOM */
const stage = document.getElementById('stage'); const playerScoreEl = document.getElementById('playerScore'); const computerScoreEl = document.getElementById('computerScore'); const lastResultEl = document.getElementById('lastResult'); const leadersOl = document.getElementById('leaders'); const titleEl = document.getElementById('title'); const battleHitEl = document.getElementById('battleHit'); const flashEl = document.getElementById('flash');

/* Canvas particles */
const canvas = document.getElementById('fx'); const ctx = canvas.getContext('2d'); let particles=[]; function resize(){canvas.width=innerWidth;canvas.height=innerHeight;} window.addEventListener('resize',resize); resize();
function spawnFirework(x,y,color='#00ffcc'){const count=26+Math.floor(Math.random()*20);for(let i=0;i<count;i++){particles.push({x,y,vx:(Math.random()-0.5)*6,vy:(Math.random()-0.8)*6,life:60+Math.random()*50,color,size:1+Math.random()*3,decay:0.96+Math.random()*0.01});}}
function spawnSparks(x,y,color='#ff5aa2',count=20){for(let i=0;i<count;i++){particles.push({x,y,vx:(Math.random()-0.5)*8,vy:(Math.random()-1.2)*6,life:30+Math.random()*30,color,size:1+Math.random()*2,decay:0.92+Math.random()*0.03});}}
function loopParticles(){ctx.clearRect(0,0,canvas.width,canvas.height);for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.x+=p.vx;p.y+=p.vy;p.vy+=0.08;p.vx*=p.decay;p.vy*=0.995;p.life--;ctx.beginPath();ctx.fillStyle=p.color;ctx.globalAlpha=Math.max(0,Math.min(1,p.life/80));ctx.fillRect(p.x,p.y,p.size,p.size);if(p.life<=0)particles.splice(i,1);}requestAnimationFrame(loopParticles);}loopParticles();

/* WebAudio synth + option to upload file */
const AudioCtx = window.AudioContext || window.webkitAudioContext; const audioCtx = new AudioCtx(); let bgOsc=null,bgGain=null; function playTone(freq,len=0.18,type='sine',gain=0.12){if(isMuted) return;const o=audioCtx.createOscillator();const g=audioCtx.createGain();o.type=type;o.frequency.value=freq;g.gain.value=gain;o.connect(g);g.connect(audioCtx.destination);o.start();g.gain.setValueAtTime(gain,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(0.0001,audioCtx.currentTime+len);o.stop(audioCtx.currentTime+len+0.02);} function startAmbient(){if(isMuted) return;bgOsc=audioCtx.createOscillator();bgGain=audioCtx.createGain();bgOsc.type='sine';bgOsc.frequency.value=60;bgGain.gain.value=0.0025;bgOsc.connect(bgGain);bgGain.connect(audioCtx.destination);bgOsc.start();} function stopAmbient(){if(bgOsc){bgOsc.stop();bgOsc.disconnect();bgOsc=null;}}
function sfxWin(){playTone(880,0.18,'sawtooth',0.14);playTone(1320,0.28,'sine',0.09);} function sfxLose(){playTone(120,0.18,'sawtooth',0.16);playTone(90,0.22,'sine',0.06);} function sfxTie(){playTone(450,0.12,'triangle',0.06);} 

/* audio upload handling */
const audioInput = document.getElementById('audioUpload'); let musicAudio=null; audioInput.addEventListener('change',async (e)=>{const file = e.target.files[0]; if(!file) return; if(musicAudio){musicAudio.pause(); musicAudio.src='';}
  musicAudio = new Audio(URL.createObjectURL(file)); musicAudio.loop = true; musicAudio.volume = 0.6; await musicAudio.play().catch(()=>{}); isMuted=false; document.getElementById('mute').textContent='Mute'; stopAmbient(); });

/* Render vector holographic SVG hands (inline) */
function makeSVGFor(id){ // returns a small SVG string for the given id
  if(id==='rock') return `
    <svg viewBox="0 0 120 120" class="svgwrap holo svg-hand" xmlns="http://www.w3.org/2000/svg">
      <path class="stroke-anim" d="M30 80 q10-40 30-40 q10 0 20 12 q10 12 10 28" />
      <path class="accent" d="M28 82 q18-28 36-26 q12 2 18 18" />
    </svg>`;
  if(id==='paper') return `
    <svg viewBox="0 0 120 120" class="svgwrap holo svg-hand" xmlns="http://www.w3.org/2000/svg">
      <path class="stroke-anim" d="M30 30 h52 v56 h-46 q-6 0 -6-6 z" />
      <path class="accent" d="M32 34 h48 v48 h-44" />
    </svg>`;
  if(id==='scissors') return `
    <svg viewBox="0 0 120 120" class="svgwrap holo svg-hand" xmlns="http://www.w3.org/2000/svg">
      <path class="stroke-anim" d="M20 70 q30-30 52-4" />
      <path class="stroke-anim" d="M20 44 q30 30 52 6" />
      <path class="accent" d="M72 42 q8-10 18-8 q6 2 8 8" />
    </svg>`;
  if(id==='fire') return `
    <svg viewBox="0 0 120 120" class="svgwrap holo" xmlns="http://www.w3.org/2000/svg">
      <path class="stroke-anim accent" d="M60 24 q-10 18 -2 32 q8 14 -6 20 q26-6 30-28 q-2 12 -22 20" />
    </svg>`;
  if(id==='water') return `
    <svg viewBox="0 0 120 120" class="svgwrap holo" xmlns="http://www.w3.org/2000/svg">
      <path class="stroke-anim" d="M30 40 q20 40 40 0 q10-20 20-6" />
      <path class="accent" d="M34 44 q18 30 36 2" />
    </svg>`;
  return '';
}

/* Render cards in stage */
function renderCards(){stage.innerHTML='';moves.forEach(m=>{const card=document.createElement('div');card.className='card';card.dataset.id=m.id;card.innerHTML=makeSVGFor(m.id)+`<div class="label">${m.name}</div>`;card.onclick=()=>handlePlayerChoice(m.id,card);stage.appendChild(card);});}
renderCards();

/* rules builder */
function buildRules(currentMoves){const simple={rock:['scissors'],paper:['rock'],scissors:['paper'],fire:['paper','scissors'],water:['fire','rock']};const rules={};currentMoves.forEach(m=>{rules[m.id]=(simple[m.id]||[]).filter(x=>currentMoves.some(cm=>cm.id===x));});return rules;}
function evaluateWinner(playerId, computerId){if(playerId===computerId) return 'tie';const rules = buildRules(moves);const defeats = rules[playerId]||[]; if(defeats.includes(computerId)) return 'player'; const cdef = rules[computerId]||[]; if(cdef.includes(playerId)) return 'computer'; return Math.random()>0.5?'player':'computer';}

/* AI */
function aiChoice(lastPlayer){ if(difficulty==='easy') return moves[Math.floor(Math.random()*moves.length)].id; if(difficulty==='hard'){const all=moves.map(x=>x.id);const rules=buildRules(moves); if(lastPlayer){const winning=all.filter(mid=> (rules[mid]||[]).includes(lastPlayer)); if(winning.length && Math.random()<0.7) return winning[Math.floor(Math.random()*winning.length)];} return moves[Math.floor(Math.random()*moves.length)].id;} if(Math.random()<0.5 && lastPlayer){const rules=buildRules(moves);const winning=moves.map(m=>m.id).filter(mid=>(rules[mid]||[]).includes(lastPlayer)); if(winning.length) return winning[Math.floor(Math.random()*winning.length)];} return moves[Math.floor(Math.random()*moves.length)].id; }

/* handle player */
function handlePlayerChoice(playerId, cardEl){document.querySelectorAll('.card').forEach(c=>c.classList.remove('selected')); cardEl.classList.add('selected'); cardEl.animate([{transform:'translateY(-8px) scale(1.03)'},{transform:'translateY(0) scale(1)'}],{duration:520,easing:'cubic-bezier(.2,.9,.3,1)'});
  const compId = aiChoice(lastPlayerMove); const result = evaluateWinner(playerId, compId); lastPlayerMove = playerId; applyResult(playerId, compId, result); }

/* apply result */
function applyResult(playerId, compId, result){const pMove = moves.find(m=>m.id===playerId) || {name:playerId}; const cMove = moves.find(m=>m.id===compId) || {name:compId}; if(result==='player'){playerScore++; lastResult=`You Win — ${pMove.name} beats ${cMove.name}`; lastResultEl.textContent=lastResult; sfxWin(); spawnFirework(innerWidth*0.6, innerHeight*0.38,'#00ffbb'); spawnSparks(innerWidth*0.6, innerHeight*0.38,'#fff',32); flash('win'); } else if(result==='computer'){computerScore++; lastResult=`You Lose — ${cMove.name} beats ${pMove.name}`; lastResultEl.textContent=lastResult; sfxLose(); spawnFirework(innerWidth*0.35, innerHeight*0.38,'#ff3366'); spawnSparks(innerWidth*0.35, innerHeight*0.38,'#ff7b9e',28); flash('lose'); } else { lastResult=`Tie — ${pMove.name} ties with ${cMove.name}`; lastResultEl.textContent=lastResult; sfxTie(); spawnSparks(innerWidth*0.5, innerHeight*0.45,'#ffffff',14); flash('tie'); }
  battleHitEl.textContent = `${pMove.name}  vs  ${cMove.name}`; battleHitEl.classList.add('show'); setTimeout(()=>battleHitEl.classList.remove('show'),700); playerScoreEl.textContent=`Player: ${playerScore}`; computerScoreEl.textContent=`Computer: ${computerScore}`; if(ultimateUnlocked && result==='player'){spawnFirework(Math.random()*innerWidth, Math.random()*innerHeight*0.6, ['#ff00ff','#00ffcc','#ffd166'][Math.floor(Math.random()*3)]);} }

/* flash overlay */
function flash(kind){flashEl.className='flash '+(kind==='win'?'win':(kind==='lose'?'lose':'tie')); flashEl.style.opacity='1'; setTimeout(()=>flashEl.style.opacity='0',350);} 

/* leaderboard localStorage */
function loadLeaders(){const raw=localStorage.getItem('neonRps_leaders'); if(!raw) return []; try{return JSON.parse(raw);}catch(e){return []}} function saveLeader(name,score){const list=loadLeaders(); list.push({name,score,date:new Date().toISOString()}); list.sort((a,b)=>b.score-a.score); localStorage.setItem('neonRps_leaders',JSON.stringify(list.slice(0,20))); renderLeaders(); } function renderLeaders(){const list=loadLeaders(); leadersOl.innerHTML = list.length ? list.map(l=>`<li>${escapeHtml(l.name)} — ${l.score}</li>`).join('') : '<li>No scores yet</li>'; } function clearLeaders(){localStorage.removeItem('neonRps_leaders'); renderLeaders(); } function escapeHtml(str){return (str||'').replace(/[&<>\"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m])}
renderLeaders();

/* UI bindings */
document.getElementById('resetBtn').onclick = ()=>{playerScore=0;computerScore=0;playerScoreEl.textContent='Player: 0';computerScoreEl.textContent='Computer: 0';lastResult='Ready';lastResultEl.textContent='Ready. Make your move.'; spawnSparks(innerWidth*0.5,innerHeight*0.5,'#ffffff',40);};
document.getElementById('leaderBtn').onclick = ()=>{const name = document.getElementById('playerName').value.trim() || 'Anonymous'; saveLeader(name, playerScore);};
document.getElementById('clearBoard').onclick = clearLeaders; document.getElementById('difficulty').onchange = (e)=>{difficulty=e.target.value; document.getElementById('modeTag').textContent = difficulty;};
document.getElementById('chaos').onclick = (e)=>{ if(moves.length===MOVES_BASE.length){ moves = MOVES_CHAOS; e.target.textContent='Normal Mode'; document.getElementById('modeTag').textContent='Chaos'; } else { moves = [...MOVES_BASE]; e.target.textContent='Chaos Mode'; document.getElementById('modeTag').textContent='Normal'; } renderCards(); };
document.getElementById('mute').onclick = (e)=>{ isMuted = !isMuted; e.target.textContent = isMuted ? 'Unmute' : 'Mute'; if(!isMuted) startAmbient(); else stopAmbient(); };

/* title easter egg */
let clickCount=0,clickTimer=null; titleEl.addEventListener('click',()=>{clickCount++; if(clickTimer) clearTimeout(clickTimer); clickTimer = setTimeout(()=>{clickCount=0;},1200); if(clickCount>=7){ultimateUnlocked=!ultimateUnlocked; clickCount=0; lastResultEl.textContent = ultimateUnlocked? 'Ultimate Mode Unlocked!' : 'Ultimate Mode Locked'; spawnFirework(innerWidth*0.5, innerHeight*0.3, ultimateUnlocked? '#00ffcc' : '#ff66aa'); sfxWin();}});

/* persist name */
const savedName = localStorage.getItem('neonRps_name'); if(savedName){document.getElementById('playerName').value = savedName;} document.getElementById('playerName').oninput = (e)=>{localStorage.setItem('neonRps_name', e.target.value)};

/* keyboard */
window.addEventListener('keydown',(e)=>{ if(e.key==='1'||e.key==='q') simulateClickCard(0); if(e.key==='2'||e.key==='w') simulateClickCard(1); if(e.key==='3'||e.key==='e') simulateClickCard(2); }); function simulateClickCard(i){const c=document.querySelectorAll('.card')[i]; if(c) c.click(); }

/* Start ambient on gesture */
function initAudioOnUserGesture(){const resume=()=>{if(audioCtx.state==='suspended') audioCtx.resume(); startAmbient(); window.removeEventListener('pointerdown', resume);};window.addEventListener('pointerdown', resume);} initAudioOnUserGesture();

/* intro particles */
spawnFirework(innerWidth*0.6, innerHeight*0.3, '#00ffcc'); spawnFirework(innerWidth*0.35, innerHeight*0.4, '#ff66aa');

/* helper: render cards uses inline SVG creations */
function renderCards(){stage.innerHTML=''; moves.forEach(m=>{const card=document.createElement('div');card.className='card';card.dataset.id=m.id; card.innerHTML = makeSVGFor(m.id) + `<div class="label">${m.name}</div>`; card.onclick = ()=>handlePlayerChoice(m.id, card); stage.appendChild(card);});}
function makeSVGFor(id){ if(id==='rock') return `<div class="svgwrap"> <svg viewBox="0 0 120 120" class="svg-hand" xmlns='http://www.w3.org/2000/svg'><path class='stroke-anim' d='M30 80 q10-40 30-40 q10 0 20 12 q10 12 10 28'/><path class='accent' d='M28 82 q18-28 36-26 q12 2 18 18'/></svg></div>`; if(id==='paper') return `<div class="svgwrap"> <svg viewBox="0 0 120 120" class="svg-hand" xmlns='http://www.w3.org/2000/svg'><path class='stroke-anim' d='M30 30 h52 v56 h-46 q-6 0 -6-6 z'/><path class='accent' d='M32 34 h48 v48 h-44'/></svg></div>`; if(id==='scissors') return `<div class="svgwrap"> <svg viewBox="0 0 120 120" class="svg-hand" xmlns='http://www.w3.org/2000/svg'><path class='stroke-anim' d='M20 70 q30-30 52-4'/><path class='stroke-anim' d='M20 44 q30 30 52 6'/><path class='accent' d='M72 42 q8-10 18-8 q6 2 8 8'/></svg></div>`; if(id==='fire') return `<div class="svgwrap"> <svg viewBox="0 0 120 120" class="svg-hand" xmlns='http://www.w3.org/2000/svg'><path class='stroke-anim accent' d='M60 24 q-10 18 -2 32 q8 14 -6 20 q26-6 30-28 q-2 12 -22 20'/></svg></div>`; if(id==='water') return `<div class="svgwrap"> <svg viewBox="0 0 120 120" class="svg-hand" xmlns='http://www.w3.org/2000/svg'><path class='stroke-anim' d='M30 40 q20 40 40 0 q10-20 20-6'/><path class='accent' d='M34 44 q18 30 36 2'/></svg></div>`; return ''; }
renderCards();

/* utility: spawn sparks wrapper used earlier */
function spawnSparks(x,y,color,count){ for(let i=0;i<(count||20);i++){particles.push({x,y,vx:(Math.random()-0.5)*8,vy:(Math.random()-1.2)*6,life:30+Math.random()*30,color,size:1+Math.random()*2,decay:0.92+Math.random()*0.03}); }}

/* particles loop already defined above */

/* README modal controls + download preview */
const readmeModal = document.getElementById('readmeModal'); document.getElementById('closeReadme').onclick = ()=> readmeModal.classList.remove('show'); document.getElementById('downloadPreview').onclick = ()=>{ const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='630'><defs><linearGradient id='g' x1='0' x2='1'><stop offset='0' stop-color='#ff00ff'/><stop offset='1' stop-color='#00f5ff'/></linearGradient></defs><rect width='100%' height='100%' fill='#041018'/><text x='60' y='120' font-family='Orbitron' font-size='64' fill='url(#g)'>NEON ARENA</text><text x='60' y='220' font-family='Poppins' font-size='32' fill='#bff6ff'>Rock · Paper · Scissors — Ultimate</text></svg>`; const blob = new Blob([svg], {type:'image/svg+xml'}); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'neon-arena-preview.svg'; a.click(); URL.revokeObjectURL(url); };

// show README on first load as an onboarding
setTimeout(()=> readmeModal.classList.add('show'),600);

/* end of JS */
