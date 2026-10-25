import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore, collection, onSnapshot, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { 
  UploadCloud, 
  FileText, 
  Printer, 
  Settings, 
  CheckCircle, 
  Clock, 
  Menu, 
  X, 
  LayoutDashboard,
  User,
  AlertCircle,
  Eye,
  Download,
  Lock,
  LogOut
} from 'lucide-react';

const firebaseConfig = {
  apiKey: "AIzaSyBwXHHYfWRiRnqlTeNmqJ1pS1liXYwbOIs",
  authDomain: "d-rasya-print.firebaseapp.com",
  projectId: "d-rasya-print",
  storageBucket: "d-rasya-print.firebasestorage.app",
  messagingSenderId: "121751980445",
  appId: "1:121751980445:web:3e2e5e39a0a45094a30774",
  measurementId: "G-40VMFVXPB8"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Fungsi cerdas untuk mengompresi gambar atau mengonversi file agar aman di bawah 1MB
const compressFileIfNeeded = (file) => {
  return new Promise((resolve, reject) => {
    // Jika file berupa gambar, kita kompres resolusi dan kualitasnya agar muat di bawah 1MB
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Batasi dimensi maksimum agar ukuran Base64-nya tidak tembus 1MB
          const MAX_DIMENSION = 1200;
          if (width > height) {
            if (width > MAX_DIMENSION) {
              height *= MAX_DIMENSION / width;
              width = MAX_DIMENSION;
            }
          } else {
            if (height > MAX_DIMENSION) {
              width *= MAX_DIMENSION / height;
              height = MAX_DIMENSION;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Ekspor ke format JPEG dengan kualitas 0.7 agar ukuran filenya sangat ringan
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(compressedDataUrl);
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    } else {
      // Untuk file non-gambar (seperti PDF/Word), baca sebagai Base64 biasa
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    }
  });
};

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('customer');
  const [errorMsg, setErrorMsg] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try { await signInAnonymously(auth); } catch (err) { setErrorMsg("Gagal terhubung ke sistem."); }
    };
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) setUser(currentUser);
      else initAuth();
    });
    if (!auth.currentUser) initAuth();
    return () => unsubscribe();
  }, []);

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#f9fafb', minHeight: '100vh', color: '#111827', margin: 0, display: 'flex', flexDirection: 'column' }}>
      {/* Navbar Minimalis & Responsive */}
      <nav style={{ backgroundColor: '#ffffff', color: '#111827', padding: '1.25rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: '#111827', color: '#ffffff', padding: '8px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Printer style={{ height: '20px', width: '20px' }} />
          </div>
          <h1 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', letterSpacing: '-0.025em', color: '#111827' }}>D RASYA PRINT</h1>
        </div>

        {/* Desktop Menu */}
        <div className="desktop-menu" style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => setActiveTab('customer')} 
            style={{ padding: '0.6rem 1.25rem', background: activeTab === 'customer' ? '#111827' : 'transparent', color: activeTab === 'customer' ? '#ffffff' : '#4b5563', border: activeTab === 'customer' ? 'none' : '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
          >
            <User style={{ width: '16px', height: '16px' }} /> Buat Pesanan
          </button>
          <button 
            onClick={() => setActiveTab('admin')} 
            style={{ padding: '0.6rem 1.25rem', background: activeTab === 'admin' ? '#111827' : 'transparent', color: activeTab === 'admin' ? '#ffffff' : '#4b5563', border: activeTab === 'admin' ? 'none' : '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }}
          >
            <LayoutDashboard style={{ width: '16px', height: '16px' }} /> Admin Dashboard
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
          className="mobile-menu-btn"
          style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: '#111827', padding: '4px' }}
        >
          {isMobileMenuOpen ? <X style={{ width: '26px', height: '26px' }} /> : <Menu style={{ width: '26px', height: '26px' }} />}
        </button>
      </nav>

      {/* Mobile Dropdown Menu */}
      {isMobileMenuOpen && (
        <div style={{ background: '#ffffff', borderBottom: '1px solid #e5e7eb', padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '8px', position: 'sticky', top: '73px', zIndex: 40, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <button 
            onClick={() => { setActiveTab('customer'); setIsMobileMenuOpen(false); }} 
            style={{ padding: '0.75rem 1rem', background: activeTab === 'customer' ? '#111827' : 'transparent', color: activeTab === 'customer' ? '#ffffff' : '#4b5563', border: activeTab === 'customer' ? 'none' : '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left', width: '100%' }}
          >
            <User style={{ width: '18px', height: '18px' }} /> Buat Pesanan
          </button>
          <button 
            onClick={() => { setActiveTab('admin'); setIsMobileMenuOpen(false); }} 
            style={{ padding: '0.75rem 1rem', background: activeTab === 'admin' ? '#111827' : 'transparent', color: activeTab === 'admin' ? '#ffffff' : '#4b5563', border: activeTab === 'admin' ? 'none' : '1px solid #e5e7eb', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left', width: '100%' }}
          >
            <LayoutDashboard style={{ width: '18px', height: '18px' }} /> Admin Dashboard
          </button>
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-menu { display: none !important; }
          .mobile-menu-btn { display: block !important; }
          .main-container { padding: 1rem !important; }
          .form-card-inner { padding: 1.5rem !important; }
          .form-header { padding: 1.5rem !important; }
          .grid-specs { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Content */}
      <main className="main-container" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '2.5rem 1.5rem', flex: 1, boxSizing: 'border-box' }}>
        {errorMsg && <div style={{ background: '#fef2f2', color: '#991b1b', padding: '14px 18px', borderRadius: '10px', marginBottom: '1.5rem', border: '1px solid #f87171', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '10px' }}><AlertCircle style={{ width: '20px', height: '20px' }} />{errorMsg}</div>}
        
        {!user ? (
          <div style={{ textAlign: 'center', padding: '5rem', fontWeight: '600', color: '#6b7280' }}>Menghubungkan ke sistem...</div>
        ) : (
          <>
            {activeTab === 'customer' ? <CustomerView user={user} onError={setErrorMsg} /> : <AdminView user={user} onError={setErrorMsg} />}
          </>
        )}
      </main>
    </div>
  );
}

function CustomerView({ user, onError }) {
  const [formData, setFormData] = useState({ customerName: '', paperSize: 'A4', colorMode: 'Hitam Putih', copies: 1, sides: '1 Sisi (Single-sided)', notes: '' });
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const fileInputRef = useRef(null);

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { onError("Silakan pilih file yang ingin di-print terlebih dahulu!"); return; }
    if (!formData.customerName) { onError("Nama pemesan wajib diisi!"); return; }
    
    // Validasi batas maksimal 25 MB
    if (file.size > 25 * 1024 * 1024) { 
      onError("Ukuran file terlalu besar! Maksimal ukuran file adalah 25MB."); 
      return; 
    }

    setIsSubmitting(true);
    onError('');
    setSuccessMsg('');

    try {
      // Kompresi otomatis file agar muat di database Firestore tanpa error limit 1MB
      const fileUrl = await compressFileIfNeeded(file);

      await addDoc(collection(db, 'orders'), {
        ...formData,
        fileName: file.name,
        fileSize: file.size,
        fileUrl: fileUrl,
        status: 'Menunggu',
        createdAt: serverTimestamp(),
        userId: user.uid
      });

      setSuccessMsg("Pesanan berhasil dikirim! Silakan tunggu konfirmasi dari D Rasya Print.");
      setFormData({ customerName: '', paperSize: 'A4', colorMode: 'Hitam Putih', copies: 1, sides: '1 Sisi (Single-sided)', notes: '' });
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      onError("Gagal mengirim pesanan: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ background: '#ffffff', borderRadius: '20px', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
      <div className="form-header" style={{ background: '#111827', color: '#ffffff', padding: '2.5rem 3rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '12px', letterSpacing: '-0.025em' }}>
          <UploadCloud style={{ width: '32px', height: '32px' }} /> Formulir Pemesanan Print
        </h2>
        <p style={{ margin: '0.5rem 0 0 0', fontSize: '1rem', color: '#9ca3af' }}>Unggah dokumen Anda dan tentukan spesifikasi cetakan dengan mudah dan cepat.</p>
      </div>

      {successMsg && <div style={{ background: '#ecfdf5', color: '#065f46', padding: '1.25rem 2rem', margin: '2rem 3rem 0 3rem', borderRadius: '12px', fontWeight: '600', border: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', gap: '12px' }}><CheckCircle style={{ width: '22px', height: '22px' }} />{successMsg}</div>}
      
      <form onSubmit={handleSubmit} className="form-card-inner" style={{ padding: '3rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div>
          <label style={{ display: 'block', fontWeight: '700', marginBottom: '0.75rem', fontSize: '0.95rem', color: '#374151' }}>Nama Pemesan <span style={{ color: '#ef4444' }}>*</span></label>
          <input type="text" name="customerName" value={formData.customerName} onChange={handleChange} required style={{ width: '100%', padding: '0.9rem 1.25rem', borderRadius: '10px', border: '1px solid #d1d5db', fontSize: '1rem', boxSizing: 'border-box', outline: 'none', backgroundColor: '#f9fafb', color: '#111827' }} placeholder="Masukkan nama lengkap Anda..." />
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: '700', marginBottom: '0.75rem', fontSize: '0.95rem', color: '#374151' }}>File Dokumen <span style={{ color: '#ef4444' }}>*</span></label>
          <div style={{ border: '2px dashed #d1d5db', padding: '3rem 2rem', borderRadius: '16px', textAlign: 'center', background: '#f9fafb', cursor: 'pointer', position: 'relative' }}>
            <input type="file" ref={fileInputRef} onChange={(e) => setFile(e.target.files[0])} accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              {file ? (
                <>
                  <div style={{ background: '#e5e7eb', padding: '12px', borderRadius: '50%' }}>
                    <FileText style={{ width: '36px', height: '36px', color: '#111827' }} />
                  </div>
                  <span style={{ fontSize: '1.05rem', fontWeight: '700', color: '#111827', wordBreak: 'break-all' }}>{file.name}</span>
                  <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>({(file.size / 1024).toFixed(1)} KB) • Klik atau seret untuk mengganti file</span>
                </>
              ) : (
                <>
                  <div style={{ background: '#e5e7eb', padding: '14px', borderRadius: '50%' }}>
                    <UploadCloud style={{ width: '36px', height: '36px', color: '#4b5563' }} />
                  </div>
                  <span style={{ fontSize: '1.05rem', fontWeight: '700', color: '#374151' }}>Pilih file atau seret ke sini</span>
                  <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>Format: PDF, Word, Gambar (Maksimal 25MB)</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div style={{ background: '#f9fafb', padding: '2rem', borderRadius: '16px', border: '1px solid #e5e7eb' }}>
          <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.05rem', fontWeight: '800', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings style={{ width: '18px', height: '18px' }} /> Spesifikasi Cetak
          </h3>
          <div className="grid-specs" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#4b5563' }}>Ukuran Kertas</label>
              <select name="paperSize" value={formData.paperSize} onChange={handleChange} style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '10px', border: '1px solid #d1d5db', background: '#ffffff', fontSize: '0.95rem', color: '#111827', outline: 'none' }}>
                <option>A4</option><option>F4 (Folio)</option><option>Letter</option><option>Legal</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#4b5563' }}>Mode Warna</label>
              <select name="colorMode" value={formData.colorMode} onChange={handleChange} style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '10px', border: '1px solid #d1d5db', background: '#ffffff', fontSize: '0.95rem', color: '#111827', outline: 'none' }}>
                <option>Hitam Putih</option><option>Full Color</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#4b5563' }}>Jumlah Salinan (Copy)</label>
              <input type="number" min="1" name="copies" value={formData.copies} onChange={handleChange} style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '10px', border: '1px solid #d1d5db', boxSizing: 'border-box', background: '#ffffff', fontSize: '0.95rem', color: '#111827', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#4b5563' }}>Sisi Cetak</label>
              <select name="sides" value={formData.sides} onChange={handleChange} style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '10px', border: '1px solid #d1d5db', background: '#ffffff', fontSize: '0.95rem', color: '#111827', outline: 'none' }}>
                <option>1 Sisi (Single-sided)</option><option>Bolak Balik (Double-sided)</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: '700', marginBottom: '0.75rem', fontSize: '0.95rem', color: '#374151' }}>Catatan Tambahan (Opsional)</label>
          <textarea name="notes" value={formData.notes} onChange={handleChange} rows="3" placeholder="Contoh: Print halaman 1-5 saja ya..." style={{ width: '100%', padding: '0.9rem 1.25rem', borderRadius: '10px', border: '1px solid #d1d5db', boxSizing: 'border-box', fontSize: '0.95rem', resize: 'vertical', outline: 'none', backgroundColor: '#f9fafb', color: '#111827' }}></textarea>
        </div>

        <button type="submit" disabled={isSubmitting} style={{ background: '#111827', color: '#ffffff', padding: '1.1rem', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', fontSize: '1rem', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', transition: 'background-color 0.2s' }}>
          {isSubmitting ? 'Mengompres & Menyimpan Pesanan...' : 'Kirim Pesanan Print'}
        </button>
      </form>
    </div>
  );
}

function AdminLogin({ onError }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      onError("Login gagal: Email atau password salah.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#ffffff', padding: '3rem', borderRadius: '20px', maxWidth: '440px', margin: '4rem auto', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)', border: '1px solid #e5e7eb' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ width: '64px', height: '64px', background: '#f3f4f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto' }}>
          <Lock style={{ width: '28px', height: '28px', color: '#111827' }} />
        </div>
        <h2 style={{ margin: 0, color: '#111827', fontSize: '1.75rem', fontWeight: '800' }}>Login Admin</h2>
        <p style={{ margin: '0.5rem 0 0 0', color: '#6b7280', fontSize: '0.95rem' }}>Masuk untuk mengelola seluruh daftar pesanan masuk.</p>
      </div>
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <label style={{ display: 'block', fontWeight: '700', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#374151' }}>Email Admin</label>
          <input type="email" placeholder="admin@drasyaprint.com" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #d1d5db', fontSize: '1rem', boxSizing: 'border-box', outline: 'none', backgroundColor: '#f9fafb' }} />
        </div>
        <div>
          <label style={{ display: 'block', fontWeight: '700', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#374151' }}>Password</label>
          <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #d1d5db', fontSize: '1rem', boxSizing: 'border-box', outline: 'none', backgroundColor: '#f9fafb' }} />
        </div>
        <button type="submit" disabled={loading} style={{ background: '#111827', color: '#ffffff', padding: '1rem', borderRadius: '10px', border: 'none', fontWeight: '700', cursor: 'pointer', fontSize: '1rem', marginTop: '0.75rem' }}>
          {loading ? 'Memeriksa...' : 'Masuk Dashboard'}
        </button>
      </form>
    </div>
  );
}

function AdminView({ user, onError }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'orders'), (snapshot) => {
      const data = [];
      snapshot.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setOrders(data);
      setLoading(false);
    }, () => {
      onError("Gagal memuat pesanan.");
      setLoading(false);
    });
    return () => unsub();
  }, [onError]);

  if (!user.email) return <AdminLogin onError={onError} />;

  const updateStatus = async (id, status) => {
    try { await updateDoc(doc(db, 'orders', id), { status }); } catch (e) { onError("Gagal memperbarui status"); }
  };

  const handlePrintFile = (url) => {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = url;
    document.body.appendChild(iframe);
    iframe.onload = () => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (e) {
        window.open(url, '_blank');
      }
      setTimeout(() => document.body.removeChild(iframe), 5000);
    };
  };

  const getFileType = (fileName) => {
    if (!fileName) return 'other';
    const ext = fileName.split('.').pop().toLowerCase();
    if (['pdf'].includes(ext)) return 'pdf';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) return 'image';
    return 'other';
  };

  return (
    <div style={{ background: '#ffffff', borderRadius: '20px', boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
      <div style={{ background: '#111827', color: '#ffffff', padding: '2rem 3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <LayoutDashboard style={{ width: '24px', height: '24px' }} /> Daftar Pesanan Masuk
          </h2>
          <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.9rem', color: '#9ca3af' }}>Kelola, pantau, dan cetak file dari pelanggan secara real-time.</p>
        </div>
        <button onClick={() => signOut(auth)} style={{ background: '#ef4444', color: '#ffffff', border: 'none', padding: '0.6rem 1.25rem', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <LogOut style={{ width: '16px', height: '16px' }} /> Keluar
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#6b7280' }}>Memuat data pesanan...</div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem', color: '#6b7280', fontSize: '1.05rem' }}>Belum ada pesanan masuk saat ini.</div>
      ) : (
        <div style={{ overflowX: 'auto', padding: '1rem 2rem 2rem 2rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.95rem', minWidth: '750px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb', color: '#4b5563' }}>
                <th style={{ padding: '16px' }}>Pelanggan</th>
                <th style={{ padding: '16px' }}>File Dokumen & Aksi</th>
                <th style={{ padding: '16px' }}>Spesifikasi Cetak</th>
                <th style={{ padding: '16px' }}>Status</th>
                <th style={{ padding: '16px', textAlign: 'center' }}>Aksi Admin</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '18px 16px', fontWeight: '700', color: '#111827' }}>{o.customerName}</td>
                  <td style={{ padding: '18px 16px' }}>
                    <div style={{ fontWeight: '600', marginBottom: '8px', color: '#374151', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText style={{ width: '16px', height: '16px', color: '#4b5563' }} /> {o.fileName}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button 
                        onClick={() => setPreviewFile({ url: o.fileUrl, name: o.fileName, type: getFileType(o.fileName) })}
                        style={{ padding: '5px 10px', fontSize: '0.8rem', background: '#f3f4f6', color: '#111827', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Eye style={{ width: '13px', height: '13px' }} /> Preview
                      </button>
                      <button 
                        onClick={() => handlePrintFile(o.fileUrl)}
                        style={{ padding: '5px 10px', fontSize: '0.8rem', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Printer style={{ width: '13px', height: '13px' }} /> Print
                      </button>
                      <a 
                        href={o.fileUrl} 
                        download={o.fileName} 
                        style={{ padding: '5px 10px', fontSize: '0.8rem', background: '#e5e7eb', color: '#111827', textDecoration: 'none', borderRadius: '6px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Download style={{ width: '13px', height: '13px' }} /> Unduh
                      </a>
                    </div>
                  </td>
                  <td style={{ padding: '18px 16px', fontSize: '0.9rem', color: '#4b5563', lineHeight: '1.5' }}>
                    <div><b>Kertas:</b> {o.paperSize}</div>
                    <div><b>Warna:</b> {o.colorMode}</div>
                    <div><b>Jumlah:</b> {o.copies}x ({o.sides})</div>
                    {o.notes && <div style={{ fontStyle: 'italic', color: '#6b7280', marginTop: '4px' }}>"{o.notes}"</div>}
                  </td>
                  <td style={{ padding: '18px 16px' }}>
                    <span style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700', background: o.status === 'Selesai' ? '#ecfdf5' : o.status === 'Diproses' ? '#eff6ff' : '#fffbeb', color: o.status === 'Selesai' ? '#065f46' : o.status === 'Diproses' ? '#1e40af' : '#b45309' }}>
                      {o.status}
                    </span>
                  </td>
                  <td style={{ padding: '18px 16px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button onClick={() => updateStatus(o.id, 'Menunggu')} style={{ padding: '7px 10px', fontSize: '0.8rem', borderRadius: '8px', border: '1px solid #d1d5db', background: '#ffffff', cursor: 'pointer', fontWeight: '600', color: '#374151' }}>Menunggu</button>
                      <button onClick={() => updateStatus(o.id, 'Diproses')} style={{ padding: '7px 10px', fontSize: '0.8rem', borderRadius: '8px', border: 'none', background: '#2563eb', color: '#ffffff', cursor: 'pointer', fontWeight: '600' }}>Proses</button>
                      <button onClick={() => updateStatus(o.id, 'Selesai')} style={{ padding: '7px 10px', fontSize: '0.8rem', borderRadius: '8px', border: 'none', background: '#059669', color: '#ffffff', cursor: 'pointer', fontWeight: '600' }}>Selesai</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Preview File */}
      {previewFile && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0, 0, 0, 0.75)', padding: '1.5rem' }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '900px', height: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9fafb' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                <FileText style={{ width: '20px', height: '20px', color: '#111827' }} />
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{previewFile.name}</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button 
                  onClick={() => handlePrintFile(previewFile.url)}
                  style={{ padding: '0.5rem 1rem', background: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Printer style={{ width: '15px', height: '15px' }} /> Print Dokumen
                </button>
                <button 
                  onClick={() => setPreviewFile(null)}
                  style={{ padding: '0.5rem', background: '#e5e7eb', color: '#111827', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                >
                  <X style={{ width: '18px', height: '18px' }} />
                </button>
              </div>
            </div>

            <div style={{ flex: 1, background: '#e5e7eb', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'auto', padding: '1rem' }}>
              {previewFile.type === 'pdf' ? (
                <iframe src={previewFile.url} title="PDF Preview" style={{ width: '100%', height: '100%', borderRadius: '8px', border: 'none', background: 'white' }} />
              ) : previewFile.type === 'image' ? (
                <img src={previewFile.url} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px' }} />
              ) : (
                <div style={{ textAlign: 'center', background: 'white', padding: '2.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  <AlertCircle style={{ width: '40px', height: '40px', color: '#d97706', margin: '0 auto 1rem auto' }} />
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: '700' }}>Pratinjau Tidak Tersedia</h4>
                  <p style={{ margin: '0 0 1.5rem 0', color: '#6b7280', fontSize: '0.9rem' }}>Format file ini (Word/Lainnya) tidak dapat dipratinjau langsung di browser.</p>
                  <a href={previewFile.url} download={previewFile.name} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '0.75rem 1.25rem', background: '#111827', color: '#ffffff', borderRadius: '8px', textDecoration: 'none', fontWeight: '600', fontSize: '0.9rem' }}>
                    <Download style={{ width: '16px', height: '16px' }} /> Unduh File Sekarang
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}