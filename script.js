/* script.js - versão corrigida */
function $(id) { return document.getElementById(id); }

// --- ELEMENTS ---
const generateBtn = $("generateBtn");
const clearBtn = $("clearBtn");
const resultArea = $("resultArea");
const countInput = $("count");
const deriveMode = $("deriveMode");
const mnemonicBox = $("mnemonicBox");
const mnemonicInput = $("mnemonicInput");
const derivationPathInput = $("derivationPath");
const qrcodeEl = $("qrcode");           // this is the visible QR container
const genExample = $("genExample");
const copyExample = $("copyExample");
const downloadAllBtn = $("downloadAllBtn");

/* store last example address so copy works reliably */
let lastExampleAddress = null;

/* === COPY ANIMATION (robust restart) === */
function animateCopy(btn) {
    if(!btn) return;
    btn.classList.remove("copy-animate");
    void btn.offsetWidth; // force reflow to restart animation
    btn.classList.add("copy-animate");
}

/* === SHOW/HIDE MNEMONIC BOX === */
deriveMode.addEventListener("change", () => {
    mnemonicBox.style.display =
        deriveMode.value === "fromMnemonic" ? "block" : "none";
});

/* === CLEAR EVERYTHING === */
clearBtn.addEventListener("click", () => {
    resultArea.innerHTML = "";
    if (qrcodeEl) { qrcodeEl.style.display = "none"; qrcodeEl.innerHTML = ""; }
    lastExampleAddress = null;
});

/* === GENERATE WALLETS === */
generateBtn.addEventListener("click", async () => {
    if (!window.ethers) return alert("Ethers.js not loaded.");

    const count = Math.min(1000, Math.max(1, Number(countInput.value)));
    resultArea.innerHTML = "";
    if (qrcodeEl) { qrcodeEl.style.display = "none"; qrcodeEl.innerHTML = ""; }

    let baseMnemonic = null;
    if (deriveMode.value === "fromMnemonic") {
        baseMnemonic = mnemonicInput.value.trim();
        if (!baseMnemonic) return alert("Enter mnemonic.");
        if (!ethers.utils.isValidMnemonic(baseMnemonic)) {
            if (!confirm("Invalid mnemonic. Continue anyway?")) return;
        }
    }

    for (let i = 0; i < count; i++) {
        let wallet;
        if (baseMnemonic) {
            const path = derivationPathInput.value.replace("{index}", i);
            const node = ethers.utils.HDNode.fromMnemonic(baseMnemonic).derivePath(path);
            wallet = new ethers.Wallet(node.privateKey);
        } else {
            wallet = ethers.Wallet.createRandom();
        }

        const address = wallet.address;
        const publicKey = wallet._signingKey().publicKey;
        const privateKey = wallet.privateKey;
        const mnemonic = wallet.mnemonic?.phrase || baseMnemonic || "";

        // --- WALLET CARD OUTPUT ---
        const box = document.createElement("div");
        box.className = "out";

        box.innerHTML = `
Wallet ${i + 1}
Address: ${address}

Mnemonic:
${mnemonic}

Public Key:
${publicKey}

Private Key:
<span id="pk_${i}">${privateKey}</span>
        `;

        // --- BUTTONS ---
        const qrBtn = document.createElement("button");
        qrBtn.textContent = "QR";
        qrBtn.className = "ghost";

        const copyAddr = document.createElement("button");
        copyAddr.textContent = "Copy Address";
        copyAddr.className = "ghost";

        const copyPk = document.createElement("button");
        copyPk.textContent = "Copy Private Key";
        copyPk.className = "ghost";

        const dlTxt = document.createElement("button");
        dlTxt.textContent = "Download .txt";
        dlTxt.className = "ghost";

        const dlJson = document.createElement("button");
        dlJson.textContent = "Export Keystore (JSON)";
        dlJson.className = "ghost";

        const hidePk = document.createElement("button");
        hidePk.textContent = "Hide";
        hidePk.className = "ghost";

        // --- BUTTON ROW WRAPPER ---
        const btnRow = document.createElement("div");
        btnRow.className = "btn-row";

        btnRow.appendChild(qrBtn);
        btnRow.appendChild(copyAddr);
        btnRow.appendChild(copyPk);
        btnRow.appendChild(dlTxt);
        btnRow.appendChild(dlJson);
        btnRow.appendChild(hidePk);

        box.appendChild(btnRow);

        // --- BUTTON LOGIC ---

        // Show QR
        qrBtn.addEventListener("click", () => {
            if (!qrcodeEl) return alert("QR container missing");
            qrcodeEl.style.display = "flex";   // show wrapper
            qrcodeEl.innerHTML = "";           // clear previous
            // create QR (library will inject an <img> or <canvas>)
            try {
                new QRCode(qrcodeEl, {
                    text: address,
                    width: 200,
                    height: 200
                });
            } catch (err) {
                console.error("QRCode error:", err);
            }
            // scroll into view on small screens
            if (window.innerWidth <= 700) qrcodeEl.scrollIntoView({ behavior: "smooth", block: "center" });
        });

        // Copy Address
        copyAddr.addEventListener("click", () => {
            navigator.clipboard.writeText(address).catch(()=>{});
            animateCopy(copyAddr);
        });

        // Copy Private Key
        copyPk.addEventListener("click", () => {
            navigator.clipboard.writeText(privateKey).catch(()=>{});
            animateCopy(copyPk);
        });

        // Download INDIVIDUAL TXT
        dlTxt.addEventListener("click", () => {
            const txt = `
Address: ${address}
Public Key: ${publicKey}
Private Key: ${privateKey}
Mnemonic: ${mnemonic}
`;
            download(txt, `wallet_${address}.txt`);
        });

        // Export JSON Keystore
        dlJson.addEventListener("click", async () => {
            const pwd = prompt("Password to encrypt:");
            if (!pwd) return;
            const json = await wallet.encrypt(pwd);
            download(json, `keystore_${address}.json`);
        });

        // Hide Private Key
        hidePk.addEventListener("click", () => {
            const span = $("pk_" + i);
            if (!span) return;
            if (span.textContent.includes("•••")) {
                span.textContent = privateKey;
            } else {
                span.textContent = "•••••••••••••••••••••••• (hidden)";
            }
        });

        resultArea.appendChild(box);
    }
});

