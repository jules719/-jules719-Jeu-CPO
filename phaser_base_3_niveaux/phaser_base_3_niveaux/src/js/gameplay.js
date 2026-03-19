export default class gameplay extends Phaser.Scene {
  constructor() {
    super("gameplay");
  }

  preload() {
    // ===== MAP PARALLAX LAYERS =====
    this.load.image("cloud", "src/assets/cloud.png");
    this.load.image("towns", "src/assets/towns.png");
    this.load.image("tiles", "src/assets/tiles.png");

    this.load.tilemapTiledJSON("map", "src/assets/test parrallax.tmj");

    // ===== ITEMS =====
    this.load.spritesheet("piece", "src/assets/spinning coin.png", {
      frameWidth: 20,
      frameHeight: 16
    });

    // Bombe : une seule source
   this.load.spritesheet("bomb", "src/assets/bomb.png", {
  frameWidth: 256,
  frameHeight: 256
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
    if (!this.cache.audio.exists("SonIntro")) {
      this.load.audio("SonIntro", "src/assets/SonIntro.mp3");
    }

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
    // Stop intro/menu music
    const introSound = this.sound.get("SonIntro");
    if (introSound && introSound.isPlaying) {
      introSound.stop();
    }

    // Play gameplay music
    this.gameMusic = this.sound.get("SonJeu") || this.sound.add("SonJeu", {
      loop: true,
      volume: 0.5
    });

    if (!this.gameMusic.isPlaying) {
      this.gameMusic.play();
    }

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
    this.map = this.make.tilemap({ key: "map" });
    const tileset = this.map.addTilesetImage("test", "tiles");

    const mapWidthPixels = this.map.widthInPixels;
    const mapHeightPixels = this.map.heightInPixels;

    // ===== PARALLAX IMAGE LAYERS =====
    this.cloudsLayer = this.add.tileSprite(0, 0, mapWidthPixels, mapHeightPixels, "cloud");
    this.cloudsLayer.setOrigin(0, 0);
    this.cloudsLayer.setScrollFactor(0.1, 1);
    this.cloudsLayer.setDepth(-2);

    this.townLayer = this.add.tileSprite(0, 0, mapWidthPixels, mapHeightPixels, "towns");
    this.townLayer.setOrigin(0, 0);
    this.townLayer.setScrollFactor(0.5, 1);
    this.townLayer.setDepth(-1);

    // ===== CALQUES TILED =====
    this.groundLayer = this.map.createLayer("Calque de Tuiles 1", tileset, 0, 0);
    this.decorLayer = this.map.createLayer("Calque de Tuiles 2", tileset, 0, 0);

    if (this.groundLayer) this.groundLayer.setDepth(1);
    if (this.decorLayer) this.decorLayer.setDepth(2);

    if (this.groundLayer) this.groundLayer.setCollisionByProperty({ estSolide: true });
    if (this.decorLayer) this.decorLayer.setCollisionByProperty({ estSolide: true });

    this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

    // ===== JOUEUR =====
    let spawnX = 100;
    let spawnY = 100;

    for (let y = 0; y < this.map.heightInPixels; y += this.map.tileHeight) {
      const tile = this.groundLayer.getTileAtWorldXY(spawnX, y, true);

      if (tile && tile.collides) {
        spawnY = tile.pixelY - 60;
        break;
      }
    }

    const skin = this.registry.get("selectedSkin");
    const playerTexture = skin === "zombie" ? "zombie" : "soldatzombie";

    this.player = this.physics.add.sprite(spawnX, spawnY, playerTexture);
    this.player.setScale(1.1);
    this.player.setCollideWorldBounds(false);
    this.player.setBounce(0);
    this.player.body.setSize(60, 70);
    this.player.body.setOffset(40, 10);
    this.player.setDepth(10);
    this.player.setFlipX(true);

    if (this.groundLayer) this.physics.add.collider(this.player, this.groundLayer);
    if (this.decorLayer) this.physics.add.collider(this.player, this.decorLayer);

    this.createAnimations();
    this.createCoinAnimation();
    this.createHumanAnimation();
    this.createBombAnimation();

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

    this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);
    this.physics.add.overlap(this.player, this.humans, this.eatHuman, null, this);
    this.physics.add.overlap(this.player, this.bombs, this.hitBomb, null, this);

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

    this.livesText = this.add.text(20, 90, "Vies : " + (1 + this.extraLives), {
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
      const coin = this.coins.create(pos[0], pos[1], "piece", 0);
      coin.setOrigin(0.5, 1);
      coin.setScale(1.8);
      coin.setDepth(2.5);
      coin.anims.play("coin_spin", true);
    });
  }

  placeHumans() {
    const humanPositions = [
      [820, 600],
      [1750, 600],
      [2860, 600]
    ];

    humanPositions.forEach((pos) => {
      const human = this.humans.create(pos[0], pos[1], "humain", 0);

      human.setOrigin(0.5, 1);
      human.setScale(2.2);
      human.setDepth(2.5);
      human.setFlipX(true);
      human.body.setAllowGravity(false);
      human.body.setImmovable(true);
      human.anims.play("human_idle", true);
    });
  }

  placeBombs() {
  const bombPositions = [
    [1350, 600],
    [2400, 520],
    [3000, 500]
  ];

  bombPositions.forEach((pos) => {
    const bomb = this.bombs.create(pos[0], pos[1], "bomb", 0);
    bomb.setOrigin(0.5, 1);
    bomb.setScale(0.3);
    bomb.setDepth(2.5);
    bomb.anims.play("bomb_idle", true);
    bomb.hasExploded = false;
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
    this.sound.play("SonManger", { volume: 0.8 });
     this.time.delayedCall(2000, () => {
    if (eatSound && eatSound.isPlaying) {
      eatSound.stop();
    }
  });

    this.hordeCount += 1;
    this.hordeText.setText("Horde : " + this.hordeCount);

    const skin = this.registry.get("selectedSkin");
    const followerTexture = skin === "zombie" ? "zombie" : "soldatzombie";

    const follower = this.add.sprite(player.x - this.hordeCount * 20, player.y, followerTexture);
    follower.setScale(1.0);
    follower.setDepth(3);
    follower.setFlipX(true);

    if (skin === "zombie") {
      follower.anims.play("run_zombie", true);
    } else {
      follower.anims.play("run_soldat", true);
    }

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

    if (this.gameMusic && this.gameMusic.isPlaying) {
      this.gameMusic.stop();
    }

    this.sound.play("SonGameOver", { volume: 1 });
    this.triggerGameOver("GAME OVER", reasonText + "\nR = recommencer");
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
  triggerGameOver(title, subtitle) {
    if (this.isGameOver) {
      return;
    }

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

    this.updateFollowers();
    this.updateMultiplierUI();

    if (this.player.y > this.map.heightInPixels + 100) {
      this.loseLifeOrGameOver("Tu es tombe dans un trou");
    }

    if (this.player.x >= this.map.widthInPixels - 120) {
      this.player.setVelocityX(0);
      this.isGameOver = true;
      this.gameOverText.setText("NIVEAU 1 TERMINE");
      this.subText.setText("Passage au niveau 2...");

      if (this.gameMusic && this.gameMusic.isPlaying) {
        this.gameMusic.stop();
      }

      this.time.delayedCall(1500, () => {
        this.scene.start("gameplay2");
      });
    }
  }
}