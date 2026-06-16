import React, { useEffect } from 'react';

export default function ConfirmationModification() {
  useEffect(() => {
    const timer = setTimeout(() => window.close(), 3000);
    return () => clearTimeout(timer);
  }, []);

  const styles = {
    container: { maxWidth: '500px', margin: '50px auto', padding: '40px', textAlign: 'center', background: 'white', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' },
    icon: { fontSize: '64px', marginBottom: '20px' },
    title: { fontSize: '24px', fontWeight: 'bold', color: '#10b981', marginBottom: '15px' },
    message: { fontSize: '16px', color: '#475569', marginBottom: '30px', lineHeight: '1.5' },
    button: { background: '#f97316', color: 'white', padding: '12px 28px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px' }
  };

  const handleClose = () => {
    window.close();
  };

  return (
    <div style={styles.container}>
      <div style={styles.icon}>✅</div>
      <h1 style={styles.title}>Modification envoyée !</h1>
      <p style={styles.message}>Votre proposition a bien été transmise à Powertech.<br/>Vous recevrez une confirmation par email.</p>
      <button style={styles.button} onClick={handleClose}>Fermer la fenêtre</button>
    </div>
  );
}