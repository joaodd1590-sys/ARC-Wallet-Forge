/* Helper */
function $(id){ return document.getElementById(id) }

/* Elements */
const generateBtn = $("generateBtn");
const clearBtn = $("clearBtn");
const resultArea = $("resultArea");
const countInput = $("count");
const deriveMode = $("deriveMode");
const mnemonicBox = $("mnemonicBox");
const mnemonicInput = $("mnemonicInput");
const derivationPathInput = $("derivationPath");
const qrcodeWrap = $("qrcodeWrap");
const qrcodeEl = $("qrcode");
const genExample = $("genExample");
const copyExample = $("copyExample");
const downloadAllBtn = $("downloadAllBtn");

/* small state */
let lastExampleAddress = null;

/* animation for copy */
function animateCopy(btn){
  if(!btn) return;
  btn.classList.add("copy-animate");
  setTimeout(()=>btn.classList.remove("copy-animate"),350);
}

/* toggle mnemonic box */
deriveMode.addEventListener("change", ()=>{
  mnemonicBox.style.display = deriveMode.value === "fromMnemonic" ? "block" : "none";
});

/* clear */
clearBtn.addEventListener("click", ()=>{
  resultArea.innerHTML = "";
  qrcodeWrap.setAttribute("aria-hidden","true");
  qrcodeEl.innerHTML = "";
  lastExampleAddress = null;
});

/* generate wallets */
generateBtn.addEventListener("click", async ()=>{
  if(!window.ethers) return alert("Ethers.js not loaded.");

  const count = Math.min(1000, Math.max(1, Number(countInput.value)));
  resultArea.innerHTML = "";
  qrcodeWrap.setAttribute("aria-hidden","true");
  qrcodeEl.innerHTML = "";
  lastExampleAddress = null;

  let baseMnemonic = null;
  if(deriveMode.value === "fromMnemonic"){
    baseMnemonic = mnemonicInput.value.trim();
    if(!baseMnemonic) return alert("Enter mnemonic.");
    if(!ethers.utils.isValidMnemonic(baseMnemonic)){
      if(!confirm("Invalid mnemonic. Continue anyway?")) return;
    }
  }

  for(let i=0;i<count;i++){
    let wallet;
    if(baseMnemonic){
      const path = derivationPathInput.value.replace("{index}",i);
      const node = ethers.utils.HDNode.fromMnemonic(baseMnemonic).derivePath(path);
      wallet = new ethers.Wallet(node.privateKey);
    } else {
      wallet = ethers.Wallet.createRandom();
    }

    const address = wallet.address;
    const publicKey = wallet._signingKey().publicKey;
    const privateKey = wallet.privateKey;
    const mnemonic = wallet.mnemonic?.phrase || baseMnemonic || "";

    /* create card */
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

    /* buttons */
    const qrBtn = document.createElement("button"); qrBtn.textContent = "QR"; qrBtn.className="ghost";
    const copyAddr = document.createElement("button"); copyAddr.textContent="Copy Address"; copyAddr.className="ghost";
    const copyPk = document.createElement("button"); copyPk.textContent="Copy Private Key"; copyPk.className="ghost";
    const dlTxt = document.createElement("button"); dlTxt.textContent="Download .txt"; dlTxt.className="ghost";
    const dlJson = document.createElement("button"); dlJson.textContent="Export Keystore (JSON)"; dlJson.className="ghost";
    const hidePk = document.createElement("button"); hidePk.textContent="Hide"; hidePk.className="ghost";

    const btnRow = document.createElement("div"); btnRow.className="btn-row";
    btnRow.appendChild(qrBtn); btnRow.appendChild(copyAddr); btnRow.appendChild(copyPk);
    btnRow.appendChild(dlTxt); btnRow.appendChild(dlJson); btnRow.appendChild(hidePk);
    box.appendChild(btnRow);

    /* logic */
    qrBtn.addEventListener("click", ()=>{
      // show QR for this address
      qrcodeEl.innerHTML = "";
      qrcodeWrap.setAttribute("aria-hidden","false");
      // center QR by recreating inside qrcodeEl
      new QRCode(qrcodeEl, { text: address, width:168, height:168, correctLevel: QRCode.CorrectLevel.H });
      // scroll on small screens to preview
      if(window.innerWidth <= 700){
        qrcodeWrap.scrollIntoView({behavior:"smooth", block:"center"});
      }
    });

    copyAddr.addEventListener("click", ()=>{
      navigator.clipboard.writeText(address);
      animateCopy(copyAddr);
    });

    copyPk.addEventListener("click", ()=>{
      navigator.clipboard.writeText(privateKey);
      animateCopy(copyPk);
    });

    dlTxt.addEventListener("click", ()=>{
      const txt = `Address: ${address}\nPublic Key: ${publicKey}\nPrivate Key: ${privateKey}\nMnemonic: ${mnemonic}\n`;
      download(txt, `wallet_${address}.txt`);
    });

    dlJson.addEventListener("click", async ()=>{
      const pwd = prompt("Password to encrypt keystore:");
      if(!pwd) return;
      const json = await wallet.encrypt(pwd);
      download(json, `keystore_${address}.json`);
    });

    hidePk.addEventListener("click", ()=>{
      const span = $("pk_" + i);
      if(!span) return;
      if(span.textContent.includes("•••")){
        span.textContent = privateKey;
      } else {
        span.textContent = "•••••••••••••••••• (hidden)";
      }
    });

    resultArea.appendChild(box);
  }
});

/* generate example (in preview) */
genExample.addEventListener("click", ()=>{
  if(!window.ethers) return alert("Ethers.js not loaded.");
  const w = ethers.Wallet.createRandom();
  lastExampleAddress = w.address;
  qrcodeEl.innerHTML = "";
  qrcodeWrap.setAttribute("aria-hidden","false");
  new QRCode(qrcodeEl, { text: lastExampleAddress, width:168, height:168, correctLevel: QRCode.CorrectLevel.H });
  if(window.innerWidth <=700) qrcodeWrap.scrollIntoView({behavior:"smooth", block:"center"});
});

/* copy sample */
copyExample.addEventListener("click", ()=>{
  if(!lastExampleAddress) return alert("Generate an example first!");
  navigator.clipboard.writeText(lastExampleAddress);
  animateCopy(copyExample);
});

/* download all */
downloadAllBtn.addEventListener("click", ()=>{
  const cards = Array.from(resultArea.children).filter(c=>c.classList.contains("out"));
  if(!cards.length) return alert("No wallets to download. Generate at least one.");

  let payload = "";
  cards.forEach((card, idx)=>{
    payload += `=== Wallet ${idx+1} ===\n`;
    payload += card.textContent.trim() + "\n\n";
  });

  download(payload, `arc-wallets-${new Date().toISOString().slice(0,19).replace(/[:T]/g,"-")}.txt`);
});

/* download helper */
function download(content, filename){
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}
