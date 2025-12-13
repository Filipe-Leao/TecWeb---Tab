import express from 'express';
import fs from 'fs/promises';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
console.log(__filename);
const __dirname = path.dirname(__filename);
console.log(__dirname);
const DATA_PATH = path.join(__dirname, '.', 'data.json');
console.log(DATA_PATH);

// --------------------------------------
// FUNÇÕES AUXILIARES
// --------------------------------------

async function loadData() {
    try {
        const raw = await fs.readFile(DATA_PATH, 'utf8');
        return JSON.parse(raw);
    } catch (err) {
        if (err.code === 'ENOENT') {
            console.log('Data file not found, creating new one.');
            const initialData = { users: [], games: [] };
            await saveData(initialData);
            return initialData;
        }
        throw err;
    }
}

async function saveData(data) {
    await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
    console.log('Data saved to', DATA_PATH);
}

// Hash MD5 genérico
function md5(value) {
    return crypto.createHash('md5').update(value).digest('hex');
}

// Gerar salt aleatório
function generateSalt() {
    return crypto.randomBytes(16).toString('hex');
}

// Hash password com salt
function hashPassword(password, salt) {
    return md5(password + salt);
}


// --------------------------------------
// SERVIDOR
// --------------------------------------

const app = express();

// ✅ ADICIONAR CORS ANTES DE TUDO
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Responder a preflight requests
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.json());

app.post('/register', async (req, res) => {
    const { nick, password } = req.body;

    // ---- validação básica ----
    if (typeof nick !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ error: 'Invalid arguments' });
    }

    const data = await loadData();

    const existing = data.users.find(u => u.nick === nick);

    // ---- Login ----
    if (existing) {
        // Usar o salt existente para verificar
        const hashed = hashPassword(password, existing.salt);
        
        // Sucesso na autenticação
        if (existing.password === hashed) {
            return res.status(200).json({
                message: 'User authenticated',
                nick: existing.nick
            });
        }

        // password diferente
        return res.status(401).json({
            error: 'Wrong password for existing user'
        });
    }

    // ---- Register ----
    const salt = generateSalt();
    const hashed = hashPassword(password, salt);
    
    const newUser = {
        nick,
        password: hashed,
        salt,
        games_won: 0,
        games_lost: 0
    };

    data.users.push(newUser);
    await saveData(data);

    return res.status(201).json({
        message: 'User registered',
        nick
    });
});

app.post('/ranking', async (req, res) => {
    const { group, size } = req.body;

    // Validação: group obrigatório
    if (group === undefined) {
        return res.status(400).json({ error: 'Undefined group' });
    }

    // Validação: group tem que ser número
    if (typeof group !== 'number' || !Number.isInteger(group)) {
        return res.status(400).json({ error: `Invalid group '${group}'` });
    }

    // Validação: size obrigatório
    if (size === undefined) {
        return res.status(400).json({ error: `Invalid size 'undefined'` });
    }

    // Validação: size tem que ser número inteiro
    if (typeof size !== 'number' || !Number.isInteger(size)) {
        return res.status(400).json({ error: `Invalid size '${size}'` });
    }

    const data = await loadData();

    // Filtrar jogos pelo tamanho do tabuleiro
    const gamesOfSize = data.games.filter(g => g.size === size && g.winner);

    // Contar vitórias e derrotas por jogador para este tamanho
    const playerStats = {};

    gamesOfSize.forEach(game => {
        const winner = game.winner;
        const loser = Object.keys(game.players).find(p => p !== winner);

        // Inicializar stats se não existir
        if (!playerStats[winner]) {
            playerStats[winner] = { nick: winner, victories: 0, games: 0 };
        }
        if (loser && !playerStats[loser]) {
            playerStats[loser] = { nick: loser, victories: 0, games: 0 };
        }

        // Atualizar contadores
        playerStats[winner].victories++;
        playerStats[winner].games++;
        
        if (loser) {
            playerStats[loser].games++;
        }
    });

    // Converter para array e ordenar
    const ranking = Object.values(playerStats)
        .sort((a, b) => {
            // Ordenar por vitórias (descendente)
            if (b.victories !== a.victories) {
                return b.victories - a.victories;
            }
            // Em caso de empate, ordenar por jogos (ascendente)
            return a.games - b.games;
        });

    return res.status(200).json({ ranking });
});

