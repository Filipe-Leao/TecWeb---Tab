import express from 'express';
import fs from 'fs/promises';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_PATH = path.join(__dirname, '.', 'data.json');

// Guarda os objetos setTimeout: { "gameId": TimeoutObject }
const gameTimers = {};

// Função para iniciar/reiniciar o cronómetro de 2 minutos
function resetGameTimer(gameId, activePlayer) {
    // 1. Cancelar timer anterior se existir
    if (gameTimers[gameId]) {
        clearTimeout(gameTimers[gameId]);
    }

    // 2. Criar novo timer de 2 minutos (120000 ms)
    gameTimers[gameId] = setTimeout(async () => {
        console.log(`⏰ Timeout no jogo ${gameId}. Jogador ${activePlayer} perdeu.`);

        // Carregar dados atuais
        const data = await loadData();
        const gameIndex = data.games.findIndex(g => g.id === gameId);

        if (gameIndex === -1) return; // Jogo já não existe

        const game = data.games[gameIndex];

        // Determinar vencedor (o adversário)
        const winner = Object.keys(game.players).find(p => p !== activePlayer);
        game.winner = winner;
        game.step = 'finished'; // Marca como terminado

        // Atualizar estatísticas
        const winnerUser = data.users.find(u => u.nick === winner);
        const loserUser = data.users.find(u => u.nick === activePlayer);
        if(winnerUser) winnerUser.games_won++;
        if(loserUser) loserUser.games_lost++;

        // Guardar e Notificar
        await saveData(data);
        notifyPlayers(gameId, {
            winner: winner,
            step: 'finished' // Força o frontend a fechar
        });

        // Limpar referência do timer
        delete gameTimers[gameId];

    }, 2 * 60 * 1000); // 2 minutos (120000 ms)
}

function clearGameTimer(gameId) {
    if (gameTimers[gameId]) {
        clearTimeout(gameTimers[gameId]);
        delete gameTimers[gameId];
    }
}

// ==========================================
// GESTÃO DE DADOS
// ==========================================

async function loadData() {
    try {
        const raw = await fs.readFile(DATA_PATH, 'utf8');
        return JSON.parse(raw);
    } catch (err) {
        return { users: [], games: [] };
    }
}

async function saveData(data) {
    await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function md5(value) {
    return crypto.createHash('md5').update(value).digest('hex');
}

function hashPassword(password, salt) {
    return md5(password + salt);
}

// ==========================================
// SERVIDOR & SSE (Server-Sent Events)
// ==========================================

const app = express();
const PORT = 8135;

// Armazena conexões ativas para atualizações em tempo real
// Estrutura: { "gameId": [res1, res2, ...] }
const clients = {};

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Methods', 'GET, POST');
    next();
});

app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// Função para notificar todos os jogadores de um jogo
function notifyPlayers(gameId, gameData) {
    if (!clients[gameId]) return;

    const dataToSend = JSON.stringify(gameData);

    // Enviar para todos os clientes conectados a este jogo
    clients[gameId].forEach(client => {
        client.write(`data: ${dataToSend}\n\n`);
    });
}

// ==========================================
// ROTAS DE AUTENTICAÇÃO E LOBBY
// ==========================================

app.post('/register', async (req, res) => {
    const { nick, password } = req.body;
    if (!nick || !password) return res.status(400).json({ error: 'Invalid data' });

    const data = await loadData();
    const existing = data.users.find(u => u.nick === nick);

    if (existing) {
        if (hashPassword(password, existing.salt) === existing.password) {
            return res.status(200).json({});
        } else {
            return res.status(401).json({ error: 'User registered with a different password' });
        }
    }

    const salt = crypto.randomBytes(16).toString('hex');
    data.users.push({
        nick,
        password: hashPassword(password, salt),
        salt,
        games_won: 0,
        games_lost: 0
    });

    await saveData(data);
    res.status(200).json({});
});

app.post('/ranking', async (req, res) => {
    const { size } = req.body; // group ignorado para simplificar
    if (!size) return res.status(400).json({ error: 'Undefined size' });

    const data = await loadData();
    // Filtra e ordena
    const ranking = data.users
        .map(u => ({ nick: u.nick, victories: u.games_won, games: u.games_won + u.games_lost }))
        .sort((a, b) => b.victories - a.victories);

    res.json({ ranking: ranking.slice(0, 10) });
});

