// Variável global para o tamanho do tabuleiro
let BOARD_SIZE = 9; // Padrão (número de colunas)
const NUM_ROWS = 4; // Número fixo de linhas

// Variável global para dificuldade da IA
let AI_DIFFICULTY = 'medium'; // Padrão: médio
let AI_SIMULATIONS = 30; // Será ajustado conforme a dificuldade

// Login
const loginForm = document.getElementById('loginForm');
const loginPage = document.getElementById('loginPage');
const registerForm = document.getElementById("registerForm");
const showRegisterLink = document.getElementById("showRegister");
const showLoginLink = document.getElementById("showLogin");
const gamePage = document.getElementById('gamePage');
const configPanel = document.getElementById('configPanel');

// Alternar para registro
showRegisterLink.addEventListener("click", (e) => {
    e.preventDefault();
    loginForm.classList.add("oculto");
    registerForm.classList.remove("oculto");
});

// Alternar para login
showLoginLink.addEventListener("click", (e) => {
    e.preventDefault();
    registerForm.classList.add("oculto");
    loginForm.classList.remove("oculto");
});


const API_BASE = "http://localhost:3000";
// Login form submission
loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    console.log ("Dados do formulário de login:\n", {username, password});

    try {

      console.log("Enviando dados de login para o servidor...\n", JSON.stringify({
            username: username,
            password: password,
        }),);  
      const res = await fetch(`${API_BASE}/api/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            username: username,
            password: password,
        }),
        });


      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Erro no login!");
        return;
      }

      // Login bem-sucedido
      console.log("Dados do jogador:", data.player);

      // Mostrar a página do jogo e esconder login
      loginPage.classList.add("oculto");
      configPanel.classList.remove("oculto");

      // Aqui você pode inicializar o jogo com os dados do jogador
      document.getElementById("turn-player-display").textContent = data.player.Username;

    } catch (err) {
      console.error("Erro no fetch:", err);
      alert("Erro ao conectar com o servidor.");
    }
});


// register form submission
registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("regUsername").value.trim();
    const password = document.getElementById("regPassword").value.trim();

    try {
        const res = await fetch(`${API_BASE}/api/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.error || "Erro ao registrar usuário.");
            return;
        }

        alert("Cadastro realizado com sucesso! Faça login para continuar.");

        // Limpar registro e voltar ao login
        registerForm.reset();
        registerForm.classList.add("oculto");
        loginForm.classList.remove("oculto");

    } catch (err) {
        console.error("Erro no registro:", err);
        alert("Erro ao conectar com o servidor.");
    }
});

// Configurações do Jogo
const btnIniciarJogo = document.getElementById('btnIniciarJogo');
const gameModeSelect = document.getElementById('gameMode');
const aiLevelOption = document.getElementById('aiLevelOption');

// Botões do Menu de Fim de Jogo
const btnDesistir = document.getElementById('btnDesistir');
const endGameMenu = document.getElementById('endGameMenu');
const endGameMessage = document.getElementById('endGameMessage');
const btnVoltarInicio = document.getElementById('btnVoltarInicio');
const btnJogarNovamente = document.getElementById('btnJogarNovamente');

// Mostrar/ocultar opção de nível da IA conforme o modo de jogo
gameModeSelect.addEventListener('change', () => {
    if (gameModeSelect.value === 'player') {
        aiLevelOption.style.display = 'none';
    } else {
        aiLevelOption.style.display = 'block';
    }
});

