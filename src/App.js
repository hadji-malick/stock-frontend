import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import { Toaster, toast } from 'react-hot-toast';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ConfirmationModal from './components/ui/ConfirmationModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logo from './assets/logo.png';  // <-- IMPORT DU LOGO
import bgAccueil from './assets/acceuil.png'; 
import FournisseurManagement from './components/FournisseurManagement'; 
import CommandeFournisseur from './components/CommandeFournisseur';
import CommandeConfirmation from './pages/CommandeConfirmation';
import CommandeModification from './pages/CommandeModification';
import ConfirmationModification from './pages/ConfirmationModification';
import AccepterModification from './pages/AccepterModification';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ConfirmerDateExpedition from './pages/ConfirmerDateExpedition';
import CommandeRejeterDemande from './pages/CommandeRejeterDemande';
import DevisFournisseur from './pages/DevisFournisseur';
import ExpeditionStatus from './components/ExpeditionStatus';
import RealTimeNotification from './components/RealTimeNotification';


// ==================== STYLES (CORPORATE BLEU) ====================
const styles = {
  container: { display: 'flex', minHeight: '100vh', background: '#fcf9f8', fontFamily: "'Inter', system-ui, sans-serif" },
  sidebar: { width: '280px', background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)', color: '#f1f5f9', display: 'flex', flexDirection: 'column', position: 'fixed', height: '100%', overflowY: 'auto', boxShadow: '4px 0 20px rgba(0,0,0,0.08)' },
sidebarHeader: {
  background: 'linear-gradient(135deg, #0f172a, #0f172a)',
  padding: '20px 16px',
  textAlign: 'center',
  marginBottom: '20px'
},

sidebarLogo: {
  width: '100%',             // prend toute la largeur du conteneur
  height: 'auto',            // hauteur proportionnelle
  display: 'block'
},
sidebarSub: {
  fontSize: '11px',
  color: '#ffedd5',
  marginTop: '4px'
},
sidebarLogoContainer: {
  backgroundColor: 'white',
  width: '100%',
  borderRadius: '12px',
  overflow: 'hidden',        // pour que l’image respecte les bords arrondis
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center'
},
sidebarTitle: {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#f97316',     // Couleur orange pour le texte
  letterSpacing: '1px'
},
sidebarSub: {
  fontSize: '10px',
  color: '#64748b',
  marginTop: '2px'
},
  userCard: { margin: '24px 20px', padding: '16px', background: '#334155', borderRadius: '16px', textAlign: 'center' },
  userName: { fontSize: '15px', fontWeight: '600', color: 'white' },
  userRole: { fontSize: '12px', color: '#94a3b8', marginTop: '4px' },
  navItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', margin: '4px 16px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', fontWeight: '500' },
  navItemActive: { background: '#3b82f6', color: 'white', boxShadow: '0 4px 8px rgba(59,130,246,0.3)' },
  navItemInactive: { color: '#cbd5e1', ':hover': { background: '#334155', color: 'white' } },
  logoutBtn: { margin: 'auto 16px 24px 16px', padding: '12px', background: '#334155', border: 'none', borderRadius: '12px', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '500', transition: '0.2s' },
  main: { flex: 1, marginLeft: '280px', padding: '28px 32px' },
  header: { background: 'white', borderRadius: '20px', padding: '16px 28px', marginBottom: '28px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  headerLogo: { height: '40px', marginRight: '16px' },
  headerTitle: { fontSize: '22px', fontWeight: '700', color: '#0f172a' },
  headerSubtitle: { fontSize: '13px', color: '#64748b', marginTop: '4px' },
  headerPhone: { fontSize: '14px', fontWeight: '500', color: '#1e293b', background: '#f1f5f9', padding: '8px 16px', borderRadius: '40px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '28px' },
  statCard: { background: 'white', borderRadius: '20px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0' },
  statTitle: { fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' },
  statValue: { fontSize: '30px', fontWeight: '800', color: '#0f172a', marginTop: '8px' },
  card: { background: 'white', borderRadius: '20px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0', marginBottom: '24px' },
  cardTitle: { fontSize: '18px', fontWeight: '700', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px 12px', background: '#f8fafc', fontSize: '12px', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' },
  td: { padding: '12px 12px', borderBottom: '1px solid #f1f5f9', fontSize: '14px', color: '#1e293b' },
  badge: { display: 'inline-block', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
  badgeSuccess: { background: '#dcfce7', color: '#166534' },
  badgeWarning: { background: '#fef3c7', color: '#92400e' },
  btnPrimary: { background: '#3b82f6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '40px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', transition: '0.2s' },
  btnSecondary: { background: '#e2e8f0', color: '#334155', border: 'none', padding: '10px 20px', borderRadius: '40px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', transition: '0.2s' },
  btnSuccess: { background: '#10b981', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '40px', cursor: 'pointer', fontWeight: '600' },
  btnDanger: { background: '#ef4444', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '30px', cursor: 'pointer', fontWeight: '500' },
  formGroup: { marginBottom: '18px' },
  label: { display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#334155' },
  input: { width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '12px', fontSize: '14px', outline: 'none', transition: '0.2s' },
  modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
  modalContent: { background: 'white', borderRadius: '24px', padding: '28px', width: '500px', maxWidth: '90%', boxShadow: '0 20px 35px -12px rgba(0,0,0,0.2)' },
  flexBetween: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  gap2: { display: 'flex', gap: '12px' },
  productGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px', marginTop: '16px' },
  productCard: { border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px', background: 'white' },
  productName: { fontSize: '15px', fontWeight: '700', marginBottom: '8px' },
  productPrice: { fontSize: '18px', fontWeight: '800', color: '#3b82f6', marginBottom: '6px' },
  productStock: { fontSize: '12px', color: '#64748b' },
};

// ==================== DASHBOARD ====================
function DashboardContent({ stats, ventesParJour, topProduits, totalVentes, chiffreAffaire, caMois, produits }) {
  const generateChartData = () => {
    if (!ventesParJour || ventesParJour.length === 0) return [];
    const today = new Date();
    const start = new Date();
    start.setDate(today.getDate() - 13);
    const allDays = [];
    for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
      allDays.push({ jour: d.toLocaleDateString('fr-FR', { weekday: 'short' }), quantite: 0, fullDate: d.toLocaleDateString('fr-FR') });
    }
    ventesParJour.forEach(v => {
      const idx = allDays.findIndex(day => day.fullDate === v.jour);
      if (idx !== -1) allDays[idx].quantite = v.quantite;
    });
    return allDays;
  };
    const produitsBenefices = produits
    .filter(p => p.prixAchat && p.prixVente && p.prixAchat > 0 && p.prixVente > p.prixAchat)
    .map(p => ({ nom: p.nom, marge: p.prixVente - p.prixAchat }))
    .sort((a, b) => b.marge - a.marge)
    .slice(0, 5);
  const chartData = generateChartData();
  const barData = topProduits.map(p => ({ name: p.nom, ventes: p.quantite }));

  const statCards = [
    { title: 'PRODUITS EN STOCK', value: stats.totalProduits || 0, icon: '📦', bg: 'linear-gradient(135deg, #3b82f6, #2563eb)' },
    { title: 'STOCK BAS', value: stats.produitsStockBas || 0, icon: '⚠️', bg: 'linear-gradient(135deg, #f59e0b, #d97706)' },
    { title: 'VALEUR DU STOCK', value: `${(stats.valeurTotaleStock || 0).toLocaleString()} FCFA`, icon: '💰', bg: 'linear-gradient(135deg, #10b981, #059669)' },
    { title: 'CA MOIS', value: `${caMois.toLocaleString()} FCFA`, icon: '📈', bg: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }  ];

  return (
    <>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b' }}>MEILLEURES VENTES - PERFORMANCE GLOBALE</h2>
        <p style={{ color: '#64748b', fontSize: '14px' }}>Multi-temporal de ventes performance</p>
      </div>

      {/* Cartes statistiques */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '28px' }}>
        {statCards.map((card, i) => (
          <div key={i} style={{ background: card.bg, borderRadius: '20px', padding: '20px', color: 'white', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div><div style={{ fontSize: '12px', opacity: 0.85 }}>{card.title}</div><div style={{ fontSize: '30px', fontWeight: 'bold', marginTop: '6px' }}>{card.value}</div></div>
              <div style={{ fontSize: '32px' }}>{card.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Cartes récapitulatives */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '28px' }}>
        <div style={styles.statCard}><div style={{ color: '#64748b', fontSize: '13px' }}>Total des ventes</div><div style={{ fontSize: '30px', fontWeight: '800', color: '#3b82f6' }}>{totalVentes}</div></div>
        <div style={styles.statCard}><div style={{ color: '#64748b', fontSize: '13px' }}>Chiffre d'affaires</div><div style={{ fontSize: '30px', fontWeight: '800', color: '#3b82f6' }}>{chiffreAffaire.toLocaleString()} FCFA</div></div>
        <div style={styles.statCard}><div style={{ color: '#64748b', fontSize: '13px' }}>Produits différents</div><div style={{ fontSize: '30px', fontWeight: '800', color: '#3b82f6' }}>{topProduits.length}</div></div>
      </div>

      {/* Graphique en aires */}
      <div style={styles.card}>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>📈 Évolution des ventes (14 derniers jours)</h3>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs><linearGradient id="colorVentes" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="jour" stroke="#94a3b8" fontSize={12} tick={{ fill: '#475569' }} interval={Math.floor(chartData.length / 7)} />
            <YAxis stroke="#94a3b8" fontSize={12} />
            <Tooltip formatter={(val) => [`${val} ventes`, 'Quantité']} contentStyle={{ borderRadius: '12px', border: 'none' }} />
            <Legend />
            <Area type="monotone" dataKey="quantite" name="Nombre de ventes" stroke="#3b82f6" strokeWidth={2} fill="url(#colorVentes)" dot={{ fill: '#3b82f6', r: 3 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Graphique à barres top produits */}
      <div style={styles.card}>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>🏆 Top produits (nombre de ventes)</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tick={{ fill: '#475569' }} angle={-15} textAnchor="end" height={60} />
            <YAxis stroke="#94a3b8" fontSize={12} />
            <Tooltip formatter={(value) => [`${value} ventes`, 'Quantité']} cursor={{ fill: 'rgba(59,130,246,0.1)' }} />
            <Legend />
            <Bar dataKey="ventes" fill="#3b82f6" radius={[8,8,0,0]} barSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {produitsBenefices.length > 0 && (
    <div style={styles.card}>
      <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '20px' }}>💰 Bénéfice par produit (marge unitaire)</h3>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={produitsBenefices} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="nom" stroke="#94a3b8" fontSize={12} tick={{ fill: '#475569' }} angle={-15} textAnchor="end" height={60} />
          <YAxis stroke="#94a3b8" fontSize={12} />
          <Tooltip formatter={(value) => [`${value.toLocaleString()} FCFA`, 'Marge']} />
          <Legend />
          <Bar dataKey="marge" fill="#10b981" radius={[8,8,0,0]} barSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )}

    </>
  );
}

// ==================== PANIER (VENDEUR) ====================
function CartComponent({ produits, user, onSaleComplete }) {
  const [panier, setPanier] = useState([]);
  const [quantites, setQuantites] = useState({});
  const [loading, setLoading] = useState(false);

  const ajouterAuPanier = (produit) => {
    const qty = quantites[produit.id] || 1;
    if (qty > produit.quantiteStock) {
      toast.error(`Stock insuffisant pour ${produit.nom}`);
      return;
    }
    setPanier(prev => {
      const existing = prev.find(i => i.id === produit.id);
      if (existing) {
        if (existing.quantite + qty > produit.quantiteStock) return prev;
        return prev.map(i => i.id === produit.id ? { ...i, quantite: i.quantite + qty } : i);
      }
      return [...prev, { ...produit, quantite: qty }];
    });
    toast.success(`${qty} x ${produit.nom} ajouté au panier`);
  };

  const retirerDuPanier = (id) => setPanier(prev => prev.filter(i => i.id !== id));
  const modifierQuantite = (id, newQty, maxStock) => {
    if (newQty < 1) return retirerDuPanier(id);
    if (newQty > maxStock) {
      toast.error(`Stock maximum: ${maxStock}`);
      return;
    }
    setPanier(prev => prev.map(i => i.id === id ? { ...i, quantite: newQty } : i));
  };

const validerVente = async () => {
  if (!panier.length) {
    toast.error('Panier vide');
    return;
  }
  setLoading(true);
  try {
    const items = panier.map(i => ({ produitId: i.id, quantite: i.quantite }));
    const res = await axios.post('http://localhost:8080/api/produits/vente-multi', {
      items,
      vendeur: user?.nom || 'Vendeur',
      commentaire: ''
    });
    toast.success(`✅ Vente validée ! Facture: ${res.data.numeroFacture}`, {
      duration: 5000,
      icon: '🧾'
    });
    setPanier([]);
    if (onSaleComplete) onSaleComplete();

    // Impression sans bloquer la fenêtre principale
    imprimerTicketSilencieux(res.data);
  } catch (err) {
    toast.error(err.response?.data?.error || 'Erreur');
  } finally {
    setLoading(false);
  }
};

const imprimerTicketSilencieux = (data) => {
  const ticketHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Ticket Powertech</title>
      <style>
        body { font-family: monospace; padding: 20px; margin:0; }
        .ticket { max-width: 300px; margin: auto; border: 1px solid #ccc; padding: 20px; border-radius: 12px; text-align: center; }
        .logo { width: 80px; margin-bottom: 10px; }
        .header { font-size: 18px; font-weight: bold; }
        .sub { font-size: 10px; color: #666; margin-bottom: 15px; }
        .row { display: flex; justify-content: space-between; margin: 6px 0; }
        .total { font-weight: bold; border-top: 1px dashed #aaa; padding-top: 8px; margin-top: 8px; }
        .footer { margin-top: 15px; font-size: 10px; }
        @media print {
          body { margin: 0; padding: 0; }
          .ticket { border: none; padding: 10px; }
        }
      </style>
    </head>
    <body>
      <div class="ticket">
        <img src="${logo}" class="logo" alt="Powertech" />
        <div class="header">POWERTECH</div>
        <div class="sub">ENGINEERING GROUP</div>
        <div>Facture: ${data.numeroFacture}</div>
        <div>${new Date().toLocaleString()}</div>
        <div>Vendeur: ${user?.nom}</div>
        <hr/>
        ${data.details.map(d => `
          <div class="row">
            <span>${d.produit} x ${d.quantite}</span>
            <span>${d.sousTotal.toLocaleString()} FCFA</span>
          </div>
        `).join('')}
        <div class="row total">
          <span>TOTAL</span>
          <span>${data.total.toLocaleString()} FCFA</span>
        </div>
        <div class="footer">Merci de votre visite !<br/>Dakar, Sénégal</div>
      </div>
      <script>
        window.onload = function() {
          window.print();
          setTimeout(() => window.close(), 1000);
        }
      </script>
    </body>
    </html>
  `;
  // Fenêtre très petite, presque invisible
  const win = window.open('', '_blank', 'width=400,height=300,toolbar=no,menubar=no,scrollbars=yes,resizable=yes');
  win.document.write(ticketHtml);
  win.document.close();
};
  const total = panier.reduce((s, i) => s + i.prixVente * i.quantite, 0);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
      <div style={styles.card}>
        <div style={styles.cardTitle}>📦 Produits disponibles</div>
        <div style={styles.productGrid}>
          {produits.filter(p => p.quantiteStock > 0).map(p => (
            <div key={p.id} style={styles.productCard}>
              <div style={styles.productName}>{p.nom}</div>
              <div style={styles.productPrice}>{p.prixVente.toLocaleString()} FCFA</div>
              <div style={styles.productStock}>Stock: {p.quantiteStock}</div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input type="number" min="1" max={p.quantiteStock} value={quantites[p.id] || 1} onChange={e => setQuantites({...quantites, [p.id]: parseInt(e.target.value) || 1})} style={{ width: '70px', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '12px', textAlign: 'center' }} />
                <button style={styles.btnSuccess} onClick={() => ajouterAuPanier(p)}>➕ Ajouter</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={styles.card}>
        <div style={styles.cardTitle}>🛒 Panier ({panier.length})</div>
        {panier.length === 0 ? <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>Panier vide</div> : (
          <>
            {panier.map(item => (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderBottom: '1px solid #eef2f6' }}>
                <div><strong>{item.nom}</strong><br/>{item.prixVente.toLocaleString()} FCFA</div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button onClick={() => modifierQuantite(item.id, item.quantite - 1, item.quantiteStock)} style={{ background: '#e2e8f0', border: 'none', width: '28px', height: '28px', borderRadius: '30px', fontWeight: 'bold' }}>-</button>
                  <span style={{ width: '30px', textAlign: 'center' }}>{item.quantite}</span>
                  <button onClick={() => modifierQuantite(item.id, item.quantite + 1, item.quantiteStock)} style={{ background: '#e2e8f0', border: 'none', width: '28px', height: '28px', borderRadius: '30px', fontWeight: 'bold' }}>+</button>
                  <button onClick={() => retirerDuPanier(item.id)} style={styles.btnDanger}>🗑️</button>
                </div>
              </div>
            ))}
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '2px solid #eef2f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '20px', fontWeight: 'bold' }}>Total : {total.toLocaleString()} FCFA</span>
              <button style={styles.btnPrimary} onClick={validerVente} disabled={loading}>{loading ? 'Vente...' : '✅ Valider'}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ==================== CLÔTURE CAISSE (VENDEUR + ADMIN) ====================
function CashClosureComponent({ onCloture }) {
  const { user } = useAuth();
  const [montantReel, setMontantReel] = useState('');
  const [commentaire, setCommentaire] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [statut, setStatut] = useState(null);
  const [historiqueClotures, setHistoriqueClotures] = useState([]);
  const isVendeur = user?.role === 'VENDEUR';

  useEffect(() => {
    check();
    if (!isVendeur) fetchHistorique();
  }, [isVendeur]);

  const check = async () => {
    try {
      const res = await axios.get('http://localhost:8080/api/produits/cloture/statut');
      setStatut(res.data);
    } catch (e) { console.error(e); }
  };
  const fetchHistorique = async () => {
    try {
      const res = await axios.get('http://localhost:8080/api/produits/cloture/historique');
      setHistoriqueClotures(res.data);
    } catch (e) { console.error(e); }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!montantReel) {
      toast.error('Montant requis');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:8080/api/produits/cloture', { montantReel: parseFloat(montantReel), commentaire });
      toast.success(res.data.message);
      setMessage({ type: 'success', text: res.data.message });
      setMontantReel('');
      setCommentaire('');
      if (onCloture) onCloture();
      check();
    } catch (err) {
      const errorText = err.response?.data?.error || 'Erreur';
      toast.error(errorText);
      setMessage({ type: 'error', text: errorText });
    } finally {
      setLoading(false);
    }
  };

  // Pour ADMIN / STOCK_MANAGER : afficher l'historique
  if (!isVendeur) {
    return (
      <div style={styles.card}>
        <div style={styles.cardTitle}>📊 Historique des clôtures de caisse</div>
        {historiqueClotures.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Aucune clôture enregistrée</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr><th style={styles.th}>Date</th><th style={styles.th}>Montant théorique</th><th style={styles.th}>Montant réel</th><th style={styles.th}>Écart</th><th style={styles.th}>Type</th><th style={styles.th}>Caissier</th><th style={styles.th}>Commentaire</th></tr>
            </thead>
            <tbody>
              {historiqueClotures.map(c => (
                <tr key={c.id}>
                  <td style={styles.td}>{new Date(c.date).toLocaleDateString()}</td>
                  <td style={styles.td}>{c.montantTheorique?.toLocaleString()} FCFA</td>
                  <td style={styles.td}>{c.montantReel?.toLocaleString()} FCFA</td>
                  <td style={styles.td} className={c.typeEcart === 'MANQUANT' ? 'text-red-600' : 'text-green-600'}>{c.ecart?.toLocaleString()} FCFA</td>
                  <td style={styles.td}>{c.typeEcart === 'MANQUANT' ? '⚠️ Manquant' : c.typeEcart === 'EXCEDENT' ? '📈 Excédent' : '✅ OK'}</td>
                  <td style={styles.td}>{c.caissier}</td>
                  <td style={styles.td}>{c.commentaire || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  }

  // Vendeur : formulaire de clôture ou message si déjà clôturé
  if (statut?.estCloturee) {
    return (
      <div style={styles.card}>
        <div style={styles.cardTitle}>✅ Clôture déjà effectuée</div>
        <div style={{ textAlign: 'center', padding: '20px', background: '#dcfce7', borderRadius: '20px' }}>
          <div style={{ fontSize: '48px' }}>✅</div>
          <p style={{ color: '#166534' }}>Caisse déjà clôturée aujourd'hui.</p>
          {statut.cloture && (
            <div style={{ background: 'white', padding: '12px', borderRadius: '16px', marginTop: '12px' }}>
              <p>Montant théorique : <strong>{statut.cloture.montantTheorique?.toLocaleString()} FCFA</strong></p>
              <p>Montant réel : <strong>{statut.cloture.montantReel?.toLocaleString()} FCFA</strong></p>
              <p>Écart : <strong style={{ color: statut.cloture.typeEcart === 'MANQUANT' ? '#dc2626' : '#3b82f6' }}>{statut.cloture.ecart?.toLocaleString()} FCFA</strong></p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.card}>
      <div style={styles.cardTitle}>🔒 Clôture de caisse</div>
      {message && <div style={{ padding: '12px', borderRadius: '14px', marginBottom: '16px', background: message.type === 'success' ? '#dcfce7' : '#fee2e2', color: message.type === 'success' ? '#166534' : '#991b1b' }}>{message.text}</div>}
      {statut && (
        <div style={{ marginBottom: '20px', padding: '14px', background: '#eff6ff', borderRadius: '18px' }}>
          <p>Montant théorique : <strong>{statut.montantTheorique?.toLocaleString()} FCFA</strong></p>
          <p>Ventes du jour : <strong>{statut.nombreVentes || 0}</strong></p>
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div style={styles.formGroup}><label style={styles.label}>Montant réel en caisse (FCFA)</label><input type="number" style={styles.input} value={montantReel} onChange={e => setMontantReel(e.target.value)} required /></div>
        <div style={styles.formGroup}><label style={styles.label}>Commentaire (optionnel)</label><input type="text" style={styles.input} value={commentaire} onChange={e => setCommentaire(e.target.value)} placeholder="Ex: Manque de monnaie" /></div>
        <button type="submit" style={styles.btnPrimary} disabled={loading}>{loading ? 'Clôture...' : '🔒 Valider la clôture'}</button>
      </form>
    </div>
  );
}

// ==================== GESTION UTILISATEURS (ADMIN) ====================
function UserManagementComponent() {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ nom: '', email: '', motDePasse: '', role: 'VENDEUR' });

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:8080/api/auth/utilisateurs', { headers: { Authorization: `Bearer ${token}` } });
      setUsers(res.data);
    } catch (err) { console.error(err); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:8080/api/auth/register', formData, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Utilisateur créé');
      fetchUsers();
      setShowModal(false);
      setFormData({ nom: '', email: '', motDePasse: '', role: 'VENDEUR' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const updateData = { nom: formData.nom, email: formData.email, role: formData.role };
      if (formData.motDePasse.trim()) updateData.motDePasse = formData.motDePasse;
      await axios.put(`http://localhost:8080/api/auth/utilisateurs/${editingUser.id}`, updateData, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Utilisateur modifié');
      fetchUsers();
      setShowEditModal(false);
      setFormData({ nom: '', email: '', motDePasse: '', role: 'VENDEUR' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };

  const deleteUser = async (id) => {
    if (window.confirm('Supprimer cet utilisateur ?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:8080/api/auth/utilisateurs/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        toast.success('Utilisateur supprimé');
        fetchUsers();
      } catch (err) {
        toast.error('Erreur');
      }
    }
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setFormData({ nom: user.nom, email: user.email, motDePasse: '', role: user.role });
    setShowEditModal(true);
  };

  const getRoleBadge = (role) => {
    if (role === 'ADMIN') return { label: 'Admin', color: '#8b5cf6', bg: '#f3e8ff' };
    if (role === 'STOCK_MANAGER') return { label: 'Gestionnaire', color: '#3b82f6', bg: '#eff6ff' };
    return { label: 'Vendeur', color: '#10b981', bg: '#ecfdf5' };
  };

  return (
    <div style={styles.card}>
      <div style={styles.flexBetween}><div style={styles.cardTitle}>👥 Utilisateurs</div><button style={styles.btnPrimary} onClick={() => { setFormData({ nom: '', email: '', motDePasse: '', role: 'VENDEUR' }); setShowModal(true); }}>➕ Nouveau</button></div>
      <table style={styles.table}>
        <thead><tr><th style={styles.th}>Nom</th><th style={styles.th}>Email</th><th style={styles.th}>Rôle</th><th style={styles.th}>Actions</th></tr></thead>
        <tbody>
          {users.map(u => {
            const badge = getRoleBadge(u.role);
            return <tr key={u.id}>
              <td style={styles.td}>{u.nom}</td>
              <td style={styles.td}>{u.email}</td>
              <td style={styles.td}><span style={{ background: badge.bg, color: badge.color, padding: '4px 14px', borderRadius: '40px', fontSize: '12px', fontWeight: '600' }}>{badge.label}</span></td>
              <td style={styles.td}>
                <button style={{ ...styles.btnPrimary, padding: '6px 12px', marginRight: '8px', fontSize: '12px' }} onClick={() => openEdit(u)}>✏️ Modifier</button>
                <button style={styles.btnDanger} onClick={() => deleteUser(u.id)}>🗑️ Supprimer</button>
              </td>
            </tr>;
          })}
        </tbody>
      </table>

      {showModal && (
        <div style={styles.modal}><div style={styles.modalContent}><div style={styles.flexBetween}><h3>Nouvel utilisateur</h3><button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '22px' }}>✖️</button></div>
        <form onSubmit={handleCreate}>
          <div style={styles.formGroup}><label>Nom</label><input style={styles.input} value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})} required /></div>
          <div style={styles.formGroup}><label>Email</label><input type="email" style={styles.input} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required /></div>
          <div style={styles.formGroup}><label>Mot de passe</label><input type="password" style={styles.input} value={formData.motDePasse} onChange={e => setFormData({...formData, motDePasse: e.target.value})} required /></div>
          <div style={styles.formGroup}><label>Rôle</label><select style={styles.input} value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}><option value="VENDEUR">Vendeur</option><option value="STOCK_MANAGER">Gestionnaire</option><option value="ADMIN">Administrateur</option></select></div>
          <div style={styles.gap2}><button type="submit" style={styles.btnPrimary}>Créer</button><button type="button" onClick={() => setShowModal(false)} style={{ ...styles.btnPrimary, background: '#94a3b8' }}>Annuler</button></div>
        </form></div></div>
      )}
      {showEditModal && editingUser && (
        <div style={styles.modal}><div style={styles.modalContent}><div style={styles.flexBetween}><h3>Modifier l'utilisateur</h3><button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', fontSize: '22px' }}>✖️</button></div>
        <form onSubmit={handleUpdate}>
          <div style={styles.formGroup}><label>Nom</label><input style={styles.input} value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})} required /></div>
          <div style={styles.formGroup}><label>Email</label><input type="email" style={styles.input} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required /></div>
          <div style={styles.formGroup}><label>Mot de passe (laisser vide pour ne pas changer)</label><input type="password" style={styles.input} value={formData.motDePasse} onChange={e => setFormData({...formData, motDePasse: e.target.value})} /></div>
          <div style={styles.formGroup}><label>Rôle</label><select style={styles.input} value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}><option value="VENDEUR">Vendeur</option><option value="STOCK_MANAGER">Gestionnaire</option><option value="ADMIN">Administrateur</option></select></div>
          <div style={styles.gap2}><button type="submit" style={styles.btnPrimary}>Enregistrer</button><button type="button" onClick={() => setShowEditModal(false)} style={{ ...styles.btnPrimary, background: '#94a3b8' }}>Annuler</button></div>
        </form></div></div>
      )}
    </div>
  );
}

// ==================== COMPOSANT PRINCIPAL ====================
function StockManagement() {
  const { user, logout } = useAuth();
  const role = user?.role;
  const [activeSection, setActiveSection] = useState('');
  const [produits, setProduits] = useState([]);
  const [stats, setStats] = useState({ totalProduits: 0, produitsStockBas: 0, valeurTotaleStock: 0 });
  const [ventes, setVentes] = useState([]);
  const [ventesParJour, setVentesParJour] = useState([]);
  const [topProduits, setTopProduits] = useState([]);
  const [totalVentes, setTotalVentes] = useState(0);
  const [chiffreAffaire, setChiffreAffaire] = useState(0);
  const [newProduct, setNewProduct] = useState({ reference: '', nom: '', prixVente: '', quantiteStock: '', fournisseurId: '' });
  const [refresh, setRefresh] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockTab, setStockTab] = useState('add');
  const [restockProductId, setRestockProductId] = useState('');
  const [restockQuantity, setRestockQuantity] = useState(1);
  const [restockSupplier, setRestockSupplier] = useState('');
  const [restockLoading, setRestockLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [produitEdit, setProduitEdit] = useState(null);
  const [filtreDateDebut, setFiltreDateDebut] = useState('');
  const [filtreDateFin, setFiltreDateFin] = useState('');
  const [filtreVendeur, setFiltreVendeur] = useState('');
  const [filtreProduit, setFiltreProduit] = useState('');
  const [fournisseurs, setFournisseurs] = useState([]);
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  // Modal suppression
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  useEffect(() => {
    fetchProduits();
    fetchStats();
    fetchVentes();
    fetchCAMois();
    fetchFournisseurs();
  }, [refresh]);

  const playSound = (type) => {
    if (!window.hasUserInteracted) return;
    const sounds = {
      warning: '/sounds/warning.wav',
      success: '/sounds/success.wav',
      error: '/sounds/error.wav'
    };
    if (sounds[type]) {
      const audio = new Audio(sounds[type]);
      audio.volume = 0.3;
      audio.play().catch(() => console.log('Son bloqué'));
    }
  };

  useEffect(() => {
    const markInteraction = () => {
      window.hasUserInteracted = true;
      document.removeEventListener('click', markInteraction);
    };
    document.addEventListener('click', markInteraction);
    return () => document.removeEventListener('click', markInteraction);
  }, []);

  useEffect(() => {
    if ('Notification' in window) {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  const [caMois, setCaMois] = useState(0);

const fetchCAMois = async () => {
  try {
    const res = await axios.get('http://localhost:8080/api/produits/ca-mois');
    setCaMois(res.data);
  } catch(e) { console.error(e); }
};

  const fetchProduits = async () => {
    try {
      const res = await axios.get('http://localhost:8080/api/produits');
      setProduits(res.data);
      const lowStock = res.data.filter(p => p.quantiteStock <= (p.seuilAlerte || 5));
      if (lowStock.length > 0) {
        const lastAlert = localStorage.getItem('lastLowStockAlert');
        const today = new Date().toDateString();
        if (lastAlert !== today) {
          playSound('warning');
          toast.error(`⚠️ ${lowStock.length} produit(s) en stock bas !`, {
            duration: 10000,
            position: 'top-right',
            icon: '⚠️'
          });
          if (Notification.permission === 'granted') {
            new Notification('Stock bas !', {
              body: `${lowStock.length} produit(s) ont atteint leur seuil d'alerte`,
              icon: '/logo.png'
            });
          }
          localStorage.setItem('lastLowStockAlert', today);
        }
      }
    } catch(e) { console.error(e); }
  };
  const fetchStats = async () => { try { const res = await axios.get('http://localhost:8080/api/produits/dashboard/stats'); setStats(res.data); } catch(e) { console.error(e); } };
  const fetchVentes = async () => {
    try {
      const res = await axios.get('http://localhost:8080/api/produits/ventes');
      setVentes(res.data);
      setTotalVentes(res.data.length);
      const ca = res.data.reduce((s, v) => s + (v.montantTotal || 0), 0);
      setChiffreAffaire(ca);
      const jourMap = new Map();
      res.data.forEach(v => { const jour = new Date(v.dateVente).toLocaleDateString('fr-FR'); jourMap.set(jour, (jourMap.get(jour) || 0) + v.quantite); });
      setVentesParJour(Array.from(jourMap.entries()).map(([jour, qty]) => ({ jour, quantite: qty })).slice(-30));
      const prodMap = new Map();
      res.data.forEach(v => { const nom = v.produit?.nom || 'Inconnu'; prodMap.set(nom, (prodMap.get(nom) || 0) + v.quantite); });
      setTopProduits(Array.from(prodMap.entries()).map(([nom, qty]) => ({ nom, quantite: qty })).sort((a,b)=>b.quantite-a.quantite).slice(0,5));
    } catch(e) { console.error(e); }
  };
  const fetchFournisseurs = async () => {
  try {
    const token = localStorage.getItem('token');
    const res = await axios.get('http://localhost:8080/api/fournisseurs', {
      headers: { Authorization: `Bearer ${token}` }
    });
    setFournisseurs(res.data);
  } catch (err) {
    console.error('Erreur chargement fournisseurs', err);
  }
};

  const addProduct = async (e) => {
  e.preventDefault();
  try {
    const productData = {
      reference: newProduct.reference,
      nom: newProduct.nom,
      prixVente: parseFloat(newProduct.prixVente),
      quantiteStock: parseInt(newProduct.quantiteStock),
      fournisseurId: newProduct.fournisseurId || null
    };
    
    await axios.post('http://localhost:8080/api/produits', productData);
    setRefresh(prev => prev+1);
    setNewProduct({ reference: '', nom: '', prixVente: '', quantiteStock: '', fournisseurId: '' });
    setShowStockModal(false);
    setActiveSection('stocks');  // ← AJOUTEZ CETTE LIGNE
    toast.success('Produit ajouté avec succès');
  } catch(err) {
    toast.error(err.response?.data?.error || 'Erreur');
  }
};
  const deleteProduct = async () => {
    if (!productToDelete) return;
    try {
      await axios.delete(`http://localhost:8080/api/produits/${productToDelete}`);
      setRefresh(prev => prev+1);
      toast.success('Produit supprimé');
    } catch(err) {
      toast.error(err.response?.data?.error || 'Erreur');
    } finally {
      setShowDeleteConfirm(false);
      setProductToDelete(null);
    }
  };
  const handleRestock = async (e) => {
    e.preventDefault();
    if (!restockProductId || restockQuantity < 1) {
      toast.error('Choisissez un produit et une quantité');
      return;
    }
    setRestockLoading(true);
    try {
      const res = await axios.post(`http://localhost:8080/api/produits/${restockProductId}/entree`, { quantite: restockQuantity, fournisseur: restockSupplier || 'Inconnu', note: '' });
      toast.success(`✅ Réapprovisionné ! Nouveau stock: ${res.data.nouveauStock}`);
      setRefresh(prev => prev+1);
      setRestockProductId(''); setRestockQuantity(1); setRestockSupplier('');
      setShowStockModal(false);
    } catch(err) {
      toast.error(err.response?.data?.error || 'Erreur');
    } finally {
      setRestockLoading(false);
    }
  };
 const handleUpdateProduct = async (e) => {
  e.preventDefault();  
  if (!produitEdit) return;
  try {
    const updateData = {
      reference: produitEdit.reference,
      nom: produitEdit.nom,
      prixVente: produitEdit.prixVente,
      seuilAlerte: produitEdit.seuilAlerte || 5,
      fournisseurId: produitEdit.fournisseur?.id || null
    };
    
    await axios.put(`http://localhost:8080/api/produits/${produitEdit.id}`, updateData);
    setRefresh(prev => prev + 1);
    setShowEditModal(false);
    setProduitEdit(null);
    setActiveSection('stocks');  
    toast.success('Produit modifié avec succès');
  } catch(err) {
    console.error("Erreur :", err);
    toast.error(err.response?.data?.error || 'Erreur lors de la modification');
  }
};
  const imprimerTicketGroupe = (ventesGroupe, total, vendeur) => {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text('POWERTECH ENGINEERING GROUP', 105, 20, { align: 'center' });
  doc.setFontSize(10);
  doc.text(`Date: ${new Date().toLocaleString()}`, 105, 30, { align: 'center' });
  doc.text(`Vendeur: ${vendeur}`, 105, 36, { align: 'center' });

  const tableColumn = ['Produit', 'Quantité', 'Prix unit.', 'Total'];
  const tableRows = ventesGroupe.map(v => [
    v.produit?.nom,
    v.quantite.toString(),
    `${v.prixUnitaire} FCFA`,
    `${(v.prixUnitaire * v.quantite).toLocaleString()} FCFA`
  ]);
  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 45,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [59, 130, 246] }
  });
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.text(`TOTAL : ${total.toLocaleString()} FCFA`, 105, finalY, { align: 'center' });
  doc.save(`ticket_${Date.now()}.pdf`);
};
  const menuItems = useMemo(() => {
    const items = [];
    if (role === 'ADMIN') {
      items.push({ section: 'dashboard', label: 'Dashboard', icon: '📊' }, { section: 'stocks', label: 'Gestion des stocks', icon: '📦' }, { section: 'commandes', label: 'Commandes', icon: '📦' },{ section: 'historique', label: 'Historique', icon: '📜' }, { section: 'cloture', label: 'Clôture de caisse', icon: '💰' }, { section: 'utilisateurs', label: 'Utilisateurs', icon: '👥' }, { section: 'fournisseurs', label: 'Fournisseurs', icon: '🏭' } );
    } else if (role === 'STOCK_MANAGER') {
      items.push({ section: 'dashboard', label: 'Dashboard', icon: '📊' }, { section: 'stocks', label: 'Gestion des stocks', icon: '📦' },{ section: 'commandes', label: 'Commandes', icon: '📦' }, { section: 'historique', label: 'Historique', icon: '📜' }, { section: 'cloture', label: 'Clôture de caisse', icon: '💰' },
    { section: 'fournisseurs', label: 'Fournisseurs', icon: '🏭' });
    } else if (role === 'VENDEUR') {
      items.push({ section: 'panier', label: 'Vente', icon: '🛒' }, { section: 'cloture', label: 'Clôture caisse', icon: '💰' });
    }
    return items;
  }, [role]);

  useEffect(() => { if (!activeSection && menuItems.length) setActiveSection(menuItems[0].section); }, [activeSection, menuItems]);
  const getRoleLabel = () => role === 'ADMIN' ? 'Administrateur' : role === 'STOCK_MANAGER' ? 'Gestionnaire Stock' : 'Vendeur';

  const filteredProduits = produits.filter(p => p.nom?.toLowerCase().includes(searchTerm.toLowerCase()) || p.reference?.toLowerCase().includes(searchTerm.toLowerCase()));
  const totalPages = Math.ceil(filteredProduits.length / itemsPerPage);
  const paginatedProduits = filteredProduits.slice((currentPage-1)*itemsPerPage, currentPage*itemsPerPage);
  const getVentesFiltrees = () => {
  let filtered = ventes;
  if (filtreDateDebut) {
    const debut = new Date(filtreDateDebut);
    debut.setHours(0,0,0);
    filtered = filtered.filter(v => new Date(v.dateVente) >= debut);
  }
  if (filtreDateFin) {
    const fin = new Date(filtreDateFin);
    fin.setHours(23,59,59);
    filtered = filtered.filter(v => new Date(v.dateVente) <= fin);
  }
  if (filtreVendeur) {
    filtered = filtered.filter(v => v.vendeur === filtreVendeur);
  }
  if (filtreProduit) {
    filtered = filtered.filter(v => v.produit?.nom === filtreProduit);
  }
  return filtered;
};

const exportPDF = () => {
  const ventesFiltrees = getVentesFiltrees();
  if (ventesFiltrees.length === 0) {
    toast.error('Aucune donnée à exporter');
    return;
  }
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text('Rapport des ventes - Powertech', 14, 20);
  doc.setFontSize(10);
  doc.text(`Généré le ${new Date().toLocaleString()}`, 14, 30);
  
  const tableColumn = ['Date', 'Produit', 'Quantité', 'Total (FCFA)', 'Vendeur'];
  const tableRows = ventesFiltrees.map(v => [
    new Date(v.dateVente).toLocaleString(),
    v.produit?.nom || 'N/A',
    v.quantite.toString(),
    v.montantTotal.toLocaleString(),
    v.vendeur
  ]);
  
  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 40,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] }
  });
  
  doc.save(`rapport_ventes_${new Date().toISOString().slice(0,19)}.pdf`);
};

