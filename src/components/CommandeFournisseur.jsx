import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import ExpeditionStatus from './ExpeditionStatus';

// ==================== TOKENS PIPELINE (alignés sur DASH_TOKENS de App.js) ====================
const PIPE = {
  gray: '#94a3b8',
  blue: '#3b82f6',
  ind:  '#6366f1',
  amb:  '#f59e0b',
  grn:  '#10b981',
  rose: '#ef4444',
};

const STAGE_META = [
  { key: 'demande',   label: 'Demande',   color: PIPE.gray },
  { key: 'devis',     label: 'Devis',     color: PIPE.blue },
  { key: 'confirmee', label: 'Confirmée', color: PIPE.ind  },
  { key: 'expediee',  label: 'Expédiée',  color: PIPE.amb  },
  { key: 'livree',    label: 'Livrée',    color: PIPE.grn  },
];

const STOPPED_STATUTS = ['DEVIS_REFUSE', 'ANNULEE', 'DEMANDE_REJETEE'];

const getStageIndex = (statut) => {
  switch (statut) {
    case 'DEMANDE_CREEE': return 0;
    case 'DEVIS_ENVOYE':
    case 'MODIFICATION_ENVOYEE':
    case 'MODIFICATION_APPROUVEE': return 1;
    case 'DEVIS_VALIDE':
    case 'COMMANDE_CONFIRMEE': return 2;
    case 'EXPEDIEE': return 3;
    case 'LIVREE': return 4;
    default: return -1;
  }
};

const STATUT_META = {
  DEMANDE_CREEE:          { label: 'Demande créée',          icon: '📝', color: PIPE.gray },
  DEVIS_ENVOYE:           { label: 'Devis reçu',             icon: '📄', color: PIPE.blue },
  DEVIS_VALIDE:           { label: 'Devis validé',           icon: '✅', color: PIPE.ind  },
  DEVIS_REFUSE:           { label: 'Devis refusé',           icon: '❌', color: PIPE.rose },
  MODIFICATION_ENVOYEE:   { label: 'Modification proposée',  icon: '⚠️', color: PIPE.amb  },
  MODIFICATION_APPROUVEE: { label: 'En attente confirmation',icon: '⏳', color: PIPE.blue },
  COMMANDE_CONFIRMEE:     { label: 'Commande confirmée',     icon: '✅', color: PIPE.ind  },
  EXPEDIEE:               { label: 'Expédiée',               icon: '📦', color: PIPE.amb  },
  LIVREE:                 { label: 'Livrée',                 icon: '✅', color: PIPE.grn  },
  ANNULEE:                { label: 'Annulée',                icon: '🛑', color: PIPE.rose },
  DEMANDE_REJETEE:        { label: 'Demande rejetée',        icon: '❌', color: PIPE.rose },
};

const AVATAR_COLORS = ['#3b82f6', '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#f97316'];
const colorForName = (name = '') => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};
const initialsForName = (name = '') =>
  name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

// ==================== SOUS-COMPOSANTS VISUELS ====================
const StatutBadge = ({ statut }) => {
  const meta = STATUT_META[statut] || { label: statut, icon: '•', color: PIPE.gray };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
      background: meta.color + '1c', color: meta.color,
      border: `1px solid ${meta.color}33`,
    }}>
      <span>{meta.icon}</span>{meta.label}
    </span>
  );
};

const PipelineTrack = ({ statut }) => {
  if (STOPPED_STATUTS.includes(statut)) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: PIPE.rose, flexShrink: 0 }} />
        <span style={{ fontSize: 11, color: PIPE.rose, fontWeight: 600 }}>Arrêtée</span>
      </div>
    );
  }
  const stage = getStageIndex(statut);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }} title={STAGE_META[stage]?.label}>
      {STAGE_META.map((s, i) => (
        <div
          key={s.key}
          title={s.label}
          style={{
            width: i === stage ? 16 : 7,
            height: 7,
            borderRadius: 4,
            background: i <= stage ? s.color : 'var(--bg-badge-default)',
            transition: 'all .25s ease',
          }}
        />
      ))}
    </div>
  );
};

const SupplierChip = ({ nom }) => {
  const color = colorForName(nom || '');
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: 30, height: 30, borderRadius: 9, background: color + '22',
        color, border: `1.5px solid ${color}44`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 700, flexShrink: 0,
      }}>
        {initialsForName(nom)}
      </div>
      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{nom || '—'}</span>
    </div>
  );
};