/* === DOWNLOAD ALL WALLETS (.txt) === */
downloadAllBtn.addEventListener("click", () => {
    const cards = Array.from(resultArea.children).filter(c => c.classList.contains("out"));
    if (!cards.length) {
        alert("No wallets to download. Generate at least one.");
        return;
    }
    let payload = "";
    cards.forEach((card, idx) => {
        payload += `=== Wallet ${idx + 1} ===\n`;
        payload += card.textContent.trim() + "\n\n";
    });
    download(payload, `arc-wallets-${Date.now()}.txt`);
});

/* === QR EXAMPLE BUTTON (now stores lastExampleAddress) === */
genExample.addEventListener("click", () => {
    const w = ethers.Wallet.createRandom();
    lastExampleAddress = w.address;
    if (!qrcodeEl) return alert("QR container missing");
    qrcodeEl.style.display = "flex";
    qrcodeEl.innerHTML = "";
    try {
        new QRCode(qrcodeEl, { text: lastExampleAddress, width: 200, height: 200 });
    } catch (err) {
        console.error("QRCode error:", err);
    }
});

/* === COPY SAMPLE ADDRESS (uses lastExampleAddress) === */
copyExample.addEventListener("click", () => {
    if (!lastExampleAddress) return alert("Generate example first!");
    navigator.clipboard.writeText(lastExampleAddress).catch(()=>{});
    animateCopy(copyExample);
});

/* === SIMPLE DOWNLOAD FUNCTION === */
function download(content, filename) {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
