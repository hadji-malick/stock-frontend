import { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function Dashboard() {
  const [ventesParJour, setVentesParJour] = useState([]);
  const [topProduits, setTopProduits] = useState([]);
  const [totalVentes, setTotalVentes] = useState(0);
  const [chiffreAffaire, setChiffreAffaire] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/produits/ventes');
      const ventes = response.data;
      
      // Total des ventes
      setTotalVentes(ventes.length);
      setChiffreAffaire(ventes.reduce((sum, v) => sum + (v.montantTotal || 0), 0));
      
      // Ventes par jour (derniers 7 jours)
      const ventesParJourMap = new Map();
      ventes.forEach(v => {
        const jour = new Date(v.dateVente).toLocaleDateString('fr-FR');
        ventesParJourMap.set(jour, (ventesParJourMap.get(jour) || 0) + (v.quantite || 0));
      });
      const ventesJour = Array.from(ventesParJourMap.entries())
        .map(([jour, quantite]) => ({ jour, quantite }))
        .slice(-7);
      setVentesParJour(ventesJour);
      
      // Top produits
      const topProduitsMap = new Map();
      ventes.forEach(v => {
        const nom = v.produit?.nom || 'Inconnu';
        topProduitsMap.set(nom, (topProduitsMap.get(nom) || 0) + (v.quantite || 0));
      });
      const top = Array.from(topProduitsMap.entries())
        .map(([nom, quantite]) => ({ nom, quantite }))
        .sort((a, b) => b.quantite - a.quantite)
        .slice(0, 5);
      setTopProduits(top);
      
      setLoading(false);
    } catch (error) {
      console.error('Erreur chargement dashboard', error);
      setLoading(false);
    }
  };

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border p-6 h-80 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-100 rounded"></div>
        </div>
        <div className="bg-white rounded-lg border p-6 h-80 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cartes récapitulatives */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white shadow-sm">
          <p className="text-sm opacity-80">Total des ventes</p>
          <p className="text-2xl font-bold">{totalVentes}</p>
        </div>
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg p-4 text-white shadow-sm">
          <p className="text-sm opacity-80">Chiffre d'affaires</p>
          <p className="text-2xl font-bold">{chiffreAffaire.toLocaleString()} FCFA</p>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white shadow-sm">
          <p className="text-sm opacity-80">Produits différents</p>
          <p className="text-2xl font-bold">{topProduits.length}</p>
        </div>
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg p-4 text-white shadow-sm">
          <p className="text-sm opacity-80">Moyenne / vente</p>
          <p className="text-2xl font-bold">{totalVentes > 0 ? Math.round(chiffreAffaire / totalVentes).toLocaleString() : 0} FCFA</p>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Évolution des ventes */}
        <div className="bg-white rounded-lg border p-5">
          <h3 className="text-md font-semibold text-gray-700 mb-4">📈 Évolution des ventes</h3>
          {ventesParJour.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ventesParJour}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="jour" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="quantite" name="Quantité vendue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">Aucune donnée</div>
          )}
        </div>

        {/* Top produits */}
        <div className="bg-white rounded-lg border p-5">
          <h3 className="text-md font-semibold text-gray-700 mb-4">🏆 Top produits</h3>
          {topProduits.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={topProduits}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ nom, quantite }) => `${nom}: ${quantite}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="quantite"
                >
                  {topProduits.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">Aucune donnée</div>
          )}
        </div>
      </div>
    </div>
  );
}