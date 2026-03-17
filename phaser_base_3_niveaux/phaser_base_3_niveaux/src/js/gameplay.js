export default class gameplay extends Phaser.Scene {
  constructor() {
    super("gameplay");
  }

preload() {

  this.load.image("sky", "src/assets/sky.png");
  this.load.image("star", "src/assets/star.png");
  this.load.image("bomb", "src/assets/bomb.png");
  this.load.image("bite", "src/assets/bite.png");

  this.load.image(
    "tileset",
    "src/assets/zombie_level1_daylight_soviet_abandoned.png"
  );

  this.load.tilemapTiledJSON(
    "map",
    "src/assets/tiled map 1 soleil projet jeu.tmj"
  );

  this.load.spritesheet("dude", "src/assets/dude.png", {
    frameWidth: 32,
    frameHeight: 48
  });

}
create() {
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

  this.tileset = this.map.addTilesetImage(
    "zombie_level1_daylight_soviet_abandoned",
    "tileset"
  );

  this.groundLayer = this.map.createLayer("Calque de Tuiles 1", this.tileset, 0, 0);
  this.decorLayer = this.map.createLayer("Calque de Tuiles 2", this.tileset, 0, 0);

  // Collision avec la propriété Tiled
  this.groundLayer.setCollisionByProperty({ estSolide: true });

  // Décommente cette ligne seulement si la propriété ne marche pas
  // this.groundLayer.setCollisionBetween(1, 10000);

  this.physics.world.setBounds(
    0,
    0,
    this.map.widthInPixels,
    this.map.heightInPixels
  );

  this.cameras.main.setBounds(
    0,
    0,
    this.map.widthInPixels,
    this.map.heightInPixels
  );

// ===== JOUEUR =====
// ===== JOUEUR =====
let spawnX = 100;
let spawnY = 100;

// Cherche la première tuile solide sous spawnX
for (let y = 0; y < this.map.heightInPixels; y += this.map.tileHeight) {
  const tile = this.groundLayer.getTileAtWorldXY(spawnX, y, true);

  if (tile && tile.collides) {
    spawnY = tile.pixelY - 30;
    break;
  }
}

this.player = this.physics.add.sprite(spawnX, spawnY, "dude");
this.player.setScale(1.3);
this.player.setCollideWorldBounds(false);
this.player.setBounce(0);
this.player.body.setSize(32, 48);
this.player.body.setOffset(0, 0);

this.applySelectedSkin();

this.physics.add.collider(this.player, this.groundLayer);

this.createAnimations();
this.player.anims.play("run", true);

this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

  // DEBUG collisions Tiled
  const debugGraphics = this.add.graphics().setAlpha(0.7);
  this.groundLayer.renderDebug(debugGraphics, {
    tileColor: null,
    collidingTileColor: new Phaser.Display.Color(255, 0, 0, 120),
    faceColor: new Phaser.Display.Color(0, 255, 0, 180)
  });

  // Contrôles
  this.cursors = this.input.keyboard.createCursorKeys();
  this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
  this.keyEsc = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

  // Groupes
  this.coins = this.physics.add.staticGroup();
  this.humans = this.physics.add.staticGroup();
  this.bombs = this.physics.add.staticGroup();

  this.placeCoins();
  this.placeHumans();
  this.placeBombs();

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

  placeCoins() {
    const coinPositions = [
      [500, 490], [620, 490], [740, 490],
      [920, 490], [980, 490], [1040, 490],
      [1450, 390], [1560, 390], [1660, 390],
      [1850, 490], [1960, 490]
    ];

    coinPositions.forEach((pos) => {
      this.coins.create(pos[0], pos[1], "star").setScale(0.8).refreshBody();
    });
  }

  placeHumans() {
    const humanPositions = [
      [820, 495],
      [1750, 495],
      [2860, 495]
    ];

    humanPositions.forEach((pos) => {
      this.humans.create(pos[0], pos[1], "bite").setScale(0.8).refreshBody();
    });
  }

  placeBombs() {
    const bombPositions = [
      [1350, 500],
      [2340, 500],
      [3470, 500]
    ];

    bombPositions.forEach((pos) => {
      this.bombs.create(pos[0], pos[1], "bomb").setScale(0.8).refreshBody();
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
      this.player.setPosition(this.player.x - 120, this.player.y - 100);
      this.player.setVelocity(0, 0);
      return;
    }

    this.triggerGameOver("GAME OVER", reasonText + "\nR = recommencer");
  }

  hitBomb() {
    if (this.isGameOver) return;
    this.loseLifeOrGameOver("Tu as touche une bombe");
  }

  triggerGameOver(title, subtitle) {
    if (this.isGameOver) return;

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

    if (this.player.y > this.map.heightInPixels + 100) {
      this.loseLifeOrGameOver("Tu es tombe dans un trou");
    }

    if (this.player.x >= this.map.widthInPixels - 120) {
      this.player.setVelocityX(0);
      this.isGameOver = true;
      this.gameOverText.setText("NIVEAU TERMINE");
      this.subText.setText("ECHAP = retour aux portes");
    }
  }
}