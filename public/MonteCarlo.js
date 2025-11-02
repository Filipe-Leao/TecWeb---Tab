// montecarlo_random.js
// IA simples: movimentos aleatórios (compatível com o teu board / move() assíncrono)

/*
  Requisitos (assumidos):
  - Existe uma variável global `matrix` (numLines x numSquares) com valores:
      0 = vazio, 1 = peça vermelha (player), 2 = peça azul (IA)
  - Cada casa tem .square[data-row][data-col] no DOM contendo .piece_red ou .piece_blue
    com dataset attributes: data-first_move, data-top_column (como no teu código).
  - Existe uma função async `move(row, col, diceValue, can_go_up, pieceElement, originalSquareElement)`
    que realiza a animação/atualização no DOM e actualiza a matrix global (essa função foi
    fornecida por ti).
  - Existem helpers visuais como showMessage(), resetDiceUI(), updateTurnIndicator() — já referenciados.
*/

// --------------------- helpers de estado / clonagem ---------------------

// Constantes do teu jogo (garante que batem com o teu script)
const NUM_LINES = 4;      // 4
const NUM_COLS = 12;     // 12
const MAX_PIECES = 12;    // 4

// Constrói um estado puro a partir do DOM + matrix global
function buildStateFromDOM() {
    const state = {
        matrix: [],
        meta: [],
        currentPlayer: playerTurn // usa a variável global
    };

    for (let r = 0; r < NUM_ROWS; r++) { // Usa NUM_ROWS
        state.matrix[r] = [];
        state.meta[r] = [];
        for (let c = 0; c < BOARD_SIZE; c++) { // Usa BOARD_SIZE (dinâmico)
            state.matrix[r][c] = matrix[r][c] ?? 0;
            const sq = document.querySelector(`.square[data-row='${r}'][data-col='${c}']`);
            if (sq) {
                const pieceRed = sq.querySelector('.piece_red');
                const pieceBlue = sq.querySelector('.piece_blue');
                let el = pieceRed || pieceBlue;
                if (el) {
                    state.meta[r][c] = {
                        first_move: el.dataset.first_move === 'true',
                        top_column: el.dataset.top_column === 'true'
                    };
                } else {
                    state.meta[r][c] = null;
                }
            } else {
                state.meta[r][c] = null;
            }
        }
    }
    return state;
}

function cloneState(state) {
    const s = {
        matrix: state.matrix.map(row => row.slice()),
        meta: state.meta.map(row => row.map(cell => cell ? { ...cell } : null)),
        currentPlayer: state.currentPlayer
    };
    return s;
}

// --------------------- utilitário: rolar dado (simples) ---------------------

// Função de rolar o dado para a IA (usa mesma distribuição de 4 paus?)
// Para simplicidade e velocidade das decisões da IA, usamos uma função que replica
// a mesma lógica do teu rollDice() mas sem DOM.
function rollDiceForAI() {
    let tab = 0;
    for (let i = 0; i < 4; i++) {
        if (Math.random() >= 0.5) tab++;
    }
    return tab === 0 ? 6 : tab;
}

// --------------------- regras de movimento (puro estado) ---------------------

// Direção de avanço por linha segundo as tuas regras (lembrando a inversão de origem)
function rowDirection(row) {
    if (row === 1 || row === 3) {
        return 1;
    } else if (row === 0 || row === 2) {
        return -1;
    }
    return 0;
}

