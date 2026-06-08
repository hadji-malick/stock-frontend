import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

function Dashboard() {
    const [stats, setStats] = useState({ ventesParJour: [], topProduits: [], totalVentes: 0, chiffreAffaire: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            // Récupérer toutes les ventes
            const response = await axios.get('http://localhost:8080/api/produits/ventes');
            const ventes = response.data;
            
            // Grouper les ventes par jour
            const ventesParJourMap = new Map();
            ventes.forEach(v => {
                const jour = new Date(v.dateVente).toLocaleDateString('fr-FR');
                ventesParJourMap.set(jour, (ventesParJourMap.get(jour) || 0) + v.quantite);
            });
            
            const ventesParJour = Array.from(ventesParJourMap.entries()).map(([jour, quantite]) => ({
                jour,
                quantite,
                date: new Date(jour.split('/').reverse().join('-'))
            })).sort((a, b) => a.date - b.date);
            
            // Grouper les produits les plus vendus
            const topProduitsMap = new Map();
            ventes.forEach(v => {
                const nom = v.produit?.nom || 'Inconnu';
                topProduitsMap.set(nom, (topProduitsMap.get(nom) || 0) + v.quantite);
            });
            
            const topProduits = Array.from(topProduitsMap.entries())
                .map(([nom, quantite]) => ({ nom, quantite }))
                .sort((a, b) => b.quantite - a.quantite)
                .slice(0, 5);
            
            // Calculer les totaux
            const totalVentes = ventes.length;
            const chiffreAffaire = ventes.reduce((sum, v) => sum + v.montantTotal, 0);
            
            setStats({ ventesParJour, topProduits, totalVentes, chiffreAffaire });
            setLoading(false);
        } catch (error) {
            console.error('Erreur', error);
            setLoading(false);
        }
    };

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '50px', backgroundColor: 'white', borderRadius: '15px' }}>
                ⏳ Chargement des statistiques...
            </div>
        );
    }

    return (
        <div style={{ marginBottom: '30px' }}>
            {/* Cartes statistiques */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '20px', 
                marginBottom: '30px' 
            }}>
                <div style={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                    color: 'white', 
                    padding: '20px', 
                    borderRadius: '15px',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                }}>
                    <h4 style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>Total des ventes</h4>
                    <p style={{ fontSize: '32px', margin: '10px 0 0', fontWeight: 'bold' }}>{stats.totalVentes}</p>
                </div>
                <div style={{ 
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', 
                    color: 'white', 
                    padding: '20px', 
                    borderRadius: '15px',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                }}>
                    <h4 style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>Chiffre d'affaires</h4>
                    <p style={{ fontSize: '32px', margin: '10px 0 0', fontWeight: 'bold' }}>{stats.chiffreAffaire.toLocaleString()} FCFA</p>
                </div>
                <div style={{ 
                    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', 
                    color: 'white', 
                    padding: '20px', 
                    borderRadius: '15px',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                }}>
                    <h4 style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>Produits différents</h4>
                    <p style={{ fontSize: '32px', margin: '10px 0 0', fontWeight: 'bold' }}>{stats.topProduits.length}</p>
                </div>
            </div>

            {/* Graphiques côte à côte */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
                gap: '20px',
                marginBottom: '20px'
            }}>
                {/* Graphique des ventes par jour */}
                <div style={{ 
                    backgroundColor: 'white', 
                    padding: '20px', 
                    borderRadius: '15px', 
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)' 
                }}>
                    <h4 style={{ margin: '0 0 20px 0', color: '#333' }}>📈 Évolution des ventes</h4>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={stats.ventesParJour}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="jour" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="quantite" stroke="#8884d8" strokeWidth={2} dot={{ r: 4 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Graphique des produits les plus vendus */}
                <div style={{ 
                    backgroundColor: 'white', 
                    padding: '20px', 
                    borderRadius: '15px', 
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)' 
                }}>
                    <h4 style={{ margin: '0 0 20px 0', color: '#333' }}>🏆 Top produits</h4>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={stats.topProduits}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="nom" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="quantite" fill="#82ca9d">
                                {stats.topProduits.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Graphique camembert (optionnel) */}
            {stats.topProduits.length > 0 && (
                <div style={{ 
                    backgroundColor: 'white', 
                    padding: '20px', 
                    borderRadius: '15px', 
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)' 
                }}>
                    <h4 style={{ margin: '0 0 20px 0', color: '#333' }}>🥧 Répartition des ventes par produit</h4>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={stats.topProduits}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ nom, quantite }) => `${nom}: ${quantite}`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="quantite"
                            >
                                {stats.topProduits.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}

export default Dashboard;