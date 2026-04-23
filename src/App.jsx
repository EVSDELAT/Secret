import React, { useState, useEffect, useRef } from 'react';
import { Lock, Unlock, Gift, Plus, Trash2, Key, Copy, Eye, EyeOff, Volume2, VolumeX, Shield, Zap, Hash, X, Sparkles } from 'lucide-react';
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
  const [modalClicks, setModalClicks] = useState(0);
  const [show1314, setShow1314] = useState(false);
  const [youtubeMusicId, setYoutubeMusicId] = useState('jfKfPfyJRdk'); // 預設浪漫曲目

  const surpriseText = `擔心說了這些會後悔 有些事不做或許未來更遺憾\n If I had enough time and the opportunity, I’d really love to see you.`; // 預設內容

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
              <button className="close-modal" onClick={() => { setIsSurpriseOpen(false); setModalClicks(0); setShow1314(false); }}>
                <X size={24} />
              </button>
              <motion.div
                whileHover={{ scale: 1.1, rotate: 15 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  const next = modalClicks + 1;
                  setModalClicks(next);
                  if (next >= 3) setShow1314(true);
                }}
                style={{ cursor: 'pointer' }}
              >
                <Sparkles size={60} className="modal-icon-premium" />
              </motion.div>

              <h3 className="modal-title-premium">驚喜揭曉</h3>
              
              <div style={{ marginTop: '1.5rem', fontFamily: 'var(--font-brand)', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.7)' }}>
                THE FIRST DAY WE MET
              </div>

              {/* 背景音樂播放器 (隱形) */}
              {isSurpriseOpen && youtubeMusicId && (
              <div style={{ display: 'none' }}>
                <iframe
                  width="0"
                  height="0"
                  src={`https://www.youtube.com/embed/${youtubeMusicId}?autoplay=1&loop=1&playlist=${youtubeMusicId}`}
                  allow="autoplay"
                ></iframe>
              </div>
            )}

            <AnimatePresence>
                {show1314 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.5 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="easter-egg-1314"
                  >
                    1314
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="surprise-text-area-premium">
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
                {tab === 'creator' && <Lock size={18} stroke={activeTab === tab ? "url(#premium-grad)" : "currentColor"} />}
                {tab === 'reader' && <Unlock size={18} stroke={activeTab === tab ? "url(#premium-grad)" : "currentColor"} />}
                {tab === 'surprise' && <Gift size={18} stroke={activeTab === tab ? "url(#premium-grad)" : "currentColor"} />}
                <span>{tab === 'creator' ? '建立' : tab === 'reader' ? '開啟' : '驚喜'}</span>
              </button>
            ))}
          </nav>
          {/* Removed sidebar-footer to prevent duplication in mobile dock */}
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
                  <div
                    className="surprise-icon-wrapper-premium"
                    onClick={() => {
                      const newClicks = surpriseClicks + 1;
                      setSurpriseClicks(newClicks);
                      if (newClicks >= 3) setShowHint(true);
                    }}
                  >
                    <div className="icon-halo"></div>
                    {/* Unique light flare for high-end refractive effect */}
                    <div style={{
                      position: 'absolute',
                      top: '15%',
                      left: '15%',
                      width: '6px',
                      height: '6px',
                      background: 'rgba(255,255,255,0.9)',
                      borderRadius: '50%',
                      filter: 'blur(3px)',
                      boxShadow: '0 0 15px #fff',
                      zIndex: 3
                    }}></div>
                    <Gift size={72} strokeWidth={1.2} className="gift-glow-icon-v2" style={{ stroke: 'url(#premium-grad)', fill: 'none' }} />
                  </div>

                  <div className="surprise-glass-card">
                    <h3 className="surprise-title-premium">Pisces Emphasize</h3>
                    <p className="surprise-subtitle">Gifts & Surprises</p>

                    <div className="surprise-input-wrapper-v2">
                      <input
                        type="password"
                        value={surprisePass}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSurprisePass(val);
                          // 使用 Base64 混淆比對 (MDQyMA== = 0420)
                          if (window.btoa(val) === 'MDQyMA==') {
                            setIsSurpriseOpen(true);
                            setSurprisePass('');
                          }
                        }}
                        placeholder="Master Password"
                        className="surprise-fancy-input-v2"
                      />
                    </div>

                    <p className={`surprise-hint-v2 ${showHint ? 'visible' : ''}`}>
                      The First Day We Met
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <footer
            className="footer-mobile-integrated"
            style={{ cursor: 'pointer', marginTop: '4rem', paddingBottom: '2rem', textAlign: 'center', opacity: 0.3 }}
          >
            <span
              onClick={() => {
                const next = versionClicks + 1;
                setVersionClicks(next);
                if (next >= 3) {
                  setFooterText('我也蠻喜歡你的 ');
                  setVersionClicks(0);
                  setTimeout(() => setFooterText('Version 5.2.0'), 3000);
                }
              }}
              style={{ pointerEvents: 'auto', fontSize: '0.55rem', letterSpacing: '0.2em' }}
            >
              <div>Powered By EVS-ZHAO TECH© 2026</div>
              <div style={{ marginTop: '0.5rem', color: footerText.includes('喜歡') ? 'var(--accent-color)' : 'inherit', opacity: footerText.includes('喜歡') ? 1 : 0.8 }}>
                {footerText}
              </div>
            </span>
          </footer>
        </main>
      </section>

      {/* Desktop-only footer logic: Only renders if window width is likely desktop or not on mobile */}
      <footer
        className="footer desktop-footer"
        style={{ cursor: 'pointer' }}
      >
        <span
          onClick={() => {
            const next = versionClicks + 1;
            setVersionClicks(next);
            if (next >= 3) {
              setFooterText('我也蠻喜歡你的 ');
              setVersionClicks(0);
              setTimeout(() => setFooterText('Version 5.2.0'), 3000);
            }
          }}
          style={{ pointerEvents: 'auto' }}
        >
          <div>Powered By EVS-ZHAO TECH© 2026</div>
          <div style={{ marginTop: '0.4rem', color: footerText.includes('喜歡') ? 'var(--accent-color)' : 'inherit' }}>
            {footerText}
          </div>
        </span>
      </footer>

      {/* Premium SVG Gradients Definition */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id="premium-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#8b5cf6' }} />
            <stop offset="100%" style={{ stopColor: '#ec4899' }} />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
