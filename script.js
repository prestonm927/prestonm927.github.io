const canvas       = document.getElementById('game');
const context      = canvas.getContext('2d');
const grid         = 15;
const paddleHeight = grid * 5; // 80
const maxPaddleY   = canvas.height - grid - paddleHeight;
const baseBallSpeed = 5;
const gameOverScreen = document.getElementById('gameOver');
const gameContainer = document.getElementById("gameContainer")

// score for Player One (left) and Player Two (right)
var playerOneScore = 0;
var playerTwoScore = 0;

var paddleSpeed = 6;
var ballSpeed   = baseBallSpeed;

var ballTier = 0;

var aiRefeshThreshold = 20;
var aiTarget = 0;
var aiPaddleSpeed = 4

var gameOver = false;
var gameOverDisplayed = false;

const leftPaddle = {
  // start in the middle of the game on the left side
  x: grid * 2,
  y: canvas.height / 2 - paddleHeight / 2,
  width: grid,
  height: paddleHeight,

  // paddle velocity
  dy: 0
};
const rightPaddle = {
  // start in the middle of the game on the right side
  x: canvas.width - grid * 3,
  y: canvas.height / 2 - paddleHeight / 2,
  width: grid,
  height: paddleHeight,

  // paddle velocity
  dy: 0
};
const ball = {
  // start in the middle of the game
  x: canvas.width / 2,
  y: canvas.height / 2,
  width: grid,
  height: grid,

  // keep track of when need to reset the ball position
  resetting: false,

  // ball velocity (start going to the top-right corner)
  dx: ballSpeed,
  dy: -ballSpeed
};

// check for collision between two objects using axis-aligned bounding box (AABB)
// @see https://developer.mozilla.org/en-US/docs/Games/Techniques/2D_collision_detection
function collides(obj1, obj2) {
  return obj1.x < obj2.x + obj2.width &&
         obj1.x + obj1.width > obj2.x &&
         obj1.y < obj2.y + obj2.height &&
         obj1.y + obj1.height > obj2.y;
}

function refreshTarget() {
  aiTarget = ball.y;
}

function aiPaddleMove() {
  if (ball.resetting) {
    leftPaddle.dy = 0;
    return;
  }

  let targetDelta = aiTarget - ball.y;

  console.log({
    aiTarget,
    "ballPos": ball.y,
    "targetDelta": targetDelta
  });

  // if the ball gets to far away from the target, refresh
  if (Math.abs(targetDelta) >= aiRefeshThreshold || playerTwoScore > 6) {
    refreshTarget();
  }

  let targetDistance = leftPaddle.y - aiTarget;
  let scalarDistance = Math.abs(targetDistance);

  leftPaddle.dy = 0;

  let cappedSpeed = Math.min(aiPaddleSpeed, ballSpeed - 2);

  if (scalarDistance > cappedSpeed) {
    // paddle is above ball
    if (targetDistance > 0) {
      leftPaddle.dy = -cappedSpeed;
    // paddle is below ball
    } else if (targetDistance < 0) {
      leftPaddle.dy = cappedSpeed;
    }
  } else {
    // leftPaddle.dy = scalarDistance;
  }
}

function showGameOver(){
  gameOverScreen.style.visibility = "visible";
  gameContainer.style.visibility = "hidden";
}

function hideGameOver(){
  gameOverScreen.visibility = "hidden";
  gameContainer.style.visibility = "visible";
}

function restartButtonFunction(){
  location.reload();
}

