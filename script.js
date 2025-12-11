/* =====================================================
   ARC Offline Wallet Generator
   Author: (you)
   Description:
   - Generates ARC wallets fully offline
   - Supports mnemonic derivation
   - Supports custom derivation paths
   - Exports encrypted keystore JSON (ethers v5)
   ===================================================== */

function $(id) { return document.getElementById(id); }

// UI elements
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

// Toggle mnemonic options
deriveMode.addEventListener("change", () => {
    mnemonicBox.style.display =
        deriveMode.value === "fromMnemonic" ? "block" : "none";
});

// Clear UI
clearBtn.addEventListener("click", () => {
    resultArea.innerHTML = "";
    qrcodeEl.innerHTML = "QR";
});

// Main generator
generateBtn.addEventListener("click", async () => {

    if (typeof ethers === "undefined") {
        alert("ethers.js not loaded.");
        return;
    }

    const count = Math.max(1, Math.min(1000, Number(countInput.value) || 1));
    resultArea.innerHTML = "";
    qrcodeEl.innerHTML = "QR";

    let mnemonicBase = null;

    // Derivation mode using seed phrase
    if (deriveMode.value === "fromMnemonic") {
        mnemonicBase = mnemonicInput.value.trim();

        if (!mnemonicBase) {
            alert("Please enter a mnemonic phrase.");
            return;
        }

        if (!ethers.utils.isValidMnemonic(mnemonicBase)) {
            if (!confirm("Mnemonic seems invalid. Continue anyway?")) return;
        }
    }

    // Generate N wallets
    for (let i = 0; i < count; i++) {

        let wallet;

        if (mnemonicBase) {
            const path = derivationPathInput.value.replace("{index}", i);
            const node = ethers.utils.HDNode.fromMnemonic(mnemonicBase).derivePath(path);
            wallet = new ethers.Wallet(node.privateKey);
        } else {
            wallet = ethers.Wallet.createRandom();
        }

        const address = wallet.address;
        const publicKey = wallet._signingKey().publicKey;
        const privateKey = wallet.privateKey;
        const mnemonic = wallet.mnemonic?.phrase || mnemonicBase || "";

        // Build wallet card
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

        // --- ACTION HANDLERS ---

        // QR code preview
        card.querySelector(".btn-qr").addEventListener("click", () => {
            qrcodeEl.innerHTML = "";
            new QRCode(qrcodeEl, { text: address, width: 200, height: 200 });
        });

        // Copy address
        card.querySelector(".btn-copy").addEventListener("click", () => {
            navigator.clipboard.writeText(address);
        });

        // Copy Private Key
        card.querySelector(".btn-copy-pk").addEventListener("click", () => {
            navigator.clipboard.writeText(privateKey);
        });

        // Download .txt export
        card.querySelector(".btn-download").addEventListener("click", () => {
            const text = `
Address: ${address}
PublicKey: ${publicKey}
PrivateKey: ${privateKey}
Mnemonic: ${mnemonic}
`;
            downloadFile(text, `wallet_${address}.txt`);
        });

        // Export keystore JSON
        card.querySelector(".btn-download-json").addEventListener("click", async () => {
            const password = prompt("Enter a password for JSON encryption:");
            if (!password) return;

            try {
                const json = await wallet.encrypt(password);
                downloadFile(json, `keystore_${address}.json`);
            } catch (err) {
                alert("Error: " + err.message);
            }
        });

        // Hide private key visually
        card.querySelector(".btn-hidepk").addEventListener("click", () => {
            const pkEl = $("pk_" + i);
            if (pkEl.textContent.includes("•")) {
                pkEl.textContent = privateKey;
            } else {
                pkEl.textContent = "•••••••••••• (hidden)";
            }
        });
    }
});

// Download all wallets in .txt
downloadAllBtn.addEventListener("click", () => {
    const items = Array.from(resultArea.children);

    if (items.length === 0) return alert("No wallets generated.");

    let txt = "";
    items.forEach((c, i) => {
        txt += c.textContent + "\n\n";
    });

    downloadFile(txt, "wallets_all.txt");
});

// Utility: download file
function downloadFile(text, filename) {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
