export default class armurerie extends Phaser.Scene {
  constructor() {
    super("armurerie");
  }

  preload() {
    this.load.image("door3", "src/assets/door3.png");
    if (!this.cache.audio.exists('SonIntro')) {
      this.load.audio('SonIntro', 'src/assets/SonIntro.mp3');
    }
  }

  create() {
    this.cameras.main.setBackgroundColor("#87ceeb");

    // Keep the menu music continuous across menu scenes
    this.menuMusic = this.sound.get('SonIntro') || this.sound.add('SonIntro', { loop: true });

    const playMenuMusic = () => {
      if (!this.menuMusic.isPlaying) {
        this.menuMusic.play();
      }
    };

    if (this.sound.context.state === 'running') {
      playMenuMusic();
    } else {
      this.input.once('pointerdown', () => {
        this.sound.context.resume().then(playMenuMusic);
      });
    }

    this.add.text(400, 60, "ARMURERIE", {
      fontSize: "38px",
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 6
    }).setOrigin(0.5);

    this.moneyText = this.add.text(400, 110, "Argent : " + this.registry.get("money"), {
      fontSize: "26px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 4
    }).setOrigin(0.5);

    this.add.image(400, 230, "door3").setDisplaySize(140, 180);

    this.add.text(400, 200, "CHOIX DU SKIN", {
      fontSize: "24px",
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 4
    }).setOrigin(0.5);

    const skinNormalBtn = this.add.rectangle(240, 290, 180, 60, 0x3498db)
      .setStrokeStyle(4, 0xffffff)
      .setInteractive({ useHandCursor: true });

    this.add.text(240, 290, "SKIN NORMAL", {
      fontSize: "22px",
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5);

    skinNormalBtn.on("pointerdown", () => {
      this.registry.set("selectedSkin", "normal");
      this.showMessage("Skin normal equipe");
    });

    const skinZombieBtn = this.add.rectangle(560, 290, 180, 60, 0x27ae60)
      .setStrokeStyle(4, 0xffffff)
      .setInteractive({ useHandCursor: true });

    this.add.text(560, 290, "SKIN ZOMBIE", {
      fontSize: "22px",
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5);

    skinZombieBtn.on("pointerdown", () => {
      this.registry.set("selectedSkin", "zombie");
      this.showMessage("Skin zombie equipe");
    });

    this.add.text(400, 370, "BONUS", {
      fontSize: "24px",
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 4
    }).setOrigin(0.5);

    const x2CoinsBtn = this.add.rectangle(240, 445, 230, 70, 0xf1c40f)
      .setStrokeStyle(4, 0xffffff)
      .setInteractive({ useHandCursor: true });

    this.add.text(240, 445, "x2 PIECES\n15 SECONDES", {
      fontSize: "22px",
      color: "#000000",
      fontStyle: "bold",
      align: "center"
    }).setOrigin(0.5);

    x2CoinsBtn.on("pointerdown", () => {
      this.registry.set("coinMultiplierReady", true);
      this.showMessage("Bonus x2 pieces active pour la prochaine partie");
    });

    const extraLifeBtn = this.add.rectangle(560, 445, 230, 70, 0xe67e22)
      .setStrokeStyle(4, 0xffffff)
      .setInteractive({ useHandCursor: true });

    this.add.text(560, 445, "2 VIES", {
      fontSize: "24px",
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5);

    extraLifeBtn.on("pointerdown", () => {
      this.registry.set("extraLifeReady", true);
      this.showMessage("Bonus 2 vies active pour la prochaine partie");
    });

    const backButton = this.add.rectangle(400, 545, 220, 55, 0xe74c3c)
      .setStrokeStyle(4, 0xffffff)
      .setInteractive({ useHandCursor: true });

    this.add.text(400, 545, "RETOUR", {
      fontSize: "24px",
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5);

    backButton.on("pointerdown", () => {
      this.scene.start("choixPortes");
    });

    this.messageText = this.add.text(400, 500, "", {
      fontSize: "20px",
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 4
    }).setOrigin(0.5);
  }

  showMessage(message) {
    this.messageText.setText(message);
  }
}
