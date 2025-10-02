const playerDisplay = document.getElementById("playerDisplay");
  const computerDisplay = document.getElementById("computerDisplay");
  const resultDisplay = document.getElementById("resultDisplay");
  const playerScoreEl = document.getElementById("playerScore");
  const computerScoreEl = document.getElementById("computerScore");

  const choices = ["✊","✋","✌️"];
  let playerScore = 0, computerScore = 0;
  let particles=[];

  // ✅ Expose functions globally so buttons work
  window.playGame = function(playerChoice){
    const computerChoice = choices[Math.floor(Math.random()*choices.length)];
    let result = "";
    if(playerChoice === computerChoice) {
      result = "😐 Tie!";
      flash("tie");
    }
    else if(
      (playerChoice==="✊"&&computerChoice==="✌️")||
      (playerChoice==="✋"&&computerChoice==="✊")||
      (playerChoice==="✌️"&&computerChoice==="✋")
    ){ 
      result = "🔥 You Win!"; 
      playerScore++; 
      flash("win"); 
      fireworks(); 
    }
    else { 
      result = "💀 You Lose!"; 
      computerScore++; 
      flash("lose"); 
      shake(); 
    }

    playerDisplay.textContent = `Player: ${playerChoice}`;
    computerDisplay.textContent = `Computer: ${computerChoice}`;
    resultDisplay.textContent = result;
    playerScoreEl.textContent = `Player: ${playerScore}`;
    computerScoreEl.textContent = `Computer: ${computerScore}`;
  }

  window.resetGame = function(){
    playerScore=0; computerScore=0;
    playerScoreEl.textContent="Player: 0";
    computerScoreEl.textContent="Computer: 0";
    playerDisplay.textContent="Player: ❓";
    computerDisplay.textContent="Computer: ❓";
    resultDisplay.textContent="Ready?";
  }

  function flash(type){
    document.body.classList.remove("flash-win","flash-lose","flash-tie");
    void document.body.offsetWidth;
    document.body.classList.add("flash-"+type);
  }

  function shake(){
    document.body.animate([
      {transform:"translateX(0)"},
      {transform:"translateX(-10px)"},
      {transform:"translateX(10px)"},
      {transform:"translateX(0)"}
    ],{duration:300});
  }

  // 🔥 Fireworks particles
  const canvas = document.getElementById("particles");
  const ctx = canvas.getContext("2d");
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  function fireworks(){
    for(let i=0;i<50;i++){
      particles.push({
        x: canvas.width/2,
        y: canvas.height/2,
        angle: Math.random()*2*Math.PI,
        speed: Math.random()*5+2,
        life: 60
      });
    }
  }

  function resizeCanvas(){
    canvas.width=window.innerWidth;
    canvas.height=window.innerHeight;
  }

  function loop(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    particles.forEach((p,i)=>{
      p.x += Math.cos(p.angle)*p.speed;
      p.y += Math.sin(p.angle)*p.speed;
      p.life--;
      ctx.fillStyle="hsl("+(p.life*5)+",100%,50%)";
      ctx.fillRect(p.x,p.y,4,4);
      if(p.life<=0) particles.splice(i,1);
    });
    requestAnimationFrame(loop);
  }
  loop();
