import { Bell, User, Phone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import logo from '../../assets/logo.png';

export default function Header({ activeSection }) {
  const { user } = useAuth();

  const getTitle = () => {
    switch(activeSection) {
      case 'dashboard': return 'Tableau de bord';
      case 'stocks': return 'Gestion des stocks';
      case 'panier': return 'Vente';
      case 'historique': return 'Historique des ventes';
      case 'cloture': return 'Clôture de caisse';
      case 'utilisateurs': return 'Utilisateurs';
      default: return 'Powertech';
    }
  };

  return (
    <header className="bg-white rounded-2xl shadow-sm border border-slate-100 px-6 py-4 flex justify-between items-center">
      <div className="flex items-center gap-4">
        <img src={logo} alt="Powertech" className="h-10 w-auto" />
        <div>
          <h1 className="text-xl font-bold text-slate-800">{getTitle()}</h1>
          <p className="text-xs text-slate-500 mt-0.5">Dakar, Sénégal</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-full">
          <Phone size={14} className="text-blue-600" />
          <span className="text-sm font-medium text-slate-700">(+221) 766432045</span>
        </div>
        <button className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <Bell size={18} className="text-slate-500" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
            <User size={14} className="text-white" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-slate-700">{user?.nom}</p>
            <p className="text-xs text-slate-400">{user?.role === 'ADMIN' ? 'Directeur' : user?.role === 'STOCK_MANAGER' ? 'Gestionnaire' : 'Vendeur'}</p>
          </div>
        </div>
      </div>
    </header>
  );
}