import { Game } from "./game.js";
import { createEntity, drawBehaviour, animBehaviour, playableBehaviour, physicsBehaviour, enemyBehaviour, rayBehaviour, collectableBehaviour} from "./entities.js";

window.addEventListener("keydown", (ev) => {
    Game.keys[ev.key.toUpperCase()] = true;
});

window.addEventListener("keyup", (ev) => {
    Game.keys[ev.key.toUpperCase()] = false;
});

let lt = performance.now();

const levels = [
    {
        start: [0, 0],
        entities: [
            {x: -2, y: 0, width: 1, height: 1, image: "images/placeholder.png", behaviours: [physicsBehaviour, enemyBehaviour, rayBehaviour], attributes: [["solid", true], ["physics", true], ["pathfinding", true]]},
            {x: 5, y: 0, width: 1, height: 1, image: "images/apple.png", behaviours: [physicsBehaviour, collectableBehaviour], attributes: []},
        ],
    },
];

function loadLevel(lvl) {
    let level = levels[lvl];
    for (const e of level.entities) {
        createEntity(e.x * 64, e.y * 64, e.width * 64, e.height * 64, e.image, e.behaviours, e.attributes);
    };

    createEntity(level.start[0], level.start[1], 64, 64, "images/snake.png", [playableBehaviour], [["physics", true], ["solid", true], ["moveStyle", "constant"], ["friction", false], ["speed", 4]]);
};

loadLevel(0);

function absMod(x, y) {
    return ((x % y) + y) % y;
};

let bgs = [];

for (let i = 0; i < 4; i++) {
    let bg = new Image;
    bg.src = "images/background.png";
    bgs.push(bg);
};

function drawBackground() {
    let tw = bgs[0].naturalWidth;
    let th = bgs[0].naturalHeight;
    if (!tw) return;

    let left = (Game.cam_pos[0] - (Game.canvas.width / 2));
    let top = Game.cam_pos[1] - (Game.canvas.height / 2);
    let i0 = Math.floor(left / tw);
    let j0 = Math.floor(top / th);
    let cols = Math.ceil(Game.canvas.height / th) + 1;
    let rows = Math.ceil(Game.canvas.width / tw) + 1;
    
    for (let i = i0; i < i0 + cols; i++) {
        for (let j = j0; j < j0 + rows; j++) {
            let sx = i * tw - left;
            let sy = j * th - top;
            let img = bgs[absMod(i, 2) + 2 * absMod(j, 2)];
            Game.ctx.drawImage(img, sx, sy);
        };
    };
};

let cspawnTime = 6;
let espawnTime = 10;

const easingRate = 0.05; 
const cameraSmoothSpeed = 0.08;

function loop() {
    requestAnimationFrame(loop);

    Game.ctx.clearRect(0, 0, Game.canvas.width, Game.canvas.height);
    let ct = performance.now();
    let dt = ((ct - lt) / 1000) || 0.01;

    drawBackground();

    for (const obj of Game.objects) {
        if (obj.update) obj.update(dt);
    };

    let sn = Game.objects.find(a => a.player);

    const targetZoom = 1 / (1 + Game.score * 0.05); 
    
    Game.cam_zoom += (targetZoom - Game.cam_zoom) * easingRate;
    Game.cam_zoom = Math.max(0.1, Game.cam_zoom);

    if (sn) {
        Game.cam_pos[0] += (sn.x - Game.cam_pos[0]) * cameraSmoothSpeed;
        Game.cam_pos[1] += (sn.y - Game.cam_pos[1]) * cameraSmoothSpeed;
    };

    cspawnTime -= dt;
    if (cspawnTime <= 0) {
        cspawnTime = 6;
        createEntity(Game.cam_pos[0] + ((Math.random() - 0.5) * 5 * 64), Game.cam_pos[1] + ((Math.random() - 0.5) * 5 * 64), 64, 64, "images/apple.png", [collectableBehaviour], []);
    };

    espawnTime -= dt;
    if (espawnTime <= 0) {
        espawnTime = 10;
        createEntity(Game.cam_pos[0] + ((Math.random() - 0.5) * 5 * 64), Game.cam_pos[1] + ((Math.random() - 0.5) * 5 * 64), 64, 64, "images/placeholder.png", [physicsBehaviour, enemyBehaviour, rayBehaviour], [["solid", true], ["physics", true], ["pathfinding", true]])
    };

    lt = ct;
};


requestAnimationFrame(loop);