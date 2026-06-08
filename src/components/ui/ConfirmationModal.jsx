import React from 'react';

const styles = {
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)'
  },
  modalContent: {
    background: 'white',
    borderRadius: '24px',
    padding: '28px',
    width: '400px',
    maxWidth: '90%',
    textAlign: 'center'
  },
  title: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '12px'
  },
  message: {
    marginBottom: '24px',
    color: '#475569'
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center'
  },
  btnPrimary: {
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    padding: '8px 20px',
    borderRadius: '40px',
    cursor: 'pointer'
  },
  btnSecondary: {
    background: '#e2e8f0',
    color: '#1e293b',
    border: 'none',
    padding: '8px 20px',
    borderRadius: '40px',
    cursor: 'pointer'
  }
};

export default function ConfirmationModal({ isOpen, onClose, onConfirm, title, message }) {
  if (!isOpen) return null;
  return (
    <div style={styles.modal}>
      <div style={styles.modalContent}>
        <h3 style={styles.title}>{title || 'Confirmation'}</h3>
        <p style={styles.message}>{message || 'Êtes-vous sûr ?'}</p>
        <div style={styles.buttonGroup}>
          <button style={styles.btnSecondary} onClick={onClose}>Annuler</button>
          <button style={styles.btnPrimary} onClick={onConfirm}>Confirmer</button>
        </div>
      </div>
    </div>
  );
}