btnIniciarJogo.addEventListener('click', () => {
    // Obter configurações escolhidas
    const boardSize = parseInt(document.getElementById('boardSize').value);
    const gameMode = document.getElementById('gameMode').value;
    const firstPlayer = document.getElementById('firstPlayer').value;
    const aiLevel = document.getElementById('aiLevel').value;

    // Atualizar tamanho do tabuleiro (número de colunas)
    BOARD_SIZE = boardSize;
    
    // Configurar dificuldade da IA
    AI_DIFFICULTY = aiLevel;
    
    // Define o número de simulações conforme a dificuldade
    switch(AI_DIFFICULTY) {
        case 'easy':
            AI_SIMULATIONS = 10; // Fácil: 10 simulações
            break;
        case 'medium':
            AI_SIMULATIONS = 30; // Médio: 30 simulações
            break;
        case 'hard':
            AI_SIMULATIONS = 100; // Difícil: 100 simulações
            break;
        default:
            AI_SIMULATIONS = 30;
    }
    
    console.log(`Dificuldade selecionada: ${AI_DIFFICULTY} (${AI_SIMULATIONS} simulações)`);

    // Guardar configurações
    sessionStorage.setItem('boardSize', boardSize);
    sessionStorage.setItem('gameMode', gameMode);
    sessionStorage.setItem('firstPlayer', firstPlayer);
    sessionStorage.setItem('aiLevel', aiLevel);

    // Definir o jogador inicial
    playerTurn = firstPlayer;

    // Ocultar painel de configurações e mostrar página do jogo
    configPanel.classList.add('oculto');
    gamePage.classList.remove('oculto');

    // Criar o tabuleiro com as configurações
    createBoard();

    // Se o computador começa, iniciar o turno dele
    if (firstPlayer === 'blue') {
        updateTurnIndicator();
        showMessage("O computador (Azul) começa o jogo...");
        setTimeout(() => {
            handleAITurn();
        }, 1000);
    } else {
        updateTurnIndicator();
        showMessage("Você (Vermelho) começa! Clique no dado para lançar.");
    }
});

// Overlay
const overlay = document.getElementById('overlay');

// Instruções
const btnInstrucoes = document.getElementById('btnInstrucoes');
const instrucoes = document.getElementById('instrucoes');
const btnFecharInstrucoes = document.getElementById('btnFecharInstrucoes');

btnInstrucoes.addEventListener('click', () => {
    instrucoes.classList.add('instrucoes-visiveis');
    overlay.classList.add('ativo');
});

btnFecharInstrucoes.addEventListener('click', () => {
    instrucoes.classList.remove('instrucoes-visiveis');
    overlay.classList.remove('ativo');
});

// Classificações
const btnClassificacoes = document.getElementById('btnClassificacoes');
const classificacoes = document.getElementById('classificacoes');
const btnFecharClassificacoes = document.getElementById('btnFecharClassificacoes');

btnClassificacoes.addEventListener('click', () => {
    classificacoes.classList.add('classificacoes-visiveis');
    overlay.classList.add('ativo');
});

btnFecharClassificacoes.addEventListener('click', () => {
    classificacoes.classList.remove('classificacoes-visiveis');
    overlay.classList.remove('ativo');
});

overlay.addEventListener('click', () => {
  classificacoes.classList.remove('classificacoes-visiveis');
  overlay.classList.remove('ativo');
});

