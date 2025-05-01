var currentDicePlayer = 1;
var diceResult1 = 0;
var diceResult2 = 0;
var winner = 0;
var playerColors = { 1: '', 2: '' };
var boardState = [];
var currentTurn = 0;
var timerInterval;
var timeLeft = 20;
var modoIA = false;  

function getPlayerName(player) {
  if (modoIA) {
    return player === 1 ? "Yo" : "El Supremo";
  }
  return "Jugador " + player;
}

function iniciarJuego() {
  var clickSound = document.getElementById('click-sound');
  clickSound.play();
  document.getElementById('menu-principal').style.display = 'none';
  document.getElementById('tablero-juego').style.display = 'flex';
  document.body.style.animation = 'none';
  document.body.style.background = 'linear-gradient(135deg, #2b5876, #4e4376)';
  document.body.style.backgroundSize = '100% 100%';
  crearTablero();
  currentDicePlayer = 1;
  diceResult1 = 0;
  diceResult2 = 0;
  winner = 0;
  document.getElementById('resultado-dado').textContent = '';
  document.getElementById('titulo-modal').textContent = getPlayerName(1) + ": Tira el dado";
  document.getElementById('modal-tirada').style.display = 'flex';
}

function iniciarJuego2() {
  modoIA = true;
  iniciarJuego();
}

function crearTablero() {
  var tablero = document.getElementById('tablero');
  tablero.innerHTML = '';
  boardState = [];
  for (var i = 0; i < 64; i++) {
    boardState.push(0);
    var celda = document.createElement('div');
    celda.classList.add('celda');
    celda.setAttribute('data-index', i);
    celda.addEventListener('click', pintarCelda);
    tablero.appendChild(celda);
  }
}

function tirarDado() {
  var roll = Math.floor(Math.random() * 6) + 1;
  if (currentDicePlayer === 1) {
    diceResult1 = roll;
    document.getElementById('resultado-dado').textContent = getPlayerName(1) + " obtuvo: " + roll;
    currentDicePlayer = 2;
    document.getElementById('titulo-modal').textContent = getPlayerName(2) + ": Tira el dado";
  } else {
    diceResult2 = roll;
    document.getElementById('resultado-dado').textContent += " | " + getPlayerName(2) + " obtuvo: " + roll;
    if (diceResult1 === diceResult2) {
      document.getElementById('resultado-dado').textContent += " - Empate, tira de nuevo.";
      currentDicePlayer = 1;
      diceResult1 = 0;
      diceResult2 = 0;
      document.getElementById('titulo-modal').textContent = getPlayerName(1) + ": Tira el dado";
    } else {
      winner = diceResult1 > diceResult2 ? 1 : 2;
      document.getElementById('resultado-dado').textContent += " - " + getPlayerName(winner) + " elige color.";
      document.getElementById('btn-tirar').disabled = true;
      setTimeout(function() {
        document.getElementById('modal-tirada').style.display = 'none';
        document.getElementById('titulo-color').textContent = getPlayerName(winner) + ": Elige tu color";
        document.getElementById('modal-color').style.display = 'flex';
      }, 2000);
    }
  }
}

function elegirColor(color) {
  if (winner === 1) {
    playerColors[1] = color;
    playerColors[2] = color === 'red' ? 'blue' : 'red';
  } else {
    playerColors[2] = color;
    playerColors[1] = color === 'red' ? 'blue' : 'red';
  }
  document.getElementById('modal-color').style.display = 'none';
  document.querySelector('.marcador.jugador1').style.color = playerColors[1];
  document.querySelector('.marcador.jugador2').style.color = playerColors[2];
  currentTurn = winner;
  startTurn();
}

function startTurn() {
  clearInterval(timerInterval);
  timeLeft = 20;
  updateTimerDisplay();
  document.getElementById('btn-turn').textContent = "Turno: " + getPlayerName(currentTurn);
  timerInterval = setInterval(function() {
    timeLeft--;
    updateTimerDisplay();
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      switchTurn();
    }
  }, 1000);
  if (modoIA && currentTurn === 2) {
    setTimeout(aiMove, 1000);
  }
}

function updateTimerDisplay() {
  document.getElementById('timer-display').textContent = timeLeft;
}

function pintarCelda(event) {

  if (modoIA && currentTurn === 2) return;
  var celda = event.target;
  var index = parseInt(celda.getAttribute('data-index'));
  if (boardState[index] !== 0) return;
  clearInterval(timerInterval);
  boardState[index] = currentTurn;
  celda.style.backgroundColor = playerColors[currentTurn];
  capturePieces(index, currentTurn);
  updateScores();
  switchTurn();
}

function aiMove() {
  var bestIndex = aiChooseMove();
  if (bestIndex !== null) {
    setTimeout(function() {
      aiPintarCelda(bestIndex);
    }, 500);
  }
}

