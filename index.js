// Elements
const playerDisplay = document.getElementById("playerDisplay");
const computerDisplay = document.getElementById("computerDisplay");
const resultDisplay = document.getElementById("resultDisplay");
const playerScoreEl = document.getElementById("playerScore");
const computerScoreEl = document.getElementById("computerScore");

const choices = ["✊", "✋", "✌️"];
let playerScore = 0;
let computerScore = 0;

// Game flow
function playGame(playerChoice) {
  const computerChoice = getComputerChoice();
  const result = getResult(playerChoice, computerChoice);

  updateDisplay(playerChoice, computerChoice, result);
  updateScore(result);
  animateResult(result);
}

function getComputerChoice() {
  return choices[Math.floor(Math.random() * choices.length)];
}

function getResult(player, computer) {
  if (player === computer) return "😐 It's a Tie!";
  if (
    (player === "✊" && computer === "✌️") ||
    (player === "✋" && computer === "✊") ||
    (player === "✌️" && computer === "✋")
  ) {
    return "🔥 You Win!";
  }
  return "💀 You Lose!";
}

function updateDisplay(player, computer, result) {
  playerDisplay.textContent = `Player: ${player}`;
  computerDisplay.textContent = `Computer: ${computer}`;
  resultDisplay.textContent = result;
}

function updateScore(result) {
  if (result.includes("Win")) playerScore++;
  if (result.includes("Lose")) computerScore++;
  playerScoreEl.textContent = `Player: ${playerScore}`;
  computerScoreEl.textContent = `Computer: ${computerScore}`;
}

function animateResult(result) {
  document.body.classList.remove("flash-win", "flash-lose", "flash-tie");
  void document.body.offsetWidth; // restart animation

  if (result.includes("Win")) document.body.classList.add("flash-win");
  else if (result.includes("Lose")) document.body.classList.add("flash-lose");
  else document.body.classList.add("flash-tie");
}

// Reset
function resetGame() {
  playerScore = 0;
  computerScore = 0;
  playerScoreEl.textContent = "Player: 0";
  computerScoreEl.textContent = "Computer: 0";
  playerDisplay.textContent = "Player: ❓";
  computerDisplay.textContent = "Computer: ❓";
  resultDisplay.textContent = "Ready?";
}
