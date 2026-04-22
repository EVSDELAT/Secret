/**
 * VAULT - Q&A Message Suite
 */

const UI = {
    // Modes
    modeCreator: document.getElementById('modeCreator'),
    modeReader: document.getElementById('modeReader'),
    creatorView: document.getElementById('creatorView'),
    readerView: document.getElementById('readerView'),

    // Creator UI
    methodSelect: document.getElementById('methodSelect'),
    masterPassword: document.getElementById('masterPassword'),
    qaList: document.getElementById('qaList'),
    addQaBtn: document.getElementById('addQaBtn'),
    generateBtn: document.getElementById('generateBtn'),
    resultBlock: document.getElementById('resultBlock'),
    vaultCodeOutput: document.getElementById('vaultCodeOutput'),

    // Reader UI
    vaultCodeInput: document.getElementById('vaultCodeInput'),
    readerPassword: document.getElementById('readerPassword'),
    unlockBtn: document.getElementById('unlockBtn'),
    decryptedList: document.getElementById('decryptedList'),

    // Global
    copyBtn: document.getElementById('copyBtn'),
    toast: document.getElementById('toast')
};

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    addQaItem(); // Start with one empty item
    setupEventListeners();
});

function setupEventListeners() {
    UI.modeCreator.addEventListener('click', () => switchView('creator'));
    UI.modeReader.addEventListener('click', () => switchView('reader'));
    UI.addQaBtn.addEventListener('click', () => addQaItem());
    UI.generateBtn.addEventListener('click', handleGenerate);
    UI.unlockBtn.addEventListener('click', handleUnlock);
    UI.copyBtn.addEventListener('click', copyVaultCode);
}

function switchView(view) {
    UI.creatorView.classList.toggle('hidden', view !== 'creator');
    UI.readerView.classList.toggle('hidden', view !== 'reader');
    UI.modeCreator.classList.toggle('active', view === 'creator');
    UI.modeReader.classList.toggle('active', view === 'reader');
}

// --- Creator Logic ---

function addQaItem() {
    const div = document.createElement('div');
    div.className = 'qa-item';
    div.innerHTML = `
        <input type="text" class="qa-q" placeholder="問題 (例如：我的生日是？)">
        <input type="text" class="qa-a" placeholder="答案 (例如：0512)">
        <button class="remove-qa">×</button>
    `;
    div.querySelector('.remove-qa').addEventListener('click', () => {
        div.remove();
        if (UI.qaList.children.length === 0) addQaItem();
    });
    UI.qaList.appendChild(div);
}

async function handleGenerate() {
    const items = [];
    document.querySelectorAll('.qa-item').forEach(item => {
        const q = item.querySelector('.qa-q').value.trim();
        const a = item.querySelector('.qa-a').value.trim();
        if (q && a) items.push({ q, a });
    });

    if (items.length === 0) return showToast('請至少輸入一個問答', 'error');
    
    const password = UI.masterPassword.value;
    const method = UI.methodSelect.value;
    if (!password) return showToast('請設定通行密鑰', 'error');

    try {
        const jsonString = JSON.stringify({ version: '1.0', method, items });
        const encrypted = await encrypt(jsonString, password, method);
        
        UI.vaultCodeOutput.value = encrypted;
        UI.resultBlock.classList.remove('hidden');
        showToast('保險箱已生成！');
    } catch (err) {
        showToast('生成失敗', 'error');
    }
}

function copyVaultCode() {
    UI.vaultCodeOutput.select();
    document.execCommand('copy');
    showToast('已複製保險箱代碼');
}

// --- Reader Logic ---

async function handleUnlock() {
    const code = UI.vaultCodeInput.value.trim();
    const password = UI.readerPassword.value;

    if (!code || !password) return showToast('請輸入代碼與密碼', 'error');

    try {
        // We don't know the method yet, try AES-GCM first (standard) or simple Base64
        // In a real app we'd prefix the code with the method. Let's assume AES for now or try both.
        let decryptedString = '';
        try {
            decryptedString = await decrypt(code, password, 'aes');
        } catch {
            decryptedString = await decrypt(code, password, 'base64');
        }

        const data = JSON.parse(decryptedString);
        renderDecryptedList(data.items);
        showToast('解鎖成功！');
    } catch (err) {
        showToast('解鎖失敗，請檢查代碼或密碼', 'error');
    }
}

function renderDecryptedList(items) {
    UI.decryptedList.innerHTML = '';
    items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'display-item';
        div.innerHTML = `
            <div class="display-q">Q: ${item.q}</div>
            <div class="display-a">A: ${item.a}</div>
        `;
        UI.decryptedList.appendChild(div);
    });
    UI.decryptedList.classList.remove('hidden');
}

function showToast(msg, type = 'success') {
    UI.toast.textContent = msg;
    UI.toast.style.background = type === 'success' ? 'var(--success)' : '#ef4444';
    UI.toast.classList.add('show');
    setTimeout(() => UI.toast.classList.remove('show'), 3000);
}

// --- Crypto Engine ---

async function encrypt(text, password, method) {
    if (method === 'aes') return await aesEncrypt(text, password);
    return btoa(unescape(encodeURIComponent(text)));
}

async function decrypt(text, password, method) {
    if (method === 'aes') return await aesDecrypt(text, password);
    return decodeURIComponent(escape(atob(text)));
}

async function deriveKey(password, salt) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']
    );
    return await crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

async function aesEncrypt(text, password) {
    const enc = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(password, salt);
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(text));
    const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
    combined.set(salt, 0);
    combined.set(iv, 16);
    combined.set(new Uint8Array(encrypted), 28);
    return btoa(String.fromCharCode(...combined));
}

async function aesDecrypt(encoded, password) {
    const combined = new Uint8Array(atob(encoded).split('').map(c => c.charCodeAt(0)));
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const key = await deriveKey(password, salt);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, combined.slice(28));
    return new TextDecoder().decode(decrypted);
}