function aiChooseMove() {
  var bestValue = -Infinity;
  var bestIndices = [];
  for (var i = 0; i < boardState.length; i++) {
    if (boardState[i] === 0) {
      var score = evaluateMove(i, 2);
      if (score > bestValue) {
        bestValue = score;
        bestIndices = [i];
      } else if (score === bestValue) {
        bestIndices.push(i);
      }
    }
  }
  if (bestIndices.length > 0) {
    return bestIndices[Math.floor(Math.random() * bestIndices.length)];
  }
  return null;
}

function evaluateMove(index, player) {
  var value = 0;
  var row = Math.floor(index / 8);
  var col = index % 8;
  var directions = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 },
    { dx: 1, dy: 1 },
    { dx: -1, dy: -1 },
    { dx: -1, dy: 1 },
    { dx: 1, dy: -1 }
  ];
  var opponent = player === 1 ? 2 : 1;
  directions.forEach(function(dir) {
    var newRow = row + dir.dy, newCol = col + dir.dx;
    if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
      var adjacentIndex = newRow * 8 + newCol;
      if (boardState[adjacentIndex] === opponent) {
        var newRow2 = newRow + dir.dy, newCol2 = newCol + dir.dx;
        if (newRow2 >= 0 && newRow2 < 8 && newCol2 >= 0 && newCol2 < 8) {
          var endIndex = newRow2 * 8 + newCol2;
          if (boardState[endIndex] === player) {
            value += 10;
          }
        }
      }
      if (boardState[adjacentIndex] === player) {
        value += 1;
      }
    }
  });
  return value;
}

function aiPintarCelda(index) {
  var celda = document.querySelector(".celda[data-index='" + index + "']");
  if (!celda) return;
  clearInterval(timerInterval);
  boardState[index] = currentTurn;
  celda.style.backgroundColor = playerColors[currentTurn];
  capturePieces(index, currentTurn);
  updateScores();
  switchTurn();
}

function capturePieces(index, player) {
  var directions = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 },
    { dx: 1, dy: 1 },
    { dx: -1, dy: -1 },
    { dx: -1, dy: 1 },
    { dx: 1, dy: -1 }
  ];
  var row = Math.floor(index / 8);
  var col = index % 8;
  var opponent = player === 1 ? 2 : 1;
  directions.forEach(function(dir) {
    var newRow = row + dir.dy, newCol = col + dir.dx;
    if (newRow < 0 || newRow > 7 || newCol < 0 || newCol > 7) return;
    var adjacentIndex = newRow * 8 + newCol;
    if (boardState[adjacentIndex] === opponent) {
      var newRow2 = newRow + dir.dy, newCol2 = newCol + dir.dx;
      if (newRow2 < 0 || newRow2 > 7 || newCol2 < 0 || newCol2 > 7) return;
      var endIndex = newRow2 * 8 + newCol2;
      if (boardState[endIndex] === player) {
        boardState[adjacentIndex] = player;
        document.querySelector(".celda[data-index='" + adjacentIndex + "']").style.backgroundColor = playerColors[player];
      }
    }
  });
}

function updateScores() {
  var score1 = boardState.filter(function(val) { return val === 1; }).length;
  var score2 = boardState.filter(function(val) { return val === 2; }).length;
  document.getElementById('p1-puntos').textContent = score1;
  document.getElementById('p2-puntos').textContent = score2;
  

  if (!boardState.includes(0)) {
    var mensajeFinal = document.getElementById('mensaje-final');
    var finalText = "";
    var audio;
    if (score1 > score2) {
      finalText = "¡" + getPlayerName(1) + " ha ganado 😎😁👍!";
      audio = new Audio("/Color War/sonidos/victoria.wav");
    } else if (score2 > score1) {
      finalText = "¡" + getPlayerName(2) + " ha ganado 😊✌️😀!";

      if (modoIA) {
        audio = new Audio("/Color War/sonidos/derrota.wav");
      } else {
        audio = new Audio("/Color War/sonidos/victoria.wav");
      }
    } else {
      finalText = "¡Empate 😐😐😐!";
    }
    mensajeFinal.textContent = finalText;
    mensajeFinal.style.display = "block";
    audio.play();
    setTimeout(function() {
      location.reload();
    }, 5000);
  }
}

function switchTurn() {
  currentTurn = currentTurn === 1 ? 2 : 1;
  startTurn();
}

document.getElementById('btn-help').addEventListener('click', function() {
  document.getElementById('modal-help').style.display = 'flex';
});

function cerrarModalHelp() {
  document.getElementById('modal-help').style.display = 'none';
}
function mostrarMensaje() {
    alert("¡Muchas gracias por visitar mi página!");
  }
  