// Retorna lista de movimentos válidos para um jogador e dadoValue no estado fornecido.
// Um movimento é representado como {row, col} (origem). A validação segue as tuas regras:
// - first_move só pode mover 1 na primeira vez.
// - destino não pode ter peça da mesma cor.
// - respeita passagem de linhas tal como no teu move().
// - não lida com 'askDirection' interativo: assume preferência 'down' quando aplicável.
function legalMovesForDice(state, playerValue, diceValue) {
    const moves = [];
    for (let r = 0; r < NUM_ROWS; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (state.matrix[r][c] !== playerValue) continue;
            const meta = state.meta[r][c] || { first_move: true, top_column: false };

            if (meta.first_move && diceValue !== 1) {
                continue;
            }

            let states = [{ row: r, col: c, top_column: !!meta.top_column, first_move: !!meta.first_move }];

            for (let step = 0; step < diceValue; step++) {
                const nextStates = [];
                for (const s of states) {
                    let targetRow = s.row;
                    let targetCol = s.col;
                    let firstMoveLocal = s.first_move; // Usamos a cópia do estado

                    // --- INÍCIO DA CORREÇÃO DA LÓGICA DE MOVIMENTO ---
                    // Esta lógica agora é IDÊNTICA à da função move() do jogador
                    let direction = 0;
                    if (targetRow === 1 || targetRow === 3) {
                        direction = 1;
                    } else if (targetRow === 0 || targetRow === 2) {
                        direction = -1;
                    }

                    if (firstMoveLocal && step === 0) {
                        firstMoveLocal = false; // Simula a alteração
                        if (targetRow === 0 && targetCol === BOARD_SIZE - 1) {
                            targetCol -= 1; // Caso especial do canto
                        } else {
                            targetCol += direction; // Movimento normal
                        }
                    } else {
                        targetCol += direction; // Movimento normal
                    }
                    // --- FIM DA CORREÇÃO DA LÓGICA DE MOVIMENTO ---


                    // trata saídas do tabuleiro
                    if (targetCol < 0 || targetCol >= BOARD_SIZE) {
                        if (targetRow === 0) {
                            targetRow = 1; targetCol = 0;
                            nextStates.push({ row: targetRow, col: targetCol, top_column: s.top_column, first_move: firstMoveLocal });
                        } else if (targetRow === 1) {
                            if (!s.top_column && targetCol >= BOARD_SIZE) {
                                // ramificação: up
                                nextStates.push({ row: 0, col: BOARD_SIZE - 1, top_column: true, first_move: firstMoveLocal });
                                // ramificação: down
                                nextStates.push({ row: 2, col: BOARD_SIZE - 1, top_column: false, first_move: firstMoveLocal });
                            } else {
                                // Se não pode ramificar (já subiu ou não está no fim), assume o caminho padrão
                                targetRow = 2; targetCol = BOARD_SIZE - 1;
                                nextStates.push({ row: targetRow, col: targetCol, top_column: s.top_column, first_move: firstMoveLocal });
                            }
                        } else if (targetRow === 2) {
                            targetRow = 1; targetCol = 0;
                            nextStates.push({ row: targetRow, col: targetCol, top_column: s.top_column, first_move: firstMoveLocal });
                        } else if (targetRow === 3) {
                            targetRow = 2; targetCol = BOARD_SIZE - 1;
                            nextStates.push({ row: targetRow, col: targetCol, top_column: s.top_column, first_move: firstMoveLocal });
                        }
                    } else {
                        // movimento normal dentro da linha
                        nextStates.push({ row: targetRow, col: targetCol, top_column: s.top_column, first_move: firstMoveLocal });
                    }
                }
                states = nextStates;
                if (states.length === 0) break;
            }

            for (const dest of states) {
                if (dest.row < 0 || dest.row >= NUM_ROWS || dest.col < 0 || dest.col >= BOARD_SIZE) continue;
                if (state.matrix[dest.row][dest.col] === playerValue) continue;

                moves.push({ row: r, col: c, targetRow: dest.row, targetCol: dest.col, setTopColumn: !!dest.top_column });
            }
        }
    }
    // Filtra movimentos duplicados (caso a ramificação crie destinos iguais)
    const uniqueMoves = [];
    const seen = new Set();
    for (const move of moves) {
        const key = `${move.row},${move.col}-${move.targetRow},${move.targetCol}-${move.setTopColumn}`;
        if (!seen.has(key)) {
            seen.add(key);
            uniqueMoves.push(move);
        }
    }
    return uniqueMoves;
}

// Aplica um movimento puramente ao state (sem tocar no DOM). Retorna novo state.
function applyMoveToState(state, move, playerValue, diceValue) {
    const s = cloneState(state);
    const { row, col, targetRow, targetCol } = move;

    // update meta for first_move
    if (s.meta[row][col] && s.meta[row][col].first_move) {
        s.meta[row][col].first_move = false;
    }

    // captura se existir adversário na casa de destino
    const opponent = playerValue === 1 ? 2 : 1;
    if (s.matrix[targetRow][targetCol] === opponent) {
        s.matrix[targetRow][targetCol] = 0;
        s.meta[targetRow][targetCol] = null;
    }

    // move peça
    s.matrix[targetRow][targetCol] = playerValue;
    s.meta[targetRow][targetCol] = s.meta[row][col] ? { ...s.meta[row][col] } : { first_move: false, top_column: false };
    // aplica a flag setTopColumn vinda do movimento (quando a peça escolheu "subir")
    if (move.setTopColumn) {
        s.meta[targetRow][targetCol].top_column = true;
    }
    s.matrix[row][col] = 0;
    s.meta[row][col] = null;

    // alterna jogador
    s.currentPlayer = (s.currentPlayer === 'red') ? 'blue' : 'red';
    return s;
}