function createBoard(size) {
    const board = [];
    for (let i = 0; i < 4 * size; i++) {
        if (i < size){
            const blue_piece = {   
                color: "Blue",
                inMotion: false,
                reachedLastRow: false 
            };
            board.push(blue_piece);
        } else if (i >= 4 * size - size){
            const red_piece = {   
                color: "Red",
                inMotion: false,
                reachedLastRow: false 
            };
            board.push(red_piece);
        } else {
            board.push(null);
        }
    }
    return board;
}

// Criar jogo (ID gerado com MD5)
app.post('/games', async (req, res) => {
    const { group, nick1, nick2, size } = req.body;

    // Validações
    if (!nick1 || !nick2) {
        return res.status(400).json({ error: 'Missing players' });
    }

    if (!size || typeof size !== 'number') {
        return res.status(400).json({ error: 'Invalid size' });
    }

    // Verificar utilizador
    const data = await loadData();
    const user = data.users.find(u => u.nick === nick);
    
    if (!user) {
        return res.status(401).json({ error: 'User not found' });
    }

    const hashed = hashPassword(password, user.salt);
    if (user.password !== hashed) {
        return res.status(401).json({ error: 'Invalid password' });
    }

    // Criar ID único
    const id = md5(JSON.stringify({ nick, size, timestamp: Date.now() }));
    
    // Criar tabuleiro inicial
    const pieces = createBoard(size);

    // Criar jogo
    const game = {
        id,
        group: group || GROUP_ID,
        size,
        pieces,
        initial: nick,
        turn: nick,
        step: "roll",
        players: {
            [nick]: "Blue"
        },
        dice: null,
        winner: null,
        createdAt: new Date().toISOString()
    };

    data.games.push(game);
    await saveData(data);

    // Retornar resposta compatível com script.js
    return res.status(201).json({
        game: id,
        pieces,
        initial: nick1,
        turn: nick1,
        step: "roll",
        players: {
            [nick1]: "Blue",
            [nick2]: "Red"
        }
    });
}); 

app.post('/update', async (req, res) => {
    const { gameId, nick, password } = req.body;

    // Validação básica
    if (typeof gameId !== 'string' || typeof nick !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ error: 'Invalid arguments' });
    }

    const data = await loadData();

    // Verificar utilizador
    const user = data.users.find(u => u.nick === nick);
    
    if (!user) {
        return res.status(401).json({ error: 'User not found' });
    }

    const hashed = hashPassword(password, user.salt);
    if (user.password !== hashed) {
        return res.status(401).json({ error: 'Invalid password' });
    }

    // Encontrar jogo
    const game = data.games.find(g => g.id === gameId);
    if (!game) {
        return res.status(404).json({ error: 'Game not found' });
    }

    // Retornar estado do jogo
    return res.status(200).json({
        game: game.id,
        pieces: game.pieces,
        initial: Object.keys(game.players)[0],
        turn: game.turn,
        step: game.step,
        players: game.players,
        dice: game.dice,
        winner: game.winner
    });
});

app.post('/join', async (req, res) => {
    const { group, nick, password, size } = req.body;

    // Validação: argumentos obrigatórios
    if (group === undefined) {
        return res.status(400).json({ error: 'Missing group' });
    }
    if (!nick) {
        return res.status(400).json({ error: 'Missing nick' });
    }
    if (!password) {
        return res.status(400).json({ error: 'Missing password' });
    }
    if (size === undefined) {
        return res.status(400).json({ error: 'Missing size' });
    }

    // Validação: tipos
    if (typeof group !== 'number' || !Number.isInteger(group)) {
        return res.status(400).json({ error: `Invalid group '${group}'` });
    }
    if (typeof nick !== 'string') {
        return res.status(400).json({ error: 'Invalid nick' });
    }
    if (typeof password !== 'string') {
        return res.status(400).json({ error: 'Invalid password' });
    }
    if (typeof size !== 'number' || !Number.isInteger(size) || size <= 0) {
        return res.status(400).json({ error: `Invalid size '${size}'` });
    }

    const data = await loadData();

    // Autenticação
    const user = data.users.find(u => u.nick === nick);
    
    if (!user) {
        return res.status(401).json({ error: 'User not registered' });
    }

    const hashed = hashPassword(password, user.salt);
    if (user.password !== hashed) {
        return res.status(401).json({ error: 'Invalid password' });
    }

    // Procurar jogo à espera com mesmo grupo e tamanho
    const waitingGame = data.games.find(g => 
        g.group === group &&
        g.size === size &&
        Object.keys(g.players).length === 1 &&
        !g.players[nick] // Não pode juntar-se ao próprio jogo
    );

    if (waitingGame) {
        // Emparelhar com jogo existente
        const assignedColor = Object.values(waitingGame.players).includes('Blue') ? 'Red' : 'Blue';
        waitingGame.players[nick] = assignedColor;
        
        await saveData(data);

        return res.status(200).json({
            game: waitingGame.id
        });
    }

    // Criar novo jogo à espera de oponente
    const id = md5(JSON.stringify({ group, nick, size, timestamp: Date.now() }));
    const pieces = createBoard(size);

    const newGame = {
        id,
        group,
        size,
        pieces,
        initial: nick,
        turn: nick,
        step: "roll",
        players: {
            [nick]: "Blue"
        },
        dice: null,
        winner: null,
        createdAt: new Date().toISOString()
    };

    data.games.push(newGame);
    await saveData(data);

    return res.status(200).json({
        game: id
    });
});