const StatCard = ({ icon, label, value, color }) => (
  <div style={{
    flex: 1, minWidth: 140, background: 'var(--bg-card)', border: '1px solid var(--border-color)',
    borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
    transition: 'background .3s ease, border .3s ease',
  }}>
    <div style={{
      width: 38, height: 38, borderRadius: 10, background: color + '1c', color,
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0,
    }}>{icon}</div>
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.4px' }}>{label}</div>
      <div style={{ fontSize: 19, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2 }}>{value}</div>
    </div>
  </div>
);

export default function CommandeFournisseur() {
  const [commandes, setCommandes] = useState([]);
  const [fournisseurs, setFournisseurs] = useState([]);
  const [produits, setProduits] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDevisModal, setShowDevisModal] = useState(false);
  const [showModifModal, setShowModifModal] = useState(false);
  const [selectedCommande, setSelectedCommande] = useState(null);
  const [selectedLignes, setSelectedLignes] = useState([]);
  const [commandeDevis, setCommandeDevis] = useState(null);
  const [devisDetail, setDevisDetail] = useState(null);
  const [commandeModif, setCommandeModif] = useState(null);
  const [modificationsDetail, setModificationsDetail] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  const [newProductTemp, setNewProductTemp] = useState({
    reference: '', nom: '', marque: '', prixVente: '', prixAchat: '', quantiteStock: 0
  });
  const [newCommande, setNewCommande] = useState({ fournisseurId: '', numero: '', commentaire: '', lignes: [] });
  const [ligneTemp, setLigneTemp] = useState({ produitId: '', marque: '', quantite: 1 });

  const generateNumeroCommande = () => {
    const now = new Date();
    const annee = now.getFullYear();
    const commandesAnnee = commandes.filter(c => c.numero && c.numero.startsWith(`CMD-${annee}-`));
    const nextNum = commandesAnnee.length + 1;
    return `CMD-${annee}-${nextNum.toString().padStart(4, '0')}`;
  };

  useEffect(() => { fetchCommandes(); fetchFournisseurs(); fetchProduits(); }, []);

  useEffect(() => {
    if (showModal) setNewCommande(prev => ({ ...prev, numero: generateNumeroCommande() }));
  }, [showModal, commandes]);

  const fetchCommandes = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:8080/api/commandes', { headers: { Authorization: `Bearer ${token}` } });
      setCommandes(res.data);
    } catch (err) { console.error('Erreur chargement commandes', err); }
  };

  const [showDateModal, setShowDateModal] = useState(false);
  const [commandeDate, setCommandeDate] = useState(null);
  const [dateExpeditionProposee, setDateExpeditionProposee] = useState('');

  const openDateExpeditionModal = (commande) => { setCommandeDate(commande); setShowDateModal(true); };

  const proposerDateExpedition = async () => {
    if (!dateExpeditionProposee) { toast.error('Veuillez sélectionner une date'); return; }
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:8080/api/commandes/${commandeDate.id}/proposer-date`, { dateExpedition: dateExpeditionProposee }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Date d\'expédition proposée avec succès');
      setShowDateModal(false);
      fetchCommandes();
    } catch (err) { toast.error('Erreur'); }
  };

  const fetchFournisseurs = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:8080/api/fournisseurs', { headers: { Authorization: `Bearer ${token}` } });
      setFournisseurs(res.data);
    } catch (err) { console.error('Erreur chargement fournisseurs', err); }
  };

  const fetchProduits = async () => {
    try {
      const res = await axios.get('http://localhost:8080/api/produits');
      setProduits(res.data);
    } catch (err) { console.error('Erreur chargement produits', err); }
  };

  const fetchDevisDetail = async (commandeId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:8080/api/commandes/${commandeId}/devis-detail`, { headers: { Authorization: `Bearer ${token}` } });
      setDevisDetail(res.data);
    } catch (err) { console.error('Erreur chargement devis', err); }
  };

  const createProductAndAddToCommande = async () => {
    if (!newProductTemp.reference || !newProductTemp.nom || !newProductTemp.prixVente) {
      toast.error('Veuillez remplir la référence, le nom et le prix de vente'); return;
    }
    try {
      const productData = {
        reference: newProductTemp.reference, nom: newProductTemp.nom, marque: newProductTemp.marque || '',
        prixVente: parseFloat(newProductTemp.prixVente),
        prixAchat: newProductTemp.prixAchat ? parseFloat(newProductTemp.prixAchat) : null,
        quantiteStock: 0
      };
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:8080/api/produits', productData, { headers: { Authorization: `Bearer ${token}` } });
      const nouveauProduit = res.data;
      toast.success('Produit créé avec succès');
      const updatedProduits = await axios.get('http://localhost:8080/api/produits');
      setProduits(updatedProduits.data);
      setLigneTemp({ produitId: nouveauProduit.id, marque: nouveauProduit.marque || '', quantite: 1 });
      setShowNewProductModal(false);
      setNewProductTemp({ reference: '', nom: '', marque: '', prixVente: '', prixAchat: '', quantiteStock: 0 });
    } catch (err) { toast.error(err.response?.data?.error || 'Erreur création produit'); }
  };

  const ajouterLigne = () => {
    const produitId = parseInt(ligneTemp.produitId);
    const quantite = parseInt(ligneTemp.quantite);
    if (isNaN(produitId) || produitId <= 0) { toast.error('Veuillez sélectionner un produit'); return; }
    if (isNaN(quantite) || quantite <= 0) { toast.error('La quantité doit être supérieure à 0'); return; }
    const produit = produits.find(p => p.id === produitId);
    if (!produit) { toast.error('Produit non trouvé'); return; }
    setNewCommande(prev => ({
      ...prev,
      lignes: [...prev.lignes, {
        produitId, produitNom: produit.nom, marque: ligneTemp.marque || produit.marque || 'Non spécifiée',
        quantite, prixUnitaire: 0, sousTotal: 0
      }]
    }));
    setLigneTemp({ produitId: '', marque: '', quantite: 1 });
    toast.success('Produit ajouté à la commande');
  };

  const retirerLigne = (index) => setNewCommande(prev => ({ ...prev, lignes: prev.lignes.filter((_, i) => i !== index) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newCommande.fournisseurId) { toast.error('Veuillez sélectionner un fournisseur'); return; }
    if (newCommande.lignes.length === 0) { toast.error('Ajoutez au moins un produit'); return; }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const commandeData = {
        fournisseurId: parseInt(newCommande.fournisseurId), numero: newCommande.numero, commentaire: newCommande.commentaire,
        lignes: newCommande.lignes.map(l => ({ produitId: l.produitId, quantite: l.quantite, prixUnitaire: 0, marque: l.marque || '' }))
      };
      await axios.post('http://localhost:8080/api/commandes', commandeData, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('✅ Demande de devis créée avec succès');
      setShowModal(false);
      setNewCommande({ fournisseurId: '', numero: '', commentaire: '', lignes: [] });
      fetchCommandes();
    } catch (err) { toast.error(err.response?.data?.error || 'Erreur lors de la création'); }
    finally { setLoading(false); }
  };

  const updateStatut = async (commandeId, nouveauStatut) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:8080/api/commandes/${commandeId}/statut`, { statut: nouveauStatut }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(`Statut mis à jour : ${nouveauStatut}`);
      fetchCommandes();
    } catch (err) { toast.error(err.response?.data?.error || 'Erreur'); }
  };

  const openDetailModal = async (commande) => {
    setSelectedCommande(commande);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:8080/api/commandes/${commande.id}/lignes`, { headers: { Authorization: `Bearer ${token}` } });
      setSelectedLignes(res.data);
      setShowDetailModal(true);
    } catch (err) { toast.error('Erreur chargement des détails'); }
  };

  const openDevisModal = async (commande) => {
    setCommandeDevis(commande);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:8080/api/commandes/${commande.id}/devis-detail`, { headers: { Authorization: `Bearer ${token}` } });
      setDevisDetail(res.data);
      setShowDevisModal(true);
    } catch (err) { toast.error('Erreur chargement du devis'); }
  };

  const openModificationModal = async (commande) => {
    setCommandeModif(commande);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:8080/api/commandes/${commande.id}/modifications`, { headers: { Authorization: `Bearer ${token}` } });
      setModificationsDetail(res.data);
      setShowModifModal(true);
    } catch (err) { toast.error('Erreur chargement des modifications'); }
  };

  const validerDevis = async (commandeId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:8080/api/commandes/${commandeId}/valider-devis`, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('✅ Devis validé, commande confirmée !');
      setShowDevisModal(false);
      fetchCommandes();
    } catch (err) { toast.error('Erreur lors de la validation'); }
  };

  const refuserDevis = async (commandeId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:8080/api/commandes/${commandeId}/refuser-devis`, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('❌ Devis refusé');
      setShowDevisModal(false);
      fetchCommandes();
    } catch (err) { toast.error('Erreur lors du refus'); }
  };

  const approuverModification = async (commandeId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:8080/api/commandes/${commandeId}/approuver-modification`, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('✅ Modification approuvée');
      setShowModifModal(false);
      fetchCommandes();
    } catch (err) { toast.error('Erreur lors de l\'approbation'); }
  };

  const refuserModification = async (commandeId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:8080/api/commandes/${commandeId}/refuser-modification`, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('❌ Modification refusée');
      setShowModifModal(false);
      fetchCommandes();
    } catch (err) { toast.error('Erreur lors du refus'); }
  };

  const envoyerEmailCommande = async (commandeId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:8080/api/commandes/${commandeId}/envoyer-email`, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('📧 Demande de devis envoyée au fournisseur');
    } catch (err) { toast.error(err.response?.data?.error || 'Erreur lors de l\'envoi'); }
  };

  // ===== STYLES =====
  const styles = {
    page: { display: 'flex', flexDirection: 'column', gap: 20 },
    card: { background: 'var(--bg-card)', borderRadius: '20px', padding: '24px', boxShadow: 'var(--shadow)', border: '1px solid var(--border-color)', transition: 'background 0.3s ease, border 0.3s ease' },
    cardTitle: { fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', transition: 'color 0.3s ease' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '13px 14px', background: 'var(--bg-table-header)', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', textTransform: 'uppercase', letterSpacing: '.4px', transition: 'background 0.3s ease, color 0.3s ease' },
    td: { padding: '14px', borderBottom: '1px solid var(--border-color)', fontSize: '14px', color: 'var(--text-primary)', transition: 'color 0.3s ease, border 0.3s ease' },
    btnPrimary: { background: '#3b82f6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '40px', cursor: 'pointer', fontWeight: '600', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8, height: 44 },
    btnSecondary: { background: 'var(--bg-btn-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', padding: '6px 12px', borderRadius: '30px', cursor: 'pointer', fontWeight: '500', fontSize: '12px', transition: 'background 0.3s ease, color 0.3s ease' },
    btnSuccess: { background: '#10b981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '30px', cursor: 'pointer', fontWeight: '500', fontSize: '12px' },
    btnWarning: { background: '#f59e0b', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '30px', cursor: 'pointer', fontWeight: '500', fontSize: '12px' },
    btnDanger: { background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '30px', cursor: 'pointer', fontWeight: '500', fontSize: '12px' },
    input: { width: '100%', padding: '10px 12px', border: '1px solid var(--input-border)', borderRadius: '12px', fontSize: '14px', background: 'var(--bg-input)', color: 'var(--text-primary)', transition: 'background 0.3s ease, color 0.3s ease, border 0.3s ease' },
    label: { display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)', transition: 'color 0.3s ease' },
    formGroup: { marginBottom: '16px' },
    modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
    modalContent: { background: 'var(--bg-card)', borderRadius: '24px', padding: '28px', width: '700px', maxWidth: '90%', maxHeight: '80vh', overflowY: 'auto', border: '1px solid var(--border-color)', transition: 'background 0.3s ease, border 0.3s ease' },
    flexBetween: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
    gap2: { display: 'flex', gap: '12px' },
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
    ligneItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', background: 'var(--bg-table-row-hover)', borderRadius: '12px', marginBottom: '8px', transition: 'background 0.3s ease' },
    paginationButton: { padding: '8px 16px', borderRadius: '30px', border: 'none', cursor: 'pointer', fontWeight: '500', transition: 'background 0.3s ease, opacity 0.3s ease' },
    paginationText: { padding: '8px 16px', background: 'var(--bg-table-header)', borderRadius: '30px', fontSize: '14px', fontWeight: '500', color: 'var(--text-secondary)', transition: 'background 0.3s ease, color 0.3s ease' }
  };

  // ===== STATS =====
  const stats = useMemo(() => {
    const enAttente = commandes.filter(c => ['DEMANDE_CREEE', 'DEVIS_ENVOYE', 'MODIFICATION_ENVOYEE', 'MODIFICATION_APPROUVEE'].includes(c.statut)).length;
    const expediees = commandes.filter(c => c.statut === 'EXPEDIEE').length;
    const livrees = commandes.filter(c => c.statut === 'LIVREE').length;
    const montantTotal = commandes.reduce((s, c) => s + (c.montantTotal || 0), 0);
    return { total: commandes.length, enAttente, expediees, livrees, montantTotal };
  }, [commandes]);

  // ===== FILTRE + PAGINATION =====
  const filteredCommandes = useMemo(() => {
    if (!searchTerm.trim()) return commandes;
    const q = searchTerm.toLowerCase();
    return commandes.filter(c =>
      c.numero?.toLowerCase().includes(q) || c.fournisseur?.nom?.toLowerCase().includes(q)
    );
  }, [commandes, searchTerm]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCommandes = filteredCommandes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCommandes.length / itemsPerPage);

  useEffect(() => { if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages); }, [filteredCommandes.length]);
  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  const fmtFCFA = (v) => (v || 0).toLocaleString('fr-FR');

  return (
    <div style={styles.page}>
      {/* ===== STATS ===== */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <StatCard icon="📦" label="Commandes" value={stats.total} color={PIPE.blue} />
        <StatCard icon="⏳" label="En attente" value={stats.enAttente} color={PIPE.amb} />
        <StatCard icon="🚚" label="Expédiées" value={stats.expediees} color={PIPE.ind} />
        <StatCard icon="✅" label="Livrées" value={stats.livrees} color={PIPE.grn} />
      </div>

      <div style={styles.card}>
        {/* ===== HEADER / RECHERCHE ===== */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={styles.cardTitle}>📦 Gestion des commandes</div>
            <div style={{ position: 'relative', minWidth: 260 }}>
              <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 15 }}>🔍</span>
              <input
                type="text"
                placeholder="Rechercher par n° ou fournisseur..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ ...styles.input, paddingLeft: 42, borderRadius: 40, height: 40 }}
              />
            </div>
          </div>
          <button style={styles.btnPrimary} onClick={() => setShowModal(true)}>➕ Nouvelle demande</button>
        </div>

        {/* ===== TABLEAU ===== */}
        <div style={{ overflowX: 'auto', borderRadius: 16, border: '1px solid var(--border-color)' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>N° Commande</th>
                <th style={styles.th}>Fournisseur</th>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Montant</th>
                <th style={styles.th}>Statut</th>
                <th style={styles.th}>Suivi</th>
                <th style={styles.th}>Produits</th>
                <th style={styles.th}>Actions</th>
                <th style={styles.th}>Expédition</th>
              </tr>
            </thead>
            <tbody>
              {currentCommandes.map(c => (
                <tr
                  key={c.id}
                  style={{ transition: '0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-table-row-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={styles.td}><span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{c.numero}</span></td>
                  <td style={styles.td}><SupplierChip nom={c.fournisseur?.nom} /></td>
                  <td style={styles.td}>{new Date(c.dateCommande).toLocaleDateString('fr-FR')}</td>
                  <td style={styles.td}><strong>{fmtFCFA(c.montantTotal)}</strong> <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>FCFA</span></td>
                  <td style={styles.td}><StatutBadge statut={c.statut} /></td>
                  <td style={styles.td}><PipelineTrack statut={c.statut} /></td>
                  <td style={styles.td}>
                    <button style={styles.btnSecondary} onClick={() => openDetailModal(c)}>📋 Détails</button>
                  </td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {c.statut === 'DEMANDE_CREEE' && (
                        <button style={styles.btnPrimary2 || { ...styles.btnPrimary, padding: '6px 14px', height: 'auto', fontSize: 12 }} onClick={() => envoyerEmailCommande(c.id)}>📧 Envoyer demande</button>
                      )}
                      {c.statut === 'MODIFICATION_ENVOYEE' && (
                        <>
                          <button style={styles.btnWarning} onClick={() => openModificationModal(c)}>📋 Voir modification</button>
                          <button style={styles.btnSuccess} onClick={() => approuverModification(c.id)}>✅ Approuver</button>
                          <button style={styles.btnDanger} onClick={() => refuserModification(c.id)}>❌ Refuser</button>
                        </>
                      )}
                      {c.statut === 'DEVIS_ENVOYE' && (
                        <>
                          <button style={styles.btnWarning} onClick={() => openDevisModal(c)}>📄 Voir devis</button>
                          <button style={styles.btnSuccess} onClick={() => validerDevis(c.id)}>✅ Valider devis</button>
                          <button style={styles.btnDanger} onClick={() => refuserDevis(c.id)}>❌ Refuser devis</button>
                        </>
                      )}
                      {(c.statut === 'DEVIS_VALIDE' || c.statut === 'COMMANDE_CONFIRMEE') && (
                        <>
                          <button style={styles.btnWarning} onClick={() => updateStatut(c.id, 'EXPEDIEE')}>📦 Expédier</button>
                          {!c.dateExpeditionProposee && (
                            <button style={{ ...styles.btnPrimary, padding: '6px 14px', height: 'auto', fontSize: 12 }} onClick={() => openDateExpeditionModal(c)}>📅 Proposer date</button>
                          )}
                        </>
                      )}
                      {c.statut === 'EXPEDIEE' && (
                        <button style={styles.btnSuccess} onClick={() => updateStatut(c.id, 'LIVREE')}>✅ Livrer</button>
                      )}
                    </div>
                  </td>
                  <td style={styles.td}><ExpeditionStatus commandeId={c.id} /></td>
                </tr>
              ))}
              {currentCommandes.length === 0 && (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
                    {searchTerm ? 'Aucune commande ne correspond à votre recherche' : 'Aucune commande pour le moment'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ===== PAGINATION ===== */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{ ...styles.paginationButton, background: currentPage === 1 ? 'var(--bg-btn-secondary)' : 'var(--bg-table-header)', opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: 'var(--text-secondary)' }}
            >◀ Précédent</button>
            <span style={styles.paginationText}>Page {currentPage} / {totalPages}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{ ...styles.paginationButton, background: currentPage === totalPages ? 'var(--bg-btn-secondary)' : 'var(--bg-table-header)', opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', color: 'var(--text-secondary)' }}
            >Suivant ▶</button>
          </div>
        )}
      </div>

      {/* MODAL DÉTAILS PRODUITS */}
      {showDetailModal && selectedCommande && (
        <div style={styles.modal}>
          <div style={{ ...styles.modalContent, maxWidth: '600px' }}>
            <div style={styles.flexBetween}>
              <h3 style={{ color: 'var(--text-primary)' }}>📋 Détails de la commande {selectedCommande.numero}</h3>
              <button onClick={() => setShowDetailModal(false)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: 'var(--text-primary)' }}>✖️</button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Produit</th><th style={styles.th}>Marque</th><th style={styles.th}>Quantité</th><th style={styles.th}>Prix unitaire</th><th style={styles.th}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedLignes.map(l => (
                    <tr key={l.id}>
                      <td style={styles.td}>{l.produit?.nom}</td>
                      <td style={styles.td}>{l.marque || '-'}</td>
                      <td style={styles.td}>{l.quantite}</td>
                      <td style={styles.td}>{l.prixUnitaire?.toLocaleString()} FCFA</td>
                      <td style={styles.td}>{l.sousTotal?.toLocaleString()} FCFA</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--text-primary)' }}>Total :</td>
                    <td style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{selectedCommande.montantTotal?.toLocaleString()} FCFA</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DEVIS */}
      {showDevisModal && commandeDevis && devisDetail && (
        <div style={styles.modal}>
          <div style={{ ...styles.modalContent, maxWidth: '700px' }}>
            <div style={styles.flexBetween}>
              <h3 style={{ color: 'var(--text-primary)' }}>📄 Devis reçu</h3>
              <button onClick={() => setShowDevisModal(false)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: 'var(--text-primary)' }}>✖️</button>
            </div>
            <p style={{ color: 'var(--text-primary)' }}><strong>Commande N° :</strong> {commandeDevis.numero}</p>
            <p style={{ color: 'var(--text-primary)' }}><strong>Fournisseur :</strong> {commandeDevis.fournisseur?.nom}</p>
            <table style={styles.table}>
              <thead>
                <tr><th style={styles.th}>Produit</th><th style={styles.th}>Quantité</th><th style={styles.th}>Prix unitaire</th><th style={styles.th}>Total</th></tr>
              </thead>
              <tbody>
                {devisDetail.lignes?.map((ligne, idx) => (
                  <tr key={idx}>
                    <td style={styles.td}>{ligne.produitNom}</td>
                    <td style={styles.td}>{ligne.quantite}</td>
                    <td style={styles.td}>{ligne.prixUnitaire?.toLocaleString()} FCFA</td>
                    <td style={styles.td}>{ligne.sousTotal?.toLocaleString()} FCFA</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr><td colSpan="3" style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--text-primary)' }}>Sous-total :</td><td style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{devisDetail.sousTotal?.toLocaleString()} FCFA</td></tr>
                <tr><td colSpan="3" style={{ textAlign: 'right', color: 'var(--text-primary)' }}>Frais de transport :</td><td style={{ color: 'var(--text-primary)' }}>{devisDetail.fraisTransport?.toLocaleString()} FCFA</td></tr>
                <tr><td colSpan="3" style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--text-primary)' }}>Total :</td><td style={{ fontWeight: 'bold', color: '#f97316' }}>{devisDetail.total?.toLocaleString()} FCFA</td></tr>
                <tr><td colSpan="4" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Délai de livraison : {devisDetail.delaiLivraison} jours</td></tr>
              </tfoot>
            </table>
            <div style={{ marginTop: '20px', textAlign: 'center', display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button style={{ ...styles.btnSuccess, padding: '10px 24px' }} onClick={() => validerDevis(commandeDevis.id)}>✅ Valider le devis</button>
              <button style={{ ...styles.btnDanger, padding: '10px 24px' }} onClick={() => refuserDevis(commandeDevis.id)}>❌ Refuser le devis</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL MODIFICATIONS PROPOSÉES */}
      {showModifModal && commandeModif && modificationsDetail && (
        <div style={styles.modal}>
          <div style={{ ...styles.modalContent, maxWidth: '700px' }}>
            <div style={styles.flexBetween}>
              <h3 style={{ color: 'var(--text-primary)' }}>📋 Modifications proposées</h3>
              <button onClick={() => setShowModifModal(false)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: 'var(--text-primary)' }}>✖️</button>
            </div>
            <p style={{ color: 'var(--text-primary)' }}><strong>Commande N° :</strong> {commandeModif.numero}</p>
            <p style={{ color: 'var(--text-primary)' }}><strong>Fournisseur :</strong> {commandeModif.fournisseur?.nom}</p>
            <div style={{ background: 'var(--bg-table-row-hover)', padding: '12px', borderRadius: '8px', marginBottom: '20px', color: 'var(--text-primary)' }}>
              <strong>📝 Commentaire du fournisseur :</strong><br />{modificationsDetail.commentaire || 'Aucun commentaire'}
            </div>
            <table style={styles.table}>
              <thead>
                <tr><th style={styles.th}>Produit</th><th style={styles.th}>Quantité initiale</th><th style={styles.th}>Quantité proposée</th><th style={styles.th}>Prix initial</th><th style={styles.th}>Prix proposé</th></tr>
              </thead>
              <tbody>
                {modificationsDetail.lignes?.map((ligne, idx) => (
                  <tr key={idx}>
                    <td style={styles.td}>{ligne.produitNom}</td>
                    <td style={styles.td}>{ligne.quantiteCommandee}</td>
                    <td style={{ ...styles.td, color: (ligne.quantiteProposee || 0) !== ligne.quantiteCommandee ? '#f97316' : 'var(--text-primary)' }}>{ligne.quantiteProposee || 0}</td>
                    <td style={styles.td}>{ligne.prixInitial?.toLocaleString()} FCFA</td>
                    <td style={{ ...styles.td, color: (ligne.prixPropose || 0) !== ligne.prixInitial ? '#f97316' : 'var(--text-primary)' }}>{ligne.prixPropose?.toLocaleString() || 0} FCFA</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: '20px', textAlign: 'center', display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button style={{ ...styles.btnSuccess, padding: '10px 24px' }} onClick={() => approuverModification(commandeModif.id)}>✅ Approuver les modifications</button>
              <button style={{ ...styles.btnDanger, padding: '10px 24px' }} onClick={() => refuserModification(commandeModif.id)}>❌ Refuser les modifications</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DATE D'EXPÉDITION */}
      {showDateModal && commandeDate && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.flexBetween}>
              <h3 style={{ color: 'var(--text-primary)' }}>📅 Proposer une date d'expédition</h3>
              <button onClick={() => setShowDateModal(false)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: 'var(--text-primary)' }}>✖️</button>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Date d'expédition proposée</label>
              <input type="datetime-local" style={styles.input} value={dateExpeditionProposee} onChange={e => setDateExpeditionProposee(e.target.value)} />
            </div>
            <div style={styles.gap2}>
              <button style={styles.btnPrimary} onClick={proposerDateExpedition}>📤 Proposer la date</button>
              <button style={styles.btnSecondary} onClick={() => setShowDateModal(false)}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NOUVELLE COMMANDE */}
      {showModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.flexBetween}>
              <h3 style={{ color: 'var(--text-primary)' }}>📝 Nouvelle demande de devis</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: 'var(--text-primary)' }}>✖️</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={styles.grid2}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Fournisseur *</label>
                  <select style={styles.input} value={newCommande.fournisseurId} onChange={e => setNewCommande({ ...newCommande, fournisseurId: e.target.value })} required>
                    <option value="">-- Sélectionner --</option>
                    {fournisseurs.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>N° Commande</label>
                  <input style={styles.input} value={newCommande.numero} disabled />
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Commentaire</label>
                <input style={styles.input} placeholder="Optionnel" value={newCommande.commentaire} onChange={e => setNewCommande({ ...newCommande, commentaire: e.target.value })} />
              </div>

              <div style={{ ...styles.card, padding: '16px', marginBottom: '16px' }}>
                <div style={styles.cardTitle}>🛒 Ajouter un produit</div>
                <div style={styles.grid2}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <select style={{ ...styles.input, flex: 1 }} value={ligneTemp.produitId} onChange={e => setLigneTemp({ ...ligneTemp, produitId: e.target.value })}>
                      <option value="">-- Choisir --</option>
                      {produits.map(p => <option key={p.id} value={p.id}>{p.nom} - {p.marque || 'Sans marque'} - Stock: {p.quantiteStock}</option>)}
                    </select>
                    <button type="button" style={styles.btnPrimary} onClick={() => setShowNewProductModal(true)}>➕ Nouveau</button>
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Marque</label>
                    <input type="text" style={styles.input} value={ligneTemp.marque} onChange={e => setLigneTemp({ ...ligneTemp, marque: e.target.value })} placeholder="DELL, HP, SAMSUNG..." />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Quantité</label>
                    <input type="number" style={styles.input} value={ligneTemp.quantite} onChange={e => setLigneTemp({ ...ligneTemp, quantite: e.target.value })} min="1" />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button type="button" style={styles.btnPrimary} onClick={ajouterLigne}>➕ Ajouter</button>
                  </div>
                </div>
              </div>

              {newCommande.lignes.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={styles.cardTitle}>📋 Produits demandés</div>
                  {newCommande.lignes.map((l, idx) => (
                    <div key={idx} style={styles.ligneItem}>
                      <div style={{ flex: 2, color: 'var(--text-primary)' }}><strong>{l.produitNom}</strong> ({l.marque || 'Sans marque'})</div>
                      <div style={{ flex: 1, textAlign: 'center', color: 'var(--text-primary)' }}>{l.quantite} unités</div>
                      <div style={{ flex: 1, textAlign: 'right', color: 'var(--text-primary)' }}>Prix à définir</div>
                      <button type="button" style={{ ...styles.btnDanger, marginLeft: '12px', padding: '4px 8px' }} onClick={() => retirerLigne(idx)}>🗑️</button>
                    </div>
                  ))}
                </div>
              )}

              <div style={styles.gap2}>
                <button type="submit" style={styles.btnPrimary} disabled={loading}>{loading ? 'Création...' : '📤 Créer la demande'}</button>
                <button type="button" onClick={() => setShowModal(false)} style={{ ...styles.btnPrimary, background: '#94a3b8' }}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CRÉATION RAPIDE DE PRODUIT */}
      {showNewProductModal && (
        <div style={styles.modal}>
          <div style={{ ...styles.modalContent, maxWidth: '450px' }}>
            <div style={styles.flexBetween}>
              <h3 style={{ color: 'var(--text-primary)' }}>➕ Nouveau produit</h3>
              <button onClick={() => setShowNewProductModal(false)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: 'var(--text-primary)' }}>✖️</button>
            </div>
            <div style={styles.formGroup}><label style={styles.label}>Référence *</label><input style={styles.input} value={newProductTemp.reference} onChange={e => setNewProductTemp({ ...newProductTemp, reference: e.target.value })} /></div>
            <div style={styles.formGroup}><label style={styles.label}>Nom *</label><input style={styles.input} value={newProductTemp.nom} onChange={e => setNewProductTemp({ ...newProductTemp, nom: e.target.value })} /></div>
            <div style={styles.formGroup}><label style={styles.label}>Marque</label><input style={styles.input} value={newProductTemp.marque} onChange={e => setNewProductTemp({ ...newProductTemp, marque: e.target.value })} placeholder="DELL, HP, SAMSUNG..." /></div>
            <div style={styles.formGroup}><label style={styles.label}>Prix de vente (FCFA) *</label><input type="number" style={styles.input} value={newProductTemp.prixVente} onChange={e => setNewProductTemp({ ...newProductTemp, prixVente: e.target.value })} /></div>
            <div style={styles.gap2}>
              <button style={styles.btnPrimary} onClick={createProductAndAddToCommande}>Créer et ajouter</button>
              <button style={styles.btnSecondary} onClick={() => setShowNewProductModal(false)}>Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}