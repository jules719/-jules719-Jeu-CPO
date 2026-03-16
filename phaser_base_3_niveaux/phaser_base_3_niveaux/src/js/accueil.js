export default class accueil extends Phaser.Scene {
  constructor() {
    super("accueil");
  }

  preload() {
    this.load.image("sky", "src/assets/sky.png");
  }

  create() {
    if (this.registry.get("money") === undefined) {
      this.registry.set("money", 0);
    }

    this.add.image(400, 300, "sky").setDisplaySize(800, 600);

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