export default class armurerie extends Phaser.Scene {
  constructor() {
    super("armurerie");
  }

  preload() {
    this.load.image("bgArmurerie", "src/assets/fond armurerie.png");

    this.load.spritesheet("zombie", "src/assets/zombie.png", {
      frameWidth: 144,
      frameHeight: 80
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

    // ===== PRIX =====
    this.prixSkinSoldat = 20;
    this.prixX2Pieces = 15;
    this.prix2Vies = 25;

    // ===== FOND =====
    const bg = this.add.image(400, 300, "bgArmurerie").setDepth(-10);
    bg.setDisplaySize(800, 600);

    // ===== MUSIQUE =====
    this.menuMusic = this.sound.get("SonIntro") || this.sound.add("SonIntro", {
      loop: true,
      volume: 0.6
    });

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

    // ===== REGISTRY INIT =====
    if (this.registry.get("money") === undefined) {
      this.registry.set("money", 0);
    }

    if (this.registry.get("selectedSkin") === undefined) {
      this.registry.set("selectedSkin", "zombie");
    }

    if (this.registry.get("soldatSkinUnlocked") === undefined) {
      this.registry.set("soldatSkinUnlocked", false);
    }

    if (
      this.registry.get("selectedSkin") === "soldat" &&
      !this.registry.get("soldatSkinUnlocked")
    ) {
      this.registry.set("selectedSkin", "zombie");
    }

    if (this.registry.get("coinMultiplierReady") === undefined) {
      this.registry.set("coinMultiplierReady", false);
    }

    if (this.registry.get("extraLifeReady") === undefined) {
      this.registry.set("extraLifeReady", false);
    }

    // ===== TITRE =====
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

    // ===== CADRES =====
    this.add.rectangle(240, 270, 300, 290, 0x1f2d3a, 0.85).setStrokeStyle(4, 0xffffff);
    this.add.rectangle(560, 270, 300, 290, 0x1f2d3a, 0.85).setStrokeStyle(4, 0xffffff);

    this.add.text(240, 130, "SKIN ZOMBIE", {
      fontSize: "26px",
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 4
    }).setOrigin(0.5);

    this.add.text(560, 130, "SKIN SOLDAT", {
      fontSize: "26px",
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 4
    }).setOrigin(0.5);

    // ===== PREVIEWS =====
    this.previewZombie = this.add.sprite(240, 230, "zombie", 0);
    this.previewZombie.setOrigin(0.5, 0.7);
    this.previewZombie.setScale(1.7);
    this.previewZombie.setFrame(0);
    this.previewZombie.setFlipX(false);

    this.previewSoldat = this.add.sprite(560, 230, "soldatzombie", 0);
    this.previewSoldat.setOrigin(0.5, 0.7);
    this.previewSoldat.setScale(1.6);
    this.previewSoldat.setFrame(2);

    this.add.ellipse(240, 260, 80, 20, 0x000000, 0.3);
    this.add.ellipse(560, 260, 80, 20, 0x000000, 0.3);

    // ===== BOUTONS SKINS =====
    this.zombieBtn = this.add.rectangle(240, 355, 200, 55, 0x27ae60)
      .setStrokeStyle(4, 0xffffff)
      .setInteractive({ useHandCursor: true });

    this.soldatBtn = this.add.rectangle(560, 355, 200, 55, 0x3498db)
      .setStrokeStyle(4, 0xffffff)
      .setInteractive({ useHandCursor: true });

    this.add.text(240, 355, "EQUIPER", {
      fontSize: "22px",
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5);

    this.soldatBtnText = this.add.text(560, 355, "", {
      fontSize: "20px",
      color: "#ffffff",
      fontStyle: "bold",
      align: "center"
    }).setOrigin(0.5);

    // ===== ACTIONS SKINS =====
    this.zombieBtn.on("pointerdown", () => {
      this.registry.set("selectedSkin", "zombie");
      this.sound.play("SonSkin");
      this.showMessage("Skin zombie équipé");
      this.updateSelectionVisual();
    });

    this.soldatBtn.on("pointerdown", () => {
      const unlocked = this.registry.get("soldatSkinUnlocked");

      if (unlocked) {
        this.registry.set("selectedSkin", "soldat");
        this.sound.play("SonSkin");
        this.showMessage("Skin soldat équipé");
        this.updateSelectionVisual();
        return;
      }

      if (this.buyItem(this.prixSkinSoldat)) {
        this.registry.set("soldatSkinUnlocked", true);
        this.registry.set("selectedSkin", "soldat");
        this.sound.play("SonSkin");
        this.showMessage("Skin soldat acheté et équipé");
        this.updateSelectionVisual();
      } else {
        this.showMessage("Pas assez d'argent");
      }
    });

    // ===== BONUS =====
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

    this.add.text(260, 480, "x2 PIECES", {
      fontSize: "22px",
      color: "#000000",
      fontStyle: "bold",
      align: "center"
    }).setOrigin(0.5);

    this.add.text(260, 510, "15 sec - " + this.prixX2Pieces, {
      fontSize: "18px",
      color: "#000000",
      fontStyle: "bold",
      align: "center"
    }).setOrigin(0.5);

    x2CoinsBtn.on("pointerdown", () => {
      if (this.registry.get("coinMultiplierReady")) {
        this.showMessage("Bonus déjà acheté");
        return;
      }

      if (this.buyItem(this.prixX2Pieces)) {
        this.registry.set("coinMultiplierReady", true);

        const x2Sound = this.sound.add("SonPieceX2", { volume: 2 });
        x2Sound.play();

        this.time.delayedCall(2000, () => {
          if (x2Sound.isPlaying) {
            x2Sound.stop();
          }
        });

        this.showMessage("Bonus x2 pièces activé");
        this.updateBonusVisual();
      } else {
        this.showMessage("Pas assez d'argent");
      }
    });

    const extraLifeBtn = this.add.rectangle(540, 490, 230, 70, 0xe67e22)
      .setStrokeStyle(4, 0xffffff)
      .setInteractive({ useHandCursor: true });

    this.add.text(540, 480, "2 VIES", {
      fontSize: "24px",
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5);

    this.add.text(540, 510, this.prix2Vies + " pièces", {
      fontSize: "18px",
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5);

    extraLifeBtn.on("pointerdown", () => {
      if (this.registry.get("extraLifeReady")) {
        this.showMessage("Bonus déjà acheté");
        return;
      }

      if (this.buyItem(this.prix2Vies)) {
        this.registry.set("extraLifeReady", true);
        this.sound.play("SonVies", { volume: 3 });
        this.showMessage("Bonus 2 vies activé");
        this.updateBonusVisual();
      } else {
        this.showMessage("Pas assez d'argent");
      }
    });

    // ===== INFOS =====
    this.skinInfoText = this.add.text(400, 540, "", {
      fontSize: "18px",
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 4
    }).setOrigin(0.5);

    this.bonusInfoText = this.add.text(400, 560, "", {
      fontSize: "18px",
      color: "#fefdfb",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 4
    }).setOrigin(0.5);

    this.messageText = this.add.text(400, 585, "", {
      fontSize: "22px",
      color: "#ffdddd",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 5
    }).setOrigin(0.5).setDepth(200);

    // ===== BOUTON RETOUR =====
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

    this.updateMoneyText();
    this.updateSelectionVisual();
    this.updateBonusVisual();
  }

  buyItem(price) {
    let money = this.registry.get("money") || 0;

    if (money >= price) {
      money -= price;
      this.registry.set("money", money);
      this.updateMoneyText();
      return true;
    }

    return false;
  }

  updateMoneyText() {
    this.moneyText.setText("Argent : " + (this.registry.get("money") || 0));
  }

  updateSelectionVisual() {
    const skin = this.registry.get("selectedSkin");
    const soldatUnlocked = this.registry.get("soldatSkinUnlocked");

    if (skin === "zombie") {
      this.zombieBtn.setFillStyle(0x1e8449);
      this.soldatBtn.setFillStyle(0x3498db);
      this.skinInfoText.setText("Skin actuel : ZOMBIE");
      this.previewZombie.setScale(1.95);
      this.previewSoldat.setScale(1.5);
    } else {
      this.zombieBtn.setFillStyle(0x27ae60);
      this.soldatBtn.setFillStyle(0x2980b9);
      this.skinInfoText.setText("Skin actuel : SOLDAT");
      this.previewZombie.setScale(1.7);
      this.previewSoldat.setScale(1.8);
    }

    if (soldatUnlocked) {
      this.soldatBtnText.setText("EQUIPER");
    } else {
      this.soldatBtnText.setText("ACHETER\n" + this.prixSkinSoldat + " pièces");
    }
  }

  updateBonusVisual() {
    const coinReady = this.registry.get("coinMultiplierReady");
    const lifeReady = this.registry.get("extraLifeReady");

    let text = "Bonus actifs : ";

    if (!coinReady && !lifeReady) {
      text += "aucun";
    } else {
      const bonuses = [];
      if (coinReady) bonuses.push("x2 pièces");
      if (lifeReady) bonuses.push("2 vies");
      text += bonuses.join(" + ");
    }

    this.bonusInfoText.setText(text);
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