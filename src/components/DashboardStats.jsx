import { useEffect, useState } from 'react';
import axios from 'axios';
import { Package, AlertTriangle, DollarSign, TrendingUp } from 'lucide-react';

export default function DashboardStats() {
  const [stats, setStats] = useState({ totalProduits: 0, produitsStockBas: 0, valeurTotaleStock: 0 });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/produits/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Erreur stats', error);
    }
  };

  const cards = [
    {
      title: 'PRODUITS EN STOCK',
      value: stats.totalProduits,
      icon: Package,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      valueColor: 'text-gray-900'
    },
    {
      title: 'STOCK BAS',
      value: stats.produitsStockBas,
      icon: AlertTriangle,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      valueColor: 'text-amber-600'
    },
    {
      title: 'VALEUR DU STOCK',
      value: `${(stats.valeurTotaleStock || 0).toLocaleString()} FCFA`,
      icon: DollarSign,
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      valueColor: 'text-emerald-600'
    },
    {
      title: 'CA MOIS',
      value: '0 FCFA',
      icon: TrendingUp,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      valueColor: 'text-purple-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => (
        <div key={idx} className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{card.title}</p>
              <p className={`text-2xl font-bold mt-1 ${card.valueColor}`}>{card.value}</p>
            </div>
            <div className={`p-2 rounded-full ${card.iconBg}`}>
              <card.icon className={`h-5 w-5 ${card.iconColor}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}