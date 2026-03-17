export default class gameplay extends Phaser.Scene {
  constructor() {
    super("gameplay");
  }

preload() {

  // ===== MAP PARALLAX LAYERS =====
  this.load.image("cloud", "src/assets/cloud.png");
  this.load.image("towns", "src/assets/towns.png");
  this.load.image("tiles", "src/assets/tiles.png");

  this.load.tilemapTiledJSON(
    "map",
    "src/assets/test parrallax.tmj"
  );

  // ===== ITEMS =====
  this.load.image("piece", "src/assets/piece.png");
  this.load.image("bomb", "src/assets/bomb.png");
  this.load.image("humain", "src/assets/humain.png");

  // ===== PERSONNAGES =====
  this.load.spritesheet("zombie", "src/assets/zombie.png", {
    frameWidth: 32,
    frameHeight: 48
  });

  this.load.spritesheet("soldatzombie", "src/assets/soldatzombie.png", {
    frameWidth: 32,
    frameHeight: 48
  });

  // ===== SOUNDS =====
  this.load.audio("SonJeu", "src/assets/SonJeu.mp3");
  this.load.audio("SonGameOver", "src/assets/SonGameOver.mp3");
  this.load.audio("SonManger", "src/assets/SonManger.mp3");
  this.load.audio("SonPiece", "src/assets/SonPiece.mp3");
}
  create() {
    // Stop menu background music while playing
    const introSound = this.sound.get('SonIntro');
    if (introSound && introSound.isPlaying) {
      introSound.stop();
    }

    // Play the game start sound (one-shot)
    this.sound.stopByKey('SonJeu');
    this.sound.play('SonJeu');

    this.gameOverSoundPlayed = false;

    this.isGameOver = false;
    this.speed = 230;
    this.jumpPower = -480;
    this.hordeCount = 1;
    this.followers = [];
    this.trail = [];

    this.extraLives = this.registry.get("extraLifeReady") ? 1 : 0;
    this.registry.set("extraLifeReady", false);

    this.coinMultiplierActive = this.registry.get("coinMultiplierReady");
    this.registry.set("coinMultiplierReady", false);
    this.coinMultiplierEndTime = 0;

    this.cameras.main.setBackgroundColor("#87ceeb");

    // ===== MAP TILED =====
    // Créer la tilemap
    this.map = this.make.tilemap({ key: "map" });

    // Ajouter le tileset
    const tileset = this.map.addTilesetImage("test", "tiles");

    // ===== PARALLAX IMAGE LAYERS =====
    // Calculer la largeur nécessaire pour les tileSprites
    const mapWidth = this.map.widthInPixels;
    const mapHeight = this.map.heightInPixels;

    // Clouds - scrollFactor 0.1 (arrière-plan lointain)
    this.cloudsLayer = this.add.tileSprite(0, 0, mapWidth, mapHeight, "cloud");
    this.cloudsLayer.setOrigin(0, 0);
    this.cloudsLayer.setScrollFactor(0.1, 1);
    this.cloudsLayer.setDepth(-2);
    this.cloudsLayer.setDisplayOrigin(0, 0);

    // Town - scrollFactor 0.5 (arrière-plan moyen)
    this.townLayer = this.add.tileSprite(0, 0, mapWidth, mapHeight, "towns");
    this.townLayer.setOrigin(0, 0);
    this.townLayer.setScrollFactor(0.5, 1);
    this.townLayer.setDepth(-1);
    this.townLayer.setDisplayOrigin(0, 0);

    // Créer les calques tile layers
    this.groundLayer = this.map.createLayer("Calque de Tuiles 1", tileset, 0, 0);
    this.decorLayer = this.map.createLayer("Calque de Tuiles 2", tileset, 0, 0);

    // Définir la profondeur des calques de tuiles
    if (this.groundLayer) this.groundLayer.setDepth(2);
if (this.decorLayer) this.decorLayer.setDepth(3);

    // Définir les collisions
    this.groundLayer.setCollisionByProperty({ estSolide: true });

    // Définir les bounds
    this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

    // ===== JOUEUR =====
    let spawnX = 100;
    let spawnY = 100;

    for (let y = 0; y < this.map.heightInPixels; y += this.map.tileHeight) {
      const tile = this.groundLayer.getTileAtWorldXY(spawnX, y, true);

      if (tile && tile.collides) {
        spawnY = tile.pixelY - 30;
        break;
      }
    }

    // Déterminer le skin au démarrage
    const skin = this.registry.get("selectedSkin");
    const playerTexture = (skin === "zombie") ? "zombie" : "soldatzombie";
    
    this.player = this.physics.add.sprite(spawnX, spawnY, playerTexture);
    this.player.setScale(1.3);
    this.player.setCollideWorldBounds(false);
    this.player.setBounce(0);
    this.player.body.setSize(32, 48);
    this.player.setDepth(3);
    this.player.body.setOffset(0, 0);

this.physics.add.collider(this.player, this.groundLayer);

this.createAnimations();
this.player.anims.play((skin === "zombie") ? "run_zombie" : "run_soldat", true);

this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    // Contrôles
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.keyEsc = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    // Groupes
    this.coins = this.physics.add.staticGroup();
    this.humans = this.physics.add.staticGroup();
    this.bombs = this.physics.add.staticGroup();

    this.placeCoins(); {
      this.coins.create(pos[0], pos[1], "piece")
  .setScale(0.8)
  .setDepth(8)
  .refreshBody();
    }
    
    this.placeHumans(); {this.humans.create(pos[0], pos[1], "humain")
  .setOrigin(0.5, 1)
  .setScale(0.8)
  .setDepth(8)
  .refreshBody();
    }

    this.placeBombs(); {this.bombs.create(pos[0], pos[1], "bomb")
  .setOrigin(0.5, 1)
  .setScale(0.8)
  .setDepth(8)
  .refreshBody();}


  
    this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);
    this.physics.add.overlap(this.player, this.humans, this.eatHuman, null, this);
    this.physics.add.overlap(this.player, this.bombs, this.hitBomb, null, this);

    // UI
    this.moneyText = this.add.text(20, 20, "Argent : " + this.registry.get("money"), {
      fontSize: "24px",
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 5
    }).setScrollFactor(0);

    this.hordeText = this.add.text(20, 55, "Horde : " + this.hordeCount, {
      fontSize: "24px",
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 5
    }).setScrollFactor(0);

    this.livesText = this.add.text(20, 90, "Vies : " + (1 + this.extraLives), {
      fontSize: "24px",
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 5
    }).setScrollFactor(0);

    this.multiplierText = this.add.text(20, 125, "", {
      fontSize: "22px",
      color: "#ffe66d",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 5
    }).setScrollFactor(0);

    this.infoText = this.add.text(20, 160, "ESPACE / HAUT = SAUT", {
      fontSize: "18px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 4
    }).setScrollFactor(0);

    this.backText = this.add.text(20, 185, "ECHAP = RETOUR", {
      fontSize: "18px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 4
    }).setScrollFactor(0);

    this.gameOverText = this.add.text(400, 230, "", {
      fontSize: "52px",
      color: "#ff0000",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 7,
      align: "center"
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100);

    this.subText = this.add.text(400, 310, "", {
      fontSize: "26px",
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 5,
      align: "center"
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100);

    if (this.coinMultiplierActive) {
      this.coinMultiplierEndTime = this.time.now + 15000;
      this.multiplierText.setText("x2 PIECES : 15");
    }
  }

  applySelectedSkin() {
    const skin = this.registry.get("selectedSkin");

    if (skin === "zombie") {
      if (this.textures.exists("zombie")) {
        this.player.setTexture("zombie");
      } else {
        this.player.setTint(0x66ff66);
      }
    } else {
      this.player.setTexture("soldatzombie");
      this.player.clearTint();
    }
  }

createAnimations() {
  if (!this.anims.exists("run_zombie")) {
    this.anims.create({
      key: "run_zombie",
      frames: this.anims.generateFrameNumbers("zombie", { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1
    });
  }

  if (!this.anims.exists("idle_zombie")) {
    this.anims.create({
      key: "idle_zombie",
      frames: [{ key: "zombie", frame: 4 }],
      frameRate: 1
    });
  }

  if (!this.anims.exists("run_soldat")) {
    this.anims.create({
      key: "run_soldat",
      frames: this.anims.generateFrameNumbers("soldatzombie", { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1
    });
  }

  if (!this.anims.exists("idle_soldat")) {
    this.anims.create({
      key: "idle_soldat",
      frames: [{ key: "soldatzombie", frame: 4 }],
      frameRate: 1
    });
  }
}

  placeCoins() {
    const coinPositions = [
      [500, 490],
      [620, 490],
      [740, 490],
      [920, 490],
      [980, 490],
      [1040, 490],
      [1450, 390],
      [1560, 390],
      [1660, 390],
      [1850, 490],
      [1960, 490]
    ];

    coinPositions.forEach((pos) => {
      this.coins.create(pos[0], pos[1], "piece")
        .setScale(0.8)
        .refreshBody();
    });
  }

  placeHumans() {
    const humanPositions = [
      [820, 495],
      [1750, 495],
      [2860, 495]
    ];

    humanPositions.forEach((pos) => {
      this.humans.create(pos[0], pos[1], "humain")
        .setOrigin(0.5, 1)
        .setScale(0.8)
        .refreshBody();
    });
  }

  placeBombs() {
    const bombPositions = [
      [1350, 500],
      [2340, 500],
      [3470, 500]
    ];

    bombPositions.forEach((pos) => {
      this.bombs.create(pos[0], pos[1], "bomb")
        .setOrigin(0.5, 1)
        .setScale(0.8)
        .refreshBody();
    });
  }

  collectCoin(player, coin) {
    coin.destroy();

    // Sound when picking up a coin (stop after ~1.5s)
    const coinSound = this.sound.play('SonPiece');
    this.time.delayedCall(1500, () => {
      if (coinSound && coinSound.isPlaying) {
        coinSound.stop();
      }
    });

    let value = 1;
    if (this.coinMultiplierActive && this.time.now < this.coinMultiplierEndTime) {
      value = 2;
    }

    const currentMoney = this.registry.get("money");
    this.registry.set("money", currentMoney + value);
    this.moneyText.setText("Argent : " + this.registry.get("money"));
  }

  eatHuman(player, human) {
    human.destroy();

    // Sound when eating a human (stop after 3s)
    const eatSound = this.sound.play('SonManger');
    this.time.delayedCall(2000, () => {
      if (eatSound && eatSound.isPlaying) {
        eatSound.stop();
      }
    });

    this.hordeCount += 1;
    this.hordeText.setText("Horde : " + this.hordeCount);

  const skin = this.registry.get("selectedSkin");
  const followerTexture = (skin === "zombie") ? "zombie" : "soldatzombie";
  const followerAnim = (skin === "zombie") ? "run_zombie" : "run_soldat";

  const follower = this.add.sprite(player.x - this.hordeCount * 20, player.y, followerTexture);
  follower.setScale(1.2);
  follower.setDepth(9);
  follower.anims.play(followerAnim, true);

  this.followers.push(follower);
}

  loseLifeOrGameOver(reasonText) {
    if (this.extraLives > 0) {
      this.extraLives -= 1;
      this.livesText.setText("Vies : " + (1 + this.extraLives));
      this.player.setPosition(this.player.x - 120, this.player.y - 100);
      this.player.setVelocity(0, 0);
      return;
    }

    // Stop in-game music and play game over sound once
    this.sound.stopByKey('SonJeu');
    if (!this.gameOverSoundPlayed) {
      this.sound.play('SonGameOver');
      this.gameOverSoundPlayed = true;
    }

    this.triggerGameOver("GAME OVER", reasonText + "\nR = recommencer");
  }

  hitBomb() {
    if (this.isGameOver) {
      return;
    }

    this.loseLifeOrGameOver("Tu as touche une bombe");
  }

  triggerGameOver(title, subtitle) {
    if (this.isGameOver) {
      return;
    }

    this.sound.stopByKey('SonJeu');

    this.isGameOver = true;
    this.player.setVelocity(0, 0);
    const skin = this.registry.get("selectedSkin");
this.player.anims.play((skin === "zombie") ? "idle_zombie" : "idle_soldat", true);

    this.gameOverText.setText(title);
    this.subText.setText(subtitle);

    this.followers.forEach((follower) => {
  follower.anims.play((skin === "zombie") ? "idle_zombie" : "idle_soldat", true);
});
  }

  updateFollowers() {
    this.trail.push({ x: this.player.x, y: this.player.y });

    if (this.trail.length > 500) {
      this.trail.shift();
    }

    for (let i = 0; i < this.followers.length; i++) {
      const index = Math.max(0, this.trail.length - 1 - (i + 1) * 8);
      const point = this.trail[index];

      if (point) {
        this.followers[i].x = point.x;
        this.followers[i].y = point.y;
      }
    }
  }

  updateMultiplierUI() {
    if (this.coinMultiplierActive) {
      const remaining = Math.max(
        0,
        Math.ceil((this.coinMultiplierEndTime - this.time.now) / 1000)
      );

      if (remaining > 0) {
        this.multiplierText.setText("x2 PIECES : " + remaining);
      } else {
        this.coinMultiplierActive = false;
        this.multiplierText.setText("");
      }
    }
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.keyEsc)) {
      this.sound.stopByKey('SonJeu');
      this.scene.start("choixPortes");
      return;
    }

    if (this.isGameOver) {
      if (Phaser.Input.Keyboard.JustDown(this.keyR)) {
        this.scene.restart();
      }
      return;
    }

    this.player.setVelocityX(this.speed);

    const wantJump =
      Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
      Phaser.Input.Keyboard.JustDown(this.keySpace);

    if (wantJump && this.player.body.blocked.down) {
      this.player.setVelocityY(this.jumpPower);
    }

   const skin = this.registry.get("selectedSkin");
const runAnim = (skin === "zombie") ? "run_zombie" : "run_soldat";

if (this.player.body.velocity.y !== 0) {
  this.player.anims.stop();
  this.player.setFrame(5);
} else if (
  !this.player.anims.isPlaying ||
  this.player.anims.currentAnim.key !== runAnim
) {
  this.player.anims.play(runAnim, true);
}

    this.updateFollowers();
    this.updateMultiplierUI();

    if (this.player.y > this.map.heightInPixels + 100) {
      this.loseLifeOrGameOver("Tu es tombe dans un trou");
    }

    if (this.player.x >= this.map.widthInPixels - 120) {
      this.sound.stopByKey('SonJeu');
      this.player.setVelocityX(0);
      this.isGameOver = true;
      this.gameOverText.setText("NIVEAU TERMINE");
      this.subText.setText("ECHAP = retour aux portes");
    }
  }
}