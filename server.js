const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

app.use(express.static('public'));

const players = new Map(); // créer une map (objet qui permet de stocker des paires de valeurs (clé, valeur) pour stocker les joueurs)
let gameStarted = false;
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

io.on('connection', (socket) => {
    console.log('Un joueur s\'est connecté');

    socket.on('newPlayer', (playerName) => {
        if (players.size >= 4) {
            socket.emit('gameFull');
            return;
        }

        players.set(socket.id, {
            name: playerName,
            indices: []
        });

        // Envoyer la liste mise à jour des joueurs à tous les clients
        const playersList = Array.from(players.values()).map(p => p.name);
        io.emit('playerCount', players.size);
        io.emit('updatePlayersList', playersList);
    });

    socket.on('startGame', () => {
        if (players.size >= 2 && !gameStarted) {
            gameStarted = true;
            io.emit('gameStarting');
            distributeClues();
        }
    });

    socket.on('disconnect', () => {
        players.delete(socket.id);
        const playersList = Array.from(players.values()).map(p => p.name);
        io.emit('playerCount', players.size);
        io.emit('updatePlayersList', playersList);
        console.log('Un joueur s\'est déconnecté');
    });
});

function distributeClues() {
    const currentEnigma = enigmas[Math.floor(Math.random() * enigmas.length)]; // choisir une énigme aléatoire
    const playerIds = Array.from(players.keys()); // récupérer les clés de la map (les joueurs)


    // Distribuer les indices à chaque joueur 
    currentEnigma.indices.forEach((indice, index) => {
        const playerId = playerIds[index % playerIds.length]; // pour chaque indice, on choisit un joueur au hasard
        const player = players.get(playerId); // on récupère le joueur
        player.indices.push(indice); // on ajoute l'indice au joueur
        io.to(playerId).emit('receiveClue', indice); // on envoie l'indice au joueur
    });
}

server.listen(3001, () => {
    console.log('Serveur démarré sur le port 3001');
}); 