export default class gameplay3 extends Phaser.Scene {
  constructor() {
    super("gameplay3");
  }

  preload() {
    // ===== FONDS =====
    this.load.image("bg3", "src/assets/background3.png");
    this.load.image("backGold3", "src/assets/back-gold2.png");
    this.load.image("gold3", "src/assets/gold2.png");

    // ===== MAP / TILESET =====
    this.load.image("groundMap3", "src/assets/ground.png");
    this.load.tilemapTiledJSON("map3", "src/assets/map3.tmj");

    // ===== ITEMS =====
    this.load.spritesheet("piece", "src/assets/spinning coin.png", {
      frameWidth: 20,
      frameHeight: 16
    });

    this.load.spritesheet("bomb", "src/assets/bomb.png", {
      frameWidth: 256,
      frameHeight: 256
    });

    // ===== PERSONNAGES =====
    this.load.spritesheet("zombie", "src/assets/zombie.png", {
      frameWidth: 192,
      frameHeight: 99
    });

    this.load.spritesheet("soldatzombie", "src/assets/soldatzombie.png", {
      frameWidth: 144,
      frameHeight: 80
    });

    // ===== SONS =====
    if (!this.cache.audio.exists("SonJeu")) {
      this.load.audio("SonJeu", "src/assets/SonJeu.mp3");
    }

    if (!this.cache.audio.exists("SonPiece")) {
      this.load.audio("SonPiece", "src/assets/SonPiece.mp3");
    }

    if (!this.cache.audio.exists("SonGameOver")) {
      this.load.audio("SonGameOver", "src/assets/SonGameOver.mp3");
    }
  }

  create() {
    // ===== SECURITE REGISTRY =====
    if (this.registry.get("money") === undefined) {
      this.registry.set("money", 0);
    }

    if (this.registry.get("selectedSkin") === undefined) {
      this.registry.set("selectedSkin", "zombie");
    }

    if (this.registry.get("coinMultiplierReady") === undefined) {
      this.registry.set("coinMultiplierReady", false);
    }

    if (this.registry.get("extraLifeReady") === undefined) {
      this.registry.set("extraLifeReady", false);
    }

    // ===== VARIABLES =====
    this.isGameOver = false;
    this.speed = 250;
    this.jumpPower = 430; // force du saut

    this.extraLives = this.registry.get("extraLifeReady") ? 1 : 0;
    this.registry.set("extraLifeReady", false);

    this.coinMultiplierActive = this.registry.get("coinMultiplierReady");
    this.registry.set("coinMultiplierReady", false);
    this.coinMultiplierEndTime = 0;

    // ===== SYSTEME DE VAGUES =====
    this.waveNumber = 1;
    this.coinsPerWave = 10;
    this.bombsThisWave = 2;
    this.coinsCollectedThisWave = 0;
    this.isSpawningNextWave = false;

    // ===== MUSIQUE =====
    this.gameMusic = this.sound.get("SonJeu") || this.sound.add("SonJeu", {
      loop: true,
      volume: 0.5
    });

    if (!this.gameMusic.isPlaying) {
      this.gameMusic.play();
    }

    // ===== MAP =====
    this.map = this.make.tilemap({ key: "map3" });

    console.log("MAP3 layers :", this.map.layers.map(l => l.name));
    console.log("MAP3 tilesets :", this.map.tilesets.map(t => t.name));

    const tiledTilesetName = this.map.tilesets.length > 0 ? this.map.tilesets[0].name : null;
    const tiledLayerName = this.map.layers.length > 0 ? this.map.layers[0].name : null;

    if (!tiledTilesetName) {
      console.error("Aucun tileset trouvé dans map3.tmj");
      return;
    }

    if (!tiledLayerName) {
      console.error("Aucun layer trouvé dans map3.tmj");
      return;
    }

    const mapTileset = this.map.addTilesetImage(tiledTilesetName, "groundMap3");

    if (!mapTileset) {
      console.error("Impossible de lier le tileset :", tiledTilesetName);
      return;
    }

    const mapWidth = this.map.widthInPixels;
    const mapHeight = this.map.heightInPixels;
    const screenWidth = this.scale.width;
    const screenHeight = this.scale.height;

    this.cameras.main.setBackgroundColor("#000000");

    // ===== FOND =====
    this.bgLayer = this.add.image(screenWidth / 2, screenHeight / 2, "bg3");
    this.bgLayer.setScrollFactor(0, 0);
    this.bgLayer.setDisplaySize(screenWidth, screenHeight);
    this.bgLayer.setDepth(-30);

    const backImg = this.textures.get("backGold3").getSourceImage();
    this.backLayer = this.add.tileSprite(
      0,
      screenHeight - backImg.height - 40,
      screenWidth,
      backImg.height,
      "backGold3"
    );
    this.backLayer.setOrigin(0, 0);
    this.backLayer.setScrollFactor(0, 0);
    this.backLayer.setDepth(-20);

    const goldImg = this.textures.get("gold3").getSourceImage();
    this.frontBgLayer = this.add.tileSprite(
      0,
      screenHeight - goldImg.height - 20,
      screenWidth,
      goldImg.height,
      "gold3"
    );
    this.frontBgLayer.setOrigin(0, 0);
    this.frontBgLayer.setScrollFactor(0, 0);
    this.frontBgLayer.setDepth(-10);

    // ===== SOL =====
    this.groundLayer = this.map.createLayer(tiledLayerName, [mapTileset], 0, 0);

    if (!this.groundLayer) {
      console.error("Layer introuvable :", tiledLayerName);
      return;
    }

    this.groundLayer.setDepth(2);
    this.groundLayer.setCollisionByProperty({ estSolide: true });

    // ===== BOUNDS =====
    this.physics.world.setBounds(0, 0, mapWidth, mapHeight);
    this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);

