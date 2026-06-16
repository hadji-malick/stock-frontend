import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

export default function CommandeModification() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [commande, setCommande] = useState(null);
  const [lignes, setLignes] = useState([]);
  const [quantites, setQuantites] = useState({});
  const [prix, setPrix] = useState({});
  const [commentaire, setCommentaire] = useState('');

  const playSuccessSound = () => {
    const audio = new Audio('/sounds/success.wav');
    audio.volume = 0.3;
    audio.play().catch(() => console.log('Son bloqué'));
  };

  const playErrorSound = () => {
    const audio = new Audio('/sounds/error.wav');
    audio.volume = 0.3;
    audio.play().catch(() => console.log('Son bloqué'));
  };

  useEffect(() => {
    fetchCommande();
  }, [token]);

  const fetchCommande = async () => {
    try {
      const res = await axios.get(`http://localhost:8080/api/commandes/modifier/${token}`);
      setCommande(res.data.commande);
      setLignes(res.data.lignes);
      
      const initialQuantites = {};
      const initialPrix = {};
      res.data.lignes.forEach(ligne => {
        initialQuantites[ligne.produit.id] = ligne.quantite;
        initialPrix[ligne.produit.id] = ligne.prixUnitaire;
      });
      setQuantites(initialQuantites);
      setPrix(initialPrix);
      setLoading(false);
    } catch (err) {
      toast.error('Erreur lors du chargement');
      setLoading(false);
    }
  };

  const handleQuantiteChange = (produitId, quantiteMax, value) => {
    let newQuantite = parseInt(value) || 0;
    if (newQuantite < 0) newQuantite = 0;
    if (newQuantite > quantiteMax) newQuantite = quantiteMax;
    setQuantites({ ...quantites, [produitId]: newQuantite });
  };

  const handlePrixChange = (produitId, value) => {
    let newPrix = parseFloat(value) || 0;
    if (newPrix < 0) newPrix = 0;
    setPrix({ ...prix, [produitId]: newPrix });
  };

const handleSubmit = async () => {
  const hasAnyProduct = Object.values(quantites).some(q => q > 0);
  if (!hasAnyProduct) {
    toast.error('Veuillez sélectionner au moins un produit disponible');
    playErrorSound();
    return;
  }
  
  console.log("Quantités envoyées:", quantites);
  console.log("Prix envoyés:", prix);
  
  setSubmitting(true);
  try {
    const response = await axios.post(`http://localhost:8080/api/commandes/modifier/${token}`, {
      quantites: quantites,
      prix: prix,
      commentaire: commentaire
    });
    console.log("Réponse:", response.data);
    toast.success('Modification envoyée avec succès !');
    playSuccessSound();
    navigate('/confirmation-modification');
  } catch (err) {
    console.error("Erreur:", err);
    toast.error(err.response?.data?.error || 'Erreur');
    playErrorSound();
  } finally {
    setSubmitting(false);
  }
};

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Chargement...</div>;

  const totalOriginal = lignes.reduce((sum, l) => sum + (l.quantite * l.prixUnitaire), 0);
  const totalPropose = lignes.reduce((sum, l) => sum + ((quantites[l.produit.id] || 0) * (prix[l.produit.id] || 0)), 0);

  const styles = {
    container: { maxWidth: '950px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' },
    header: { background: '#f97316', padding: '20px', textAlign: 'center', color: 'white', borderRadius: '12px 12px 0 0' },
    content: { background: 'white', border: '1px solid #e2e8f0', padding: '24px', borderRadius: '0 0 12px 12px' },
    table: { width: '100%', borderCollapse: 'collapse', margin: '15px 0' },
    th: { background: '#f8fafc', padding: '12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' },
    td: { padding: '12px', borderBottom: '1px solid #e2e8f0' },
    input: { width: '80px', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '8px', textAlign: 'center' },
    inputPrix: { width: '130px', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '8px', textAlign: 'center' },
    textarea: { width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', marginTop: '5px', fontFamily: 'Arial' },
    btnPrimary: { background: '#f97316', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', marginRight: '10px' },
    btnSecondary: { background: '#e2e8f0', color: '#334155', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontSize: '16px' },
    totalOriginal: { color: '#ef4444', textDecoration: 'line-through' },
    totalPropose: { color: '#10b981', fontWeight: 'bold', fontSize: '18px' }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>✏️ Proposer des modifications</h1>
        <p>Commande N° : {commande?.numero}</p>
      </div>
      
      <div style={styles.content}>
        <p><strong>Fournisseur :</strong> {commande?.fournisseur?.nom}</p>
        <p><strong>Date :</strong> {new Date(commande?.dateCommande).toLocaleDateString()}</p>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Produit</th>
                <th style={styles.th}>Quantité commandée</th>
                <th style={styles.th}>Quantité disponible</th>
                <th style={styles.th}>Prix unitaire (FCFA)</th>
                <th style={styles.th}>Total</th>
              </tr>
            </thead>
            <tbody>
              {lignes.map(ligne => (
                <tr key={ligne.produit.id}>
                  <td style={styles.td}><strong>{ligne.produit.nom}</strong></td>
                  <td style={styles.td} style={{ textAlign: 'center' }}>{ligne.quantite}</td>
                  <td style={styles.td}>
                    <input
                      type="number"
                      min="0"
                      max={ligne.quantite}
                      value={quantites[ligne.produit.id] || 0}
                      onChange={(e) => handleQuantiteChange(ligne.produit.id, ligne.quantite, e.target.value)}
                      style={styles.input}
                    />
                  </td>
                  <td style={styles.td}>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={prix[ligne.produit.id] || 0}
                      onChange={(e) => handlePrixChange(ligne.produit.id, e.target.value)}
                      style={styles.inputPrix}
                    />
                  </td>
                  <td style={styles.td}>
                    <strong>{(quantites[ligne.produit.id] || 0) * (prix[ligne.produit.id] || 0)} FCFA</strong>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: '#f8fafc' }}>
                <td colSpan="3" style={{ textAlign: 'right', fontWeight: 'bold' }}>Total :</td>
                <td colSpan="2">
                  <span style={styles.totalOriginal}>{totalOriginal.toLocaleString()} FCFA</span>
                  {' → '}
                  <span style={styles.totalPropose}>{totalPropose.toLocaleString()} FCFA</span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        <div style={{ marginTop: '20px' }}>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>📝 Commentaire (optionnel)</label>
          <textarea
            rows="3"
            style={styles.textarea}
            placeholder="Ex: Produit indisponible, délai de livraison, remise exceptionnelle..."
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
          />
        </div>
        
        <div style={{ marginTop: '30px', textAlign: 'center' }}>
          <button style={styles.btnPrimary} onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Envoi en cours...' : '📤 Proposer cette modification'}
          </button>
          <button style={styles.btnSecondary} onClick={() => window.close()}>Annuler</button>
        </div>
        
        <p style={{ fontSize: '12px', color: '#64748b', marginTop: '20px', textAlign: 'center' }}>
          Cette modification sera examinée par notre service achats. Vous serez informé de la décision par email.
        </p>
      </div>
    </div>
  );
}