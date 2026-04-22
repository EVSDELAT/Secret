import React, { useState, useEffect, useRef } from 'react';
import { Lock, Unlock, Gift, Plus, Trash2, Key, Copy, Eye, EyeOff, Volume2, VolumeX, Shield, Zap, Hash, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Encryption Algorithms ---
async function deriveKey(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
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
  combined.set(salt, 0); combined.set(iv, 16); combined.set(new Uint8Array(encrypted), 28);
  return 'AES:' + btoa(String.fromCharCode(...combined));
}

async function aesDecrypt(encoded, password) {
  const combined = new Uint8Array(atob(encoded.replace('AES:', '')).split('').map(c => c.charCodeAt(0)));
  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const key = await deriveKey(password, salt);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, combined.slice(28));
  return new TextDecoder().decode(decrypted);
}

const b64Encrypt = (text) => 'B64:' + btoa(unescape(encodeURIComponent(text)));
const b64Decrypt = (encoded) => decodeURIComponent(escape(atob(encoded.replace('B64:', ''))));

const caesarCipher = (str, shift) => 'CSR:' + str.split('').map(c => String.fromCharCode(c.charCodeAt(0) + shift)).join('');
const caesarDecipher = (str, shift) => str.replace('CSR:', '').split('').map(c => String.fromCharCode(c.charCodeAt(0) - shift)).join('');