    // ===== JOUEUR =====
    const spawnX = 120;
    const spawnY = 350;

    const skin = this.registry.get("selectedSkin");
    const playerTexture = skin === "zombie" ? "zombie" : "soldatzombie";

    this.player = this.physics.add.sprite(spawnX, spawnY, playerTexture);
    this.player.setScale(1.1);
    this.player.setCollideWorldBounds(true);
    this.player.setBounce(0);
    this.player.setDepth(20);

    if (skin === "zombie") {
      this.player.body.setSize(90, 75);
      this.player.body.setOffset(50, 12);
    } else {
      this.player.body.setSize(60, 70);
      this.player.body.setOffset(40, 10);
    }

    this.physics.add.collider(this.player, this.groundLayer);

    this.createAnimations();
    this.createCoinAnimation();
    this.createBombAnimation();

    if (skin === "zombie") {
      this.player.anims.play("idle_zombie", true);
    } else {
      this.player.anims.play("idle_soldat", true);
    }

    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    // ===== CONTROLES =====
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyQ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyZ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z); // saut clavier AZERTY
    this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE); // saut espace
    this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.keyEsc = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    // ===== GROUPES =====
    this.coins = this.physics.add.group();
    this.bombs = this.physics.add.group();

    this.physics.add.collider(this.coins, this.groundLayer);
    this.physics.add.collider(this.bombs, this.groundLayer);

    this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);
    this.physics.add.overlap(this.player, this.bombs, this.hitBomb, null, this);

    // ===== UI =====
    this.moneyText = this.add.text(20, 20, "Argent : " + this.registry.get("money"), {
      fontSize: "24px",
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 5
    }).setScrollFactor(0).setDepth(100);

    this.livesText = this.add.text(20, 55, "Vies : " + (1 + this.extraLives), {
      fontSize: "24px",
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 5
    }).setScrollFactor(0).setDepth(100);

    this.waveText = this.add.text(20, 90, "Vague : 1", {
      fontSize: "24px",
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 5
    }).setScrollFactor(0).setDepth(100);

    this.objectiveText = this.add.text(20, 125, "Pieces : 0 / 10", {
      fontSize: "24px",
      color: "#ffe66d",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 5
    }).setScrollFactor(0).setDepth(100);

    this.bombText = this.add.text(20, 160, "Bombes : 2", {
      fontSize: "22px",
      color: "#ff8a8a",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 5
    }).setScrollFactor(0).setDepth(100);

    this.multiplierText = this.add.text(20, 195, "", {
      fontSize: "22px",
      color: "#9ef0ff",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 5
    }).setScrollFactor(0).setDepth(100);

    this.infoText = this.add.text(20, 230, "GAUCHE / DROITE = SE DEPLACER | Z / ESPACE = SAUTER", {
      fontSize: "18px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 4
    }).setScrollFactor(0).setDepth(100);

    this.backText = this.add.text(20, 255, "ECHAP = RETOUR", {
      fontSize: "18px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 4
    }).setScrollFactor(0).setDepth(100);

    this.waveMessageText = this.add.text(400, 110, "", {
      fontSize: "34px",
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 6,
      align: "center"
    }).setOrigin(0.5).setScrollFactor(0).setDepth(120);

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
    returnToDoors() {
  // stop musique si elle tourne
  if (this.gameMusic && this.gameMusic.isPlaying) {
    this.gameMusic.stop();
  }

  // reset éventuel (optionnel)
  this.isGameOver = false;

  // changement de scène
  this.scene.start("choixPortes");
}

    // ===== 1ERE VAGUE =====
    this.startWave();
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
        frames: [{ key: "zombie", frame: 0 }],
        frameRate: 1,
        repeat: -1
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
        frames: [{ key: "soldatzombie", frame: 0 }],
        frameRate: 1,
        repeat: -1
      });
    }
  }

  createCoinAnimation() {
    if (!this.anims.exists("coin_spin")) {
      this.anims.create({
        key: "coin_spin",
        frames: this.anims.generateFrameNumbers("piece", { start: 0, end: 5 }),
        frameRate: 10,
        repeat: -1
      });
    }
  }

  createBombAnimation() {
    if (!this.anims.exists("bomb_idle")) {
      this.anims.create({
        key: "bomb_idle",
        frames: this.anims.generateFrameNumbers("bomb", { start: 0, end: 5 }),
        frameRate: 6,
        repeat: -1
      });
    }

    if (!this.anims.exists("bomb_explode")) {
      this.anims.create({
        key: "bomb_explode",
        frames: this.anims.generateFrameNumbers("bomb", { start: 6, end: 23 }),
        frameRate: 14,
        repeat: 0
      });
    }
  }

  startWave() {
    this.coinsCollectedThisWave = 0;
    this.objectiveText.setText("Pieces : 0 / " + this.coinsPerWave);
    this.waveText.setText("Vague : " + this.waveNumber);
    this.bombText.setText("Bombes : " + this.bombsThisWave);

    this.showWaveMessage(
      "VAGUE " + this.waveNumber + "\n" +
      this.coinsPerWave + " pieces - " + this.bombsThisWave + " bombes"
    );

    this.spawnFallingCoins(this.coinsPerWave);
    this.spawnFallingBombs(this.bombsThisWave);
  }

  spawnFallingCoins(count) {
    const leftLimit = 80;
    const rightLimit = this.map.widthInPixels - 80;

    for (let i = 0; i < count; i++) {
      this.time.delayedCall(i * 350, () => {
        if (this.isGameOver) return;

        const x = Phaser.Math.Between(leftLimit, rightLimit);
        const y = Phaser.Math.Between(-300, -50);

        const coin = this.coins.create(x, y, "piece", 0);
        coin.setScale(1.8);
        coin.setDepth(30);
        coin.body.setAllowGravity(true);
        coin.body.setBounce(0);
        coin.body.setVelocityY(Phaser.Math.Between(80, 180));
        coin.body.setCollideWorldBounds(false);
        coin.anims.play("coin_spin", true);
      });
    }
  }

  spawnFallingBombs(count) {
    const leftLimit = 80;
    const rightLimit = this.map.widthInPixels - 80;

    for (let i = 0; i < count; i++) {
      this.time.delayedCall(i * 250, () => {
        if (this.isGameOver) return;

        const x = Phaser.Math.Between(leftLimit, rightLimit);
        const y = Phaser.Math.Between(-500, -100);

        const bomb = this.bombs.create(x, y, "bomb", 0);
        bomb.setScale(0.22);
        bomb.setDepth(30);
        bomb.body.setAllowGravity(true);
        bomb.body.setBounce(0);
        bomb.body.setVelocityY(Phaser.Math.Between(100, 220));
        bomb.body.setCollideWorldBounds(false);
        bomb.anims.play("bomb_idle", true);
        bomb.hasExploded = false;
      });
    }
  }

  showWaveMessage(message) {
    this.waveMessageText.setText(message);

    if (this.waveMessageTimer) {
      this.waveMessageTimer.remove(false);
    }

    this.waveMessageTimer = this.time.delayedCall(1800, () => {
      this.waveMessageText.setText("");
    });
  }

  collectCoin(player, coin) {
    coin.destroy();
    this.sound.play("SonPiece", { volume: 0.7 });

    let value = 1;
    if (this.coinMultiplierActive && this.time.now < this.coinMultiplierEndTime) {
      value = 2;
    }

    const currentMoney = this.registry.get("money") || 0;
    this.registry.set("money", currentMoney + value);
    this.moneyText.setText("Argent : " + this.registry.get("money"));

    this.coinsCollectedThisWave += 1;
    this.objectiveText.setText("Pieces : " + this.coinsCollectedThisWave + " / " + this.coinsPerWave);

    if (this.coinsCollectedThisWave >= this.coinsPerWave && !this.isSpawningNextWave) {
      this.launchNextWave();
    }
  }

  launchNextWave() {
    this.isSpawningNextWave = true;

    this.time.delayedCall(1200, () => {
      if (this.isGameOver) return;

      this.coins.clear(true, true);
      this.bombs.clear(true, true);

      this.waveNumber += 1;
      this.bombsThisWave *= 2;

      this.startWave();
      this.isSpawningNextWave = false;
    });
  }

  hitBomb(player, bomb) {
    if (this.isGameOver || bomb.hasExploded) return;

    bomb.hasExploded = true;
    bomb.body.enable = false;

    bomb.play("bomb_explode");

    bomb.once("animationcomplete", () => {
      bomb.destroy();
      this.loseLifeOrGameOver("Tu as touche une bombe");
    });
  }

  loseLifeOrGameOver(reasonText) {
    if (this.extraLives > 0) {
      this.extraLives -= 1;
      this.livesText.setText("Vies : " + (1 + this.extraLives));
      this.player.setVelocity(0, 0);
      this.player.setPosition(this.player.x, this.player.y - 60);
      return;
    }

    if (this.gameMusic && this.gameMusic.isPlaying) {
      this.gameMusic.stop();
    }

    this.sound.play("SonGameOver", { volume: 1 });
    this.triggerGameOver("GAME OVER", reasonText + "\nR = recommencer");
  }

  triggerGameOver(title, subtitle) {
    if (this.isGameOver) return;

    this.isGameOver = true;
    this.player.setVelocity(0, 0);

    const skin = this.registry.get("selectedSkin");

    if (skin === "zombie") {
      this.player.anims.play("idle_zombie", true);
    } else {
      this.player.anims.play("idle_soldat", true);
    }

    this.gameOverText.setText(title);
    this.subText.setText(subtitle);
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

  updatePlayerMovement() {
    let moving = false;

    if (this.cursors.left.isDown || this.keyQ.isDown || this.keyA.isDown) {
      this.player.setVelocityX(-this.speed);
      this.player.setFlipX(false);
      moving = true;
    } else if (this.cursors.right.isDown || this.keyD.isDown) {
      this.player.setVelocityX(this.speed);
      this.player.setFlipX(true);
      moving = true;
    } else {
      this.player.setVelocityX(0);
    }

    // ===== SAUT =====
    if (
      (Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
        Phaser.Input.Keyboard.JustDown(this.keyZ) ||
        Phaser.Input.Keyboard.JustDown(this.keySpace)) &&
      this.player.body.blocked.down
    ) {
      this.player.setVelocityY(-this.jumpPower);
    }

    const skin = this.registry.get("selectedSkin");

    if (moving) {
      if (skin === "zombie") {
        if (!this.player.anims.isPlaying || this.player.anims.currentAnim.key !== "run_zombie") {
          this.player.anims.play("run_zombie", true);
        }
      } else {
        if (!this.player.anims.isPlaying || this.player.anims.currentAnim.key !== "run_soldat") {
          this.player.anims.play("run_soldat", true);
        }
      }
    } else {
      if (skin === "zombie") {
        if (!this.player.anims.isPlaying || this.player.anims.currentAnim.key !== "idle_zombie") {
          this.player.anims.play("idle_zombie", true);
        }
      } else {
        if (!this.player.anims.isPlaying || this.player.anims.currentAnim.key !== "idle_soldat") {
          this.player.anims.play("idle_soldat", true);
        }
      }
    }
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.keyEsc)) {
  this.returnToDoors();
  return;
}

    this.updatePlayerMovement();
    this.updateMultiplierUI();

    const camX = this.cameras.main.scrollX;

    if (this.backLayer) {
      this.backLayer.tilePositionX = camX * 0.20;
    }

    if (this.frontBgLayer) {
      this.frontBgLayer.tilePositionX = camX * 0.35;
    }

    if (this.player.y > this.map.heightInPixels + 100) {
      this.loseLifeOrGameOver("Tu es tombe dans un trou");
    }
  }
}