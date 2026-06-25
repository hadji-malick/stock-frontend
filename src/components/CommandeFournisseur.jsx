import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import ExpeditionStatus from './ExpeditionStatus';

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
  
  // ===== PAGINATION =====
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  
  const [newProductTemp, setNewProductTemp] = useState({
    reference: '',
    nom: '',
    marque: '',
    prixVente: '',
    prixAchat: '',
    quantiteStock: 0
  });
  
  const [newCommande, setNewCommande] = useState({
    fournisseurId: '',
    numero: '',
    commentaire: '',
    lignes: []
  });
  
  const [ligneTemp, setLigneTemp] = useState({
    produitId: '',
    marque: '',
    quantite: 1
  });

  // Générer le numéro de commande automatique
  const generateNumeroCommande = () => {
    const now = new Date();
    const annee = now.getFullYear();
    const commandesAnnee = commandes.filter(c => c.numero && c.numero.startsWith(`CMD-${annee}-`));
    const nextNum = commandesAnnee.length + 1;
    return `CMD-${annee}-${nextNum.toString().padStart(4, '0')}`;
  };

  useEffect(() => {
    fetchCommandes();
    fetchFournisseurs();
    fetchProduits();
  }, []);

  useEffect(() => {
    if (showModal) {
      setNewCommande(prev => ({
        ...prev,
        numero: generateNumeroCommande()
      }));
    }
  }, [showModal, commandes]);

  const fetchCommandes = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:8080/api/commandes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCommandes(res.data);
    } catch (err) {
      console.error('Erreur chargement commandes', err);
    }
  };

  const [showDateModal, setShowDateModal] = useState(false);
  const [commandeDate, setCommandeDate] = useState(null);
  const [dateExpeditionProposee, setDateExpeditionProposee] = useState('');

  const openDateExpeditionModal = (commande) => {
    setCommandeDate(commande);
    setShowDateModal(true);
  };

  const proposerDateExpedition = async () => {
    if (!dateExpeditionProposee) {
      toast.error('Veuillez sélectionner une date');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:8080/api/commandes/${commandeDate.id}/proposer-date`, {
        dateExpedition: dateExpeditionProposee
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Date d\'expédition proposée avec succès');
      setShowDateModal(false);
      fetchCommandes();
    } catch (err) {
      toast.error('Erreur');
    }
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

  const fetchProduits = async () => {
    try {
      const res = await axios.get('http://localhost:8080/api/produits');
      setProduits(res.data);
    } catch (err) {
      console.error('Erreur chargement produits', err);
    }
  };

  const fetchLignesCommande = async (commandeId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:8080/api/commandes/${commandeId}/lignes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedLignes(res.data);
    } catch (err) {
      console.error('Erreur chargement lignes', err);
    }
  };

  const fetchDevisDetail = async (commandeId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:8080/api/commandes/${commandeId}/devis-detail`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDevisDetail(res.data);
    } catch (err) {
      console.error('Erreur chargement devis', err);
    }
  };

  const createProductAndAddToCommande = async () => {
    if (!newProductTemp.reference || !newProductTemp.nom || !newProductTemp.prixVente) {
      toast.error('Veuillez remplir la référence, le nom et le prix de vente');
      return;
    }
    try {
      const productData = {
        reference: newProductTemp.reference,
        nom: newProductTemp.nom,
        marque: newProductTemp.marque || '',
        prixVente: parseFloat(newProductTemp.prixVente),
        prixAchat: newProductTemp.prixAchat ? parseFloat(newProductTemp.prixAchat) : null,
        quantiteStock: 0
      };
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:8080/api/produits', productData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const nouveauProduit = res.data;
      toast.success('Produit créé avec succès');
      
      const updatedProduits = await axios.get('http://localhost:8080/api/produits');
      setProduits(updatedProduits.data);
      
      setLigneTemp({
        produitId: nouveauProduit.id,
        marque: nouveauProduit.marque || '',
        quantite: 1
      });
      
      setShowNewProductModal(false);
      setNewProductTemp({ reference: '', nom: '', marque: '', prixVente: '', prixAchat: '', quantiteStock: 0 });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur création produit');
    }
  };

  const ajouterLigne = () => {
    const produitId = parseInt(ligneTemp.produitId);
    const quantite = parseInt(ligneTemp.quantite);
    
    if (isNaN(produitId) || produitId <= 0) {
      toast.error('Veuillez sélectionner un produit');
      return;
    }
    if (isNaN(quantite) || quantite <= 0) {
      toast.error('La quantité doit être supérieure à 0');
      return;
    }
    
    const produit = produits.find(p => p.id === produitId);
    if (!produit) {
      toast.error('Produit non trouvé');
      return;
    }
    
    setNewCommande(prev => ({
      ...prev,
      lignes: [...prev.lignes, {
        produitId: produitId,
        produitNom: produit.nom,
        marque: ligneTemp.marque || produit.marque || 'Non spécifiée',
        quantite: quantite,
        prixUnitaire: 0,
        sousTotal: 0
      }]
    }));
    
    setLigneTemp({ produitId: '', marque: '', quantite: 1 });
    toast.success('Produit ajouté à la commande');
  };

  const retirerLigne = (index) => {
    setNewCommande(prev => ({
      ...prev,
      lignes: prev.lignes.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newCommande.fournisseurId) {
      toast.error('Veuillez sélectionner un fournisseur');
      return;
    }
    if (newCommande.lignes.length === 0) {
      toast.error('Ajoutez au moins un produit');
      return;
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const commandeData = {
        fournisseurId: parseInt(newCommande.fournisseurId),
        numero: newCommande.numero,
        commentaire: newCommande.commentaire,
        lignes: newCommande.lignes.map(l => ({
          produitId: l.produitId,
          quantite: l.quantite,
          prixUnitaire: 0,
          marque: l.marque || ''
        }))
      };
      
      await axios.post('http://localhost:8080/api/commandes', commandeData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('✅ Demande de devis créée avec succès');
      setShowModal(false);
      setNewCommande({ fournisseurId: '', numero: '', commentaire: '', lignes: [] });
      fetchCommandes();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const updateStatut = async (commandeId, nouveauStatut) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:8080/api/commandes/${commandeId}/statut`, {
        statut: nouveauStatut
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Statut mis à jour : ${nouveauStatut}`);
      fetchCommandes();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    }
  };

  const openDetailModal = async (commande) => {
    setSelectedCommande(commande);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:8080/api/commandes/${commande.id}/lignes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedLignes(res.data);
      setShowDetailModal(true);
    } catch (err) {
      toast.error('Erreur chargement des détails');
    }
  };

  const openDevisModal = async (commande) => {
    setCommandeDevis(commande);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:8080/api/commandes/${commande.id}/devis-detail`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDevisDetail(res.data);
      setShowDevisModal(true);
    } catch (err) {
      toast.error('Erreur chargement du devis');
    }
  };

  const openModificationModal = async (commande) => {
    setCommandeModif(commande);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:8080/api/commandes/${commande.id}/modifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setModificationsDetail(res.data);
      setShowModifModal(true);
    } catch (err) {
      toast.error('Erreur chargement des modifications');
    }
  };

  const validerDevis = async (commandeId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:8080/api/commandes/${commandeId}/valider-devis`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('✅ Devis validé, commande confirmée !');
      setShowDevisModal(false);
      fetchCommandes();
    } catch (err) {
      toast.error('Erreur lors de la validation');
    }
  };

  const refuserDevis = async (commandeId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:8080/api/commandes/${commandeId}/refuser-devis`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('❌ Devis refusé');
      setShowDevisModal(false);
      fetchCommandes();
    } catch (err) {
      toast.error('Erreur lors du refus');
    }
  };

  const approuverModification = async (commandeId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:8080/api/commandes/${commandeId}/approuver-modification`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('✅ Modification approuvée');
      setShowModifModal(false);
      fetchCommandes();
    } catch (err) {
      toast.error('Erreur lors de l\'approbation');
    }
  };

  const refuserModification = async (commandeId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:8080/api/commandes/${commandeId}/refuser-modification`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('❌ Modification refusée');
      setShowModifModal(false);
      fetchCommandes();
    } catch (err) {
      toast.error('Erreur lors du refus');
    }
  };

  const envoyerEmailCommande = async (commandeId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:8080/api/commandes/${commandeId}/envoyer-email`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('📧 Demande de devis envoyée au fournisseur');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de l\'envoi');
    }
  };

  const getStatutBadge = (statut) => {
    switch(statut) {
      case 'DEMANDE_CREEE': return { color: '#f59e0b', bg: '#fef3c7', label: '📝 Demande créée' };
      case 'DEVIS_ENVOYE': return { color: '#3b82f6', bg: '#eff6ff', label: '📄 Devis reçu' };
      case 'DEVIS_VALIDE': return { color: '#10b981', bg: '#d1fae5', label: '✅ Devis validé' };
      case 'DEVIS_REFUSE': return { color: '#ef4444', bg: '#fee2e2', label: '❌ Devis refusé' };
      case 'MODIFICATION_ENVOYEE': return { color: '#f97316', bg: '#fff7ed', label: '⚠️ Modification proposée' };
      case 'MODIFICATION_APPROUVEE': return { color: '#f59e0b', bg: '#fef3c7', label: '⏳ En attente confirmation' };
      case 'COMMANDE_CONFIRMEE': return { color: '#10b981', bg: '#d1fae5', label: '✅ Commande confirmée' };
      case 'EXPEDIEE': return { color: '#3b82f6', bg: '#eff6ff', label: '📦 Expédiée' };
      case 'LIVREE': return { color: '#10b981', bg: '#d1fae5', label: '✅ Livrée' };
      default: return { color: '#6b7280', bg: '#f3f4f6', label: statut };
    }
  };

  const styles = {
    card: { background: 'white', borderRadius: '20px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0', marginBottom: '24px' },
    cardTitle: { fontSize: '18px', fontWeight: '700', color: '#0f172a', marginBottom: '16px' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '12px', background: '#f8fafc', fontSize: '12px', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0' },
    td: { padding: '12px', borderBottom: '1px solid #f1f5f9', fontSize: '14px', color: '#1e293b' },
    btnPrimary: { background: '#3b82f6', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '40px', cursor: 'pointer', fontWeight: '600' },
    btnSecondary: { background: '#e2e8f0', color: '#334155', border: 'none', padding: '6px 12px', borderRadius: '30px', cursor: 'pointer', fontWeight: '500', fontSize: '12px' },
    btnSuccess: { background: '#10b981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '30px', cursor: 'pointer', fontWeight: '500', fontSize: '12px' },
    btnWarning: { background: '#f59e0b', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '30px', cursor: 'pointer', fontWeight: '500', fontSize: '12px' },
    btnDanger: { background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '30px', cursor: 'pointer', fontWeight: '500', fontSize: '12px' },
    input: { width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '12px', fontSize: '14px' },
    label: { display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#334155' },
    formGroup: { marginBottom: '16px' },
    modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
    modalContent: { background: 'white', borderRadius: '24px', padding: '28px', width: '700px', maxWidth: '90%', maxHeight: '80vh', overflowY: 'auto' },
    flexBetween: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
    gap2: { display: 'flex', gap: '12px' },
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
    ligneItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', background: '#f8fafc', borderRadius: '12px', marginBottom: '8px' }
  };

  // ===== CALCUL DE LA PAGINATION =====
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCommandes = commandes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(commandes.length / itemsPerPage);

  // Réinitialiser la page quand les commandes changent
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [commandes.length]);

  return (
    <div style={styles.card}>
      <div style={styles.flexBetween}>
        <div style={styles.cardTitle}>📦 Gestion des commandes</div>
        <button style={styles.btnPrimary} onClick={() => setShowModal(true)}>➕ Nouvelle demande</button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>N° Commande</th>
              <th style={styles.th}>Fournisseur</th>
              <th style={styles.th}>Date</th>
              <th style={styles.th}>Montant</th>
              <th style={styles.th}>Statut</th>
              <th style={styles.th}>Produits</th>
              <th style={styles.th}>Actions</th>
              <th style={styles.th}>Expédition</th>
            </tr>
          </thead>
          <tbody>
            {currentCommandes.map(c => {
              const badge = getStatutBadge(c.statut);
              return (
                <tr key={c.id}>
                  <td style={styles.td}>{c.numero}</td>
                  <td style={styles.td}>{c.fournisseur?.nom}</td>
                  <td style={styles.td}>{new Date(c.dateCommande).toLocaleDateString()}</td>
                  <td style={styles.td}>{c.montantTotal?.toLocaleString() || 0} FCFA</td>
                  <td style={styles.td}>
                    <span style={{ background: badge.bg, color: badge.color, padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '500' }}>
                      {badge.label}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <button style={styles.btnSecondary} onClick={() => openDetailModal(c)}>📋 Détails</button>
                  </td>
                  <td style={styles.td}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {/* DEMANDE_CREEE : envoyer email */}
                      {c.statut === 'DEMANDE_CREEE' && (
                        <button style={styles.btnPrimary} onClick={() => envoyerEmailCommande(c.id)}>📧 Envoyer demande</button>
                      )}
                      
                      {/* MODIFICATION_ENVOYEE : voir et traiter */}
                      {c.statut === 'MODIFICATION_ENVOYEE' && (
                        <>
                          <button style={styles.btnWarning} onClick={() => openModificationModal(c)}>📋 Voir modification</button>
                          <button style={styles.btnSuccess} onClick={() => approuverModification(c.id)}>✅ Approuver</button>
                          <button style={styles.btnDanger} onClick={() => refuserModification(c.id)}>❌ Refuser</button>
                        </>
                      )}
                      
                      {/* DEVIS_ENVOYE : voir et traiter */}
                      {c.statut === 'DEVIS_ENVOYE' && (
                        <>
                          <button style={styles.btnWarning} onClick={() => openDevisModal(c)}>📄 Voir devis</button>
                          <button style={styles.btnSuccess} onClick={() => validerDevis(c.id)}>✅ Valider devis</button>
                          <button style={styles.btnDanger} onClick={() => refuserDevis(c.id)}>❌ Refuser devis</button>
                        </>
                      )}
                      
                      {/* DEVIS_VALIDE ou COMMANDE_CONFIRMEE : expédier */}
                      {(c.statut === 'DEVIS_VALIDE' || c.statut === 'COMMANDE_CONFIRMEE') && (
                        <>
                          <button style={styles.btnWarning} onClick={() => updateStatut(c.id, 'EXPEDIEE')}>📦 Expédier</button>
                          {!c.dateExpeditionProposee && (
                            <button style={styles.btnPrimary} onClick={() => openDateExpeditionModal(c)}>📅 Proposer date</button>
                          )}
                        </>
                      )}

                      {/* EXPEDIEE : livrer */}
                      {c.statut === 'EXPEDIEE' && (
                        <button style={styles.btnSuccess} onClick={() => updateStatut(c.id, 'LIVREE')}>✅ Livrer</button>
                      )}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <ExpeditionStatus commandeId={c.id} />
                  </td>
                </tr>
              );
            })}
            {commandes.length === 0 && (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>Aucune commande</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ===== PAGINATION ===== */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p-1))} 
            disabled={currentPage === 1}
            style={{ 
              padding: '8px 16px', 
              borderRadius: '30px', 
              background: currentPage === 1 ? '#e2e8f0' : '#f1f5f9',
              border: 'none', 
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer', 
              fontWeight: '500',
              opacity: currentPage === 1 ? 0.5 : 1
            }}
          >
            ◀ Précédent
          </button>
          <span style={{ padding: '8px 16px', background: '#f1f5f9', borderRadius: '30px', fontSize: '14px', fontWeight: '500' }}>
            Page {currentPage} / {totalPages}
          </span>
          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} 
            disabled={currentPage === totalPages}
            style={{ 
              padding: '8px 16px', 
              borderRadius: '30px', 
              background: currentPage === totalPages ? '#e2e8f0' : '#f1f5f9',
              border: 'none', 
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', 
              fontWeight: '500',
              opacity: currentPage === totalPages ? 0.5 : 1
            }}
          >
            Suivant ▶
          </button>
        </div>
      )}

      {/* MODAL DÉTAILS PRODUITS */}
      {showDetailModal && selectedCommande && (
        <div style={styles.modal}>
          <div style={{ ...styles.modalContent, maxWidth: '600px' }}>
            <div style={styles.flexBetween}>
              <h3>📋 Détails de la commande {selectedCommande.numero}</h3>
              <button onClick={() => setShowDetailModal(false)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer' }}>✖️</button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Produit</th>
                    <th style={styles.th}>Marque</th>
                    <th style={styles.th}>Quantité</th>
                    <th style={styles.th}>Prix unitaire</th>
                    <th style={styles.th}>Total</th>
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
                    <td colSpan="4" style={{ textAlign: 'right', fontWeight: 'bold' }}>Total :</td>
                    <td style={{ fontWeight: 'bold' }}>{selectedCommande.montantTotal?.toLocaleString()} FCFA</td>
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
              <h3>📄 Devis reçu</h3>
              <button onClick={() => setShowDevisModal(false)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer' }}>✖️</button>
            </div>
            
            <p><strong>Commande N° :</strong> {commandeDevis.numero}</p>
            <p><strong>Fournisseur :</strong> {commandeDevis.fournisseur?.nom}</p>
            
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Produit</th>
                  <th style={styles.th}>Quantité</th>
                  <th style={styles.th}>Prix unitaire</th>
                  <th style={styles.th}>Total</th>
                </tr>
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
                <tr>
                  <td colSpan="3" style={{ textAlign: 'right', fontWeight: 'bold' }}>Sous-total :</td>
                  <td style={{ fontWeight: 'bold' }}>{devisDetail.sousTotal?.toLocaleString()} FCFA</td>
                </tr>
                <tr>
                  <td colSpan="3" style={{ textAlign: 'right' }}>Frais de transport :</td>
                  <td>{devisDetail.fraisTransport?.toLocaleString()} FCFA</td>
                </tr>
                <tr>
                  <td colSpan="3" style={{ textAlign: 'right', fontWeight: 'bold' }}>Total :</td>
                  <td style={{ fontWeight: 'bold', color: '#f97316' }}>{devisDetail.total?.toLocaleString()} FCFA</td>
                </tr>
                <tr>
                  <td colSpan="4" style={{ fontSize: '12px', color: '#64748b' }}>
                    Délai de livraison : {devisDetail.delaiLivraison} jours
                  </td>
                </tr>
              </tfoot>
            </table>
            
            <div style={{ marginTop: '20px', textAlign: 'center', display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button style={{ ...styles.btnSuccess, padding: '10px 24px' }} onClick={() => validerDevis(commandeDevis.id)}>
                ✅ Valider le devis
              </button>
              <button style={{ ...styles.btnDanger, padding: '10px 24px' }} onClick={() => refuserDevis(commandeDevis.id)}>
                ❌ Refuser le devis
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL MODIFICATIONS PROPOSÉES */}
      {showModifModal && commandeModif && modificationsDetail && (
        <div style={styles.modal}>
          <div style={{ ...styles.modalContent, maxWidth: '700px' }}>
            <div style={styles.flexBetween}>
              <h3>📋 Modifications proposées</h3>
              <button onClick={() => setShowModifModal(false)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer' }}>✖️</button>
            </div>
            
            <p><strong>Commande N° :</strong> {commandeModif.numero}</p>
            <p><strong>Fournisseur :</strong> {commandeModif.fournisseur?.nom}</p>
            
            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>
              <strong>📝 Commentaire du fournisseur :</strong><br/>
              {modificationsDetail.commentaire || 'Aucun commentaire'}
            </div>
            
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Produit</th>
                  <th style={styles.th}>Quantité initiale</th>
                  <th style={styles.th}>Quantité proposée</th>
                  <th style={styles.th}>Prix initial</th>
                  <th style={styles.th}>Prix proposé</th>
                </tr>
              </thead>
              <tbody>
                {modificationsDetail.lignes?.map((ligne, idx) => (
                  <tr key={idx}>
                    <td style={styles.td}>{ligne.produitNom}</td>
                    <td style={styles.td}>{ligne.quantiteCommandee}</td>
                    <td style={styles.td} style={{ color: (ligne.quantiteProposee || 0) !== ligne.quantiteCommandee ? '#f97316' : 'inherit' }}>
                      {ligne.quantiteProposee || 0}
                    </td>
                    <td style={styles.td}>{ligne.prixInitial?.toLocaleString()} FCFA</td>
                    <td style={styles.td} style={{ color: (ligne.prixPropose || 0) !== ligne.prixInitial ? '#f97316' : 'inherit' }}>
                      {ligne.prixPropose?.toLocaleString() || 0} FCFA
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div style={{ marginTop: '20px', textAlign: 'center', display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button style={{ ...styles.btnSuccess, padding: '10px 24px' }} onClick={() => approuverModification(commandeModif.id)}>
                ✅ Approuver les modifications
              </button>
              <button style={{ ...styles.btnDanger, padding: '10px 24px' }} onClick={() => refuserModification(commandeModif.id)}>
                ❌ Refuser les modifications
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DATE D'EXPÉDITION */}
      {showDateModal && commandeDate && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.flexBetween}>
              <h3>📅 Proposer une date d'expédition</h3>
              <button onClick={() => setShowDateModal(false)} style={{ background: 'none', border: 'none', fontSize: '22px' }}>✖️</button>
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
              <h3>📝 Nouvelle demande de devis</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer' }}>✖️</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={styles.grid2}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Fournisseur *</label>
                  <select style={styles.input} value={newCommande.fournisseurId} onChange={e => setNewCommande({...newCommande, fournisseurId: e.target.value})} required>
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
                <input style={styles.input} placeholder="Optionnel" value={newCommande.commentaire} onChange={e => setNewCommande({...newCommande, commentaire: e.target.value})} />
              </div>

              <div style={{ ...styles.card, padding: '16px', marginBottom: '16px' }}>
                <div style={styles.cardTitle}>🛒 Ajouter un produit</div>
                <div style={styles.grid2}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <select style={{ ...styles.input, flex: 1 }} value={ligneTemp.produitId} onChange={e => setLigneTemp({...ligneTemp, produitId: e.target.value})}>
                      <option value="">-- Choisir --</option>
                      {produits.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.nom} - {p.marque || 'Sans marque'} - Stock: {p.quantiteStock}
                        </option>
                      ))}
                    </select>
                    <button type="button" style={styles.btnPrimary} onClick={() => setShowNewProductModal(true)}>➕ Nouveau</button>
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Marque</label>
                    <input type="text" style={styles.input} value={ligneTemp.marque} onChange={e => setLigneTemp({...ligneTemp, marque: e.target.value})} placeholder="DELL, HP, SAMSUNG..." />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Quantité</label>
                    <input type="number" style={styles.input} value={ligneTemp.quantite} onChange={e => setLigneTemp({...ligneTemp, quantite: e.target.value})} min="1" />
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
                      <div style={{ flex: 2 }}><strong>{l.produitNom}</strong> ({l.marque || 'Sans marque'})</div>
                      <div style={{ flex: 1, textAlign: 'center' }}>{l.quantite} unités</div>
                      <div style={{ flex: 1, textAlign: 'right' }}>Prix à définir</div>
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
              <h3>➕ Nouveau produit</h3>
              <button onClick={() => setShowNewProductModal(false)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer' }}>✖️</button>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Référence *</label>
              <input style={styles.input} value={newProductTemp.reference} onChange={e => setNewProductTemp({...newProductTemp, reference: e.target.value})} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Nom *</label>
              <input style={styles.input} value={newProductTemp.nom} onChange={e => setNewProductTemp({...newProductTemp, nom: e.target.value})} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Marque</label>
              <input style={styles.input} value={newProductTemp.marque} onChange={e => setNewProductTemp({...newProductTemp, marque: e.target.value})} placeholder="DELL, HP, SAMSUNG..." />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Prix de vente (FCFA) *</label>
              <input type="number" style={styles.input} value={newProductTemp.prixVente} onChange={e => setNewProductTemp({...newProductTemp, prixVente: e.target.value})} />
            </div>
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