// --- App Component ---
export default function App() {
  const [activeTab, setActiveTab] = useState('creator');
  const [algo, setAlgo] = useState('AES');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [qaList, setQaList] = useState([{ id: Date.now(), q: '', a: '' }]);
  const [vaultCode, setVaultCode] = useState('');

  const [readerCode, setReaderCode] = useState('');
  const [readerPass, setReaderPass] = useState('');
  const [decryptedData, setDecryptedData] = useState(null);

  const [surprisePass, setSurprisePass] = useState('');
  const [isSurpriseOpen, setIsSurpriseOpen] = useState(false);
  const [surpriseClicks, setSurpriseClicks] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [versionClicks, setVersionClicks] = useState(0);
  const [footerText, setFooterText] = useState('Version 5.2.0');

  const surpriseText = `擔心說了這些會後悔 有些事不做或許未來更遺憾 然後我蠻想見妳的`; // 預設內容

  useEffect(() => {
    if (surprisePass === '0420') {
      setIsSurpriseOpen(true);
      setSurprisePass(''); // 重置以便再次輸入
    }
  }, [surprisePass]);

  const handleTabChange = (tab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
  };

  const addQa = () => { setQaList([...qaList, { id: Date.now(), q: '', a: '' }]); };
  const removeQa = (id) => { setQaList(qaList.filter(item => item.id !== id)); };
  const updateQa = (id, field, val) => {
    setQaList(qaList.map(item => item.id === id ? { ...item, [field]: val } : item));
  };

  const handleGenerate = async () => {
    if (algo !== 'B64' && !password) { return alert('此方法需要設定密碼'); }
    const data = JSON.stringify({ items: qaList, ts: Date.now() });
    try {
      let result = '';
      if (algo === 'AES') result = await aesEncrypt(data, password);
      else if (algo === 'B64') result = b64Encrypt(data);
      else if (algo === 'CSR') result = caesarCipher(data, 5);
      setVaultCode(result);
    } catch (e) { alert('加密失敗'); }
  };

  const handleUnlock = async () => {
    if (!readerCode) return alert('請貼上代碼');
    try {
      let decryptedText = '';
      if (readerCode.startsWith('AES:')) decryptedText = await aesDecrypt(readerCode, readerPass);
      else if (readerCode.startsWith('B64:')) decryptedText = b64Decrypt(readerCode);
      else if (readerCode.startsWith('CSR:')) decryptedText = caesarDecipher(readerCode, 5);
      setDecryptedData(JSON.parse(decryptedText));
    } catch (e) { alert('密碼錯誤或代碼格式不符'); }
  };

  return (
    <div className="app-container">
      <div className="bg-dynamic-glow" />

      {/* Surprise Popup Modal */}
      <AnimatePresence>
        {isSurpriseOpen && (
          <motion.div
            className="surprise-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSurpriseOpen(false)}
          >
            <motion.div
              className="surprise-modal-content"
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="close-modal" onClick={() => setIsSurpriseOpen(false)}>
                <X size={24} />
              </button>
              <Gift size={48} className="modal-icon" />
              <h3>✨ 驚喜揭曉 ✨</h3>
              <div className="surprise-text-area">
                {surpriseText}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="page-header">
        <div className="header-titles">
          <h2>炫炫's Secret</h2>
          <p className="subtitle-en">Pisces' love is in the details</p>
        </div>
      </header>

      <section className="main-card">
        <aside className="sidebar">
          <div className="brand-section">
            <h1 className="brand-title">PERSONAL</h1>
            <span className="brand-secret">SECRET</span>
          </div>
          <nav className="nav-list">
            {['creator', 'reader', 'surprise'].map((tab) => (
              <button
                key={tab}
                className={`mode-btn ${activeTab === tab ? 'active' : ''}`}
                onClick={() => handleTabChange(tab)}
              >
                {tab === 'creator' && <Lock size={16} />}
                {tab === 'reader' && <Unlock size={16} />}
                {tab === 'surprise' && <Gift size={16} />}
                <span>{tab === 'creator' ? '建立' : tab === 'reader' ? '開啟' : '驚喜'}</span>
              </button>
            ))}
          </nav>
          <div
            className="sidebar-footer"
            onClick={() => {
              const next = versionClicks + 1;
              setVersionClicks(next);
              if (next >= 3) {
                setFooterText('我也蠻喜歡你的');
                setVersionClicks(0);
                setTimeout(() => setFooterText('Version 5.2.0'), 3000);
              }
            }}
            style={{ cursor: 'pointer' }}
          >
            <p>{footerText}</p>
          </div>
        </aside>

        <main className="main-content">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} className="section-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {activeTab === 'creator' && (
                <div className="compact-layout">
                  <div className="algo-selector">
                    <label>加密協議 / ALGORITHM</label>
                    <div className="algo-grid">
                      <button className={algo === 'AES' ? 'selected' : ''} onClick={() => setAlgo('AES')}>AES-256 GCM</button>
                      <button className={algo === 'B64' ? 'selected' : ''} onClick={() => setAlgo('B64')}>Base64 Lite</button>
                      <button className={algo === 'CSR' ? 'selected' : ''} onClick={() => setAlgo('CSR')}>Caesar Classic</button>
                    </div>
                  </div>

                  {algo !== 'B64' && (
                    <div className="input-group">
                      <label>通解密碼 / MASTER PASS</label>
                      <div className="relative-container">
                        <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="glass-input small pr-icon" placeholder="輸入解密用的主密碼..." />
                        <button className="input-icon-btn" onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="qa-section">
                    <label>加密清單 / DATA LIST</label>
                    <div className="qa-scroll-area">
                      {qaList.map((item, idx) => (
                        <div key={item.id} className="qa-card-premium">
                          <div className="qa-line question">
                            <span className="qa-tag">Q</span>
                            <input placeholder="輸入問題內容..." value={item.q} onChange={(e) => updateQa(item.id, 'q', e.target.value)} />
                          </div>
                          <div className="qa-line answer">
                            <span className="qa-tag">A</span>
                            <input placeholder="秘密答案..." value={item.a} onChange={(e) => updateQa(item.id, 'a', e.target.value)} />
                            <button onClick={() => removeQa(item.id)} className="qa-delete-btn"><Trash2 size={14} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button className="dashed-btn" onClick={addQa}><Plus size={14} /> 新增問答項</button>
                  </div>

                  <button className="primary-btn small" onClick={handleGenerate}>封裝保險櫃 / SEAL VAULT</button>

                  {vaultCode && (
                    <div className="result-area-compact">
                      <label>生成的字串 / RESULT</label>
                      <div className="relative-container">
                        <textarea value={vaultCode} readOnly className="code-font" />
                        <button className="copy-overlay" onClick={() => { navigator.clipboard.writeText(vaultCode); alert('已複製'); }}>複製</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'reader' && (
                <div className="compact-layout">
                  <div className="input-group">
                    <label>保險櫃代碼 / VAULT STRING</label>
                    <textarea value={readerCode} onChange={(e) => setReaderCode(e.target.value)} className="glass-textarea small code-font" placeholder="貼上加密字串..." />
                  </div>
                  <div className="input-group">
                    <label>密鑰驗證 / AUTH</label>
                    <input type="password" value={readerPass} onChange={(e) => setReaderPass(e.target.value)} className="glass-input small" placeholder="輸入解鎖密語..." />
                  </div>
                  <button className="primary-btn small" onClick={handleUnlock}><Unlock size={16} /> 啟封 / DECODE</button>

                  {decryptedData && (
                    <div className="decrypted-scrollable">
                      {decryptedData.items.map((item, i) => (
                        <div key={i} className="reveal-compact-premium">
                          <div className="q-row"><span>Question</span> {item.q}</div>
                          <div className="a-row"><span>Answer</span> {item.a}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'surprise' && (
                <div className="surprise-view-centered">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 4 }}
                    onClick={() => {
                      const newClicks = surpriseClicks + 1;
                      setSurpriseClicks(newClicks);
                      if (newClicks >= 3) setShowHint(true);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <Gift size={64} className="gift-glow-icon" />
                  </motion.div>
                  <h3 className="surprise-title">Pisces Love Surprises&Gift</h3>
                  <div className="surprise-input-wrapper">
                    <input
                      type="password"
                      value={surprisePass}
                      onChange={(e) => setSurprisePass(e.target.value)}
                      placeholder="請輸入密碼"
                      className="surprise-fancy-input"
                    />
                  </div>
                  <p className={`surprise-hint ${showHint ? 'visible' : ''}`}>The First Day We Met</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </section>

      <footer className="footer">Powered By EVS-ZHAO TECH© 2026</footer>
    </div>
  );
}
