export default class armurerie extends Phaser.Scene {
  constructor() {
    super("armurerie");
  }

  preload() {
    this.load.image("sky", "src/assets/sky.png");
    this.load.image("door3", "src/assets/door3.png");
  }

  create() {
    this.hasMultiplied = false;

    this.add.image(400, 300, "sky").setDisplaySize(800, 600);

    this.add.text(400, 80, "ARMURERIE", {
      fontSize: "38px",
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 6
    }).setOrigin(0.5);

    this.moneyText = this.add.text(400, 150, "Argent : " + this.registry.get("money"), {
      fontSize: "28px",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 4
    }).setOrigin(0.5);

    this.add.image(400, 290, "door3").setDisplaySize(180, 220);

    const x2Button = this.add.rectangle(400, 420, 260, 80, 0xf1c40f)
      .setStrokeStyle(4, 0xffffff)
      .setInteractive({ useHandCursor: true });

    this.x2Label = this.add.text(400, 420, "x2 ARGENT", {
      fontSize: "30px",
      color: "#000000",
      fontStyle: "bold"
    }).setOrigin(0.5);

    x2Button.on("pointerdown", () => {
      if (this.hasMultiplied) {
        return;
      }

      const currentMoney = this.registry.get("money");
      this.registry.set("money", currentMoney * 2);
      this.moneyText.setText("Argent : " + this.registry.get("money"));
      this.x2Label.setText("DEJA UTILISE");
      this.hasMultiplied = true;
      x2Button.disableInteractive();
      x2Button.setFillStyle(0x95a5a6);
    });

    const backButton = this.add.rectangle(400, 530, 220, 60, 0xe74c3c)
      .setStrokeStyle(4, 0xffffff)
      .setInteractive({ useHandCursor: true });

    this.add.text(400, 530, "RETOUR", {
      fontSize: "26px",
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5);

    backButton.on("pointerdown", () => {
      this.scene.start("choixPortes");
    });
  }
}