const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

app.use(express.static('public'));

const players = new Map(); // créer une map (objet qui permet de stocker des paires de valeurs (clé, valeur) pour stocker les joueurs)
let gameStarted = false;
let currentEnigma = null; // Nouvelle variable globale
const enigmas = [
    {
        question: "Trouvez le code secret",
        indices: [
            "Le premier chiffre est pair",
            "Le deuxième chiffre est plus grand que 5",
            "La somme des chiffres est 12",
            "Le code contient deux chiffres"
        ],
        solution: "48"
    }
    // Ajouter plus d'énigmes ici en dur ou créer une db pour les stocker
];

let debugId = 0; // Pour suivre l'ordre des événements

io.on('connection', (socket) => {
    debugId++;
    const currentDebugId = debugId;
    console.log(`[${currentDebugId}] Nouvelle connexion, ID: ${socket.id}`);

    socket.on('newPlayer', (playerName) => {
        console.log(`[${currentDebugId}] Nouveau joueur: ${playerName} (ID: ${socket.id})`);
        
        // Vérifier si le joueur n'est pas déjà dans la partie
        for (let [existingId, player] of players.entries()) {
            if (player.name === playerName) {
                console.log(`[${currentDebugId}] Joueur ${playerName} déjà présent, suppression ancienne connexion`);
                players.delete(existingId);
                break;
            }
        }

        if (players.size >= 4) {
            console.log(`[${currentDebugId}] Partie pleine, joueur refusé`);
            socket.emit('gameFull');
            return;
        }

        players.set(socket.id, {
            name: playerName,
            indices: []
        });

        console.log(`[${currentDebugId}] État après ajout:`);
        console.log('- Joueurs:', Array.from(players.values()).map(p => p.name));
        console.log('- Nombre total:', players.size);
        
        const playersList = Array.from(players.values()).map(p => p.name);
        io.emit('playerCount', players.size);
        io.emit('updatePlayersList', playersList);
    });

    socket.on('startGame', () => {
        console.log(`[${currentDebugId}] Tentative de démarrage par ${socket.id}`);
        console.log('État actuel:');
        console.log('- Joueurs:', Array.from(players.values()).map(p => p.name));
        console.log('- Nombre total:', players.size);
        console.log('- Partie démarrée:', gameStarted);
        
        if (players.size >= 2 && !gameStarted) {
            console.log(`[${currentDebugId}] Démarrage de la partie...`);
            gameStarted = true;
            io.emit('gameStarting');
            distributeClues();
        } else {
            const reason = players.size < 2 ? 
                'Il faut au moins 2 joueurs pour démarrer' : 
                'La partie est déjà en cours';
            console.log(`[${currentDebugId}] Démarrage impossible: ${reason}`);
            socket.emit('startGameError', { message: reason });
        }
    });

    socket.on('submitAnswer', (answer) => {
        if (!gameStarted || !currentEnigma) {
            return;
        }

        const player = players.get(socket.id);
        if (!player) return;

        if (answer.toString() === currentEnigma.solution) {
            io.emit('gameWon', player.name);
            gameStarted = false;
            currentEnigma = null;
            // Réinitialiser les indices des joueurs
            for (let player of players.values()) {
                player.indices = [];
            }
        } else {
            socket.emit('answerResult', {
                correct: false,
                message: 'Mauvaise réponse, essayez encore!'
            });
        }
    });

    socket.on('disconnect', () => {
        const player = players.get(socket.id);
        console.log(`[${currentDebugId}] Déconnexion: ${player ? player.name : 'inconnu'} (ID: ${socket.id})`);
        
        if (player) {
            players.delete(socket.id);
            
            if (gameStarted && players.size < 2) {
                console.log(`[${currentDebugId}] Arrêt de la partie: plus assez de joueurs`);
                gameStarted = false;
                currentEnigma = null;
                io.emit('gameEnded', 'Plus assez de joueurs pour continuer la partie');
            }

            const playersList = Array.from(players.values()).map(p => p.name);
            console.log(`[${currentDebugId}] Joueurs restants:`, playersList);
            io.emit('playerCount', players.size);
            io.emit('updatePlayersList', playersList);
        }
    });
});

function distributeClues() {
    console.log('[Server] Distribution des indices');
    currentEnigma = enigmas[Math.floor(Math.random() * enigmas.length)];
    const playerIds = Array.from(players.keys());
    console.log('- Joueurs participants:', Array.from(players.values()).map(p => p.name));

    currentEnigma.indices.forEach((indice, index) => {
        const playerId = playerIds[index % playerIds.length];
        const player = players.get(playerId);
        if (player) {
            console.log(`- Envoi indice "${indice}" à ${player.name}`);
            player.indices.push(indice);
            io.to(playerId).emit('receiveClue', indice);
        }
    });
}

server.listen(3001, () => {
    console.log('Serveur démarré sur le port 3001');
}); 