async function carregarClassificacoes() {
  try {
    const response = await fetch(`${API_BASE}/api/leaderboard`);
    const data = await response.json();

    const tbodyLogin = document.querySelector('#classificacoes tbody');
    const tbodyGame = document.querySelector('#classificacoesJogo tbody');

    [tbodyLogin, tbodyGame].forEach(tbody => {
      tbody.innerHTML = '';
      data.forEach((player, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${index + 1}º</td>
          <td>${player.username}</td>
          <td>${player.victories}</td>
          <td>${player.defeats}</td>
        `;
        tbody.appendChild(row);
      });
    });

  } catch (error) {
    console.error('Erro ao carregar classificações:', error);
  }
}

window.addEventListener('load', carregarClassificacoes);

// Instruções na página do jogo
const btnInstrucoesJogo = document.getElementById('btnInstrucoesJogo');
const instrucoesJogo = document.getElementById('instrucoesJogo');
const btnFecharInstrucoesJogo = document.getElementById('btnFecharInstrucoesJogo');

btnInstrucoesJogo.addEventListener('click', () => {
    instrucoesJogo.classList.add('instrucoes-visiveis');
    overlay.classList.add('ativo');
});

btnFecharInstrucoesJogo.addEventListener('click', () => {
    instrucoesJogo.classList.remove('instrucoes-visiveis');
    overlay.classList.remove('ativo');
});

// Classificações na página do jogo
const btnClassificacoesJogo = document.getElementById('btnClassificacoesJogo');
const classificacoesJogo = document.getElementById('classificacoesJogo');
const btnFecharClassificacoesJogo = document.getElementById('btnFecharClassificacoesJogo');

btnClassificacoesJogo.addEventListener('click', () => {
    classificacoesJogo.classList.add('classificacoes-visiveis');
    overlay.classList.add('ativo');
});

btnFecharClassificacoesJogo.addEventListener('click', () => {
    classificacoesJogo.classList.remove('classificacoes-visiveis');
    overlay.classList.remove('ativo');
});

// --- Bloco de Listeners do Fim de Jogo (agora num só sítio) ---

btnDesistir.addEventListener('click', () => {
    showEndGameMenu('blue'); // Azul (PC) ganha se Vermelho (jogador) desistir
});

// Voltar à página inicial
btnVoltarInicio.addEventListener('click', () => {
    endGameMenu.classList.add('oculto');
    gamePage.classList.add('oculto');
    loginPage.classList.remove('oculto');
    overlay.classList.remove('ativo');

    sessionStorage.clear();
    loginForm.reset();
});

// Jogar novamente
btnJogarNovamente.addEventListener('click', () => {
    endGameMenu.classList.add('oculto');
    gamePage.classList.add('oculto');
    configPanel.classList.remove('oculto');
    overlay.classList.remove('ativo');

    // Resetar variáveis do jogo
    selectedPiece = null;
    diceValue = 0;
    playerTurn = 'red';
    matrix = null;
    pieces = []; // ADICIONE ESTA LINHA

    resetDiceUI();
});

// --- Fim do Bloco de Listeners duplicados ---

// --- Variáveis Globais do Jogo ---
const board = document.getElementById('board');
const moveSelector = document.getElementById('moveSelector');
const moveUpBtn = document.getElementById('move_up');
const moveDownBtn = document.getElementById('move_down');

const dicePanel = document.getElementById('dice-panel');
const diceSticks = document.querySelectorAll('#dice-sticks .stick');
const diceValueDisplay = document.getElementById('dice-value-display');
const diceMessage = document.getElementById('dice-message');

const messageBar = document.getElementById('message-bar');
const turnIndicator = document.getElementById('turn-indicator');
const turnPlayerDisplay = document.getElementById('turn-player-display');
const diceLogList = document.getElementById('dice-log-list');

const maxPieces = 12;
let selectedPiece = null;
let diceValue = 0;
let playerTurn = 'red';
let matrix = null;
let pieces = []; // Esta linha já estava aqui, a de cima era duplicada

// Variável de controlo para a Promise do askDirection
let resolveAskDirection = null;

// Função para mostrar mensagens ao jogador
function showMessage(message, type = 'info') {
    messageBar.textContent = message;
    messageBar.className = type;
}

// Função para atualizar o indicador de turno
function updateTurnIndicator() {
    if (playerTurn === 'red') {
        turnPlayerDisplay.textContent = 'Vermelho';
        turnIndicator.className = 'red';
    } else {
        turnPlayerDisplay.textContent = 'Azul (PC)';
        turnIndicator.className = 'blue';
    }
}


// Função de criar o tabuleiro
function createBoard() {
    const board = document.getElementById('board');
    board.innerHTML = ''; // Limpa o tabuleiro

    // Atualiza o CSS grid com o novo tamanho (BOARD_SIZE colunas)
    board.style.gridTemplateColumns = `repeat(${BOARD_SIZE}, 50px)`;

    // Total de casas = BOARD_SIZE colunas * 4 linhas
    const totalSquares = BOARD_SIZE * NUM_ROWS;

    // Inicializa a matriz
    matrix = [];
    for (let row = 0; row < NUM_ROWS; row++) {
        matrix[row] = [];
        for (let col = 0; col < BOARD_SIZE; col++) {
            matrix[row][col] = 0;
        }
    }

    // Inicializa o array de peças
    pieces = [];

    let squareIndex = 0;
    for (let row = 0; row < NUM_ROWS; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            // ... (criação do square) ...
            const square = document.createElement('div');
            square.className = 'square';
            square.dataset.row = row;
            square.dataset.col = col;
            if (col === BOARD_SIZE - 1) {
                square.dataset.lastCol = 'true';
            }

            // ADAPTADO: Posiciona peças em TODAS as casas das linhas 0 e 3
            if (row === 0) { // Linha 0 (Vermelho)
                const piece = document.createElement('div');
                piece.className = 'piece_red';
                piece.dataset.first_move = 'true';
                piece.dataset.top_column = 'false';
                square.appendChild(piece);
                matrix[row][col] = 1;
                square.addEventListener('click', handleClick);
            }
            else if (row === NUM_ROWS - 1) { // Linha 3 (Azul)
                const piece = document.createElement('div');
                piece.className = 'piece_blue';
                piece.dataset.first_move = 'true';
                piece.dataset.top_column = 'false';
                square.appendChild(piece);
                matrix[row][col] = 2;
                square.addEventListener('click', handleClick);
            }
            else {
                square.addEventListener('click', handleClick);
            }
            board.appendChild(square);
        }
    }
    updateTurnIndicator();
}

// Função para lançar dado
function rollDice() {
    let tab = 0;
    for (let i = 0; i < 4; i++){
        let prob = Math.random();
        if (prob >= 0.50){
            tab++;
            diceSticks[i].className = 'stick claro';
        } else {
            diceSticks[i].className = 'stick escuro';
        }
    }

    if (tab === 0){
        diceValue = 6;
    }
    else{
        diceValue = tab;
    }

    diceValueDisplay.textContent = diceValue;
    diceMessage.textContent = `Selecione uma peça para mover.`;
    showMessage(`Dado lançado: ${diceValue}! Selecione uma peça.`);

    return diceValue;
}

// Função para lidar com o clique no painel do dado
async function handleDiceRoll() {
    if (diceValue !== 0) {
        showMessage("Já lançou o dado. Mova uma peça!", 'error');
        return;
    }
    if (playerTurn !== 'red') {
        showMessage("É a vez do computador!", 'error');
        return;
    }

    rollDice(); // Isto define o 'diceValue' global
    addLog('red', diceValue);

    // --- NOVO BLOCO DE VALIDAÇÃO (Corrige o Jogo "Preso") ---
    if (typeof window.legalMovesForDice === 'function') {
        // Usa as funções do MonteCarlo.js para verificar o estado
        const currentState = window.buildStateFromDOM();
        const validMoves = window.legalMovesForDice(currentState, 1, diceValue); // 1 = jogador vermelho

        if (validMoves.length === 0) {
            // NÃO HÁ JOGADAS VÁLIDAS! Este é o bug que reportou.
            showMessage(`Não há jogadas válidas com o dado ${diceValue}.`, 'error');

            if (diceValue !== 1 && diceValue !== 4 && diceValue !== 6) {
                // Dado 2 ou 3: Passa a vez
                showMessage("A passar a vez ao computador...", 'error');
                // Espera 2 segundos para a mensagem ser lida
                await new Promise(resolve => setTimeout(resolve, 2000));
                handleAITurn();
            } else {
                // Dado 1, 4, ou 6: Reroll
                showMessage("Rode novamente o dado! Clique no dado.");
                // Espera 2 segundos
                await new Promise(resolve => setTimeout(resolve, 2000));
                resetDiceUI();
            }
            return; // Impede o resto da função de correr
        }
    } else {
        console.warn("legalMovesForDice não foi encontrada. A saltar a validação de jogada.");
    }
}

// Função 'move' retorna 3 estados: 'success', 'reroll_only', 'fail'
async function move(row, col, diceValue, can_go_up, pieceElement, originalSquareElement, aiMoveChoice = null) {
    let targetRow = parseInt(row);
    let targetCol = parseInt(col);

    console.log("Initial position:", targetRow, targetCol, pieceElement);
    let direction = 0;

    let first_move_used = false;

    // --- LÓGICA DE FIRST_MOVE (Verificação inicial) ---
    if (pieceElement.dataset.first_move === 'true') {
        if (diceValue === 1) {
            first_move_used = true;
            pieceElement.dataset.first_move = 'false'; //
        } else {
            showMessage("No primeiro movimento, só se pode mover 1 casa.", 'error');
            if (diceValue === 4 || diceValue === 6){
                return 'reroll_only';
            }
            return 'fail';
        }
    }
    // --- FIM DA VERIFICAÇÃO ---

    // Loop de movimento
    for (let k = 0; k < diceValue; k++) {

        // --- LÓGICA DE MOVIMENTO (CORRIGIDA) ---

        // 1. Define sempre a direção
        if (targetRow === 1 || targetRow === 3) {
            direction = 1;
        } else if (targetRow === 0 || targetRow === 2) {
            direction = -1;
        }

        // 2. Verifica se é o caso especial (1º passo de 1º mov)
        if (first_move_used && k === 0) {
            if (targetRow === 0 && targetCol === BOARD_SIZE - 1) {
                targetCol -= 1; // Caso especial do canto
            } else {
                // É um 1º mov, mas não no canto, move-se normalmente
                targetCol += direction;
            }
        } else {
            // É um passo normal (k > 0)
            targetCol += direction;
        }
        // --- FIM DA CORREÇÃO ---


        // --- Lógica de transição de linha (sem alteração) ---
        if (targetCol < 0 || targetCol >= BOARD_SIZE) {
            if (targetRow === 0) {
                targetRow = 1;
                targetCol = 0;
            }
            else if (targetRow === 1) {
                let moveChoice = 'down';
                if (playerTurn === 'red' && pieceElement.dataset.top_column === 'false' && targetCol >= BOARD_SIZE) {
                    moveChoice = await askDirection();
                }
                else if (playerTurn === 'blue') {
                    moveChoice = aiMoveChoice;
                }

                if (moveChoice === 'up' && pieceElement.dataset.top_column === 'false') {
                    pieceElement.dataset.top_column = 'true';
                    targetRow = 0;
                    targetCol = BOARD_SIZE - 1;
                } else { // 'down'
                    targetRow = 2;
                    targetCol = BOARD_SIZE - 1;
                }
            }
            else if (targetRow === 2) {
                targetRow = 1;
                targetCol = 0;
            } else if (targetRow === 3) {
                targetRow = 2;
                targetCol = BOARD_SIZE - 1;
            }
        }
    }

    const pieceValue = matrix[row][col];
    if (matrix[targetRow][targetCol] === pieceValue) {
        showMessage("Não pode mover, existe uma peça sua na casa de destino.", 'error');
        // Rollback
        if (first_move_used) {
            pieceElement.dataset.first_move = 'true';
        }
        return 'fail';
    }

    const targetSquare = document.querySelector(`.square[data-row='${targetRow}'][data-col='${targetCol}']`);
    if (!targetSquare) {
        showMessage("Erro: Casa de destino não encontrada no DOM.", 'error');
        if (first_move_used) { // Rollback
            pieceElement.dataset.first_move = 'true';
        }
        return 'fail';
    }

    // --- Lógica de Captura (sem alteração) ---
    if (matrix[targetRow][targetCol] !== 0) {
        showMessage("Capturou uma peça do seu adversário!", 'info');
        targetSquare.innerHTML = '';

        if (checkWinCondition()) {
            return 'success_win';
        }
    }

    targetSquare.appendChild(pieceElement);
    matrix[targetRow][targetCol] = pieceValue;
    matrix[row][col] = 0;

    return 'success';
}

// Função para limpar o painel de dados
function resetDiceUI() {
    diceValue = 0;
    diceValueDisplay.textContent = "-";
    diceMessage.textContent = "Clique aqui para lançar";
    diceSticks.forEach(stick => stick.className = 'stick');

    // Garante que o indicador de turno está correto
    updateTurnIndicator();
}

// Função para pedir direção ao jogador
function askDirection(){
    return new Promise((resolve) => {
        moveSelector.classList.remove('oculto'); // Mostra o painel
        overlay.classList.add('ativo');      // Mostra o overlay
        resolveAskDirection = resolve;
    });
}

async function highlightMove(row, col, diceValue, can_go_up, pieceElement, originalSquareElement) {
    let targetRow = parseInt(row);
    let targetCol = parseInt(col);

    console.log("Highlight Initial:", targetRow, targetCol, pieceElement);
    let direction = 0;

    let first_move_used = false;

    // --- LÓGICA DE FIRST_MOVE (Verificação inicial) ---
    if (pieceElement.dataset.first_move === 'true') {
        if (diceValue === 1) {
            first_move_used = true;
        } else {
            showMessage("No primeiro movimento, só se pode mover 1 casa.", 'error');
            if (diceValue === 4 || diceValue === 6){
                return 'reroll_only';
            }
            return 'fail';
        }
    }
    // --- FIM DA VERIFICAÇÃO ---

    // Loop de movimento
    for (let k = 0; k < diceValue; k++) {

        // --- LÓGICA DE MOVIMENTO (CORRIGIDA) ---

        // 1. Define sempre a direção
        if (targetRow === 1 || targetRow === 3) {
            direction = 1;
        } else if (targetRow === 0 || targetRow === 2) {
            direction = -1;
        }

        // 2. Verifica se é o caso especial (1º passo de 1º mov)
        if (first_move_used && k === 0) {
            if (targetRow === 0 && targetCol === BOARD_SIZE - 1) {
                targetCol -= 1; // Caso especial do canto
            } else {
                // É um 1º mov, mas não no canto, move-se normalmente
                targetCol += direction;
            }
        } else {
            // É um passo normal (k > 0)
            targetCol += direction;
        }
        // --- FIM DA CORREÇÃO ---


        // --- Lógica de transição de linha (sem alteração) ---
        if (targetCol < 0 || targetCol >= BOARD_SIZE) {
            if (targetRow === 0) {
                targetRow = 1;
                targetCol = 0;
            } else if (targetRow === 1) {
                let moveChoice = 'down';

                 if (playerTurn === 'red' && pieceElement.dataset.top_column === 'false' && targetCol >= BOARD_SIZE) {
                    showMessage("Esta jogada leva a uma bifurcação. A escolha aparecerá se confirmar.", "info");
                    targetRow = 1;
                    targetCol = BOARD_SIZE -1;
                    break;
                }

                if (moveChoice === 'up' && pieceElement.dataset.top_column === 'false') {
                    targetRow = 0;
                    targetCol = BOARD_SIZE - 1;
                } else {
                    targetRow = 2;
                    targetCol = BOARD_SIZE - 1;
                }
            } else if (targetRow === 2) {
                targetRow = 1;
                targetCol = 0;
            } else if (targetRow === 3) {
                targetRow = 2;
                targetCol = BOARD_SIZE - 1;
            }
        }
    }

    const targetSquare = document.querySelector(`.square[data-row='${targetRow}'][data-col='${targetCol}']`);
    const currentTarget = document.querySelector(`.square[data-row='${row}'][data-col='${col}']`);


    if (!targetSquare) {
        showMessage("Casa de destino inválida.", "error");
        return 'fail';
    }

    // VERIFICAÇÃO FINAL: Não pode aterrar na própria peça
    const pieceValue = matrix[row][col];
    if (matrix[targetRow][targetCol] === pieceValue) {
        showMessage("Não pode mover, existe uma peça sua na casa de destino.", 'error');
        return 'fail';
    }

    highlight(targetSquare);

    // --- Espera o clique do jogador para confirmar ---
    const confirmation = await waitForClickOnSquare(targetSquare, currentTarget);

    clearHighlights();

    if (!confirmation) {
        showMessage("Movimento cancelado.", "error");
        return 'cancel';
    }

    // Se confirmou, devolve o square para mover
    return targetSquare;
}

function waitForClickOnSquare(squareElement, originalSquareElement) {
    return new Promise((resolve) => {
        let confirmed = false;

        const handleConfirm = (event) => {
            if (squareElement.contains(event.target)) {
                confirmed = true;
                cleanup();
                resolve(true); // Confirmado
            }
        };

        const handleCancel = (event) => {
            if (!squareElement.contains(event.target)) {
                cleanup();
                resolve(false); // Cancelado
            }
        };

        function cleanup() {
            squareElement.removeEventListener("click", handleConfirm);
            document.removeEventListener("click", handleCancel, true);
        }

        // Espera um pequeno atraso antes de ativar o listener global,
        // evitando capturar o mesmo clique que selecionou a peça
        setTimeout(() => {
            squareElement.addEventListener("click", handleConfirm);
            originalSquareElement.addEventListener("click", handleConfirm);
            document.addEventListener("click", handleCancel, true);
        }, 100);
    });
}



// Função para lidar com o clique numa casa
async function handleClick(e) {
    const square = e.currentTarget;

    if (diceValue === 0) {
        showMessage("Clique no painel 'Dado de Paus' para lançar o dado primeiro!", 'error');
        return;
    }

    if (playerTurn !== 'red') {
        showMessage("É a vez do computador, por favor aguarde.", 'error');
        return;
    }

    // ADAPTADO: Limpa destaques da jogada anterior
    clearHighlights();

    const piece = square.querySelector('.piece_red');
    if (piece) {
        // ADAPTADO: Destaque de início
        square.classList.add('selected');

        const row = parseInt(square.dataset.row);
        const col = parseInt(square.dataset.col);
        const can_go_up = true;

        // Passa 'null' como aiMoveChoice

        // ADAPTADO: Destaque de fim
        const sqEnd = piece.parentElement;

        const confirmTarget = await highlightMove(row, col, diceValue, can_go_up, piece, square);

        let moveResult = 'move_not_confirmed';

        // Só permite mover se o jogador confirmou o clique e devolveu uma casa válida
        if (confirmTarget instanceof HTMLElement && confirmTarget.classList.contains('square')) {
            // Jogador confirmou corretamente
            moveResult = await move(row, col, diceValue, can_go_up, piece, square, null);
        } else if (confirmTarget === 'cancel' || confirmTarget === false) {
            showMessage("Movimento cancelado. Selecione outra peça.", "error");
        } else if (confirmTarget === 'reroll_only'){
            showMessage("Joga novamente! Clique no dado.");
            resetDiceUI();
        } else {
            showMessage("Tem de clicar na casa destacada para confirmar o movimento.", "error");
        }


        if (moveResult === 'success' || moveResult === 'success_win') {
            if (sqEnd && sqEnd.classList.contains('square')) {
                sqEnd.classList.add('highlight-end');
            }
        }

        switch (moveResult) {
            case 'success_win':
                // O jogo acabou, o menu já foi mostrado pela checkWinCondition
                break;
            case 'success':
                // clearHighlights(); -> Removido para manter o destaque
                if (diceValue !== 1 && diceValue !== 4 && diceValue !== 6) {
                    showMessage("Movimento bem-sucedido. A passar a vez ao computador...");
                    // ADAPTADO: Chama o handleAITurn correto
                    handleAITurn();
                } else {
                    showMessage("Movimento bem-sucedido! Joga novamente. Clique no dado.");
                    resetDiceUI();
                }
                break;
            case 'reroll_only':
                showMessage("Joga novamente! Clique no dado.");
                resetDiceUI();
                break;
            case 'fail':
                showMessage("Jogada inválida. Tente mover outra peça.", 'error');
                // O 'diceValue' não é resetado, permitindo ao jogador tentar outra peça.
                break;
            case 'move_not_confirmed':
                showMessage("Movimento não confirmado. Selecione outra peça para mover.", 'error');
                break;
        }

    } else {
        if (square.querySelector('.piece_blue')) {
            showMessage("Essa é uma peça do oponente!", 'error');
        } else {
            showMessage("Selecione uma peça vermelha para mover.", 'error');
        }
    }
}

// A função de turno do computador passou a ser fornecida pelo MonteCarlo.js.
function handleAITurn() {
    playerTurn = 'blue';
    updateTurnIndicator();

    // Verifica se a função MonteCarlo existe (do MonteCarlo.js)
    if (typeof window.handleAITurn_MonteCarloRandom === 'function') {
        console.log("A chamar o turno da IA (Monte Carlo)...");
        // Passa o número de simulações configurado
        window.handleAITurn_MonteCarloRandom(AI_SIMULATIONS, 0); // Usa AI_SIMULATIONS em vez de 1000
    } else {
        // Fallback (se MonteCarlo.js falhar a carregar)
        console.warn("MonteCarlo.js não encontrado. A usar IA de 'placeholder'.");
        showMessage("É a vez do computador... o 'Azul' está a pensar...");
        setTimeout(() => {
            showMessage("O computador 'Azul' jogou. É a sua vez.");
            playerTurn = 'red';
            resetDiceUI();
        }, 500);
    }
}

// Funções de destaque
function highlight(square) {
    clearHighlights();
    square.classList.add('highlight-end');
}


function clearHighlights() {
    document.querySelectorAll('.square').forEach(sq => {
        sq.classList.remove('selected', 'highlight-start', 'highlight-end', 'highlight-target');
    });
}

moveUpBtn.addEventListener('click', () => {
    if (resolveAskDirection) {
        moveSelector.classList.add('oculto'); // Esconde o painel
        overlay.classList.remove('ativo');    // Esconde o overlay
        resolveAskDirection('up');
        resolveAskDirection = null;
    }
});

moveDownBtn.addEventListener('click', () => {
    if (resolveAskDirection) {
        moveSelector.classList.add('oculto'); // Esconde o painel
        overlay.classList.remove('ativo');    // Esconde o overlay
        resolveAskDirection('down');
        resolveAskDirection = null;
    }
});


// --- Funções de Fim de Jogo (agora num só sítio) ---
function showEndGameMenu(winner) {
    const message = (winner === 'red') ? 'Os Vermelhos Venceram!' : 'Os Azuis Venceram!';
    endGameMessage.textContent = message;
    endGameMenu.classList.remove('oculto');
    overlay.classList.add('ativo'); // Ativa o overlay
}

function checkWinCondition() {
    const redPieces = document.querySelectorAll('#board .piece_red');
    const bluePieces = document.querySelectorAll('#board .piece_blue');

    if (redPieces.length === 0) {
        // Azul venceu
        showEndGameMenu('blue');
        return true;
    }
    if (bluePieces.length === 0) {
        // Vermelho venceu
        showEndGameMenu('red');
        return true;
    }
    return false;
}

const MAX_LOG_ENTRIES = 10; // Reduzido de 20 para 10

function addLog(playerColor, diceValue) {
    if (!diceLogList) return; // Segurança

    const li = document.createElement('li');
    const ball = document.createElement('span');
    ball.className = `log-ball ${playerColor}`;

    const text = document.createElement('span'); // MUDADO: createElement em vez de createTextNode
    text.textContent = diceValue;
    text.className = `log-number ${playerColor}`; // ADICIONADO: classe para colorir o número

    li.appendChild(ball);
    li.appendChild(text);

    // Adiciona o novo item
    diceLogList.prepend(li); // Adiciona no topo

    // Limita o número de logs
    if (diceLogList.children.length > MAX_LOG_ENTRIES) {
        // Remove o item mais antigo (o último da lista)
        diceLogList.removeChild(diceLogList.lastChild);
    }
}

// --- Listener final ---
dicePanel.addEventListener('click', handleDiceRoll);