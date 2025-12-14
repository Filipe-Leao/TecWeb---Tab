// MonteCarlo.js - LÓGICA DE MOVIMENTO CORRIGIDA

// 1. CONSTRUÇÃO DO ESTADO
function buildStateFromDOM() {
    const state = {
        matrix: [],
        meta: [],
        currentPlayer: window.playerTurn // Usa window para garantir acesso global
    };

    const numRows = window.NUM_ROWS || 4;
    const boardSize = window.BOARD_SIZE || 9;

    for (let r = 0; r < numRows; r++) {
        state.matrix[r] = [];
        state.meta[r] = [];
        for (let c = 0; c < boardSize; c++) {
            state.matrix[r][c] = (window.matrix && window.matrix[r] && window.matrix[r][c]) ?? 0;

            const sq = document.querySelector(`.square[data-row='${r}'][data-col='${c}']`);
            if (sq) {
                const el = sq.querySelector('.piece_red') || sq.querySelector('.piece_blue');
                if (el) {
                    state.meta[r][c] = {
                        first_move: el.getAttribute('data-first-move') === 'true',
                        visited_enemy: el.getAttribute('data-visited-enemy') === 'true'
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

// 2. MOVIMENTOS VÁLIDOS
function legalMovesForDice(state, pVal, dice) {
    const moves = [];
    const isRed = (pVal === 1);
    const boardSize = window.BOARD_SIZE || 9;
    const numRows = window.NUM_ROWS || 4;

    for (let r = 0; r < numRows; r++) {
        for (let c = 0; c < boardSize; c++) {
            if (state.matrix[r][c] !== pVal) continue;

            const meta = state.meta[r][c] || { first_move: true, visited_enemy: false };

            if (meta.first_move && dice !== 1) continue;

            let paths = [{ r: r, c: c, vis: meta.visited_enemy, fm: meta.first_move, choice: null }];

            for (let step = 0; step < dice; step++) {
                let nextPaths = [];
                for (let p of paths) {
                    let nr = p.r, nc = p.c;
                    let dir = (nr === 1 || nr === 3) ? 1 : -1;

                    // CORREÇÃO: Removemos o recuo forçado no canto.
                    // A peça move-se sempre na direção normal, mesmo no 1º movimento.
                    nc += dir;

                    // Transições de Linha
                    if (nc < 0 || nc >= boardSize) {
                        if (isRed) { // VERMELHO
                            if (nr === 0) nextPaths.push({ r: 1, c: 0, vis: p.vis, fm: false, choice: p.choice });
                            else if (nr === 1) nextPaths.push({ r: 2, c: boardSize - 1, vis: p.vis, fm: false, choice: p.choice });
                            else if (nr === 2) {
                                if (!p.vis) nextPaths.push({ r: 3, c: 0, vis: true, fm: false, choice: 'attack' });
                                nextPaths.push({ r: 1, c: 0, vis: p.vis, fm: false, choice: 'retreat' });
                            }
                            else if (nr === 3) nextPaths.push({ r: 2, c: boardSize - 1, vis: p.vis, fm: false, choice: p.choice });
                        } else { // AZUL
                            if (nr === 3) nextPaths.push({ r: 2, c: boardSize - 1, vis: p.vis, fm: false, choice: p.choice });
                            else if (nr === 2) nextPaths.push({ r: 1, c: 0, vis: p.vis, fm: false, choice: p.choice });
                            else if (nr === 1) {
                                if (!p.vis) nextPaths.push({ r: 0, c: boardSize - 1, vis: true, fm: false, choice: 'attack' });
                                nextPaths.push({ r: 2, c: boardSize - 1, vis: p.vis, fm: false, choice: 'retreat' });
                            }
                            else if (nr === 0) nextPaths.push({ r: 1, c: 0, vis: p.vis, fm: false, choice: p.choice });
                        }
                    } else {
                        nextPaths.push({ r: nr, c: nc, vis: p.vis, fm: false, choice: p.choice });
                    }
                }
                paths = nextPaths;
            }

            for (let dest of paths) {
                if (state.matrix[dest.r][dest.c] === pVal) continue;
                moves.push({ row: r, col: c, targetRow: dest.r, targetCol: dest.c, choice: dest.choice });
            }
        }
    }
    return moves;
}

// 3. FUNÇÕES AUXILIARES
function chooseMove(moves, level) {
    const aiPlayerVal = 1;
    const opponentVal = 2;
    const captures = moves.filter(m => buildStateFromDOM().matrix[m.targetRow][m.targetCol] === opponentVal);

    if (level === 'hard') level = (Math.random() < 0.75) ? 'medium' : 'easy';
    if (level === 'medium' && captures.length > 0) return captures[Math.floor(Math.random() * captures.length)];
    return moves[Math.floor(Math.random() * moves.length)];
}

// 4. FUNÇÃO PRINCIPAL
async function handleAITurn(val) {
    if (val === undefined || val === null) val = 0;

    if (val === 0) {
        // Limpa highlights do turno anterior
        if (typeof window.clearHighlights === 'function') {
            window.clearHighlights();
        }
        
        let tab = 0;
        for (let i = 0; i < 4; i++) {
            if (Math.random() >= 0.5) {
                tab++;
            }
        }
        val = (tab === 0) ? 6 : tab;

        // Reset visual antes de animar
        if (typeof diceValueDisplay !== 'undefined') diceValueDisplay.textContent = '-';

        // Canvas Animation: Anima o dado de paus para o computador
        if (window.animateDiceRoll) {
            await window.animateDiceRoll(val, () => {
                // Mostra valor e histórico após a animação terminar
                if (typeof diceValueDisplay !== 'undefined') diceValueDisplay.textContent = val;
                if (typeof window.addLog === 'function') window.addLog('red', val);
            });
        } else {
            // Fallback sem canvas
            if (typeof diceValueDisplay !== 'undefined') diceValueDisplay.textContent = val;
            if (typeof window.addLog === 'function') window.addLog('red', val);
            await new Promise(r => setTimeout(r, 1000));
        }
    }

    const state = buildStateFromDOM();
    const moves = legalMovesForDice(state, 1, val);

    if (moves.length === 0) {
        if (typeof showMessage !== 'undefined') showMessage("IA sem jogadas.", 'info');
        if (val === 1 || val === 4 || val === 6) {
            setTimeout(() => handleAITurn(0), 2000);
        } else {
            // Mostra o valor durante 2 segundos antes de mudar de jogador (mesmo quando não há movimentos)
            setTimeout(() => {
                if (typeof window.playerTurn !== 'undefined') window.playerTurn = 'blue';
                if (typeof resetDiceUI !== 'undefined') resetDiceUI();
                if (typeof showMessage !== 'undefined') showMessage("Sua vez (Azul)!", 'info');
            }, 2000);
        }
        return;
    }

    const move = chooseMove(moves, (typeof AI_DIFFICULTY !== 'undefined') ? AI_DIFFICULTY : 'medium');
    const sq = document.querySelector(`.square[data-row='${move.row}'][data-col='${move.col}']`);
    const p = sq.querySelector('.piece_red');

    sq.classList.add('highlight-red');

    if (typeof window.move === 'function') {
        await window.move(move.row, move.col, val, p, sq, move.choice);
    }

    if (val === 1 || val === 4 || val === 6) {
        setTimeout(() => handleAITurn(0), 1500);
    } else {
        if (typeof showMessage !== 'undefined') showMessage("Sua vez (Azul)!", 'info');
        window.playerTurn = 'blue';
        // Mostra o valor durante 2 segundos antes de resetar
        setTimeout(() => {
            if (typeof resetDiceUI !== 'undefined') resetDiceUI();
        }, 2000);
    }
}

// EXPORTS
window.handleAITurn = handleAITurn;
window.legalMovesForDice = legalMovesForDice;
window.buildStateFromDOM = buildStateFromDOM;