// Helper
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

// Hide QR initially
qrcodeEl.style.display = "none";

// Toggle mnemonic
deriveMode.addEventListener("change", () => {
    mnemonicBox.style.display =
        deriveMode.value === "fromMnemonic" ? "block" : "none";
});

// Clear data
clearBtn.addEventListener("click", () => {
    resultArea.innerHTML = "";
    qrcodeEl.style.display = "none";
});

// MAIN GENERATOR
generateBtn.addEventListener("click", async () => {
    if (!window.ethers) {
        alert("Ethers.js not loaded.");
        return;
    }

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

        const card = document.createElement("div");
        card.className = "out";

        card.innerHTML = `
Wallet ${i + 1}
Address: ${address}
Mnemonic: ${mnemonic}

Public Key:
${publicKey}

Private Key:
<span id="pk_${i}">${privateKey}</span>
`;

        // Buttons
        const qrBtn = document.createElement("button");
        qrBtn.textContent = "QR";
        qrBtn.className = "ghost";

        const copyAddress = document.createElement("button");
        copyAddress.textContent = "Copy Address";
        copyAddress.className = "ghost";

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

        // QR generator
        qrBtn.addEventListener("click", () => {
            qrcodeEl.style.display = "flex";
            qrcodeEl.innerHTML = "";
            new QRCode(qrcodeEl, {
                text: address,
                width: 180,
                height: 180,
            });
        });

        // Copy address
        copyAddress.addEventListener("click", () => {
            navigator.clipboard.writeText(address);
        });

        // Copy private key
        copyPk.addEventListener("click", () => {
            navigator.clipboard.writeText(privateKey);
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

        // Export Keystore JSON
        dlJson.addEventListener("click", async () => {
            const pwd = prompt("Password for JSON encryption:");
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
                span.textContent = "•••••••••••••••••• (hidden)";
            }
        });

        card.appendChild(qrBtn);
        card.appendChild(copyAddress);
        card.appendChild(copyPk);
        card.appendChild(dlTxt);
        card.appendChild(dlJson);
        card.appendChild(hidePk);

        resultArea.appendChild(card);
    }
});

// BUTTON: Example QR
genExample.addEventListener("click", () => {
    const w = ethers.Wallet.createRandom();
    qrcodeEl.style.display = "flex";
    qrcodeEl.innerHTML = "";
    new QRCode(qrcodeEl, {
        text: w.address,
        width: 180,
        height: 180
    });
});

// BUTTON: Copy Example Address
copyExample.addEventListener("click", () => {
    const img = qrcodeEl.querySelector("img");
    if (!img) return alert("Generate an example first!");

    navigator.clipboard.writeText(img.src);
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
