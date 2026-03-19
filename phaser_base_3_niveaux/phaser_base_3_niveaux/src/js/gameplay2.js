export default class gameplay2 extends Phaser.Scene {
  constructor() {
    super("gameplay2");
  }

  preload() {
    // ===== BACKGROUNDS =====
    this.load.image("bg", "src/assets/bg rogner.png");
    this.load.image("farBuildings", "src/assets/far-buildings rogner.png");
    this.load.image("buildings", "src/assets/buildings rogner.png");

    // ===== MAP / TILESET =====
    this.load.image("tilesetMap2", "src/assets/tileset.png");
    this.load.tilemapTiledJSON("map2", "src/assets/map2 potentiel.tmj");

    // ===== ITEMS =====
    this.load.spritesheet("piece", "src/assets/spinning coin.png", {
      frameWidth: 20,
      frameHeight: 16
    });

    this.load.spritesheet("humain", "src/assets/humain.png", {
      frameWidth: 32,
      frameHeight: 32
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

    if (!this.cache.audio.exists("SonManger")) {
      this.load.audio("SonManger", "src/assets/SonManger.mp3");
    }

    if (!this.cache.audio.exists("SonGameOver")) {
      this.load.audio("SonGameOver", "src/assets/SonGameOver.mp3");
    }
  }

  create() {
    this.isGameOver = false;
    this.speed = 250;
    this.jumpPower = -500;
    this.hordeCount = 5;
    this.followers = [];
    this.trail = [];

    let savedLives2 = this.registry.get("remainingLives");
    if (savedLives2 == null || savedLives2 <= 0) {
      savedLives2 = this.registry.get("extraLifeReady") ? 2 : 1;
    }
    this.totalLives = savedLives2;
    this.registry.set("remainingLives", this.totalLives);

    // Si le joueur a un bonus vie disponible, on l'utilise comme boussole :
    if (this.registry.get("extraLifeReady") && this.totalLives <= 1) {
      this.totalLives = 2;
      this.registry.set("remainingLives", this.totalLives);
    }

    this.coinMultiplierActive = this.registry.get("coinMultiplierReady");
    this.registry.set("coinMultiplierReady", false);
    this.coinMultiplierEndTime = 0;

    // ===== MUSIQUE =====
    this.gameMusic = this.sound.get("SonJeu") || this.sound.add("SonJeu", {
      loop: true,
      volume: 0.5
    });

    if (!this.gameMusic.isPlaying) {
      this.gameMusic.play();
    }

    // ===== MAP =====
    this.map = this.make.tilemap({ key: "map2" });

    const mapTileset = this.map.addTilesetImage("tileset", "tilesetMap2");

    const mapWidth = this.map.widthInPixels;
    const mapHeight = this.map.heightInPixels;
    const screenWidth = this.scale.width;
    const screenHeight = this.scale.height;

    this.cameras.main.setBackgroundColor("#000000");

    // ===== FOND FIXE =====
    this.bgLayer = this.add.image(screenWidth / 2, screenHeight / 2, "bg");
    this.bgLayer.setScrollFactor(0, 0);
    this.bgLayer.setDisplaySize(screenWidth, screenHeight);
    this.bgLayer.setDepth(-30);

    // ===== far-buildings rogner : parallax 0.20 =====
    this.farLayer = this.add.tileSprite(
      0,
      0,
      screenWidth,
      screenHeight,
      "farBuildings"
    );
    this.farLayer.setOrigin(0, 0);
    this.farLayer.setScrollFactor(0, 0);
    this.farLayer.setDepth(-20);

    const farImg = this.textures.get("farBuildings").getSourceImage();
    this.farLayer.tileScaleY = screenHeight / farImg.height;

    // ===== buildings rogner : parallax 0.35 =====
    this.buildingsLayer = this.add.tileSprite(
      0,
      0,
      screenWidth,
      screenHeight,
      "buildings"
    );
    this.buildingsLayer.setOrigin(0, 0);
    this.buildingsLayer.setScrollFactor(0, 0);
    this.buildingsLayer.setDepth(-10);

    const buildingsImg = this.textures.get("buildings").getSourceImage();
    this.buildingsLayer.tileScaleY = screenHeight / buildingsImg.height;

    // ===== UNIQUE LAYER TILED =====
    this.groundLayer = this.map.createLayer("Calque de Tuiles 1", [mapTileset], 0, 0);

    if (!this.groundLayer) {
      console.error("Layer introuvable : Calque de Tuiles 1");
      return;
    }

    this.groundLayer.setDepth(2);
    this.groundLayer.setCollisionByProperty({ estSolide: true });

    // ===== BOUNDS =====
    this.physics.world.setBounds(0, 0, mapWidth, mapHeight);
    this.cameras.main.setBounds(0, 0, mapWidth, mapHeight);

    // ===== JOUEUR =====
    let spawnX = 100;
    let spawnY = 300;

    const skin = this.registry.get("selectedSkin");
    const playerTexture = skin === "zombie" ? "zombie" : "soldatzombie";

    this.player = this.physics.add.sprite(spawnX, spawnY, playerTexture);
    this.player.setScale(1.1);
    this.player.setCollideWorldBounds(false);
    this.player.setBounce(0);
    this.player.body.setSize(60, 70);
    this.player.body.setOffset(40, 10);
    this.player.setDepth(20);
    this.player.setFlipX(true);

    this.physics.add.collider(this.player, this.groundLayer);

    this.createAnimations();
    this.createCoinAnimation();
    this.createHumanAnimation();

    if (skin === "zombie") {
      this.player.anims.play("run_zombie", true);
    } else {
      this.player.anims.play("run_soldat", true);
    }

    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    // ===== CONTROLES =====
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.keyEsc = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    // ===== GROUPES =====
    this.coins = this.physics.add.group({
      allowGravity: false,
      immovable: true
    });

    this.humans = this.physics.add.group({
      allowGravity: false,
      immovable: true
    });

    this.placeCoins();
    this.placeHumans();

    this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);
    this.physics.add.overlap(this.player, this.humans, this.eatHuman, null, this);

    // ===== UI =====
    this.moneyText = this.add.text(20, 20, "Argent : " + this.registry.get("money"), {
      fontSize: "24px",
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 5
    }).setScrollFactor(0).setDepth(100);

    this.hordeText = this.add.text(20, 55, "Horde : " + this.hordeCount, {
      fontSize: "24px",
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 5
    }).setScrollFactor(0).setDepth(100);

    this.livesText = this.add.text(20, 90, "Vies : " + this.totalLives, {
      fontSize: "24px",
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 5
    }).setScrollFactor(0).setDepth(100);

    this.multiplierText = this.add.text(20, 125, "", {
      fontSize: "22px",
      color: "#ffe66d",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 5
    }).setScrollFactor(0).setDepth(100);

    this.infoText = this.add.text(20, 160, "ESPACE / HAUT = SAUT", {
      fontSize: "18px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 4
    }).setScrollFactor(0).setDepth(100);

    this.backText = this.add.text(20, 185, "ECHAP = RETOUR", {
      fontSize: "18px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 4
    }).setScrollFactor(0).setDepth(100);

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

  createHumanAnimation() {
    if (!this.anims.exists("human_idle")) {
      this.anims.create({
        key: "human_idle",
        frames: this.anims.generateFrameNumbers("humain", { start: 0, end: 3 }),
        frameRate: 6,
        repeat: -1
      });
    }
  }

  placeCoins() {
    const coinPositions = [
      [450, 420],
      [520, 420],
      [590, 420],
      [1100, 360],
      [1170, 360],
      [1800, 300],
      [1870, 300]
    ];

    coinPositions.forEach((pos) => {
      const coin = this.coins.create(pos[0], pos[1], "piece", 0);
      coin.setOrigin(0.5, 1);
      coin.setScale(1.8);
      coin.setDepth(30);
      coin.anims.play("coin_spin", true);
    });
  }

  placeHumans() {
    const humanPositions = [
      [900, 520],
      [1600, 520],
      [2400, 520]
    ];

    humanPositions.forEach((pos) => {
      const human = this.humans.create(pos[0], pos[1], "humain", 0);
      human.setOrigin(0.5, 1);
      human.setScale(2.2);
      human.setDepth(30);
      human.setFlipX(true);
      human.body.setAllowGravity(false);
      human.body.setImmovable(true);
      human.anims.play("human_idle", true);
    });
  }

  collectCoin(player, coin) {
    coin.destroy();
    this.sound.play("SonPiece", { volume: 0.7 });

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
   const sonManger = this.sound.add("SonManger", { volume: 0.8 });
    sonManger.play();

    this.time.delayedCall(2000, () => {
      if (sonManger && sonManger.isPlaying) {
        sonManger.stop();
      }
    });

    this.hordeCount += 1;
    this.hordeText.setText("Horde : " + this.hordeCount);

    const skin = this.registry.get("selectedSkin");
    const followerTexture = skin === "zombie" ? "zombie" : "soldatzombie";

    const follower = this.add.sprite(player.x - this.hordeCount * 20, player.y, followerTexture);
    follower.setScale(1.0);
    follower.setDepth(20);
    follower.setFlipX(true);

    if (skin === "zombie") {
      follower.anims.play("run_zombie", true);
    } else {
      follower.anims.play("run_soldat", true);
    }

    this.followers.push(follower);
  }
  findRespawnPoint(deathX) {
  const respawnX = Math.max(100, deathX - 384);
  let respawnY = 300;

  for (let y = 0; y < this.map.heightInPixels; y += this.map.tileHeight) {
    const tile = this.groundLayer.getTileAtWorldXY(respawnX, y, true);

    if (tile && tile.collides) {
      respawnY = tile.pixelY - 60;
      break;
    }
  }

  return { x: respawnX, y: respawnY };
}
  loseLifeOrGameOver(reasonText) {
  const deathX = this.player.x;

  this.totalLives = Math.max(0, this.totalLives - 1);
  this.livesText.setText("Vies : " + this.totalLives);
  this.registry.set("remainingLives", this.totalLives);

  if (this.totalLives > 0) {
    const respawn = this.findRespawnPoint(deathX);
    this.player.setPosition(respawn.x, respawn.y);
    this.player.setVelocity(0, 0);
    this.isGameOver = false;

    const skin = this.registry.get("selectedSkin");
    if (skin === "zombie") {
      this.player.anims.play("run_zombie", true);
    } else {
      this.player.anims.play("run_soldat", true);
    }

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

    this.followers.forEach((follower) => {
      if (skin === "zombie") {
        follower.anims.play("idle_zombie", true);
      } else {
        follower.anims.play("idle_soldat", true);
      }
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
      if (this.gameMusic && this.gameMusic.isPlaying) {
        this.gameMusic.stop();
      }
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

    if (this.player.body.velocity.y !== 0) {
      this.player.anims.stop();
      this.player.setFrame(4);
    } else {
      const skin = this.registry.get("selectedSkin");

      if (skin === "zombie") {
        if (!this.player.anims.isPlaying || this.player.anims.currentAnim.key !== "run_zombie") {
          this.player.anims.play("run_zombie", true);
        }
      } else {
        if (!this.player.anims.isPlaying || this.player.anims.currentAnim.key !== "run_soldat") {
          this.player.anims.play("run_soldat", true);
        }
      }
    }

    const camX = this.cameras.main.scrollX;
    this.farLayer.tilePositionX = camX * 0.20;
    this.buildingsLayer.tilePositionX = camX * 0.35;

    this.player.setDepth(20);

    this.updateFollowers();
    this.updateMultiplierUI();

    if (this.player.y > this.map.heightInPixels + 100) {
      this.loseLifeOrGameOver("Tu es tombe dans un trou");
    }

    if (this.player.x >= this.map.widthInPixels - 120) {
      this.player.setVelocityX(0);
      this.isGameOver = true;
      this.gameOverText.setText("NIVEAU 2 TERMINE");
      this.subText.setText("ECHAP = retour aux portes");

      if (this.gameMusic && this.gameMusic.isPlaying) {
        this.gameMusic.stop();
      }
    }
  }
}