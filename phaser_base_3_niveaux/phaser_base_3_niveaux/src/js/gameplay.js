export default class gameplay extends Phaser.Scene {
  constructor() {
    super("gameplay");
  }

  preload() {
    this.load.image("sky", "src/assets/sky.png");
    this.load.image("platform", "src/assets/platform.png");
    this.load.image("star", "src/assets/star.png");
    this.load.image("bomb", "src/assets/bomb.png");
    this.load.image("bite", "src/assets/bite.png");
    
    // Load Tiled map assets
    this.load.image("tileset", "src/assets/zombie_level1_daylight_soviet_abandoned.png");
    this.load.tilemapTiledJSON("map", "src/assets/tiled map 1 soleil projet jeu.tmj");

    this.load.spritesheet("dude", "src/assets/dude.png", {
      frameWidth: 32,
      frameHeight: 48
    });
  }

  create() {
    this.isGameOver = false;
    this.mapWidth = 7000;
    this.speed = 230;
    this.jumpPower = -700;
    this.hordeCount = 1;
    this.followers = [];
    this.trail = [];

    this.extraLives = this.registry.get("extraLifeReady") ? 1 : 0;
    this.registry.set("extraLifeReady", false);

    this.coinMultiplierActive = this.registry.get("coinMultiplierReady");
    this.registry.set("coinMultiplierReady", false);
    this.coinMultiplierEndTime = 0;

    this.physics.world.setBounds(0, 0, this.mapWidth, 700);
    this.cameras.main.setBounds(0, 0, this.mapWidth, 600);

    // Load and display the Tiled map
    const map = this.make.tilemap({ key: "map" });
    const tileset = map.addTilesetImage("zombie_level1_daylight_soviet_abandoned", "tileset");
    const layer = map.createLayer(1, tileset, 0, 0);
    layer.setScrollFactor(1);
    layer.setOrigin(0, 0);
    
    // Enable collision on tiles marked as "estSolide"
    layer.setCollisionByProperty({ estSolide: true });

    this.holes = [
      { start: 1100, end: 1280 },
      { start: 2100, end: 2300 },
      { start: 3250, end: 3450 },
      { start: 4550, end: 4720 },
      { start: 5800, end: 6000 }
    ];

    this.platforms = this.physics.add.staticGroup();
    this.groundVisuals = [];

    this.createGround();

    this.player = this.physics.add.sprite(120, 470, "dude");
    this.player.setScale(1.3);
    this.player.setCollideWorldBounds(false);
    this.player.body.setSize(20, 40);
    this.player.body.setOffset(6, 8);

    this.applySelectedSkin();

    // Collider with both Tiled map layer and platforms
    this.physics.add.collider(this.player, layer);
    this.physics.add.collider(this.player, this.platforms);

    this.createAnimations();
    this.player.anims.play("run", true);

    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.keyEsc = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    this.coins = this.physics.add.staticGroup();
    this.humans = this.physics.add.staticGroup();
    this.bombs = this.physics.add.staticGroup();

    this.placeCoins();
    this.placeHumans();
    this.placeBombs();

    this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);
    this.physics.add.overlap(this.player, this.humans, this.eatHuman, null, this);
    this.physics.add.overlap(this.player, this.bombs, this.hitBomb, null, this);

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
      this.player.setTint(0x66ff66);
    } else {
      this.player.clearTint();
    }
  }

  createAnimations() {
    if (!this.anims.exists("run")) {
      this.anims.create({
        key: "run",
        frames: this.anims.generateFrameNumbers("dude", { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
      });
    }

    if (!this.anims.exists("idle")) {
      this.anims.create({
        key: "idle",
        frames: [{ key: "dude", frame: 4 }],
        frameRate: 1
      });
    }
  }

  createGround() {
    const segmentWidth = 140;
    const groundY = 540;
    const groundHeight = 60;

    for (let x = 0; x < this.mapWidth; x += segmentWidth) {
      if (this.isInsideHole(x, x + segmentWidth)) {
        continue;
      }

      const visual = this.add.rectangle(
        x + segmentWidth / 2,
        groundY + groundHeight / 2,
        segmentWidth,
        groundHeight,
        0x2d6a4f
      );
      this.groundVisuals.push(visual);

      const hitbox = this.add.rectangle(
        x + segmentWidth / 2,
        groundY + groundHeight / 2,
        segmentWidth,
        groundHeight,
        0x000000,
        0
      );

      this.physics.add.existing(hitbox, true);
      this.platforms.add(hitbox);
    }

    const highPlatforms = [
      { x: 1500, y: 455, width: 180, height: 22 },
      { x: 2600, y: 405, width: 180, height: 22 },
      { x: 3750, y: 435, width: 200, height: 22 },
      { x: 5050, y: 385, width: 180, height: 22 },
      { x: 6400, y: 415, width: 180, height: 22 }
    ];

    highPlatforms.forEach((p) => {
      const visual = this.add.rectangle(
        p.x + p.width / 2,
        p.y + p.height / 2,
        p.width,
        p.height,
        0x8d6e63
      );
      this.groundVisuals.push(visual);

      const hitbox = this.add.rectangle(
        p.x + p.width / 2,
        p.y + p.height / 2,
        p.width,
        p.height,
        0x000000,
        0
      );

      this.physics.add.existing(hitbox, true);
      this.platforms.add(hitbox);
    });
  }

  isInsideHole(startX, endX) {
    for (let i = 0; i < this.holes.length; i++) {
      const hole = this.holes[i];
      if (endX > hole.start && startX < hole.end) {
        return true;
      }
    }
    return false;
  }

  placeCoins() {
    const coinPositions = [
      [500, 490], [620, 490], [740, 490],
      [920, 490], [980, 490], [1040, 490],
      [1450, 490], [1560, 390], [1660, 390],
      [1850, 490], [1960, 490],
      [2450, 490], [2600, 345], [2680, 345], [2760, 345],
      [3000, 490], [3140, 490],
      [3600, 490], [3760, 380], [3840, 380], [3920, 380],
      [4200, 490], [4350, 490],
      [4900, 490], [5070, 325], [5150, 325],
      [5400, 490], [5520, 490],
      [6200, 490], [6400, 360], [6480, 360], [6560, 360]
    ];

    coinPositions.forEach((pos) => {
      this.coins.create(pos[0], pos[1], "star").setScale(0.8).refreshBody();
    });
  }

  placeHumans() {
    const humanPositions = [
      [820, 495],
      [1750, 495],
      [2860, 495],
      [4050, 495],
      [5250, 495],
      [6660, 495]
    ];

    humanPositions.forEach((pos) => {
      this.humans.create(pos[0], pos[1], "bite").setScale(0.8).refreshBody();
    });
  }

  placeBombs() {
    const bombPositions = [
      [1350, 500],
      [2340, 500],
      [3470, 500],
      [4740, 500],
      [6030, 500]
    ];

    bombPositions.forEach((pos) => {
      const bomb = this.bombs.create(pos[0], pos[1], "bomb").setScale(0.8);
      bomb.refreshBody();
    });
  }

  collectCoin(player, coin) {
    coin.destroy();

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
    this.hordeCount += 1;
    this.hordeText.setText("Horde : " + this.hordeCount);

    const follower = this.add.sprite(player.x - this.hordeCount * 20, player.y, "dude");
    follower.setScale(1.2);
    follower.anims.play("run", true);

    if (this.registry.get("selectedSkin") === "zombie") {
      follower.setTint(0x66ff66);
    }

    this.followers.push(follower);
  }

  loseLifeOrGameOver(reasonText) {
    if (this.extraLives > 0) {
      this.extraLives -= 1;
      this.livesText.setText("Vies : " + (1 + this.extraLives));

      this.player.setPosition(this.player.x - 120, 420);
      this.player.setVelocity(0, 0);
      return;
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

    this.isGameOver = true;
    this.player.setVelocity(0, 0);
    this.player.anims.play("idle", true);

    this.gameOverText.setText(title);
    this.subText.setText(subtitle);

    this.followers.forEach((follower) => {
      follower.anims.play("idle", true);
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
      const remaining = Math.max(0, Math.ceil((this.coinMultiplierEndTime - this.time.now) / 1000));

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
      this.player.setFrame(5);
    } else if (!this.player.anims.isPlaying || this.player.anims.currentAnim.key !== "run") {
      this.player.anims.play("run", true);
    }

    this.updateFollowers();
    this.updateMultiplierUI();

    if (this.player.y > 650) {
      this.loseLifeOrGameOver("Tu es tombe dans un trou");
    }

    if (this.player.x >= this.mapWidth - 120) {
      this.player.setVelocityX(0);
      this.isGameOver = true;
      this.gameOverText.setText("NIVEAU TERMINE");
      this.subText.setText("ECHAP = retour aux portes");
    }
  }
}