app.post('/join', async (req, res) => {
    const { group, nick, password, size } = req.body;
    const data = await loadData();

    // Validar user
    const user = data.users.find(u => u.nick === nick);
    if (!user || user.password !== hashPassword(password, user.salt)) {
        return res.status(401).json({ error: 'Auth failed' });
    }

    // Tentar encontrar jogo à espera
    let game = data.games.find(g => g.group === group && g.size === size && Object.keys(g.players).length === 1 && !g.players[nick]);

    if (game) {
        // Juntar-se
        const p1Color = Object.values(game.players)[0];
        game.players[nick] = (p1Color === 'Blue') ? 'Red' : 'Blue';
        await saveData(data);

        // TIMER: Jogo começou (2 jogadores). Inicia timer para quem tem a vez.
        resetGameTimer(game.id, game.turn);

        // Notificar o jogador que estava à espera via SSE
        setTimeout(() => {
            notifyPlayers(game.id, {
                game: game.id,
                players: game.players,
                turn: game.turn,
                pieces: game.pieces,
                step: 'roll'
            });
        }, 100);

        return res.json({ game: game.id });
    }

    // Criar novo jogo
    const id = md5(nick + Date.now());
    const pieces = Array(size * 4).fill(null);

    // Setup inicial peças (Blue em baixo/fim, Red em cima/início)
    // Simplificação: Quem cria é Blue.
    for(let i=0; i<size; i++) pieces[i] = { color: 'Red', inMotion: false, reachedLastRow: false };
    for(let i=size*3; i<size*4; i++) pieces[i] = { color: 'Blue', inMotion: false, reachedLastRow: false };

    const newGame = {
        id, group, size, pieces,
        players: { [nick]: 'Blue' },
        turn: nick,
        step: 'waiting',
        dice: null,
        winner: null,
        selectedPiece: null // Auxiliar para o notify
    };

    data.games.push(newGame);
    await saveData(data);
    res.json({ game: id });
});

app.post('/leave', async (req, res) => {
    const { nick, password, game: gameId } = req.body;
    const data = await loadData();

    // Auth Check (Simplificado)
    const user = data.users.find(u => u.nick === nick);
    if (!user || user.password !== hashPassword(password, user.salt)) return res.status(401).json({ error: 'Auth failed' });

    const gameIndex = data.games.findIndex(g => g.id === gameId);
    if (gameIndex === -1) return res.status(404).json({ error: 'Game not found' });

    const game = data.games[gameIndex];

    // TIMER: Se alguém sai, cancela o timer
    clearGameTimer(gameId);

    // Se só tem 1 jogador, apaga o jogo
    if (Object.keys(game.players).length === 1) {
        data.games.splice(gameIndex, 1);
        await saveData(data);
        return res.json({});
    }

    // Se tem 2, o outro ganha
    const winner = Object.keys(game.players).find(p => p !== nick);
    game.winner = winner;
    game.step = 'finished';

    // Atualizar stats
    const winnerUser = data.users.find(u => u.nick === winner);
    const loserUser = data.users.find(u => u.nick === nick);
    if(winnerUser) winnerUser.games_won++;
    if(loserUser) loserUser.games_lost++;

    await saveData(data);

    notifyPlayers(gameId, { winner: winner });
    res.json({});
});

// ==========================================
// LÓGICA DE JOGO
// ==========================================

// Rota GET para SSE (Server-Sent Events)
app.get('/update', (req, res) => {
    const { game: gameId, nick } = req.query;

    if (!gameId) {
        res.status(400).json({ error: "Game ID missing" });
        return;
    }

    // Configurar headers para SSE
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });

    // Registar cliente
    if (!clients[gameId]) clients[gameId] = [];
    clients[gameId].push(res);

    // Enviar estado atual imediatamente (para desenhar o tabuleiro inicial)
    // Precisamos ler os dados
    loadData().then(data => {
        const game = data.games.find(g => g.id === gameId);
        if (game) {
            const payload = {
                turn: game.turn,
                pieces: game.pieces,
                dice: game.dice,
                step: game.step,
                players: game.players,
                winner: game.winner
            };
            res.write(`data: ${JSON.stringify(payload)}\n\n`);
        }
    });

    // Quando o cliente fecha a conexão
    req.on('close', () => {
        if (clients[gameId]) {
            clients[gameId] = clients[gameId].filter(client => client !== res);
        }
    });
});

app.post('/roll', async (req, res) => {
    const { nick, password, game: gameId } = req.body;
    const data = await loadData();
    const game = data.games.find(g => g.id === gameId);

    // Validações
    if (!game) return res.status(404).json({ error: 'Game not found' });
    if (game.turn !== nick) return res.status(400).json({ error: 'Not your turn' });
    if (game.dice && game.dice.value > 0) return res.status(400).json({ error: 'Already rolled' });

    // Lógica do dado (4 paus)
    let sticks = 0;
    for(let i=0; i<4; i++) if(Math.random() > 0.5) sticks++;
    const value = (sticks === 0) ? 6 : sticks;

    // Atualizar estado
    game.dice = { value: value };
    game.step = 'from'; // Agora deve escolher peça

    await saveData(data);

    notifyPlayers(gameId, {
        dice: game.dice,
        turn: game.turn,
        step: game.step
    });

    res.json({ dice: game.dice });
});

