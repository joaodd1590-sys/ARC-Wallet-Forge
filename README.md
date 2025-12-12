<!-- README.md for ARC-Wallet-Forge -->

# ARC Wallet Forge

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Repo Size](https://img.shields.io/github/repo-size/joaodd1590-sys/ARC-Wallet-Forge)](https://github.com/joaodd1590-sys/ARC-Wallet-Forge)
[![Issues](https://img.shields.io/github/issues/joaodd1590-sys/ARC-Wallet-Forge)](https://github.com/joaodd1590-sys/ARC-Wallet-Forge/issues)

---

<p align="center">
  <img src="https://github.com/joaodd1590-sys/ARC-Wallet-Forge/blob/main/banner.png" alt="ARC Wallet Forge Banner" width="900"/>
</p>

---

## 🔐 ARC Offline Wallet Generator

**ARC Wallet Forge** is a lightweight, offline wallet generator for ARC/EVM-compatible chains.  
Everything runs locally in the browser — **no data is ever uploaded**. Ideal for secure seed generation, keystore export and quick QR previews.

---

## ✨ Features

- Generate wallets fully **offline** in the browser  
- Supports **BIP39 mnemonics** (12–24 words)  
- Derive multiple addresses using custom HD derivation paths (`m/44'/60'/0'/0/{index}`)  
- Export encrypted Keystore (JSON) protected by a password  
- Download wallets as `.txt` files (single/all)  
- QR code preview for addresses  
- Copy address / copy private key buttons for quick workflows  
- Responsive UI — mobile & desktop friendly

---

## 🧪 Demo / Preview

Open `index.html` in your browser (no server required):

```bash
git clone https://github.com/joaodd1590-sys/ARC-Wallet-Forge.git
cd ARC-Wallet-Forge
# open index.html in your browser (double click or serve it locally)
