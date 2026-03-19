export default class choixPortes extends Phaser.Scene {
  constructor() {
    super("choixPortes");
  }

  preload() {
    this.load.image("door1", "src/assets/armurerie.png");
    this.load.image("door2", "src/assets/gameplay.png");
    this.load.image("bgPortes", "src/assets/fond porte.png");

    if (!this.cache.audio.exists("SonIntro")) {
      this.load.audio("SonIntro", "src/assets/SonIntro.mp3");
    }

    this.load.on("loaderror", (file) => {
      console.error("Erreur chargement asset :", file.key, file.src);
    });
  }

  create() {
    this.cameras.main.setBackgroundColor("#000000");

    const bg = this.add.image(400, 300, "bgPortes").setDepth(-1);
    bg.setDisplaySize(800, 600);

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

    this.add.text(400, 80, "CHOISIS UNE PORTE", {
      fontSize: "34px",
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 6
    }).setOrigin(0.5);

    this.add.text(400, 130, "Argent : " + this.registry.get("money"), {
      fontSize: "24px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 4
    }).setOrigin(0.5);

    const doorLeft = this.add.image(250, 330, "door1")
      .setDisplaySize(170, 250)
      .setInteractive({ useHandCursor: true });

    const doorRight = this.add.image(550, 330, "door2")
      .setDisplaySize(170, 250)
      .setInteractive({ useHandCursor: true });

    this.add.text(250, 490, "ARMURERIE", {
      fontSize: "24px",
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 4
    }).setOrigin(0.5);

    this.add.text(550, 490, "GAMEPLAY", {
      fontSize: "24px",
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 4
    }).setOrigin(0.5);

    const backButton = this.add.rectangle(100, 50, 120, 45, 0xe74c3c)
      .setStrokeStyle(3, 0xffffff)
      .setInteractive({ useHandCursor: true });

    this.add.text(100, 50, "MENU", {
      fontSize: "20px",
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5);

    doorLeft.on("pointerdown", () => {
      this.scene.start("armurerie");
    });

    doorRight.on("pointerdown", () => {
      this.scene.start("gameplay");
    });

    backButton.on("pointerdown", () => {
      this.scene.start("accueil");
    });
  }
}