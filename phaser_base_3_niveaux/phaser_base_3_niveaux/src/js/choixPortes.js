export default class choixPortes extends Phaser.Scene {
  constructor() {
    super("choixPortes");
  }

  preload() {
    this.load.image("sky", "src/assets/sky.png");
    this.load.image("door1", "src/assets/door1.png");
    this.load.image("door2", "src/assets/door2.png");
  }

  create() {
    this.add.image(400, 300, "sky").setDisplaySize(800, 600);

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

    doorLeft.on("pointerdown", () => {
      this.scene.start("armurerie");
    });

    doorRight.on("pointerdown", () => {
      this.scene.start("gameplay");
    });

    const backButton = this.add.rectangle(100, 50, 120, 45, 0xe74c3c)
      .setStrokeStyle(3, 0xffffff)
      .setInteractive({ useHandCursor: true });

    this.add.text(100, 50, "MENU", {
      fontSize: "20px",
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5);

    backButton.on("pointerdown", () => {
      this.scene.start("accueil");
    });
  }
}