app.post('/pass', async (req, res) => {
    const { nick, game: gameId } = req.body;
    const data = await loadData();
    const game = data.games.find(g => g.id === gameId);

    if (!game || game.turn !== nick) return res.status(400).json({ error: 'Erro' });

    const diceVal = game.dice ? parseInt(game.dice.value) : 0;

    // Se o dado for 1, 4 ou 6, o jogador mantém a vez, apenas reseta o dado
    if ([1, 4, 6].includes(diceVal)) {
        game.dice = null; // Limpa o dado para permitir novo roll
        game.step = 'roll';
        game.selectedPiece = null;
        // TIMER: Se jogo de novo, reinicio o timer para mim (dar mais 2 min)
        resetGameTimer(gameId, nick);
    } else {
        // Caso contrário (2 ou 3), passa a vez ao adversário
        const players = Object.keys(game.players);
        const nextPlayer = players.find(p => p !== nick);
        game.turn = nextPlayer;
        game.dice = null;
        game.step = 'roll';
        game.selectedPiece = null;
        // TIMER: Troca de turno, inicia timer para o outro
        resetGameTimer(gameId, nextPlayer);
    }
    // -------------------------------------------

    await saveData(data);
    notifyPlayers(gameId, game);
    res.json({});
});

app.post('/notify', async (req, res) => {
    const { nick, game: gameId, cell } = req.body;
    const cellIdx = parseInt(cell);

    const data = await loadData();
    const game = data.games.find(g => g.id === gameId);

    if (!game) return res.status(404).json({});
    if (game.turn !== nick) return res.status(400).json({ error: 'Not your turn' });

    // --- FASE 1: SELECIONAR PEÇA ('from') ---
    if (game.step === 'from' || game.step === 'roll') {
        const piece = game.pieces[cellIdx];
        const myColor = game.players[nick];

        if (!piece || piece.color !== myColor) {
            return res.status(400).json({ error: 'Not your piece' });
        }

        // Se eu sou Blue, Home é Row 3 (indices 27-35), Enemy é Row 0 (0-8).
        // Se eu sou Red, Home é Row 0 (0-8), Enemy é Row 3 (27-35).
        const size = game.size;
        const myHomeStart = (myColor === 'Blue') ? size * 3 : 0;
        const myHomeEnd = (myColor === 'Blue') ? size * 4 : size;
        const enemyHomeStart = (myColor === 'Blue') ? 0 : size * 3;
        const enemyHomeEnd = (myColor === 'Blue') ? size : size * 4;

        // Verificar se a peça selecionada está na base inimiga
        if (cellIdx >= enemyHomeStart && cellIdx < enemyHomeEnd) {
            // Verificar se tenho peças na minha casa
            let hasFriendsInHome = false;
            for (let i = myHomeStart; i < myHomeEnd; i++) {
                if (game.pieces[i] && game.pieces[i].color === myColor) {
                    hasFriendsInHome = true;
                    break;
                }
            }
            if (hasFriendsInHome) {
                return res.status(400).json({ error: 'Piece blocked (Invader Rule)' });
            }
        }

        // Se passou, marca como selecionada
        game.selectedPiece = cellIdx;
        game.step = 'to';
        await saveData(data);
        // Não notificamos todos no select para não mostrar ao inimigo o que estamos a pensar
        return res.json({});
    }

    // --- FASE 2: MOVER PARA DESTINO ('to') ---
    else if (game.step === 'to') {
        const fromIdx = game.selectedPiece;

        // Mover
        const movingPiece = game.pieces[fromIdx];
        if (!movingPiece) return res.status(400).json({ error: 'Selection lost' }); // Segurança extra

        movingPiece.inMotion = true; // Já não é first move

        // Captura?
        if (game.pieces[cellIdx]) {
            // Remover peça capturada
            game.pieces[cellIdx] = null;
        }

        // Atualizar tabuleiro
        game.pieces[cellIdx] = movingPiece;
        game.pieces[fromIdx] = null;

        // Verificar Vitória
        const myColor = game.players[nick];
        const enemyColor = (myColor === 'Blue') ? 'Red' : 'Blue';
        const enemyCount = game.pieces.filter(p => p && p.color === enemyColor).length;

        if (enemyCount === 0) {
            game.winner = nick;
            game.step = 'finished';
             // Atualizar stats
            const winnerUser = data.users.find(u => u.nick === nick);
            if(winnerUser) winnerUser.games_won++;

            // TIMER: Jogo acabou, remove timer
            clearGameTimer(gameId);
        } else {
            // Verificar se joga de novo
            console.log(game.dice)
            const diceVal = parseInt(game.dice.value);
            console.log(`Jogador ${nick} rolou ${diceVal}`);
            if ([1, 4, 6].includes(diceVal)) {
                game.step = 'roll';
                game.dice = null; // Permitir novo roll
                // TIMER: Joga de novo, reinicia timer para si mesmo
                resetGameTimer(gameId, nick);
            } else {
                // Passar vez automaticamente
                const players = Object.keys(game.players);
                const nextPlayer = players.find(p => p !== nick);
                game.turn = nextPlayer;
                game.step = 'roll';
                game.dice = null;
                // TIMER: Troca de turno, inicia timer para adversário
                resetGameTimer(gameId, nextPlayer);
            }
        }

        game.selectedPiece = null;
        await saveData(data);

        notifyPlayers(gameId, {
            pieces: game.pieces,
            turn: game.turn,
            step: game.step,
            dice: game.dice,
            winner: game.winner
        });

        res.json({});
    }
});

app.listen(PORT, () => console.log(`✅ Servidor de Jogo a correr na porta ${PORT} (com Timeout 2min)`));