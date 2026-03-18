export default class armurerie extends Phaser.Scene {
  constructor() {
    super("armurerie");
  }

  preload() {
    this.load.image("door3", "src/assets/door3.png");

  this.load.spritesheet("zombie", "src/assets/zombie.png", {
  frameWidth: 192,
  frameHeight: 99
});

this.load.spritesheet("soldatzombie", "src/assets/soldatzombie.png", {
  frameWidth: 144,
  frameHeight: 80
});

    if (!this.cache.audio.exists("SonIntro")) {
      this.load.audio("SonIntro", "src/assets/SonIntro.mp3");
    }

    this.load.audio("SonPieceX2", "src/assets/SonPieceX2.mp3");
    this.load.audio("SonSkin", "src/assets/SonSkin.mp3");
    this.load.audio("SonVies", "src/assets/SonVies.mp3");
  }

  create() {
    this.cameras.main.setBackgroundColor("#87ceeb");

    this.menuMusic = this.sound.get("SonIntro") || this.sound.add("SonIntro", { loop: true, volume: 0.6 });

    const playMenuMusic = () => {
      if (!this.menuMusic.isPlaying) {
        this.menuMusic.play();
      }
    };

    if (this.sound.context.state === "running") {
      playMenuMusic();
    } else {
      this.input.once("pointerdown", () => {
        this.sound.context.resume().then(playMenuMusic);
      });
    }

    if (this.registry.get("selectedSkin") === undefined) {
      this.registry.set("selectedSkin", "soldat");
    }
    if (this.registry.get("coinMultiplierReady") === undefined) {
      this.registry.set("coinMultiplierReady", false);
    }
    if (this.registry.get("extraLifeReady") === undefined) {
      this.registry.set("extraLifeReady", false);
    }

    this.add.text(400, 45, "ARMURERIE", {
      fontSize: "40px",
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 6
    }).setOrigin(0.5);

    this.moneyText = this.add.text(400, 90, "Argent : " + this.registry.get("money"), {
      fontSize: "26px",
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 4
    }).setOrigin(0.5);

    this.add.rectangle(240, 270, 300, 290, 0x1f2d3a, 0.85).setStrokeStyle(4, 0xffffff);
    this.add.rectangle(560, 270, 300, 290, 0x1f2d3a, 0.85).setStrokeStyle(4, 0xffffff);

    this.add.text(240, 130, "SKIN SOLDAT", {
      fontSize: "26px",
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 4
    }).setOrigin(0.5);

    this.add.text(560, 130, "SKIN ZOMBIE", {
      fontSize: "26px",
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 4
    }).setOrigin(0.5);

    // aperçus fixes
    // aperçus fixes
this.previewSoldat = this.add.sprite(240, 230, "soldatzombie", 0);
this.previewSoldat.setOrigin(0.5, 0.7);
this.previewSoldat.setScale(1.5);
this.previewSoldat.setFrame(2);
this.previewSoldat.setDepth(5);


this.previewZombie = this.add.sprite(560, 230, "zombie", 0);
this.previewZombie.setOrigin(0.5, 0.7);
this.previewZombie.setScale(1.2);
this.previewZombie.setFrame(0);
this.previewZombie.setFrame(2);
this.previewZombie.setDepth(5);

    this.soldatBtn = this.add.rectangle(240, 355, 200, 55, 0x3498db)
      .setStrokeStyle(4, 0xffffff)
      .setInteractive({ useHandCursor: true });

    this.zombieBtn = this.add.rectangle(560, 355, 200, 55, 0x27ae60)
      .setStrokeStyle(4, 0xffffff)
      .setInteractive({ useHandCursor: true });


    this.add.ellipse(240, 260, 80, 20, 0x000000, 0.3);
    this.add.ellipse(560, 260, 80, 20, 0x000000, 0.3);

    this.add.text(240, 355, "EQUIPER", {
      fontSize: "22px",
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5);

    this.add.text(560, 355, "EQUIPER", {
      fontSize: "22px",
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5);

    this.soldatBtn.on("pointerdown", () => {
      this.registry.set("selectedSkin", "soldat");
      this.sound.play("SonSkin");
      this.showMessage("Skin soldat equipé");
      this.updateSelectionVisual();
    });

    this.zombieBtn.on("pointerdown", () => {
      this.registry.set("selectedSkin", "zombie");
      this.sound.play("SonSkin");
      this.showMessage("Skin zombie equipé");
      this.updateSelectionVisual();
    });

    this.add.rectangle(400, 485, 650, 120, 0x16212b, 0.88).setStrokeStyle(4, 0xffffff);

    this.add.text(400, 425, "BONUS POUR LA PROCHAINE PARTIE", {
      fontSize: "24px",
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 4
    }).setOrigin(0.5);

    const x2CoinsBtn = this.add.rectangle(260, 490, 230, 70, 0xf1c40f)
      .setStrokeStyle(4, 0xffffff)
      .setInteractive({ useHandCursor: true });

    this.add.text(260, 490, "x2 PIECES\n15 SECONDES", {
      fontSize: "22px",
      color: "#000000",
      fontStyle: "bold",
      align: "center"
    }).setOrigin(0.5);

   x2CoinsBtn.on("pointerdown", () => {
  this.registry.set("coinMultiplierReady", true);

  const x2Sound = this.sound.add("SonPieceX2", { volume: 2 });
  x2Sound.play();

  this.time.delayedCall(2000, () => {
    if (x2Sound && x2Sound.isPlaying) {
      x2Sound.stop();
    }
  });

  this.showMessage("Bonus x2 pièces activé");
  this.updateBonusVisual();
});

    const extraLifeBtn = this.add.rectangle(540, 490, 230, 70, 0xe67e22)
      .setStrokeStyle(4, 0xffffff)
      .setInteractive({ useHandCursor: true });

    this.add.text(540, 490, "2 VIES", {
      fontSize: "24px",
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5);

    extraLifeBtn.on("pointerdown", () => {
      this.registry.set("extraLifeReady", true);
      this.sound.play("SonVies", { volume: 3 });
      this.showMessage("Bonus 2 vies activé");
      this.updateBonusVisual();
    });

    this.skinInfoText = this.add.text(400, 585, "", {
      fontSize: "18px",
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 4
    }).setOrigin(0.5);

    this.bonusInfoText = this.add.text(400, 615, "", {
      fontSize: "18px",
      color: "#ffeaa7",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 4
    }).setOrigin(0.5);

    const backButton = this.add.rectangle(730, 50, 120, 50, 0xe74c3c)
      .setStrokeStyle(4, 0xffffff)
      .setInteractive({ useHandCursor: true });

    this.add.text(730, 50, "RETOUR", {
      fontSize: "20px",
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5);

    backButton.on("pointerdown", () => {
      this.scene.start("choixPortes");
    });

    this.messageText = this.add.text(400, 655, "", {
      fontSize: "20px",
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 4
    }).setOrigin(0.5);

    this.updateSelectionVisual();
    this.updateBonusVisual();
  }

  updateSelectionVisual() {
  const skin = this.registry.get("selectedSkin");

  if (skin === "soldat") {
    this.soldatBtn.setFillStyle(0x2980b9);
    this.zombieBtn.setFillStyle(0x27ae60);
    this.skinInfoText.setText("Skin actuel : SOLDAT");
    this.previewSoldat.setScale(1.65);
    this.previewZombie.setScale(1.2);
  } else {
    this.soldatBtn.setFillStyle(0x3498db);
    this.zombieBtn.setFillStyle(0x1e8449);
    this.skinInfoText.setText("Skin actuel : ZOMBIE");
    this.previewSoldat.setScale(1.5);
    this.previewZombie.setScale(1.35);
  }
}

updateSelectionVisual() {
  const skin = this.registry.get("selectedSkin");

  if (skin === "soldat") {
    this.soldatBtn.setFillStyle(0x2980b9);
    this.zombieBtn.setFillStyle(0x27ae60);
    this.skinInfoText.setText("Skin actuel : SOLDAT");

    this.previewSoldat.setScale(1.75);
    this.previewZombie.setScale(1.4);

  } else {
    this.soldatBtn.setFillStyle(0x3498db);
    this.zombieBtn.setFillStyle(0x1e8449);
    this.skinInfoText.setText("Skin actuel : ZOMBIE");

    this.previewSoldat.setScale(1.6);
    this.previewZombie.setScale(1.55);
  }
}

  showMessage(message) {
    this.messageText.setText(message);

    if (this.messageTimer) {
      this.messageTimer.remove(false);
    }

    this.messageTimer = this.time.delayedCall(2500, () => {
      this.messageText.setText("");
    });
  }
}