import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

export default function CommandeConfirmation() {
  const { token } = useParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const confirmerCommande = async () => {
      try {
        const res = await axios.get(`http://localhost:8080/api/commandes/confirmer/${token}`);
        setStatus('success');
        setMessage(res.data.message);
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.error || 'Erreur lors de la confirmation');
      }
    };
    confirmerCommande();
  }, [token]);

  if (status === 'loading') {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <h2>⏳ Confirmation en cours...</h2>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center', padding: '50px', maxWidth: '500px', margin: 'auto' }}>
      {status === 'success' ? (
        <>
          <div style={{ fontSize: '64px' }}>✅</div>
          <h2 style={{ color: '#10b981' }}>Commande confirmée !</h2>
          <p>{message}</p>
          <p style={{ color: '#64748b', marginTop: '20px' }}>Merci d'avoir confirmé cette commande.</p>
        </>
      ) : (
        <>
          <div style={{ fontSize: '64px' }}>❌</div>
          <h2 style={{ color: '#ef4444' }}>Erreur de confirmation</h2>
          <p>{message}</p>
          <p>Veuillez contacter Powertech si le problème persiste.</p>
        </>
      )}
    </div>
  );
}