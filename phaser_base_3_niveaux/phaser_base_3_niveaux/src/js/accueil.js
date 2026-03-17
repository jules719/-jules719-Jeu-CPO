export default class accueil extends Phaser.Scene {
  constructor() {
    super("accueil");
  }

  preload() {
    // Debug: catch any failures to load assets
    this.load.on('loaderror', (file) => {
      console.error('Asset load error:', file.key, file.src);
    });

    this.load.audio('SonIntro', 'src/assets/SonIntro.mp3');
  }

  create() {
    this.cameras.main.setBackgroundColor("#87ceeb");

    // Play sound after a user interaction (browser autoplay policies)
    const introSound = this.sound.add('SonIntro');

    if (this.registry.get("money") === undefined) {
      this.registry.set("money", 0);
    }

    if (this.registry.get("selectedSkin") === undefined) {
      this.registry.set("selectedSkin", "normal");
    }

    if (this.registry.get("coinMultiplierReady") === undefined) {
      this.registry.set("coinMultiplierReady", false);
    }

    if (this.registry.get("extraLifeReady") === undefined) {
      this.registry.set("extraLifeReady", false);
    }

    this.add.text(400, 140, "ZOMBIE TSUNAMI", {
      fontSize: "42px",
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 6
    }).setOrigin(0.5);

    this.add.text(400, 205, "Version de base", {
      fontSize: "22px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 4
    }).setOrigin(0.5);

    const playButton = this.add.rectangle(400, 360, 220, 80, 0x1abc9c)
      .setStrokeStyle(4, 0xffffff)
      .setInteractive({ useHandCursor: true });

    this.add.text(400, 360, "PLAY", {
      fontSize: "32px",
      color: "#000000",
      fontStyle: "bold"
    }).setOrigin(0.5);

    playButton.on("pointerover", () => {
      playButton.setFillStyle(0x16a085);
    });

    playButton.on("pointerout", () => {
      playButton.setFillStyle(0x1abc9c);
    });

    playButton.on("pointerdown", () => {
      introSound.play();
      this.scene.start("choixPortes");
    });

    this.add.text(400, 520, "Argent total : " + this.registry.get("money"), {
      fontSize: "24px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 4
    }).setOrigin(0.5);
  }
}