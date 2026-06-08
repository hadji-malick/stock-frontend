import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';
import bgAccueil from '../assets/acceuil.png';   // ← Import de l'image de fond

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(email, password);
    if (!result.success) {
      setError(result.error);
    }
  };

  const styles = {
    container: {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      // Remplace le dégradé par l'image de fond
      backgroundImage: `url(${bgAccueil})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      // Option : ajouter une teinte sombre pour améliorer la lisibilité
      // backgroundColor: 'rgba(0,0,0,0.3)',
      // backgroundBlendMode: 'overlay',
    },
    card: {
      background: 'white',
      borderRadius: '32px',
      padding: '40px',
      width: '420px',
      maxWidth: '90%',
      boxShadow: '0 20px 35px -12px rgba(0,0,0,0.2)',
      textAlign: 'center',
      
      backgroundColor: 'rgba(255,255,255,0.95)',
    },
    logo: {
      height: '70px',
      marginBottom: '16px',
    },
    title: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#0f172a',
      marginBottom: '8px',
    },
    subtitle: {
      color: '#64748b',
      marginBottom: '32px',
      fontSize: '14px',
    },
    input: {
      width: '100%',
      padding: '12px 16px',
      marginBottom: '16px',
      border: '1px solid #cbd5e1',
      borderRadius: '16px',
      fontSize: '14px',
      outline: 'none',
      transition: '0.2s',
    },
    button: {
      width: '100%',
      background: '#3b82f6',
      color: 'white',
      border: 'none',
      padding: '12px',
      borderRadius: '40px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: '0.2s',
    },
    error: {
      background: '#fee2e2',
      color: '#991b1b',
      padding: '10px',
      borderRadius: '12px',
      marginBottom: '20px',
      fontSize: '14px',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <img src={logo} alt="Powertech" style={styles.logo} />
        <h2 style={styles.title}>POWERTECH</h2>
        <p style={styles.subtitle}>Gestion des stocks</p>
        {error && <div style={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            required
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            required
          />
          <button type="submit" style={styles.button}>
            Se connecter
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;