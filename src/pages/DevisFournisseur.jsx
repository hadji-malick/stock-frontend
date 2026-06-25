import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';

export default function DevisFournisseur() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [commande, setCommande] = useState(null);
  const [lignes, setLignes] = useState([]);
  const [devis, setDevis] = useState({
    prix: {},
    fraisTransport: 0,
    delaiLivraisonPropose: 5,
    dateValidite: '',
    conditionsPaiement: ''
  });

  useEffect(() => {
    fetchDemande();
  }, [token]);

  const fetchDemande = async () => {
    try {
      console.log('🔍 Token:', token);
      const res = await axios.get(`http://localhost:8080/api/commandes/devis/${token}`);
      console.log('📦 Réponse:', res.data);
      
      if (res.data.error) {
        setError(res.data.error);
        setLoading(false);
        return;
      }
      
      setCommande(res.data.commande);
      setLignes(res.data.lignes || []);
      
      // Initialiser les prix à 0 pour chaque produit
      const initialPrix = {};
      (res.data.lignes || []).forEach(ligne => {
        initialPrix[ligne.produit.id] = 0;
      });
      setDevis(prev => ({ ...prev, prix: initialPrix }));
      
      setLoading(false);
    } catch (err) {
      console.error('❌ Erreur:', err);
      setError('Impossible de charger la demande. Vérifiez le lien.');
      setLoading(false);
    }
  };

  const handlePrixChange = (produitId, value) => {
    let newPrix = parseFloat(value) || 0;
    if (newPrix < 0) newPrix = 0;
    setDevis(prev => ({
      ...prev,
      prix: { ...prev.prix, [produitId]: newPrix }
    }));
  };

  const handleSubmit = async () => {
  console.log("🚀 Bouton cliqué !");
  
  // Vérifier que tous les prix sont saisis
  const hasEmptyPrice = Object.values(devis.prix).some(p => p === 0);
  console.log("Prix saisis:", devis.prix);
  
  if (hasEmptyPrice) {
    toast.error('Veuillez saisir un prix pour tous les produits');
    return;
  }
  
  if (!devis.delaiLivraisonPropose || devis.delaiLivraisonPropose < 1) {
    toast.error('Veuillez indiquer un délai de livraison valide');
    return;
  }
  
  const payload = {
    prix: devis.prix,
    fraisTransport: devis.fraisTransport,
    delaiLivraisonPropose: devis.delaiLivraisonPropose,
    dateValidite: devis.dateValidite,
    conditionsPaiement: devis.conditionsPaiement
  };
  console.log("📤 Payload envoyé:", payload);
  
  setSubmitting(true);
  try {
    const response = await axios.post(`http://localhost:8080/api/commandes/devis/${token}`, payload);
    console.log("✅ Réponse du serveur:", response.data);
    toast.success('✅ Devis envoyé avec succès !');
    setTimeout(() => window.close(), 2000);
  } catch (err) {
    console.error("❌ Erreur:", err);
    toast.error(err.response?.data?.error || 'Erreur lors de l\'envoi du devis');
  } finally {
    setSubmitting(false);
  }
};

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', fontFamily: 'Arial' }}>
        <p>Chargement de la demande...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '50px', fontFamily: 'Arial' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
        <p style={{ color: '#ef4444' }}>{error}</p>
        <p style={{ fontSize: '12px', color: '#64748b' }}>Le lien est peut-être expiré ou invalide.</p>
      </div>
    );
  }

  const styles = {
    container: { 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif' 
    },
    header: { 
      background: 'linear-gradient(135deg, #f97316, #ea580c)', 
      padding: '24px 20px', 
      textAlign: 'center', 
      color: 'white', 
      borderRadius: '12px 12px 0 0' 
    },
    headerTitle: { margin: 0, fontSize: '24px', fontWeight: 'bold' },
    headerSub: { margin: '8px 0 0', fontSize: '14px', opacity: 0.9 },
    content: { 
      background: 'white', 
      border: '1px solid #e2e8f0', 
      borderTop: 'none', 
      padding: '24px', 
      borderRadius: '0 0 12px 12px' 
    },
    info: { 
      background: '#f8fafc', 
      padding: '12px 16px', 
      borderRadius: '8px', 
      marginBottom: '20px',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '8px'
    },
    table: { width: '100%', borderCollapse: 'collapse', margin: '15px 0' },
    th: { 
      background: '#f8fafc', 
      padding: '10px 12px', 
      textAlign: 'left', 
      borderBottom: '2px solid #e2e8f0',
      fontSize: '12px',
      fontWeight: '700',
      color: '#475569',
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    },
    td: { padding: '10px 12px', borderBottom: '1px solid #f1f5f9', fontSize: '14px' },
    input: { 
      width: '100%', 
      maxWidth: '150px', 
      padding: '8px 10px', 
      border: '1px solid #cbd5e1', 
      borderRadius: '8px', 
      fontSize: '14px',
      outline: 'none'
    },
    inputFull: { 
      width: '100%', 
      padding: '8px 10px', 
      border: '1px solid #cbd5e1', 
      borderRadius: '8px', 
      fontSize: '14px',
      outline: 'none'
    },
    grid2: { 
      display: 'grid', 
      gridTemplateColumns: '1fr 1fr', 
      gap: '16px', 
      marginTop: '20px' 
    },
    label: { 
      display: 'block', 
      fontWeight: '600', 
      marginBottom: '5px', 
      color: '#334155', 
      fontSize: '13px' 
    },
    btnPrimary: { 
      background: 'linear-gradient(135deg, #f97316, #ea580c)', 
      color: 'white', 
      border: 'none', 
      padding: '12px 28px', 
      borderRadius: '8px', 
      cursor: 'pointer', 
      fontSize: '16px', 
      fontWeight: '600',
      marginRight: '10px'
    },
    btnSecondary: { 
      background: '#e2e8f0', 
      color: '#334155', 
      border: 'none', 
      padding: '12px 28px', 
      borderRadius: '8px', 
      cursor: 'pointer', 
      fontSize: '16px',
      fontWeight: '600'
    },
    note: {
      fontSize: '12px',
      color: '#64748b',
      marginTop: '20px',
      textAlign: 'center',
      padding: '12px',
      background: '#fef3c7',
      borderRadius: '8px'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>📄 Devis</h1>
        <p style={styles.headerSub}>Demande N° : {commande?.numero || 'Chargement...'}</p>
      </div>
      
      <div style={styles.content}>
        <div style={styles.info}>
          <div><strong>Fournisseur :</strong> {commande?.fournisseur?.nom || 'N/A'}</div>
          <div><strong>Date :</strong> {commande?.dateCommande ? new Date(commande.dateCommande).toLocaleDateString() : 'N/A'}</div>
          {commande?.commentaire && (
            <div style={{ gridColumn: '1 / -1' }}><strong>Commentaire :</strong> {commande.commentaire}</div>
          )}
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Produit</th>
                <th style={styles.th}>Marque</th>
                <th style={styles.th}>Quantité</th>
                <th style={styles.th}>Prix unitaire (FCFA)</th>
              </tr>
            </thead>
            <tbody>
              {lignes.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                    Aucun produit dans cette demande
                  </td>
                </tr>
              ) : (
                lignes.map(ligne => (
                  <tr key={ligne.produit.id}>
                    <td style={styles.td}><strong>{ligne.produit.nom}</strong></td>
                    <td style={styles.td}>{ligne.marque || '-'}</td>
                    <td style={styles.td}>{ligne.quantite}</td>
                    <td style={styles.td}>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        placeholder="Saisir le prix"
                        value={devis.prix[ligne.produit.id] || ''}
                        onChange={(e) => handlePrixChange(ligne.produit.id, e.target.value)}
                        style={styles.input}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div style={styles.grid2}>
          <div>
            <label style={styles.label}>Frais de transport (FCFA)</label>
            <input 
              type="number" 
              min="0"
              step="100"
              style={styles.inputFull} 
              value={devis.fraisTransport} 
              onChange={(e) => setDevis({...devis, fraisTransport: parseFloat(e.target.value) || 0})} 
            />
          </div>
          <div>
            <label style={styles.label}>Délai de livraison (jours) *</label>
            <input 
              type="number" 
              min="1"
              style={styles.inputFull} 
              value={devis.delaiLivraisonPropose} 
              onChange={(e) => setDevis({...devis, delaiLivraisonPropose: parseInt(e.target.value) || 5})} 
            />
          </div>
        </div>

        <div style={styles.grid2}>
          <div>
            <label style={styles.label}>Date de validité</label>
            <input 
              type="date" 
              style={styles.inputFull} 
              value={devis.dateValidite} 
              onChange={(e) => setDevis({...devis, dateValidite: e.target.value})} 
            />
          </div>
          <div>
            <label style={styles.label}>Conditions de paiement</label>
            <input 
              type="text" 
              style={styles.inputFull} 
              placeholder="Ex: Paiement à 30 jours" 
              value={devis.conditionsPaiement} 
              onChange={(e) => setDevis({...devis, conditionsPaiement: e.target.value})} 
            />
          </div>
        </div>

        <div style={{ marginTop: '30px', textAlign: 'center' }}>
          <button 
            style={styles.btnPrimary} 
            onClick={handleSubmit} 
            disabled={submitting}
          >
            {submitting ? 'Envoi en cours...' : '📤 Envoyer le devis'}
          </button>
          <button 
            style={styles.btnSecondary} 
            onClick={() => window.close()}
          >
            Annuler
          </button>
        </div>
        
        <div style={styles.note}>
          💡 Ce devis sera examiné par notre service achats. 
          Vous serez informé de la décision par email.
        </div>
      </div>
    </div>
  );
}