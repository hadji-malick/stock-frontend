import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

export default function AccepterModification() {
  const { token } = useParams();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const accepter = async () => {
      try {
        const res = await axios.post(`http://localhost:8080/api/commandes/accepter-modification-api?token=${token}`);
        setStatus('success');
        setMessage(res.data.message || 'Modification acceptée avec succès !');
        const audio = new Audio('/sounds/success.wav');
        audio.volume = 0.3;
        audio.play().catch(() => console.log('Son bloqué'));
        setTimeout(() => window.close(), 3000);
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || err.response?.data?.error || 'Une erreur est survenue lors de l’acceptation.');
        const audio = new Audio('/sounds/error.wav');
        audio.volume = 0.3;
        audio.play().catch(() => console.log('Son bloqué'));
      }
    };
    accepter();
  }, [token]);

  if (status === 'loading') return <div style={{ textAlign: 'center', padding: '50px' }}>⏳ Traitement...</div>;

  const styles = {
    container: { maxWidth: '500px', margin: '50px auto', padding: '40px', textAlign: 'center', background: 'white', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' },
    icon: { fontSize: '64px', marginBottom: '20px' },
    title: { fontSize: '24px', fontWeight: 'bold' },
    message: { color: '#475569', marginTop: '16px' }
  };

  return (
    <div style={styles.container}>
      {status === 'success' ? (
        <>
          <div style={{ ...styles.icon, color: '#10b981' }}>✅</div>
          <h2 style={{ ...styles.title, color: '#10b981' }}>Modification acceptée !</h2>
          <p style={styles.message}>{message}</p>
          <p style={{ marginTop: '20px', color: '#64748b' }}>Cette fenêtre se ferme dans quelques instants...</p>
        </>
      ) : (
        <>
          <div style={{ ...styles.icon, color: '#ef4444' }}>❌</div>
          <h2 style={{ ...styles.title, color: '#ef4444' }}>Erreur</h2>
          <p style={styles.message}>{message}</p>
        </>
      )}
    </div>
  );
}
