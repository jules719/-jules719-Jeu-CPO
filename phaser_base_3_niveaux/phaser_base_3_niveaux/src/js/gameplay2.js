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

    this.load.spritesheet("bomb", "src/assets/bomb.png", {
      frameWidth: 256,
      frameHeight: 256
    });

    this.load.spritesheet("humain", "src/assets/humain.png", {
      frameWidth: 32,
      frameHeight: 32
    });

    // ===== PORTE =====
    this.load.spritesheet("door", "src/assets/door.png", {
      frameWidth: 96,
      frameHeight: 120
    });

    // ===== PERSONNAGES =====
    this.load.spritesheet("zombie", "src/assets/zombie.png", {
      frameWidth: 144,
      frameHeight: 80
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

    this.isGameOver = false;
    this.speed = 250;
    this.jumpPower = -500;

    this.startFollowersCount = 5;
    this.hordeCount = 1 + this.startFollowersCount;

    this.humansEaten = 0;
    this.requiredHumans = 3;

    this.followers = [];
    this.trail = [];

    this.doorUnlocked = false;
    this.doorOpening = false;
    this.doorMessageCooldown = false;

    let savedLives = this.registry.get("remainingLives");
    if (savedLives == null || savedLives <= 0) {
      savedLives = this.registry.get("extraLifeReady") ? 2 : 1;
    }
    this.totalLives = savedLives;
    this.registry.set("remainingLives", this.totalLives);
    this.registry.set("extraLifeReady", false);

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

    // ===== PARALLAX 1 =====
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

    // ===== PARALLAX 2 =====
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

    // ===== LAYER TILED =====
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
    const spawnX = 100;
    const spawnY = 480;

    const skin = this.registry.get("selectedSkin");
    const playerTexture = skin === "zombie" ? "zombie" : "soldatzombie";

    this.player = this.physics.add.sprite(spawnX, spawnY, playerTexture);
    this.player.setScale(1.1);
    this.player.setCollideWorldBounds(false);
    this.player.setBounce(0);
    this.player.setDepth(20);
    this.player.setFlipX(true);

    if (skin === "zombie") {
      this.player.body.setSize(78, 72);
      this.player.body.setOffset(28, 6);
    } else {
      this.player.body.setSize(60, 70);
      this.player.body.setOffset(40, 10);
    }

    this.physics.add.collider(this.player, this.groundLayer);

    // ===== ANIMS =====
    this.createAnimations();
    this.createCoinAnimation();
    this.createHumanAnimation();
    this.createBombAnimation();
    this.createDoorAnimation();

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

    this.bombs = this.physics.add.group({
      allowGravity: false,
      immovable: true
    });

    this.placeCoins();
    this.placeHumans();
    this.placeBombs();
    this.createDoor();
    this.spawnStartingFollowers();

    this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);
    this.physics.add.overlap(this.player, this.humans, this.eatHuman, null, this);
    this.physics.add.overlap(this.player, this.bombs, this.hitBomb, null, this);
    this.physics.add.overlap(this.player, this.exitDoorZone, this.tryOpenDoor, null, this);

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

    this.objectiveText = this.add.text(20, 160, "Humains manges : 0 / 3", {
      fontSize: "22px",
      color: "#9ef0ff",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 5
    }).setScrollFactor(0).setDepth(100);

    this.infoText = this.add.text(20, 195, "ESPACE / HAUT = SAUT", {
      fontSize: "18px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 4
    }).setScrollFactor(0).setDepth(100);

    this.backText = this.add.text(20, 220, "ECHAP = RETOUR", {
      fontSize: "18px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 4
    }).setScrollFactor(0).setDepth(100);

    this.doorInfoText = this.add.text(400, 60, "", {
      fontSize: "24px",
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
        frames: [{ key: "soldatzombie", frame: 4 }],
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

  createDoorAnimation() {
    if (!this.anims.exists("door_open")) {
      this.anims.create({
        key: "door_open",
        frames: this.anims.generateFrameNumbers("door", { start: 0, end: 5 }),
        frameRate: 10,
        repeat: 0
      });
    }
  }

  placeCoins() {
    const coinPositions = [
      [170, 540],
      [250, 540],
      [330, 540],
      [430, 508],
      [540, 540],

      [1030, 444],
      [1110, 444],
      [1190, 444],

      [1290, 284],
      [1410, 252],
      [1530, 284],

      [1810, 444],
      [1940, 380],
      [2470, 316],
      [3030, 284]
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
      [1080, 480],
      [1780, 480],
      [2800, 288]
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

  placeBombs() {
    const bombPositions = [
      [520, 540],
      [1390, 180],
      [2720, 540]
    ];

    bombPositions.forEach((pos) => {
      const bomb = this.bombs.create(pos[0], pos[1], "bomb", 0);
      bomb.setOrigin(0.5, 1);
      bomb.setScale(0.22);
      bomb.setDepth(30);
      bomb.anims.play("bomb_idle", true);
      bomb.hasExploded = false;
    });
  }

  createDoor() {
    const doorX = 3088;
    const doorBottomY = 320;

    this.door = this.physics.add.sprite(doorX, doorBottomY, "door", 0);
    this.door.setOrigin(0.5, 1);
    this.door.setScale(1);
    this.door.setDepth(35);
    this.door.body.allowGravity = false;
    this.door.body.immovable = true;

    this.exitDoorZone = this.add.zone(doorX, doorBottomY - 60, 110, 140);
    this.physics.add.existing(this.exitDoorZone, true);
  }

  spawnStartingFollowers() {
    const skin = this.registry.get("selectedSkin");
    const followerTexture = skin === "zombie" ? "zombie" : "soldatzombie";

    for (let i = 0; i < this.startFollowersCount; i++) {
      const follower = this.add.sprite(
        this.player.x - (i + 1) * 35,
        this.player.y,
        followerTexture
      );

      follower.setDepth(20);
      follower.setFlipX(true);

      if (skin === "zombie") {
        follower.setScale(1.1);
        follower.anims.play("run_zombie", true);
      } else {
        follower.setScale(1.0);
        follower.anims.play("run_soldat", true);
      }

      this.followers.push(follower);
    }
  }

  showDoorMessage(message) {
    this.doorInfoText.setText(message);

    if (this.doorInfoTimer) {
      this.doorInfoTimer.remove(false);
    }

    this.doorInfoTimer = this.time.delayedCall(1800, () => {
      this.doorInfoText.setText("");
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
  }

  eatHuman(player, human) {
    human.destroy();
    this.sound.play("SonManger", { volume: 0.8 });

    this.humansEaten += 1;
    this.hordeCount += 1;

    this.hordeText.setText("Horde : " + this.hordeCount);
    this.objectiveText.setText("Humains manges : " + this.humansEaten + " / " + this.requiredHumans);

    const skin = this.registry.get("selectedSkin");
    const followerTexture = skin === "zombie" ? "zombie" : "soldatzombie";

    const follower = this.add.sprite(player.x - this.hordeCount * 20, player.y, followerTexture);
    follower.setDepth(20);
    follower.setFlipX(true);

    if (skin === "zombie") {
      follower.setScale(1.1);
      follower.anims.play("run_zombie", true);
    } else {
      follower.setScale(1.0);
      follower.anims.play("run_soldat", true);
    }

    this.followers.push(follower);

    if (this.humansEaten >= this.requiredHumans) {
      this.doorUnlocked = true;
      this.showDoorMessage("La porte est ouverte !");
    }
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

  tryOpenDoor() {
    if (this.isGameOver || this.doorOpening) return;

    if (!this.doorUnlocked) {
      if (!this.doorMessageCooldown) {
        const remaining = this.requiredHumans - this.humansEaten;
        this.showDoorMessage("Mange encore " + remaining + " humain" + (remaining > 1 ? "s" : ""));
        this.doorMessageCooldown = true;

        this.time.delayedCall(1200, () => {
          this.doorMessageCooldown = false;
        });
      }
      return;
    }

    this.doorOpening = true;
    this.isGameOver = true;
    this.player.setVelocityX(0);
    this.player.setVelocityY(0);

    this.door.play("door_open");

    this.showDoorMessage("Porte ouverte !");

    this.door.once("animationcomplete", () => {
      this.gameOverText.setText("NIVEAU 2 TERMINE");
      this.subText.setText("Passage au niveau 3...");

      if (this.gameMusic && this.gameMusic.isPlaying) {
        this.gameMusic.stop();
      }

      this.time.delayedCall(1000, () => {
        this.scene.start("gameplay3");
      });
    });
  }

  triggerGameOver(title, subtitle) {
    if (this.isGameOver && !this.doorOpening) {
      return;
    }

    this.doorOpening = false;
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

    if (this.trail.length > 700) {
      this.trail.shift();
    }

    for (let i = 0; i < this.followers.length; i++) {
      const index = Math.max(0, this.trail.length - 1 - (i + 1) * 10);
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
      if (Phaser.Input.Keyboard.JustDown(this.keyR) && !this.doorOpening) {
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
      this.player.setFrame(0);
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
  }
}