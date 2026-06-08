import React from 'react';
import { useAuth } from '../context/AuthContext';

function Header() {
    const { user, logout } = useAuth();

    const getRoleLabel = (role) => {
        switch(role) {
            case 'ADMIN': return '👑 Administrateur';
            case 'STOCK_MANAGER': return '📦 Gestionnaire stock';
            case 'VENDEUR': return '💰 Vendeur';
            default: return role;
        }
    };

    return (
        <div style={{
            backgroundColor: '#343a40',
            color: 'white',
            padding: '15px 30px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            borderRadius: '10px'
        }}>
            <div>
                <h2 style={{ margin: 0 }}>📦 Powertech - Gestion des stocks</h2>
                <small style={{ opacity: 0.8 }}>{getRoleLabel(user?.role)}</small>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <span>👋 Bonjour, {user?.nom}</span>
                <button
                    onClick={logout}
                    style={{
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '5px',
                        cursor: 'pointer'
                    }}
                >
                    Déconnexion
                </button>
            </div>
        </div>
    );
}

export default Header;