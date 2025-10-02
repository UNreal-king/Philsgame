
    const playerDisplay = document.getElementById("playerDisplay");
    const computerDisplay = document.getElementById("computerDisplay");
    const resultDisplay = document.getElementById("resultDisplay");
    const playerScoreEl = document.getElementById("playerScore");
    const computerScoreEl = document.getElementById("computerScore");
    const canvas = document.getElementById("particles");
    const ctx = canvas.getContext("2d");

    const choices = ["✊","✋","✌️"];
    let playerScore = 0, computerScore = 0;
    let particles = [];

    // ✅ Must be global for onclick to work
    function playGame(playerChoice) {
      const computerChoice = choices[Math.floor(Math.random()*choices.length)];
      let result = "";

      if (playerChoice === computerChoice) {
        result = "😐 Tie!";
      } else if (
        (playerChoice==="✊"&&computerChoice==="✌️")||
        (playerChoice==="✋"&&computerChoice==="✊")||
        (playerChoice==="✌️"&&computerChoice==="✋")
      ) {
        result = "🔥 You Win!";
        playerScore++;
        fireworks();
      } else {
        result = "💀 You Lose!";
        computerScore++;
      }

      playerDisplay.textContent = `Player: ${playerChoice}`;
      computerDisplay.textContent = `Computer: ${computerChoice}`;
      resultDisplay.textContent = result;
      playerScoreEl.textContent = `Player: ${playerScore}`;
      computerScoreEl.textContent = `Computer: ${computerScore}`;
    }

    function resetGame() {
      playerScore=0; computerScore=0;
      playerDisplay.textContent="Player: ❓";
      computerDisplay.textContent="Computer: ❓";
      resultDisplay.textContent="Ready?";
      playerScoreEl.textContent="Player: 0";
      computerScoreEl.textContent="Computer: 0";
    }

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    function fireworks(){
      for(let i=0;i<40;i++){
        particles.push({
          x: canvas.width/2,
          y: canvas.height/2,
          angle: Math.random()*2*Math.PI,
          speed: Math.random()*5+2,
          life: 60
        });
      }
    }

    function loop(){
      ctx.clearRect(0,0,canvas.width,canvas.height);
      particles.forEach((p,i)=>{
        p.x += Math.cos(p.angle)*p.speed;
        p.y += Math.sin(p.angle)*p.speed;
        p.life--;
        ctx.fillStyle="hsl("+(p.life*6)+",100%,50%)";
        ctx.fillRect(p.x,p.y,4,4);
        if(p.life<=0) particles.splice(i,1);
      });
      requestAnimationFrame(loop);
    }
    loop();
