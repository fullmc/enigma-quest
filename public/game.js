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
let answerInput;
let submitButton;
let resultText;
let gameStarted = false;

function preload() {
    // Charger les assets (images, sons, etc.)
}

function create() {
    socket = io();
    
    // Demander le nom du joueur
    playerName = prompt("Entrez votre nom :");
    if (!playerName) {
        playerName = "Joueur" + Math.floor(Math.random() * 1000);
    }
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
    startButton.setInteractive({ useHandCursor: true });
    startButton.visible = false;
    
    startButton.on('pointerdown', () => {
        console.log('Bouton démarrer cliqué');
        socket.emit('startGame');
    });

    // Afficher les indices (initialement cachés)
    clueText = this.add.text(50, 100, '', {
        fontSize: '16px',
        fill: '#fff'
    });

    // Écouteurs socket
    socket.on('playerCount', (count) => {
        console.log('Nombre de joueurs:', count);
        playerCountText.setText(`Joueurs connectés : ${count}`);
        startButton.visible = count >= 2;
    });

    socket.on('gameStarting', () => {
        console.log('La partie commence!');
        startButton.visible = false;
        playerCountText.setText('La partie commence !');
        answerInput.style.display = 'block';
        submitButton.visible = true;
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

    // Ajouter le champ de réponse (initialement caché)
    const inputElement = document.createElement('input');
    inputElement.type = 'text';
    inputElement.placeholder = 'Entrez votre réponse';
    inputElement.style.position = 'absolute';
    inputElement.style.left = '50px';
    inputElement.style.top = '400px';
    inputElement.style.display = 'none';
    document.body.appendChild(inputElement);
    answerInput = inputElement;

    // Ajouter le bouton de soumission
    submitButton = this.add.text(50, 450, '[ Soumettre la réponse ]', {
        fontSize: '20px',
        fill: '#00ff00'
    });
    submitButton.setInteractive();
    submitButton.visible = false;

    // Texte pour le résultat
    resultText = this.add.text(50, 500, '', {
        fontSize: '20px',
        fill: '#ffffff'
    });

    submitButton.on('pointerdown', () => {
        const answer = answerInput.value;
        socket.emit('submitAnswer', answer);
        answerInput.value = '';
    });

    // Nouveaux écouteurs socket
    socket.on('answerResult', (result) => {
        resultText.setText(result.message);
        if (result.correct) {
            resultText.setColor('#00ff00');
        } else {
            resultText.setColor('#ff0000');
        }
    });

    socket.on('gameWon', (winner) => {
        resultText.setText(`Bravo ! ${winner} a trouvé la bonne réponse !`);
        resultText.setColor('#00ff00');
        answerInput.style.display = 'none';
        submitButton.visible = false;
    });

    socket.on('startGameError', (error) => {
        console.log('Erreur de démarrage:', error.message);
        resultText.setText(error.message);
        resultText.setColor('#ff0000');
    });

    socket.on('gameEnded', (reason) => {
        console.log('Fin de partie:', reason);
        gameStarted = false;
        startButton.visible = players.size >= 2;
        answerInput.style.display = 'none';
        submitButton.visible = false;
        resultText.setText(reason);
        resultText.setColor('#ff0000');
        clueText.setText('');
    });
}

function update() {
    // Mettre à jour le jeu 
} 