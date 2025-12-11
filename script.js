function $(id) { return document.getElementById(id); }

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

qrcodeEl.style.display = "none";

// Toggle mnemonic field
deriveMode.addEventListener("change", () => {
    mnemonicBox.style.display =
        deriveMode.value === "fromMnemonic" ? "block" : "none";
});

// Clear screen
clearBtn.addEventListener("click", () => {
    resultArea.innerHTML = "";
    qrcodeEl.style.display = "none";
});

// Generate wallets
generateBtn.addEventListener("click", async () => {

    if (!window.ethers) {
        alert("ethers.js failed to load.");
        return;
    }

    const count = Math.min(1000, Math.max(1, Number(countInput.value)));
    resultArea.innerHTML = "";
    qrcodeEl.style.display = "none";

    let baseMnemonic = null;

    if (deriveMode.value === "fromMnemonic") {
        baseMnemonic = mnemonicInput.value.trim();
        if (!baseMnemonic) return alert("Please enter a mnemonic phrase.");
        if (!ethers.utils.isValidMnemonic(baseMnemonic)) {
            if (!confirm("Mnemonic appears invalid. Continue anyway?")) return;
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

        const card = document.createElement("div");
        card.className = "out";

        card.innerHTML = `
            <strong>Wallet ${i + 1}</strong><br>
            Address: ${address}<br>
            Mnemonic: ${mnemonic}<br><br>

            <strong>Public Key:</strong><br>${publicKey}<br><br>

            <strong>Private Key:</strong><br>
            <span id="pk_${i}">${privateKey}</span><br><br>

            <button class="ghost btn-qr">QR</button>
            <button class="ghost btn-copy">Copy Address</button>
            <button class="ghost btn-copy-pk">Copy Private Key</button>
            <button class="ghost btn-download">Download .txt</button>
            <button class="ghost btn-download-json">Export Keystore (JSON)</button>
            <button class="ghost btn-hidepk">Hide</button>
        `;

        resultArea.appendChild(card);

        // Show QR only when clicked
        card.querySelector(".btn-qr").addEventListener("click", () => {
            qrcodeEl.style.display = "flex";
            qrcodeEl.innerHTML = "";
            new QRCode(qrcodeEl, {
                text: address,
                width: 200,
                height: 200
            });
        });

        // Copy address
        card.querySelector(".btn-copy").addEventListener("click", () => {
            navigator.clipboard.writeText(address);
        });

        // Copy Private Key
        card.querySelector(".btn-copy-pk").addEventListener("click", () => {
            navigator.clipboard.writeText(privateKey);
        });

        // Download TXT
        card.querySelector(".btn-download").addEventListener("click", () => {
            const text = `
Address: ${address}
PublicKey: ${publicKey}
PrivateKey: ${privateKey}
Mnemonic: ${mnemonic}
`;
            downloadFile(text, `wallet_${address}.txt`);
        });

        // Keystore JSON
        card.querySelector(".btn-download-json").addEventListener("click", async () => {
            const pwd = prompt("Enter password for JSON encryption:");
            if (!pwd) return;

            try {
                const json = await wallet.encrypt(pwd);
                downloadFile(json, `keystore_${address}.json`);
            } catch (err) {
                alert("Error: " + err.message);
            }
        });

        // Hide / Show PK
        card.querySelector(".btn-hidepk").addEventListener("click", () => {
            const pkEl = $("pk_" + i);
            if (pkEl.textContent.includes("•••")) {
                pkEl.textContent = privateKey;
            } else {
                pkEl.textContent = "•••••••••••• (hidden)";
            }
        });
    }
});

// Download all wallets TXT
downloadAllBtn.addEventListener("click", () => {
    const items = Array.from(resultArea.children);
    if (!items.length) return alert("No wallets generated.");

    let txt = "";
    items.forEach((c) => (txt += c.textContent + "\n\n"));

    downloadFile(txt, "wallets_all.txt");
});

// File downloader
function downloadFile(content, filename) {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
}
