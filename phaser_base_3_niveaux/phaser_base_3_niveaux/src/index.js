import accueil from "./js/accueil.js";
import choixPortes from "./js/choixPortes.js";
import armurerie from "./js/armurerie.js";
import gameplay from "./js/gameplay.js";

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 600 },
      debug: false
    }
  },
  scene: [accueil, choixPortes, armurerie, gameplay]
};

new Phaser.Game(config);
