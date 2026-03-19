import accueil from "./js/accueil.js";
import choixPortes from "./js/choixPortes.js";
import armurerie from "./js/armurerie.js";
import gameplay from "./js/gameplay.js";
import gameplay2 from "./js/gameplay2.js";
import gameplay3 from "./js/gameplay3.js";

const config = {
  type: Phaser.AUTO,
  parent: "game-container",
  width: 800,
  height: 600,
  pixelArt: true,
  backgroundColor: "#000000",
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
  scene: [accueil, choixPortes, armurerie, gameplay, gameplay2, gameplay3]
};

new Phaser.Game(config);