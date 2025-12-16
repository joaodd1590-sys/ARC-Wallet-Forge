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
const qrcodeEl = $("qrcode");
const genExample = $("genExample");
const copyExample = $("copyExample");
const downloadAllBtn = $("downloadAllBtn");

/* === COPY ANIMATION (NORMAL) === */
function animateCopy(btn) {
    btn.classList.add("copy-animate");
    setTimeout(() => btn.classList.remove("copy-animate"), 350);
}

/* === COPY PRIVATE KEY (WARNING) === */
function animatePrivateKeyWarning(btn) {
    const originalText = btn.textContent;

    btn.textContent = "⚠ Cuidado: não compartilhe";
    btn.classList.add("copy-animate");
    btn.style.background = "#ef4444";
    btn.style.color = "#fff";

    setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = "";
        btn.style.color = "";
        btn.classList.remove("copy-animate");
    }, 1800);
}

/* === SHOW/HIDE MNEMONIC BOX === */
deriveMode.addEventListener("change", () => {
    mnemonicBox.style.display =
        deriveMode.value === "fromMnemonic" ? "block" : "none";
});

/* === CLEAR EVERYTHING === */
clearBtn.addEventListener("click", () => {
    resultArea.innerHTML = "";
    qrcodeEl.style.display = "none";
});

/* === GENERATE WALLETS === */
generateBtn.addEventListener("click", async () => {
    if (!window.ethers) return alert("Ethers.js not loaded.");

    const count = Math.min(1000, Math.max(1, Number(countInput.value)));
    resultArea.innerHTML = "";
    qrcodeEl.style.display = "none";

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

        // --- BUTTON ROW ---
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

        // QR
        qrBtn.addEventListener("click", () => {
            qrcodeEl.style.display = "flex";
            qrcodeEl.innerHTML = "";
            new QRCode(qrcodeEl, {
                text: address,
                width: 200,
                height: 200
            });
        });

        // Copy Address
        copyAddr.addEventListener("click", () => {
            navigator.clipboard.writeText(address);
            animateCopy(copyAddr);
        });

        // Copy Private Key (SECURE WARNING)
        copyPk.addEventListener("click", () => {
            navigator.clipboard.writeText(privateKey);
            animatePrivateKeyWarning(copyPk);
        });

        // Download TXT
        dlTxt.addEventListener("click", () => {
            const txt = `
Address: ${address}
Public Key: ${publicKey}
Private Key: ${privateKey}
Mnemonic: ${mnemonic}
`;
            download(txt, `wallet_${address}.txt`);
        });

        // Export JSON
        dlJson.addEventListener("click", async () => {
            const pwd = prompt("Password to encrypt:");
            if (!pwd) return;
            const json = await wallet.encrypt(pwd);
            download(json, `keystore_${address}.json`);
        });

        // Hide Private Key
        hidePk.addEventListener("click", () => {
            const span = $("pk_" + i);
            span.textContent = span.textContent.includes("•••")
                ? privateKey
                : "•••••••••••••••••••••••• (hidden)";
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

/* === QR EXAMPLE BUTTON === */
genExample.addEventListener("click", () => {
    const w = ethers.Wallet.createRandom();
    qrcodeEl.style.display = "flex";
    qrcodeEl.innerHTML = "";
    new QRCode(qrcodeEl, {
        text: w.address,
        width: 200,
        height: 200
    });
});

/* === COPY SAMPLE ADDRESS FROM QR === */
copyExample.addEventListener("click", () => {
    const img = qrcodeEl.querySelector("img");
    if (!img) return alert("Generate example QR first!");
    navigator.clipboard.writeText(img.src);
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
