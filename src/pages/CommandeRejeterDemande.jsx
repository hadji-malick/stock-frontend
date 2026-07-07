import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';

export default function CommandeRejeterDemande() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [commande, setCommande] = useState(null);
  const [commentaire, setCommentaire] = useState('');

  useEffect(() => {
    fetchCommande();
  }, [token]);

  const fetchCommande = async () => {
    try {
      const res = await axios.get(`http://localhost:8080/api/commandes/rejeter-demande/${token}`);
      setCommande(res.data.commande);
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
      await axios.post(`http://localhost:8080/api/commandes/rejeter-demande/${token}`, {
        commentaire: commentaire
      });
      toast.success('Demande rejetée');
      setSubmitted(true);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const styles = {
    container: { maxWidth: '600px', margin: '50px auto', padding: '20px', fontFamily: 'Arial, sans-serif' },
    header: { background: '#ef4444', padding: '20px', textAlign: 'center', color: 'white', borderRadius: '12px 12px 0 0' },
    content: { background: 'white', border: '1px solid #e2e8f0', padding: '24px', borderRadius: '0 0 12px 12px' },
    textarea: { width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', marginTop: '5px', fontFamily: 'Arial', minHeight: '100px' },
    label: { fontWeight: 'bold', display: 'block', marginBottom: '5px' },
    btnDanger: { background: '#ef4444', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontSize: '16px' }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Chargement...</div>;

  if (submitted) {
    return (
      <div style={styles.container}>
        <div style={{ ...styles.content, textAlign: 'center', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h2 style={{ color: '#ef4444' }}>❌ Demande rejetée</h2>
          <p>Votre rejet a bien été transmis à Powertech Engineering Group. Merci pour votre retour.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>❌ Rejeter la demande de devis</h1>
        <p>Commande N° : {commande?.numero}</p>
      </div>
      <div style={styles.content}>
        <p>Vous êtes sur le point de rejeter cette demande de devis. Merci d'indiquer la raison ci-dessous.</p>
        <label style={styles.label}>Raison du rejet *</label>
        <textarea
          style={styles.textarea}
          value={commentaire}
          onChange={e => setCommentaire(e.target.value)}
          placeholder="Ex: Produit indisponible, hors de notre catalogue, capacité insuffisante..."
        />
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <button style={styles.btnDanger} onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Envoi...' : '❌ Confirmer le rejet'}
          </button>
        </div>
      </div>
    </div>
  );
}