// game loop
function loop(timestamp) {
  requestAnimationFrame(loop);
  context.clearRect(0,0,canvas.width,canvas.height);

  if (gameOver) {
    if (!gameOverDisplayed) {
      showGameOver();
      gameOverDisplayed = true;
    }

    return;
  }

  aiPaddleMove();

  // move paddles by their velocity
  leftPaddle.y  += leftPaddle.dy;
  rightPaddle.y += rightPaddle.dy;

  // prevent paddles from going through walls
  if (leftPaddle.y < grid) {
    leftPaddle.y = grid;
  }
  else if (leftPaddle.y > maxPaddleY) {
    leftPaddle.y = maxPaddleY;
  }

  if (rightPaddle.y < grid) {
    rightPaddle.y = grid;
  }
  else if (rightPaddle.y > maxPaddleY) {
    rightPaddle.y = maxPaddleY;
  }

  // draw paddles
  context.fillStyle = 'white';
  context.fillRect(leftPaddle.x, leftPaddle.y, leftPaddle.width, leftPaddle.height);
  context.fillRect(rightPaddle.x, rightPaddle.y, rightPaddle.width, rightPaddle.height);

  // move ball by its velocity
  ball.x += ball.dx;
  ball.y += ball.dy;

  // prevent ball from going through walls by changing its velocity
  if (ball.y < grid) {
    ball.y   = grid;
    ball.dy *= -1;
  }
  else if (ball.y + grid > canvas.height - grid) {
    ball.y   = canvas.height - grid * 2;
    ball.dy *= -1;
  }

  // reset ball if it goes past paddle (but only if we haven't already done so)
  if ((ball.x < 0 || ball.x > canvas.width) && !ball.resetting) {
    ball.resetting = true;
    
    // ball goes off screen to the right -> Player One scored
    if (ball.x > canvas.width) {
      ++playerOneScore;
      ball.dx = baseBallSpeed;
    }
    // ball goes off screen to the left -> Player Two scored
    else if (ball.x < 0) {
      ++playerTwoScore;
      ball.dx = -baseBallSpeed;

      // increase speed as player score gets higher
      if (playerTwoScore % 2 === 1) {
        aiPaddleSpeed += 1;
      }

      // ai becomes more accurate as player score increases
      if (playerTwoScore > 5) {
        aiRefeshThreshold = 10;
      }
    }
    // implement score to HTML
    document.getElementById("playerOneScore").innerHTML = "Player 1 Score: " + playerOneScore;
    document.getElementById("playerTwoScore").innerHTML = "Player 2 Score: " + playerTwoScore;

    leftPaddle.y = canvas.height / 2 - paddleHeight / 2;

    ballTier = 0;

    // give some time for the player to recover before launching the ball again
    setTimeout(() => {
      ball.resetting = false;
      ball.x = canvas.width / 2;
      ball.y = canvas.height / 2;
    }, 400);
  }

  let ballSpeedIncrease = 1;
  let paddleHit = false;

  // check to see if ball collides with paddle. if they do change x velocity
  if (collides(ball, leftPaddle)) {
    // speed up ball, going left
    ball.dx -= ballSpeedIncrease;

    ball.dx *= -1;

    // move ball next to the paddle otherwise the collision will happen again
    // in the next frame
    ball.x = leftPaddle.x + leftPaddle.width;
    paddleHit = true;
  }
  else if (collides(ball, rightPaddle)) {
    // speed up ball, going right
    ball.dx += ballSpeedIncrease;

    ball.dx *= -1;

    // move ball next to the paddle otherwise the collision will happen again
    // in the next frame
    ball.x = rightPaddle.x - ball.width;
    paddleHit = true;
  }

  if (paddleHit) {
    ballTier++;
    ballSpeed++;
  }

  // draw ball
  if (ballTier <= 3) {
    context.fillStyle = 'white';
  } else {
    context.fillStyle = 'red';
  }

  context.fillRect(ball.x, ball.y, ball.width, ball.height);

  // draw walls
  context.fillStyle = 'lightgrey';
  context.fillRect(0, 0, canvas.width, grid);
  context.fillRect(0, canvas.height - grid, canvas.width, canvas.height);

  // draw dotted line down the middle
  for (let i = grid; i < canvas.height - grid; i += grid * 2) {
    context.fillRect(canvas.width / 2 - grid / 2, i, grid, grid);
  }

  if (playerOneScore >= 7 || playerTwoScore >= 7){

    if (playerOneScore > playerTwoScore) {
      document.getElementById("winnerText").innerText = "YOU LOSE";
    } else {
      document.getElementById("winnerText").innerText = "YOU WIN"
    }
    gameOver = true;
  }
}

// listen to keyboard events to move the paddles
document.addEventListener('keydown', function(e) {

  // up arrow key
  if (e.which === 38) {
    rightPaddle.dy = -paddleSpeed;
  }
  // down arrow key
  else if (e.which === 40) {
    rightPaddle.dy = paddleSpeed;
  }

  // w key
  if (e.which === 87) {
    leftPaddle.dy = -paddleSpeed;
  }
  // a key
  else if (e.which === 83) {
    leftPaddle.dy = paddleSpeed;
  }
});

// listen to keyboard events to stop the paddle if key is released
document.addEventListener('keyup', function(e) {
  if (e.which === 38 || e.which === 40) {
    rightPaddle.dy = 0;
  }

  if (e.which === 83 || e.which === 87) {
    leftPaddle.dy = 0;
  }
});

// start the game
requestAnimationFrame(loop);
