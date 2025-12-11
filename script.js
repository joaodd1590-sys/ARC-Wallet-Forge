function $(id) { return document.getElementById(id); }

// Elements
const generateBtn = $("generateBtn");
const clearBtn = $("clearBtn");
const resultArea = $("resultArea");
const countInput = $("count");
const deriveMode = $("deriveMode");
const mnemonicBox = $("mnemonicBox");
const mnemonicInput = $("mnemonicInput");
const derivationPathInput = $("derivationPath");
const downloadAllBtn = $("downloadAllBtn");
const qrcodeEl = $("qrcode");
const genExample = $("genExample");
const copyExample = $("copyExample");

// Copy animation handler
function animateCopy(btn) {
    btn.classList.add("copy-animate");
    setTimeout(() => btn.classList.remove("copy-animate"), 350);
}

// Toggle mnemonic box
deriveMode.addEventListener("change", () => {
    mnemonicBox.style.display =
        deriveMode.value === "fromMnemonic" ? "block" : "none";
});

// Clear page
clearBtn.addEventListener("click", () => {
    resultArea.innerHTML = "";
    qrcodeEl.style.display = "none";
});

// MAIN WALLET GENERATION
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
            if (!confirm("Invalid mnemonic. Continue?")) return;
        }
    }

    for (let i = 0; i < count; i++) {

        let wallet;

        if (baseMnemonic) {
            const path = derivationPathInput.value.replace("{index}", i);
            const node = ethers.utils.HDNode.fromMnemonic(baseMnemonic)
                .derivePath(path);
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

        // Create buttons
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

        // Copy PK
        copyPk.addEventListener("click", () => {
            navigator.clipboard.writeText(privateKey);
            animateCopy(copyPk);
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
            const pwd = prompt("Password:");
            if (!pwd) return;
            const json = await wallet.encrypt(pwd);
            download(json, `keystore_${address}.json`);
        });

        // Hide PK
        hidePk.addEventListener("click", () => {
            const span = $("pk_" + i);
            if (span.textContent.includes("•••")) {
                span.textContent = privateKey;
            } else {
                span.textContent = "•••••••••••••••••••• (hidden)";
            }
        });

        // Append buttons
        box.appendChild(qrBtn);
        box.appendChild(copyAddr);
        box.appendChild(copyPk);
        box.appendChild(dlTxt);
        box.appendChild(dlJson);
        box.appendChild(hidePk);

        resultArea.appendChild(box);
    }
});

// Download helper
function download(content, filename) {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
}

// Example QR
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

// Copy Example QR
copyExample.addEventListener("click", () => {
    const img = qrcodeEl.querySelector("img");
    if (!img) return alert("Generate an example first!");
    navigator.clipboard.writeText(img.src);
    animateCopy(copyExample);
});
