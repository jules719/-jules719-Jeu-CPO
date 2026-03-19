export default class accueil extends Phaser.Scene {
  constructor() {
    super("accueil");
  }

  preload() {
    // Debug: catch any failures to load assets
    this.load.on("loaderror", (file) => {
      console.error("Asset load error:", file.key, file.src);
    });

    this.load.image("bgMenu", "src/assets/fond ecran.png");
    this.load.audio("SonIntro", "src/assets/SonIntro.mp3");
  }

  create() {
    const bg = this.add.image(400, 300, "bgMenu").setDepth(-1);
    bg.setScale(0.85); // dézoom

    this.cameras.main.setBackgroundColor("#87ceeb");

    // Use a single music instance across menu scenes (avoid double-play)
    this.menuMusic = this.sound.get("SonIntro") || this.sound.add("SonIntro", { loop: true });

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

    this.add.text(400, 80, "Apocalypse Run", {
      fontSize: "42px",
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 6
    }).setOrigin(0.5);

    const playButton = this.add.rectangle(400, 220, 220, 80, 0xffffff)
      .setStrokeStyle(4, 0x000000)
      .setInteractive({ useHandCursor: true });

    this.add.text(400, 220, "PLAY", {
      fontSize: "32px",
      color: "#000000",
      fontStyle: "bold"
    }).setOrigin(0.5);

    playButton.on("pointerover", () => {
      playButton.setFillStyle(0xf0f0f0);
    });

    playButton.on("pointerout", () => {
      playButton.setFillStyle(0xffffff);
    });

    playButton.on("pointerdown", () => {
      if (this.menuMusic && !this.menuMusic.isPlaying) {
        this.menuMusic.play();
      }
      this.scene.start("choixPortes");
    });
  }
}