const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);
let socket;
let clueText;
let playerCountText;
let playerName;
let startButton;
let playersList;

function preload() {
    // Charger les assets (images, sons, etc.)
}

function create() {
    socket = io();
    
    // Demander le nom du joueur
    const playerName = prompt("Entrez votre nom :");
    socket.emit('newPlayer', playerName);

    // Afficher le nombre de joueurs
    playerCountText = this.add.text(50, 50, 'Joueurs connectés : 1', {
        fontSize: '16px',
        fill: '#fff'
    });

    // Créer la liste des joueurs
    playersList = this.add.text(50, 80, '', {
        fontSize: '16px',
        fill: '#ffff00'
    });

    // Créer le bouton de démarrage (initialement invisible)
    startButton = this.add.text(250, 300, '[ Démarrer la partie ]', {
        fontSize: '24px',
        fill: '#00ff00'
    });
    startButton.setInteractive();
    startButton.visible = false;
    
    startButton.on('pointerdown', () => {
        socket.emit('startGame');
    });

    // Afficher les indices (initialement cachés)
    clueText = this.add.text(50, 100, '', {
        fontSize: '16px',
        fill: '#fff'
    });

    // Écouteurs socket
    socket.on('playerCount', (count) => {
        playerCountText.setText(`Joueurs connectés : ${count}`);
        startButton.visible = count >= 2;
    });

    socket.on('gameStarting', () => {
        startButton.visible = false;
        playerCountText.setText('La partie commence !');
    });

    socket.on('receiveClue', (clue) => {
        clueText.setText('Votre indice : ' + clue);
    });

    socket.on('gameFull', () => {
        alert('La partie est pleine !');
    });

    socket.on('updatePlayersList', (players) => {
        let playersText = '';
        players.forEach((player, index) => {
            playersText += `${index + 1}. ${player}\n`;
        });
        playersList.setText(playersText);
    });
}

function update() {
    // Mettre à jour le jeu 
} 