const ventesFiltrees = getVentesFiltrees();
const groupedVentes = (() => {
  const groups = new Map();
  ventesFiltrees.forEach(v => {
    const key = v.factureId ? `facture_${v.factureId}` : `temp_${new Date(v.dateVente).toISOString().slice(0,16)}`;
    if (!groups.has(key)) groups.set(key, { ventes: [], factureId: v.factureId, date: v.dateVente, vendeur: v.vendeur });
    groups.get(key).ventes.push(v);
  });
  return Array.from(groups.values()).map(group => ({
    ...group,
    total: group.ventes.reduce((sum, v) => sum + (v.prixUnitaire * v.quantite), 0)
  }));
})();

  return (
    <div style={styles.container}>
      <Toaster position="top-right" />
      {/* ===== AJOUTE RealTimeNotification ICI ===== */}
      <RealTimeNotification />
      <div style={styles.sidebar}>
<div style={styles.sidebarHeader}>
  <div style={styles.sidebarLogoContainer}>
    <img src={logo} alt="Powertech" style={styles.sidebarLogo} />
  </div>
</div>
        <div style={styles.userCard}>
          <div style={styles.userName}>{user?.nom}</div>
          <div style={styles.userRole}>{getRoleLabel()}</div>
        </div>
        {menuItems.map(item => (
          <div key={item.section} onClick={() => setActiveSection(item.section)} style={{ ...styles.navItem, ...(activeSection === item.section ? styles.navItemActive : styles.navItemInactive) }}>
            <span>{item.icon}</span> <span>{item.label}</span>
          </div>
        ))}
        <button onClick={logout} style={styles.logoutBtn}>🚪 Déconnexion</button>
      </div>

      <div style={styles.main}>
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <img src={logo} alt="Powertech" style={styles.headerLogo} />
            <div>
              <div style={styles.headerTitle}>
                {activeSection === 'dashboard' && 'Tableau de bord'}
                {activeSection === 'stocks' && 'Gestion des stocks'}
                {activeSection === 'historique' && 'Historique des ventes'}
                {activeSection === 'panier' && 'Vente'}
                {activeSection === 'cloture' && 'Clôture de caisse'}
                {activeSection === 'utilisateurs' && 'Utilisateurs'}
                {activeSection === 'fournisseurs' && 'Gestion des fournisseurs'}
                {activeSection === 'commandes' && 'Commandes fournisseurs'}
              </div>
              <div style={styles.headerSubtitle}>{getRoleLabel()} – Dakar, Sénégal</div>
            </div>
          </div>
          <div style={styles.headerPhone}>📞 (+221) 766432045</div>
        </div>

        {activeSection === 'dashboard' && <DashboardContent stats={stats} ventesParJour={ventesParJour} topProduits={topProduits} totalVentes={totalVentes} chiffreAffaire={chiffreAffaire} caMois={caMois} produits={produits} />}

{activeSection === 'stocks' && (
  <div>
    {/* Barre de recherche et bouton */}
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
      <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
        <input
          type="text"
          placeholder="🔍 Rechercher par nom ou référence..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ ...styles.input, paddingLeft: '38px', borderRadius: '40px' }}
        />
        <span style={{ position: 'absolute', left: '14px', top: '10px', fontSize: '18px', color: '#94a3b8' }}></span>
      </div>
      <button
        onClick={() => { setStockTab('add'); setShowStockModal(true); }}
        style={{ ...styles.btnPrimary, padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '40px' }}
      >
        ➕ Nouvelle opération
      </button>
    </div>

    {/* Carte tableau des produits */}
    <div style={styles.card}>
      <div style={styles.cardTitle}>📋 Produits en stock</div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ ...styles.th, padding: '14px 12px' }}>Référence</th>
              <th style={{ ...styles.th, padding: '14px 12px' }}>Nom</th>
              <th style={{ ...styles.th, padding: '14px 12px' }}>Prix (FCFA)</th>
              <th style={{ ...styles.th, padding: '14px 12px' }}>Stock</th>
              <th style={{ ...styles.th, padding: '14px 12px' }}>Fournisseur</th>
              <th style={{ ...styles.th, padding: '14px 12px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProduits.map(p => {
              const isLowStock = p.quantiteStock <= (p.seuilAlerte || 5);
              const isRupture = p.quantiteStock === 0;
              let stockBadgeStyle = { ...styles.badge, background: '#dcfce7', color: '#166534' };
              if (isRupture) stockBadgeStyle = { ...styles.badge, background: '#fee2e2', color: '#991b1b' };
              else if (isLowStock) stockBadgeStyle = { ...styles.badge, background: '#fef3c7', color: '#92400e' };

              return (
                <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9', transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fafaf9'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td style={{ ...styles.td, fontFamily: 'monospace', fontWeight: '500' }}>{p.reference}</td>
                  <td style={{ ...styles.td, fontWeight: '600' }}>{p.nom}</td>
                  <td style={styles.td}>{p.prixVente?.toLocaleString()} FCFA</td>
                  <td style={styles.td}>
                    <span style={stockBadgeStyle}>{p.quantiteStock}</span>
                  </td>
                  <td style={styles.td}>{p.fournisseur?.nom || '-'}</td>
                  <td style={{ ...styles.td, textAlign: 'center' }}>
                    <button onClick={() => { setProduitEdit(p); setShowEditModal(true); }} style={{ background: '#3b82f6', border: 'none', color: 'white', padding: '6px 12px', borderRadius: '30px', fontSize: '12px', cursor: 'pointer', fontWeight: '500', marginRight: '8px', transition: '0.2s' }}>
                      ✏️ Modifier
                    </button>
                    <button onClick={() => { setProductToDelete(p.id); setShowDeleteConfirm(true); }} style={{ background: '#ef4444', border: 'none', color: 'white', padding: '6px 12px', borderRadius: '30px', fontSize: '12px', cursor: 'pointer', fontWeight: '500', transition: '0.2s' }}>
                      🗑️ Supprimer
                    </button>
                  </td>
                </tr>
              );
            })}
            {paginatedProduits.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Aucun produit trouvé</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '24px', paddingTop: '8px', borderTop: '1px solid #eef2f6' }}>
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p-1))}
            disabled={currentPage === 1}
            style={{ padding: '6px 14px', borderRadius: '30px', background: '#e2e8f0', border: 'none', cursor: 'pointer', fontWeight: '500', transition: '0.2s', opacity: currentPage === 1 ? 0.5 : 1 }}
            onMouseEnter={e => { if (currentPage !== 1) e.currentTarget.style.backgroundColor = '#cbd5e1'; }}
            onMouseLeave={e => { if (currentPage !== 1) e.currentTarget.style.backgroundColor = '#e2e8f0'; }}
          >
            ◀ Précédent
          </button>
          <span style={{ padding: '6px 12px', background: '#f1f5f9', borderRadius: '30px', fontSize: '14px', fontWeight: '500' }}>
            Page {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))}
            disabled={currentPage === totalPages}
            style={{ padding: '6px 14px', borderRadius: '30px', background: '#e2e8f0', border: 'none', cursor: 'pointer', fontWeight: '500', transition: '0.2s', opacity: currentPage === totalPages ? 0.5 : 1 }}
            onMouseEnter={e => { if (currentPage !== totalPages) e.currentTarget.style.backgroundColor = '#cbd5e1'; }}
            onMouseLeave={e => { if (currentPage !== totalPages) e.currentTarget.style.backgroundColor = '#e2e8f0'; }}
          >
            Suivant ▶
          </button>
        </div>
      )}
    </div>
   {/* Modals de stock */}
{showStockModal && (
  <div style={styles.modal}>
    <div style={{ ...styles.modalContent, maxWidth: '580px' }}>
      <div style={styles.flexBetween}>
        <h3>📦 Gestion des stocks</h3>
        <button onClick={() => setShowStockModal(false)} style={{ background: 'none', border: 'none', fontSize: '22px' }}>✖️</button>
      </div>
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid #e2e8f0', marginBottom: '24px' }}>
        <button onClick={() => setStockTab('add')} style={{ padding: '10px 18px', background: stockTab === 'add' ? '#3b82f6' : 'transparent', color: stockTab === 'add' ? 'white' : '#475569', border: 'none', borderRadius: '40px', fontWeight: '600' }}>➕ Ajouter</button>
        <button onClick={() => setStockTab('restock')} style={{ padding: '10px 18px', background: stockTab === 'restock' ? '#3b82f6' : 'transparent', color: stockTab === 'restock' ? 'white' : '#475569', border: 'none', borderRadius: '40px', fontWeight: '600' }}>📥 Réapprovisionner</button>
      </div>

      {/* Ajout produit avec choix du fournisseur */}
      {stockTab === 'add' && (
        <form onSubmit={addProduct}>
          <div style={styles.formGroup}><label>Référence</label><input style={styles.input} value={newProduct.reference} onChange={e => setNewProduct({...newProduct, reference: e.target.value})} required /></div>
          <div style={styles.formGroup}><label>Nom</label><input style={styles.input} value={newProduct.nom} onChange={e => setNewProduct({...newProduct, nom: e.target.value})} required /></div>
          <div style={styles.formGroup}><label>Prix (FCFA)</label><input type="number" style={styles.input} value={newProduct.prixVente} onChange={e => setNewProduct({...newProduct, prixVente: e.target.value})} required /></div>
          <div style={styles.formGroup}><label>Quantité initiale</label><input type="number" style={styles.input} value={newProduct.quantiteStock} onChange={e => setNewProduct({...newProduct, quantiteStock: e.target.value})} required /></div>

          {/* Liste déroulante des fournisseurs */}
         <div style={styles.formGroup}>
  <label style={styles.label}>Fournisseur</label>
  <select
    style={styles.input}
    value={newProduct.fournisseurId || ''}
    onChange={e => setNewProduct({...newProduct, fournisseurId: e.target.value})}
  >
    <option value="">-- Aucun --</option>
    {fournisseurs.map(f => (
      <option key={f.id} value={f.id}>{f.nom}</option>
    ))}
  </select>
</div>

          <div style={styles.gap2}>
            <button type="submit" style={styles.btnPrimary}>Ajouter</button>
            <button type="button" onClick={() => setShowStockModal(false)} style={{ ...styles.btnPrimary, background: '#94a3b8' }}>Annuler</button>
          </div>
        </form>
      )}

      {/* Réapprovisionnement (avec fournisseur optionnel) */}
      {stockTab === 'restock' && (
        <form onSubmit={handleRestock}>
          <div style={styles.formGroup}><label>Produit</label><select style={styles.input} value={restockProductId} onChange={e => setRestockProductId(parseInt(e.target.value))} required><option value="">-- Sélectionner --</option>{produits.map(p => <option key={p.id} value={p.id}>{p.nom} (Stock: {p.quantiteStock})</option>)}</select></div>
          <div style={styles.formGroup}><label>Quantité</label><input type="number" style={styles.input} value={restockQuantity} onChange={e => setRestockQuantity(parseInt(e.target.value))} min="1" required /></div>
          <div style={styles.formGroup}><label>Fournisseur</label>
            <select style={styles.input} value={restockSupplier} onChange={e => setRestockSupplier(e.target.value)}>
              <option value="">-- Sélectionner un fournisseur --</option>
              {fournisseurs.map(f => (
                <option key={f.id} value={f.nom}>{f.nom}</option>
              ))}
            </select>
          </div>
          <div style={styles.gap2}><button type="submit" style={styles.btnPrimary} disabled={restockLoading}>{restockLoading ? 'Traitement...' : 'Réapprovisionner'}</button><button type="button" onClick={() => setShowStockModal(false)} style={{ ...styles.btnPrimary, background: '#94a3b8' }}>Annuler</button></div>
        </form>
      )}
    </div>
  </div>
)}
   {showEditModal && produitEdit && (
  <div style={styles.modal}>
    <div style={{ ...styles.modalContent, maxWidth: '500px' }}>
      <div style={styles.flexBetween}>
        <h3>✏️ Modifier le produit</h3>
        <button onClick={() => { setShowEditModal(false); setProduitEdit(null); }} style={{ background: 'none', border: 'none', fontSize: '22px' }}>✖️</button>
      </div>
      <form onSubmit={handleUpdateProduct}>
        <div style={styles.formGroup}><label>Référence</label><input style={styles.input} value={produitEdit.reference} onChange={e => setProduitEdit({...produitEdit, reference: e.target.value})} required /></div>
        <div style={styles.formGroup}><label>Nom</label><input style={styles.input} value={produitEdit.nom} onChange={e => setProduitEdit({...produitEdit, nom: e.target.value})} required /></div>
        <div style={styles.formGroup}><label>Prix (FCFA)</label><input type="number" style={styles.input} value={produitEdit.prixVente} onChange={e => setProduitEdit({...produitEdit, prixVente: e.target.value})} required /></div>
        <div style={styles.formGroup}><label>Seuil alerte</label><input type="number" style={styles.input} value={produitEdit.seuilAlerte || 5} onChange={e => setProduitEdit({...produitEdit, seuilAlerte: e.target.value})} /></div>

        {/* SELECT FOURNISSEUR - DOIT ÊTRE AVANT LES BOUTONS */}
        <div style={styles.formGroup}>
          <label style={styles.label}>Fournisseur</label>
          <select
            style={styles.input}
            value={produitEdit.fournisseur?.id || ''}
            onChange={e => setProduitEdit({
              ...produitEdit,
              fournisseur: e.target.value ? { id: parseInt(e.target.value) } : null
            })}
          >
            <option value="">-- Aucun --</option>
            {fournisseurs.map(f => (
              <option key={f.id} value={f.id}>{f.nom}</option>
            ))}
          </select>
        </div>

        <div style={styles.gap2}>
          <button type="submit" style={styles.btnPrimary}>Enregistrer</button>
          <button type="button" onClick={() => { setShowEditModal(false); setProduitEdit(null); }} style={{ ...styles.btnPrimary, background: '#94a3b8' }}>Annuler</button>
        </div>
      </form>
    </div>
  </div>
)}
    <ConfirmationModal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} onConfirm={deleteProduct} title="Confirmation" message="Supprimer ce produit ?" />
  </div>
)}

      {activeSection === 'historique' && (
  <div style={styles.card}>
    <div style={styles.cardTitle}>📜 Historique des ventes</div>
    
    {/* Barre de filtres */}
    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '24px', alignItems: 'flex-end' }}>
      <div style={{ flex: 1 }}>
        <label style={styles.label}>Date début</label>
        <input type="date" value={filtreDateDebut} onChange={e => setFiltreDateDebut(e.target.value)} style={styles.input} />
      </div>
      <div style={{ flex: 1 }}>
        <label style={styles.label}>Date fin</label>
        <input type="date" value={filtreDateFin} onChange={e => setFiltreDateFin(e.target.value)} style={styles.input} />
      </div>
      <div style={{ flex: 1 }}>
        <label style={styles.label}>Vendeur</label>
        <select value={filtreVendeur} onChange={e => setFiltreVendeur(e.target.value)} style={styles.input}>
          <option value="">Tous</option>
          {[...new Set(ventes.map(v => v.vendeur))].map(v => <option key={v} value={v}>{v}</option>)}
        </select>
      </div>
      <div style={{ flex: 1 }}>
        <label style={styles.label}>Produit</label>
        <select value={filtreProduit} onChange={e => setFiltreProduit(e.target.value)} style={styles.input}>
          <option value="">Tous</option>
          {[...new Set(ventes.map(v => v.produit?.nom).filter(Boolean))].map(p => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      <button onClick={() => { setFiltreDateDebut(''); setFiltreDateFin(''); setFiltreVendeur(''); setFiltreProduit(''); }} style={{ ...styles.btnSecondary, height: '42px', padding: '0 20px' }}>Réinitialiser</button>
      <button onClick={exportPDF} style={{ ...styles.btnPrimary, height: '42px', padding: '0 20px', background: '#dc2626' }}>📄 Export PDF</button>
    </div>

    {ventes.length === 0 ? (
      <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Aucune vente</div>
    ) : groupedVentes.length === 0 ? (
      <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Aucune vente correspondant aux filtres</div>
    ) : (
      groupedVentes.map((group, idx) => (
        <div key={idx} style={{ marginBottom: '28px', border: '1px solid #edf2f7', borderRadius: '20px', overflow: 'hidden' }}>
          <div style={{ background: '#f8fafc', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div><strong>🧾 {group.factureId ? `Facture #${group.factureId}` : 'Transaction'}</strong> - {new Date(group.date).toLocaleString()}</div>
            <div><strong>Total : {group.total.toLocaleString()} FCFA</strong></div>
            <button onClick={() => imprimerTicketGroupe(group.ventes, group.total, group.vendeur)} style={{ ...styles.btnPrimary, padding: '6px 16px', fontSize: '13px' }}>🖨️ Imprimer</button>
          </div>
          <table style={styles.table}>
            <thead><tr><th style={styles.th}>Produit</th><th style={styles.th}>Qté</th><th style={styles.th}>Prix unitaire</th><th style={styles.th}>Total</th><th style={styles.th}>Vendeur</th></tr></thead>
            <tbody>
              {group.ventes.map(v => (
                <tr key={v.id}>
                  <td style={styles.td}>{v.produit?.nom}</td>
                  <td style={styles.td}>{v.quantite}</td>
                  <td style={styles.td}>{v.prixUnitaire?.toLocaleString()} FCFA</td>
                  <td style={styles.td}>{(v.prixUnitaire * v.quantite).toLocaleString()} FCFA</td>
                  <td style={styles.td}>{v.vendeur}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))
    )}
  </div>
)}

        {activeSection === 'panier' && <CartComponent produits={produits} user={user} onSaleComplete={() => setRefresh(prev => prev+1)} />}
        {activeSection === 'cloture' && <CashClosureComponent onCloture={() => setRefresh(prev => prev+1)} />}
        {activeSection === 'utilisateurs' && <UserManagementComponent />}
        {activeSection === 'fournisseurs' && <FournisseurManagement />}
        {activeSection === 'commandes' && <CommandeFournisseur />}
      </div>
    </div>
  );
}

function AppContent() {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Chargement...</div>;
  if (!user) return <Login />;
  return <StockManagement />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Route publique pour la confirmation de commande */}
        <Route path="/commande/confirmer/:token" element={<CommandeConfirmation />} />
        <Route path="/commande/accepter-modification/:token" element={<AccepterModification />} />
        <Route path="/commande/modifier/:token" element={<CommandeModification />} />
        <Route path="/confirmation-modification" element={<ConfirmationModification />} />
        <Route path="/commande/confirmer-date/:token" element={<ConfirmerDateExpedition />} />
        <Route path="/commande/rejeter-demande/:token" element={<CommandeRejeterDemande />} />
        <Route path="/commande/devis/:token" element={<DevisFournisseur />} />
        <Route path="/commande/expedition/:id" element={<ExpeditionStatus />} />
        {/* Route principale avec authentification */}
        <Route path="/*" element={
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
