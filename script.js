// === Canvas Setup ===
let boardWidth = 360;
let boardHeight = 640;
let board, context;

// === Game Images ===
let backgroundImg = new Image();
backgroundImg.src = "./Images/flappybirdbg.png";

let birdImg = new Image();
birdImg.src = "./Images/flappybird.png";

let topPipeImg = new Image();
topPipeImg.src = "./Images/toppipe.png";

let bottomPipeImg = new Image();
bottomPipeImg.src = "./Images/bottompipe.png";

let playButtonImg = new Image();
playButtonImg.src = "./Images/flappyBirdPlayButton.png";

let flappyBirdTextImg = new Image();
flappyBirdTextImg.src = "./Images/flappyBirdLogo.png";

let gameOverImg = new Image();
gameOverImg.src = "./Images/flappy-gameover.png";

// === Game State Management ===
let GAME_STATE = {
  MENU: "menu",
  PLAYING: "playing",
  GAME_OVER: "gameOver",
};
let currentState = GAME_STATE.MENU;

let inputLocked = false; // Prevents accidental input spamming

// === UI Elements ===
let playButton = {
  x: boardWidth / 2 - 115.5 / 2,
  y: boardHeight / 2 - 64 / 2,
  width: 115,
  height: 64,
};

let logo = {
  x: boardWidth / 2 - 300 / 2,
  y: boardHeight / 4,
  width: 300,
  height: 100,
};

// === Bird and Physics ===
let bird = {
  x: 50,
  y: boardHeight / 2,
  width: 40,
  height: 30,
};
let velocityY = 0;
let gravity = 0.5;
let birdY = boardHeight / 2;

// === Pipes ===
let pipeWidth = 50;
let pipeGap = 200;
let pipeArray = [];
let pipeIntervalId;

// === Score ===
let score = 0;

// === Input Events ===
document.addEventListener("keydown", handleKeyDown);
document.addEventListener("mousedown", handleMouseClick);

// === Initialize the Game ===
window.onload = function () {
  board = document.getElementById("board");
  board.width = boardWidth;
  board.height = boardHeight;
  context = board.getContext("2d");

  requestAnimationFrame(update); // Start render loop
};

// === Game Loop ===
function update() {
  requestAnimationFrame(update);
  context.clearRect(0, 0, board.width, board.height);

  if (currentState === GAME_STATE.MENU) {
    renderMenu();
  } else if (currentState === GAME_STATE.PLAYING) {
    renderGame();
  } else if (currentState === GAME_STATE.GAME_OVER) {
    renderGameOver();
  }
}

// === Render Functions ===

function renderMenu() {
  context.drawImage(backgroundImg, 0, 0, boardWidth, boardHeight);
  context.drawImage(
    playButtonImg,
    playButton.x,
    playButton.y,
    playButton.width,
    playButton.height
  );

  let scaledWidth = logo.width;
  let scaledHeight =
    (flappyBirdTextImg.height / flappyBirdTextImg.width) * scaledWidth;
  context.drawImage(
    flappyBirdTextImg,
    logo.x,
    logo.y,
    scaledWidth,
    scaledHeight
  );
}

function renderGame() {
  // Apply gravity and move bird
  velocityY += gravity;
  bird.y = Math.max(bird.y + velocityY, 0);
  context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);

  // End game if bird falls below screen
  if (bird.y > board.height) {
    currentState = GAME_STATE.GAME_OVER;
    return;
  }

  // Move and render pipes
  for (let i = 0; i < pipeArray.length; i++) {
    let pipe = pipeArray[i];
    pipe.x -= 2; // Move pipe left

    context.drawImage(pipe.img, pipe.x, pipe.y, pipe.width, pipe.height);

    // Score calculation
    if (!pipe.passed && bird.x > pipe.x + pipe.width) {
      score += 0.5; // Count once for each top+bottom pair
      pipe.passed = true;
    }

    // Collision check
    if (detectCollision(bird, pipe)) {
      currentState = GAME_STATE.GAME_OVER;
      return;
    }
  }

  // Remove off-screen pipes
  while (pipeArray.length > 0 && pipeArray[0].x < -pipeWidth) {
    pipeArray.shift();
  }

  // Draw score
  context.fillStyle = "white";
  context.font = "45px sans-serif";
  context.textAlign = "left";
  context.fillText(Math.floor(score), 5, 45);
}

function renderGameOver() {
  let imgWidth = 400;
  let imgHeight = 80;
  let x = (boardWidth - imgWidth) / 2;
  let y = boardHeight / 3;

  context.drawImage(gameOverImg, x, y, imgWidth, imgHeight);

  let scoreText = `Your score: ${Math.floor(score)}`;
  context.fillStyle = "white";
  context.font = "45px sans-serif";
  context.textAlign = "center";
  context.fillText(scoreText, boardWidth / 2, y + imgHeight + 50);

  inputLocked = true;
  setTimeout(() => {
    inputLocked = false;
  }, 1000);
}

// === Input Handlers ===

function handleKeyDown(e) {
  if (inputLocked) return;

  if (e.code === "Space") {
    if (currentState === GAME_STATE.MENU) {
      startGame();
    } else if (currentState === GAME_STATE.PLAYING) {
      velocityY = -6;
    } else if (currentState === GAME_STATE.GAME_OVER) {
      resetGame();
      currentState = GAME_STATE.MENU;
    }
  }
}

function handleMouseClick(e) {
  if (inputLocked) return;

  let rect = board.getBoundingClientRect();
  let mouseX = e.clientX - rect.left;
  let mouseY = e.clientY - rect.top;

  if (currentState === GAME_STATE.MENU) {
    // Click on play button
    if (
      mouseX >= playButton.x &&
      mouseX <= playButton.x + playButton.width &&
      mouseY >= playButton.y &&
      mouseY <= playButton.y + playButton.height
    ) {
      startGame();
    }
  } else if (currentState === GAME_STATE.PLAYING) {
    velocityY = -6;
  } else if (currentState === GAME_STATE.GAME_OVER) {
    resetGame();
    currentState = GAME_STATE.MENU;
  }
}

// === Game Start & Reset ===

function startGame() {
  currentState = GAME_STATE.PLAYING;
  bird.y = birdY;
  velocityY = 0;
  pipeArray = [];
  score = 0;

  // Start generating pipes
  if (pipeIntervalId) clearInterval(pipeIntervalId);
  pipeIntervalId = setInterval(placePipes, 1500);
}

function resetGame() {
  bird.y = birdY;
  velocityY = 0;
  pipeArray = [];
  score = 0;
  clearInterval(pipeIntervalId);
}

// === Pipe Generation ===

function placePipes() {
  let maxTopPipeHeight = boardHeight - pipeGap - 50;
  let topPipeHeight = Math.floor(Math.random() * maxTopPipeHeight);
  let bottomPipeHeight = boardHeight - topPipeHeight - pipeGap;

  let topPipe = {
    x: boardWidth,
    y: 0,
    width: pipeWidth,
    height: topPipeHeight,
    img: topPipeImg,
    passed: false,
  };

  let bottomPipe = {
    x: boardWidth,
    y: topPipeHeight + pipeGap,
    width: pipeWidth,
    height: bottomPipeHeight,
    img: bottomPipeImg,
    passed: false,
  };

  pipeArray.push(topPipe, bottomPipe);
}

// === Collision Detection ===

function detectCollision(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}
