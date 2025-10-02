// STEP 1: Setup references
const playerDisplay = document.getElementById("playerDisplay");
const computerDisplay = document.getElementById("computerDisplay");
const resultDisplay = document.getElementById("resultDisplay");

const choices = ["✊", "✋", "✌️"];

// STEP 2: Main function
function playGame(playerChoice) {
  const computerChoice = getComputerChoice();
  const result = getResult(playerChoice, computerChoice);

  updateDisplay(playerChoice, computerChoice, result);
  animateResult();
}

// STEP 3: Computer choice generator
function getComputerChoice() {
  return choices[Math.floor(Math.random() * choices.length)];
}

// STEP 4: Compare choices → decide winner
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

// STEP 5: Update the UI
function updateDisplay(player, computer, result) {
  playerDisplay.textContent = `Player: ${player}`;
  computerDisplay.textContent = `Computer: ${computer}`;
  resultDisplay.textContent = result;
}

// STEP 6: Add a pulse animation to result
function animateResult() {
  resultDisplay.style.animation = "none"; // reset
  void resultDisplay.offsetWidth;         // trick to restart animation
  resultDisplay.style.animation = "pulse 2s infinite alternate";
}
