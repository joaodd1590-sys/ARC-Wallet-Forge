const canvas = document.getElementById("bg-canvas");
const ctx = canvas.getContext("2d");

let w, h;
function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

// caracteres estilo hacker
const chars = "01<>/{}[]$#@*&%";
const fontSize = 14;
const columns = () => Math.floor(w / fontSize);

let drops = [];

function initDrops() {
    drops = [];
    for (let i = 0; i < columns(); i++) {
        drops[i] = Math.random() * h;
    }
}
initDrops();

function draw() {
    // fade suave
    ctx.fillStyle = "rgba(120, 180, 255, 0.20)";
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = "rgba(120, 180, 255, 0.35)";
    ctx.font = `${fontSize}px monospace`;

    for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, i * fontSize, drops[i]);

        drops[i] += fontSize * 0.3;

        if (drops[i] > h && Math.random() > 0.97) {
            drops[i] = 0;
        }
    }

    requestAnimationFrame(draw);
}

draw();
