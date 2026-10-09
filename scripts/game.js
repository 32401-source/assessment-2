export const Game = {
    canvas: document.getElementById("canvas"),
    ctx: document.getElementById("canvas").getContext("2d"),
    keys: {},
    objects: [],
    cam_pos: [0, 0],
    friction: 0.9,
    score: 0,
    lives: 3,
};