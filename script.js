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

/* === CLICK ANIMATION (GENERIC) === */
function animateClick(btn) {
    btn.classList.add("copy-animate");
    setTimeout(() => btn.classList.remove("copy-animate"), 300);
}

/* === COPY FEEDBACK (NO LAYOUT BREAK) === */
function showCopied(btn) {
    const original = btn.textContent;
    btn.textContent = "Copied";
    animateClick(btn);

    setTimeout(() => {
        btn.textContent = original;
    }, 1200);
}

/* === SECURITY TOAST (PRIVATE KEY) === */
function showSecurityToast(message) {
    let toast = document.querySelector(".security-toast");

    if (!toast) {
        toast = document.createElement("div");
        toast.className = "security-toast";
        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2200);
}

/* === SHOW/HIDE MNEMONIC BOX === */
deriveMode.addEventListener("change", () => {
    mnemonicBox.style.display =
        deriveMode.value === "fromMnemonic" ? "block" : "none";
});

/* === CLEAR EVERYTHING === */
clearBtn.addEventListener("click", () => {
    animateClick(clearBtn);
    resultArea.innerHTML = "";
    qrcodeEl.style.display = "none";
});

/* === GENERATE WALLETS === */
generateBtn.addEventListener("click", async () => {
    animateClick(generateBtn);
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

        const btnRow = document.createElement("div");
        btnRow.className = "btn-row";

        btnRow.append(qrBtn, copyAddr, copyPk, dlTxt, dlJson, hidePk);
        box.appendChild(btnRow);

        // --- BUTTON LOGIC ---

        qrBtn.onclick = () => {
            animateClick(qrBtn);
            qrcodeEl.style.display = "flex";
            qrcodeEl.innerHTML = "";
            new QRCode(qrcodeEl, { text: address, width: 200, height: 200 });
        };

        copyAddr.onclick = () => {
            navigator.clipboard.writeText(address);
            showCopied(copyAddr);
        };

        copyPk.onclick = () => {
            navigator.clipboard.writeText(privateKey);
            animateClick(copyPk);
            showSecurityToast("⚠ Warning: never share this private key");
        };

        dlTxt.onclick = () => {
            animateClick(dlTxt);
            const txt = `
Address: ${address}
Public Key: ${publicKey}
Private Key: ${privateKey}
Mnemonic: ${mnemonic}
`;
            download(txt, `wallet_${address}.txt`);
        };

        dlJson.onclick = async () => {
            animateClick(dlJson);
            const pwd = prompt("Password to encrypt:");
            if (!pwd) return;
            const json = await wallet.encrypt(pwd);
            download(json, `keystore_${address}.json`);
        };

        hidePk.onclick = () => {
            animateClick(hidePk);
            const span = $("pk_" + i);
            span.textContent = span.textContent.includes("•••")
                ? privateKey
                : "•••••••••••••••••••••••• (hidden)";
        };

        resultArea.appendChild(box);
    }
});

/* === DOWNLOAD ALL WALLETS === */
downloadAllBtn.addEventListener("click", () => {
    animateClick(downloadAllBtn);

    const cards = [...resultArea.children].filter(c => c.classList.contains("out"));
    if (!cards.length) return alert("No wallets to download.");

    let payload = "";
    cards.forEach((card, i) => {
        payload += `=== Wallet ${i + 1} ===\n${card.textContent.trim()}\n\n`;
    });

    download(payload, `arc-wallets-${Date.now()}.txt`);
});

/* === GENERATE QR EXAMPLE === */
genExample.onclick = () => {
    animateClick(genExample);
    const w = ethers.Wallet.createRandom();
    qrcodeEl.style.display = "flex";
    qrcodeEl.innerHTML = "";
    new QRCode(qrcodeEl, { text: w.address, width: 200, height: 200 });
};

/* === COPY SAMPLE ADDRESS === */
copyExample.onclick = () => {
    const img = qrcodeEl.querySelector("img");
    if (!img) return alert("Generate example QR first!");
    navigator.clipboard.writeText(img.src);
    showCopied(copyExample);
};

/* === DOWNLOAD HELPER === */
function download(content, filename) {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
