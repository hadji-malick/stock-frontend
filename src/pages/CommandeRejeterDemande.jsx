import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

export default function CommandeRejeterDemande() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [commande, setCommande] = useState(null);
  const [lignes, setLignes] = useState([]);
  const [commentaire, setCommentaire] = useState('');

  useEffect(() => {
    fetchCommande();
  }, [token]);

  const fetchCommande = async () => {
    try {
      const res = await axios.get(`http://localhost:8080/api/commandes/rejeter-demande/${token}`);
      setCommande(res.data.commande);
      setLignes(res.data.lignes);
      setLoading(false);
    } catch (err) {
      toast.error('Erreur lors du chargement');
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!commentaire.trim()) {
      toast.error('Veuillez indiquer la raison du rejet');
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(`http://localhost:8080/api/commandes/rejeter-demande/${token}`, { commentaire });
      toast.success('Demande rejetée avec succès');
      navigate('/confirmation-rejet');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Chargement...</div>;

  const styles = {
    container: { maxWidth: '700px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' },
    header: { background: '#ef4444', padding: '20px', textAlign: 'center', color: 'white', borderRadius: '12px 12px 0 0' },
    content: { background: 'white', border: '1px solid #e2e8f0', padding: '24px', borderRadius: '0 0 12px 12px' },
    table: { width: '100%', borderCollapse: 'collapse', margin: '15px 0' },
    th: { background: '#f8fafc', padding: '12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' },
    td: { padding: '12px', borderBottom: '1px solid #e2e8f0' },
    textarea: { width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', marginTop: '5px', fontFamily: 'Arial' },
    btnDanger: { background: '#ef4444', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', marginRight: '10px' },
    btnSecondary: { background: '#e2e8f0', color: '#334155', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontSize: '16px' }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>❌ Rejeter la demande de devis</h1>
        <p>Commande N° : {commande?.numero}</p>
      </div>
      <div style={styles.content}>
        <p><strong>Fournisseur :</strong> {commande?.fournisseur?.nom}</p>
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Produit</th>
                <th style={styles.th}>Marque</th>
                <th style={styles.th}>Quantité</th>
              </tr>
            </thead>
            <tbody>
              {lignes.map(l => (
                <tr key={l.id}>
                  <td style={styles.td}>{l.produit?.nom}</td>
                  <td style={styles.td}>{l.marque || '-'}</td>
                  <td style={styles.td}>{l.quantite}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: '20px' }}>
          <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>📝 Raison du rejet *</label>
          <textarea
            rows="4"
            style={styles.textarea}
            placeholder="Ex: Produits non disponibles actuellement, hors de notre catalogue..."
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
          />
        </div>

        <div style={{ marginTop: '30px', textAlign: 'center' }}>
          <button style={styles.btnDanger} onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Envoi en cours...' : '❌ Confirmer le rejet'}
          </button>
          <button style={styles.btnSecondary} onClick={() => window.close()}>Annuler</button>
        </div>
      </div>
    </div>
  );
}