app.post('/leave', async (req, res) => {
    const { nick, password, game } = req.body;

    // Validação: argumentos obrigatórios
    if (!nick) {
        return res.status(400).json({ error: 'Missing nick' });
    }
    if (!password) {
        return res.status(400).json({ error: 'Missing password' });
    }
    if (!game) {
        return res.status(400).json({ error: 'Missing game' });
    }

    // Validação: tipos
    if (typeof nick !== 'string') {
        return res.status(400).json({ error: 'Invalid nick' });
    }
    if (typeof password !== 'string') {
        return res.status(400).json({ error: 'Invalid password' });
    }
    if (typeof game !== 'string') {
        return res.status(400).json({ error: 'Invalid game' });
    }

    const data = await loadData();

    // Autenticação
    const user = data.users.find(u => u.nick === nick);
    
    if (!user) {
        return res.status(401).json({ error: 'User not registered' });
    }

    const hashed = hashPassword(password, user.salt);
    if (user.password !== hashed) {
        return res.status(401).json({ error: 'Invalid password' });
    }

    // Encontrar jogo
    const gameIndex = data.games.findIndex(g => g.id === game);
    
    if (gameIndex === -1) {
        return res.status(404).json({ error: 'Invalid game identifier' });
    }

    const foundGame = data.games[gameIndex];

    // Verificar se o jogador está no jogo
    if (!foundGame.players[nick]) {
        return res.status(403).json({ error: 'Player not in this game' });
    }

    // Caso 1: Jogo ainda à espera de emparelhamento (só 1 jogador)
    if (Object.keys(foundGame.players).length === 1) {
        console.log("Player leaving waiting game:", nick);
        // Remover o jogo completamente
        data.games.splice(gameIndex, 1);
        await saveData(data);

        return res.status(200).json({
            message: 'Left waiting game',
            game: game
        });
    }

    // Caso 2: Jogo em curso (2 jogadores) - adversário ganha
    if (foundGame.winner) {
        // Jogo já terminou
        return res.status(200).json({
            message: 'Game already finished',
            game: game
        });
    }

    // Determinar adversário
    const opponent = Object.keys(foundGame.players).find(p => p !== nick);

    // Marcar adversário como vencedor
    foundGame.winner = opponent;
    foundGame.step = "finished";

    // Atualizar estatísticas
    const opponentUser = data.users.find(u => u.nick === opponent);
    const leavingUser = data.users.find(u => u.nick === nick);

    if (opponentUser) {
        console.log("Updating wins for", opponentUser.nick);
        opponentUser.games_won = (opponentUser.games_won || 0) + 1;
    }
    // Atualizar derrotas do jogador que saiu apenas se o adversário for encontrado
    if (leavingUser && opponentUser) {
        console.log("Updating losses for", leavingUser.nick);
        leavingUser.games_lost = (leavingUser.games_lost || 0) + 1;
    }

    await saveData(data);

    return res.status(200).json({
        message: 'Left game, opponent wins',
        game: game,
        winner: opponent
    });
});

// Obter tudo (para testes)
app.get('/data', async (req, res) => {
    const data = await loadData();
    res.json(data);
});

app.listen(3000, () => console.log('Server running on 3000'));
