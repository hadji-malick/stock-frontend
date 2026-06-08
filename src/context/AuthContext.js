import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        if (token && userData) {
            setUser(JSON.parse(userData));
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        setLoading(false);
    }, []);

    const login = async (email, motDePasse) => {
        try {
            const response = await axios.post('http://localhost:8080/api/auth/login', { email, motDePasse });
            const { token, email: userEmail, nom, role } = response.data;
            
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify({ email: userEmail, nom, role }));
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setUser({ email: userEmail, nom, role });
            
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data?.error || 'Erreur de connexion' };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
    };

    const hasRole = (roles) => {
        if (!user) return false;
        return roles.includes(user.role);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, hasRole, loading }}>
            {children}
        </AuthContext.Provider>
    );
};