export default class gameplay extends Phaser.Scene {
  constructor() {
    super("gameplay");
  }

  preload() {
    this.load.image("sky", "./assets/sky.png");
    this.load.image("platform", "./assets/platform.png");
    this.load.image("star", "./assets/star.png");
    this.load.image("bomb", "./assets/bomb.png");
    this.load.image("bite", "./assets/bite.png");

    this.load.spritesheet("dude", "./assets/dude.png", {
      frameWidth: 32,
      frameHeight: 48
    });
  }

  create() {
    this.isGameOver = false;
    this.mapWidth = 7000;
    this.speed = 230;
    this.jumpPower = -520;
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

    for (let x = 400; x < this.mapWidth; x += 800) {
      this.add.image(x, 300, "sky").setDisplaySize(800, 600);
    }

    this.platforms = this.physics.add.staticGroup();
    this.holes = [
      { start: 1100, end: 1280 },
      { start: 2100, end: 2300 },
      { start: 3250, end: 3450 },
      { start: 4550, end: 4720 },
      { start: 5800, end: 6000 }
    ];

    this.createGround();

    this.player = this.physics.add.sprite(120, 470, "dude");
    this.player.setScale(1.3);
    this.player.setCollideWorldBounds(false);
    this.player.body.setSize(20, 40);
    this.player.body.setOffset(6, 8);

    this.applySelectedSkin();

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

    this.infoText = this.add.text(20, 160, "ESPACE / FLECHE HAUT = SAUT", {
      fontSize: "18px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 4
    }).setScrollFactor(0);

    this.backText = this.add.text(20, 185, "ECHAP = RETOUR AUX PORTES", {
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
    const segmentWidth = 128;
    const groundY = 568;

    for (let x = 0; x < this.mapWidth; x += segmentWidth) {
      if (this.isInsideHole(x, x + segmentWidth)) {
        continue;
      }

      const block = this.platforms.create(x, groundY, "platform").setOrigin(0, 0);
      block.refreshBody();

      if (block.width !== segmentWidth || block.height !== 32) {
        block.displayWidth = segmentWidth;
        block.displayHeight = 32;
        block.refreshBody();
      }
    }

    const highPlatforms = [
      { x: 1500, y: 470, width: 180 },
      { x: 2600, y: 420, width: 180 },
      { x: 3750, y: 450, width: 200 },
      { x: 5050, y: 400, width: 180 },
      { x: 6400, y: 430, width: 180 }
    ];

    highPlatforms.forEach((p) => {
      const count = Math.floor(p.width / 64);
      for (let i = 0; i < count; i++) {
        const block = this.platforms.create(p.x + i * 64, p.y, "platform").setOrigin(0, 0);
        block.displayWidth = 64;
        block.displayHeight = 28;
        block.refreshBody();
      }
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
      [500, 500], [620, 500], [740, 500],
      [920, 500], [980, 500], [1040, 500],
      [1450, 500], [1560, 410], [1660, 410],
      [1850, 500], [1960, 500],
      [2450, 500], [2600, 360], [2680, 360], [2760, 360],
      [3000, 500], [3140, 500],
      [3600, 500], [3760, 400], [3840, 400], [3920, 400],
      [4200, 500], [4350, 500],
      [4900, 500], [5070, 340], [5150, 340],
      [5400, 500], [5520, 500],
      [6200, 500], [6400, 370], [6480, 370], [6560, 370]
    ];

    coinPositions.forEach((pos) => {
      this.coins.create(pos[0], pos[1], "star").setScale(0.8).refreshBody();
    });
  }

  placeHumans() {
    const humanPositions = [
      [820, 500],
      [1750, 500],
      [2860, 500],
      [4050, 500],
      [5250, 500],
      [6660, 500]
    ];

    humanPositions.forEach((pos) => {
      this.humans.create(pos[0], pos[1], "bite").setScale(0.8).refreshBody();
    });
  }

  placeBombs() {
    const bombPositions = [
      [1350, 510],
      [2340, 510],
      [3470, 510],
      [4740, 510],
      [6030, 510]
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
      const index = Math.max(0, this.trail.length - 1 - (i + 1) * 18);
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