// Verifica condição terminal: um jogador sem peças
function isTerminalState(state) {
    let countRed = 0, countBlue = 0;
    for (let r = 0; r < NUM_LINES; r++) {
        for (let c = 0; c < NUM_COLS; c++) {
            if (state.matrix[r][c] === 1) countRed++;
            if (state.matrix[r][c] === 2) countBlue++;
        }
    }
    if (countRed === 0 || countBlue === 0) return true;
    return false;
}

// Quem ganhou? retorna 1 (red), 2 (blue), 0 empate/não terminal
function winnerOfState(state) {
    let countRed = 0, countBlue = 0;
    for (let r = 0; r < NUM_LINES; r++) {
        for (let c = 0; c < NUM_COLS; c++) {
            if (state.matrix[r][c] === 1) countRed++;
            if (state.matrix[r][c] === 2) countBlue++;
        }
    }
    if (countRed === 0) return 2;
    if (countBlue === 0) return 1;
    return 0;
}

// --------------------- playout aleatório (simulação) ---------------------

function randomDiceRollSimulation() {
    let tab = 0;
    let val = 0;
    for (let i = 0; i < 4; i++){
        let prob = Math.random();
        if (prob >= 0.50){
            tab++;
        }
    }
    if (tab === 0){
        val = 6;
    }
    else{
        val = tab;
    }

    return val;
}

function randomPlayoutFrom(state, maxDepth = 200) {
    let s = cloneState(state);
    let depth = 0;
    while (!isTerminalState(s) && depth < maxDepth) {
        const playerValue = s.currentPlayer === 'red' ? 1 : 2;
        const dice = randomDiceRollSimulation();
        const moves = legalMovesForDice(s, playerValue, dice);
        if (moves.length === 0) {
            if (dice !== 1 && dice !== 4 && dice !== 6) {
                // sem jogadas válidas e não pode rerolar: passa a vez
                s.currentPlayer = (s.currentPlayer === 'red') ? 'blue' : 'red';
            }
            depth++;
            continue;
        }
        const mv = moves[Math.floor(Math.random() * moves.length)];
        s = applyMoveToState(s, mv, playerValue, dice);
        depth++;
    }
    return winnerOfState(s); // 0 / 1 / 2
}

// --------------------- API da IA (aleatória com simulações Monte Carlo simples) ---------------------

// Simples MonteCarlo que avalia cada jogada válida com 'simulations' playouts aleatórios
async function monteCarloEvaluateMoves(simulationsPerMove = 50, diceValueForThisTurn = null) {
    // constroi estado actual
    const baseState = buildStateFromDOM();
    const aiPlayerValue = 2; // peças azuis
    console.log("Value of dice for this turn:", diceValueForThisTurn);
    const diceValue = (diceValueForThisTurn === null) ? rollDiceForAI() : diceValueForThisTurn;

    // recolhe jogadas válidas
    const legal = legalMovesForDice(baseState, aiPlayerValue, diceValue);

    console.log(`IA Monte Carlo: ${legal.length} jogadas legais com dado ${diceValue}.`);
    if (legal.length > 0) {
        console.log("Primeiro movimento legal:", legal[0]);
    }

    if (legal.length === 0) {
        return { action: null, diceValue }; // nada a fazer
    }

    // para cada opção corre algumas simulações e conta wins
    const results = legal.map(m => ({ move: m, wins: 0, sims: 0 }));

    for (let i = 0; i < legal.length; i++) {
        const entry = results[i];
        for (let s = 0; s < simulationsPerMove; s++) {
            // aplica o movimento à cópia e faz playouts
            const afterMoveState = applyMoveToState(baseState, entry.move, aiPlayerValue, diceValue);
            const winner = randomPlayoutFrom(afterMoveState, 200);
            if (winner === aiPlayerValue) entry.wins++;
            entry.sims++;
        }
    }

    // escolhe a jogada com melhor taxa de vitórias (ou aleatória entre as melhores)
    let bestRate = -1;
    for (const e of results) {
        const rate = e.sims > 0 ? (e.wins / e.sims) : 0;
        if (rate > bestRate) bestRate = rate;
    }
    const bestCandidates = results.filter(e => (e.sims > 0 ? (e.wins / e.sims) : 0) === bestRate);
    const chosen = bestCandidates[Math.floor(Math.random() * bestCandidates.length)];
    return {
            action: chosen.move,
            diceValue,
            winrate: chosen.wins / chosen.sims
        };
}

// --------------------- integração com o teu handleAITurn (executa movimento no DOM) ---------------------

