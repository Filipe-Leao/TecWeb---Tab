// Constrói um estado puro a partir do DOM + matrix global
function buildStateFromDOM() {
    const state = {
        matrix: [],
        meta: [],
        currentPlayer: playerTurn
    };

    for (let r = 0; r < NUM_ROWS; r++) {
        state.matrix[r] = [];
        state.meta[r] = [];
        for (let c = 0; c < BOARD_SIZE; c++) {
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

function rollDiceForAI() {
    let tab = 0;
    for (let i = 0; i < 4; i++) {
        if (Math.random() >= 0.5) tab++;
    }
    return tab === 0 ? 6 : tab;
}

function rowDirection(row) {
    if (row === 1 || row === 3) {
        return 1;
    } else if (row === 0 || row === 2) {
        return -1;
    }
    return 0;
}

// Retorna lista de movimentos válidos para um jogador e dadoValue no estado fornecido.
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

                    let direction = 0;
                    if (targetRow === 1 || targetRow === 3) {
                        direction = 1;
                    } else if (targetRow === 0 || targetRow === 2) {
                        direction = -1;
                    }

                    if (firstMoveLocal && step === 0) {
                        firstMoveLocal = false;
                        if (targetRow === 0 && targetCol === BOARD_SIZE - 1) {
                            targetCol -= 1; // Caso especial do canto
                        } else {
                            targetCol += direction;
                        }
                    } else {
                        targetCol += direction; 
                    }

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
    // Filtra movimentos duplicados
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

function isTerminalState(state) {
    let countRed = 0, countBlue = 0;
    for (let r = 0; r < NUM_ROWS; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (state.matrix[r][c] === 1) countRed++;
            if (state.matrix[r][c] === 2) countBlue++;
        }
    }
    if (countRed === 0 || countBlue === 0) return true;
    return false;
}
 
function winnerOfState(state) {
    let countRed = 0, countBlue = 0;
    for (let r = 0; r < NUM_ROWS; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (state.matrix[r][c] === 1) countRed++;
            if (state.matrix[r][c] === 2) countBlue++;
        }
    }
    if (countRed === 0) return 2;   // ser vencedor é o azul
    if (countBlue === 0) return 1;  // ser vencedor é o vermelho
    // Estado não terminal
    return 0;
}

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
                s.currentPlayer = (s.currentPlayer === 'red') ? 'blue' : 'red';
            }
            depth++;
            continue;
        }
        const mv = moves[Math.floor(Math.random() * moves.length)];
        s = applyMoveToState(s, mv, playerValue, dice);
        depth++;
    }
    return winnerOfState(s);
}

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

async function handleAITurn_MonteCarloRandom(simulationsPerMove = 30, diceValue) {
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
    }

    // avalia jogadas
    const { action, diceValue: usedDice, winrate } = await monteCarloEvaluateMoves(simulationsPerMove, diceValue);
    diceValue = usedDice;

    if (!action) {
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
            setTimeout(() => {
                handleAITurn_MonteCarloRandom(simulationsPerMove, 0); // IA joga de novo
            }, 1500);
            return;
        }
    }

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

    sq.classList.add('highlight-start');

    const aiChoice = action.setTopColumn ? 'up' : 'down';

    const result = await move(action.row, action.col, diceValue, true, pieceEl, sq, aiChoice);

    const sqEnd = document.querySelector(`.square[data-row='${action.targetRow}'][data-col='${action.targetCol}']`);
    if (result === 'success' || result === 'success_win') {
        if (sqEnd) sqEnd.classList.add('highlight-start');
    }

    await new Promise(resolve => setTimeout(resolve, 1500)); 

    // Lógica de Fim de Jogo
    if (result === 'success_win') {
        // A função move() já chamou o menu de fim de jogo.
        console.log("Computador venceu o jogo!");
        return;
    }

    // após mover, atualiza turno e UI 
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
            setTimeout(() => {
                handleAITurn_MonteCarloRandom(simulationsPerMove, 0); 
            }, 2000);
        }
    } else if (result === 'reroll_only') {
        showMessage("Computador não pode mover, mas joga de novo...", 'info');
        diceValue = 0;
        resetDiceUI();
        updateTurnIndicator();
        setTimeout(() => {
            handleAITurn_MonteCarloRandom(simulationsPerMove, 0);
        }, 2000);
    } else {
        playerTurn = 'red';
        resetDiceUI();
        showMessage("Computador não pôde mover e passou a vez.", 'info');
        updateTurnIndicator();
    }
}

window.legalMovesForDice = legalMovesForDice;
window.buildStateFromDOM = buildStateFromDOM;
window.handleAITurn = handleAITurn;