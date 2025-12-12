function $(id){ return document.getElementById(id); }

/* Elements */
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

let lastExampleAddress = null;

/* Animation */
function animateCopy(btn){
    if (!btn) return;
    btn.classList.remove("copy-animate");
    void btn.offsetWidth;
    btn.classList.add("copy-animate");
}

/* Toggle mnemonic */
deriveMode.addEventListener("change", ()=>{
    mnemonicBox.style.display = deriveMode.value === "fromMnemonic" ? "block" : "none";
});

/* Clear preview */
clearBtn.addEventListener("click", ()=>{
    resultArea.innerHTML = "";
    qrcodeEl.style.display = "none";
    qrcodeEl.innerHTML = "";
});

/* Generate wallets */
generateBtn.addEventListener("click", async ()=>{
    if (!window.ethers) return alert("Ethers.js not loaded.");

    const count = Math.max(1, Math.min(1000, Number(countInput.value)));
    resultArea.innerHTML = "";
    qrcodeEl.style.display = "none";
    qrcodeEl.innerHTML = "";

    let baseMnemonic = null;

    if (deriveMode.value === "fromMnemonic") {
        baseMnemonic = mnemonicInput.value.trim();
        if (!baseMnemonic) return alert("Enter mnemonic phrase.");
        if (!ethers.utils.isValidMnemonic(baseMnemonic))
            if (!confirm("Invalid mnemonic. Continue anyway?")) return;
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
Wallet ${i+1}
Address: ${address}

Mnemonic:
${mnemonic}

Public Key:
${publicKey}

Private Key:
<span id="pk_${i}">${privateKey}</span>
        `;

        const row = document.createElement("div");
        row.className = "btn-row";

        const btnQR = document.createElement("button");
        btnQR.textContent = "QR";
        btnQR.className = "ghost";

        btnQR.addEventListener("click", ()=>{
            qrcodeEl.innerHTML = "";
            qrcodeEl.style.display = "block";
            new QRCode(qrcodeEl, { text: address, width: 180, height: 180 });
        });

        const btnCopyAddr = document.createElement("button");
        btnCopyAddr.textContent = "Copy Address";
        btnCopyAddr.className = "ghost";

        btnCopyAddr.addEventListener("click", ()=>{
            navigator.clipboard.writeText(address);
            animateCopy(btnCopyAddr);
        });

        const btnCopyPK = document.createElement("button");
        btnCopyPK.textContent = "Copy Private Key";
        btnCopyPK.className = "ghost";

        btnCopyPK.addEventListener("click", ()=>{
            navigator.clipboard.writeText(privateKey);
            animateCopy(btnCopyPK);
        });

        const btnTxt = document.createElement("button");
        btnTxt.textContent = "Download .txt";
        btnTxt.className = "ghost";

        btnTxt.addEventListener("click", ()=>{
            const content = `Address: ${address}\nPublic Key: ${publicKey}\nPrivate Key: ${privateKey}\nMnemonic: ${mnemonic}\n`;
            downloadFile(content, `wallet_${address}.txt`);
        });

        const btnJson = document.createElement("button");
        btnJson.textContent = "Export Keystore (JSON)";
        btnJson.className = "ghost";

        btnJson.addEventListener("click", async ()=>{
            const pwd = prompt("Password:");
            if (!pwd) return;
            const json = await wallet.encrypt(pwd);
            downloadFile(json, `keystore_${address}.json`);
        });

        const btnHide = document.createElement("button");
        btnHide.textContent = "Hide";
        btnHide.className = "ghost";

        btnHide.addEventListener("click", ()=>{
            const span = $("pk_" + i);
            if (!span) return;
            span.textContent = span.textContent.includes("•••")
                ? privateKey
                : "••••••••••••••••••••••• (hidden)";
        });

        row.append(btnQR, btnCopyAddr, btnCopyPK, btnTxt, btnJson, btnHide);
        box.appendChild(row);

        resultArea.appendChild(box);
    }
});

/* Example QR */
genExample.addEventListener("click", ()=>{
    const w = ethers.Wallet.createRandom();
    lastExampleAddress = w.address;

    qrcodeEl.innerHTML = "";
    qrcodeEl.style.display = "block";

    new QRCode(qrcodeEl, { text: lastExampleAddress, width: 180, height: 180 });
});

/* Copy example */
copyExample.addEventListener("click", ()=>{
    if (!lastExampleAddress) return alert("Generate example first.");
    navigator.clipboard.writeText(lastExampleAddress);
    animateCopy(copyExample);
});

/* Download all */
downloadAllBtn.addEventListener("click", ()=>{
    const items = document.querySelectorAll(".out");
    if (!items.length) return alert("Generate wallets first.");

    let txt = "";
    items.forEach((box, i)=>{
        txt += `=== Wallet ${i+1} ===\n${box.textContent.trim()}\n\n`;
    });

    downloadFile(txt, "all_wallets.txt");
});

function downloadFile(content, name) {
    const blob = new Blob([content], {type:"text/plain"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
}