// Esta função faz o turno do AI: rola o dado (visualmente), escolhe jogada (aleatória/MC) e chama move()
async function handleAITurn_MonteCarloRandom(simulationsPerMove = 30, diceValue) {
    // ADAPTADO: Limpa destaques da jogada anterior
    clearHighlights();

    console.log("AI Turn começou com diceValue:", diceValue);
    if (diceValue !== 0) {
        console.log("Usando diceValue existente:", diceValue);
    } else {
        let tab = 0;
        for (let i = 0; i < 4; i++) {
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
        } else {
            diceValue = tab;
        }

        console.log(`Computador rolou o dado: ${diceValue}`);

        // Atualiza a UI
        diceValueDisplay.textContent = diceValue;
        diceMessage.textContent = `Computador lançou o dado: ${diceValue}`;
        addLog('blue', diceValue);
        // --- FIM DA CORREÇÃO ---
    }

    // avalia jogadas
    const { action, diceValue: usedDice, winrate } = await monteCarloEvaluateMoves(simulationsPerMove, diceValue);
    diceValue = usedDice;

    if (!action) {
        // ... (lógica de 'não há jogadas' sem alteração) ...
        // ... (mas envolvemos a chamada recursiva num setTimeout) ...
        if (diceValue !== 1 && diceValue !== 4 && diceValue !== 6) {
            showMessage("Azuis não têm jogadas válidas. A passar a vez ao jogador.", 'info');
            playerTurn = 'red';
            resetDiceUI();
            updateTurnIndicator();
            return;
        }
        else {
            showMessage("Azuis não têm jogadas válidas mas podem rerolar.", 'info');
            console.log("AI rerolls since it has no valid moves but dice is 1/4/6");
            diceValue = 0;
            resetDiceUI();
            updateTurnIndicator();
            // ADAPTADO: Delay de 2 segundos
            setTimeout(() => {
                handleAITurn_MonteCarloRandom(simulationsPerMove, 0); // IA joga de novo
            }, 1500);
            return;
        }
    }

    // action: {row, col, targetRow, targetCol, setTopColumn}
    const sq = document.querySelector(`.square[data-row='${action.row}'][data-col='${action.col}']`);
    if (!sq) {
        showMessage("Erro: casa da peça do computador não encontrada no DOM.", 'error');
        return;
    }
    const pieceEl = sq.querySelector('.piece_blue');
    if (!pieceEl) {
        showMessage("Erro: peça do computador não encontrada no DOM.", 'error');
        return;
    }

    // ADAPTADO: Bug da escolha UP/DOWN
    // Removemos esta linha. A escolha será passada para o move()
    // if (action.setTopColumn) { pieceEl.dataset.top_column = 'true'; }

    // ADAPTADO: Destaque visual
    sq.classList.add('highlight-start');

    // ADAPTADO: Passa a escolha da IA ('up' ou 'down') para a função move()
    const aiChoice = action.setTopColumn ? 'up' : 'down';

    // chama a tua função move()
    const result = await move(action.row, action.col, diceValue, true, pieceEl, sq, aiChoice);

    // ADAPTADO: Destaque visual da casa final
    const sqEnd = document.querySelector(`.square[data-row='${action.targetRow}'][data-col='${action.targetCol}']`);
    if (result === 'success' || result === 'success_win') {
        if (sqEnd) sqEnd.classList.add('highlight-start');
    }

    // ADAPTADO: Pequena pausa para ver o destaque
    await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5s pausa

    // ADAPTADO: Lógica de Fim de Jogo
    if (result === 'success_win') {
        // A função move() já chamou o menu de fim de jogo.
        console.log("Computador venceu o jogo!");
        return;
    }

    // após mover, atualiza turno e UI conforme as regras
    if (result === 'success') {
        if (diceValue !== 1 && diceValue !== 4 && diceValue !== 6) {
            playerTurn = 'red';
            resetDiceUI();
            showMessage("Computador jogou. A tua vez.", 'info');
            updateTurnIndicator();
        } else {
            showMessage("Computador joga de novo...", 'info');
            diceValue = 0;
            resetDiceUI();
            updateTurnIndicator();
            // ADAPTADO: Delay de 2 segundos
            setTimeout(() => {
                handleAITurn_MonteCarloRandom(simulationsPerMove, 0); // IA joga de novo
            }, 2000);
        }
    } else if (result === 'reroll_only') {
        showMessage("Computador não pode mover, mas joga de novo...", 'info');
        diceValue = 0;
        resetDiceUI();
        updateTurnIndicator();
        // ADAPTADO: Delay de 2 segundos
        setTimeout(() => {
            handleAITurn_MonteCarloRandom(simulationsPerMove, 0);
        }, 2000);
    } else {
        // fail
        playerTurn = 'red';
        resetDiceUI();
        showMessage("Computador não pôde mover e passou a vez.", 'info');
        updateTurnIndicator();
    }
}

window.legalMovesForDice = legalMovesForDice;
window.buildStateFromDOM = buildStateFromDOM;
window.handleAITurn = handleAITurn;