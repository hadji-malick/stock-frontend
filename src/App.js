import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import { Toaster, toast } from 'react-hot-toast';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';
import ConfirmationModal from './components/ui/ConfirmationModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logo from './assets/logo.png';
import bgAccueil from './assets/acceuil.png';
import FournisseurManagement from './components/FournisseurManagement';
import CommandeFournisseur from './components/CommandeFournisseur';
import CommandeConfirmation from './pages/CommandeConfirmation';
import CommandeModification from './pages/CommandeModification';
import ConfirmationModification from './pages/ConfirmationModification';
import AccepterModification from './pages/AccepterModification';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RealTimeNotification from './components/RealTimeNotification';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import CommandeDevis from './pages/CommandeDevis';
import CommandeRejeterDemande from './pages/CommandeRejeterDemande';
import ConfirmerDateExpedition from './pages/ConfirmerDateExpedition';

// ==================== HELPER DATE — clé stable YYYY-MM-DD ====================
// Remplace toLocaleDateString('fr-FR') qui est fragile (fuseau horaire, locale du navigateur).
// Utilisé partout où on doit comparer ou regrouper des ventes par jour.
const parseDate = (value) => {
  const date = new Date(value);
  return value && !Number.isNaN(date.getTime()) ? date : null;
};
const toDateKey = (d) => {
  const date = parseDate(d);
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// ==================== STYLES (CORPORATE BLEU) ====================
const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    background: 'var(--bg-primary)',
    fontFamily: "'Inter', system-ui, sans-serif"
  },
  sidebar: {
    width: '280px',
    background: 'var(--bg-sidebar)',
    color: '#f1f5f9',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    height: '100%',
    overflowY: 'auto',
    boxShadow: '4px 0 20px rgba(0,0,0,0.08)'
  },
  sidebarHeader: {
    background: 'var(--bg-sidebar-header)',
    padding: '20px 16px',
    textAlign: 'center',
    marginBottom: '20px'
  },
  sidebarLogo: { width: '100%', height: 'auto', display: 'block' },
  sidebarSub: { fontSize: '11px', color: '#ffedd5', marginTop: '4px' },
  sidebarLogoContainer: {
    backgroundColor: 'white', width: '100%', borderRadius: '12px',
    overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center'
  },
  sidebarTitle: { fontSize: '16px', fontWeight: 'bold', color: '#f97316', letterSpacing: '1px' },
  userCard: { margin: '24px 20px', padding: '16px', background: 'var(--bg-user-card)', borderRadius: '16px', textAlign: 'center' },
  userName: { fontSize: '15px', fontWeight: '600', color: 'white' },
  userRole: { fontSize: '12px', color: '#94a3b8', marginTop: '4px' },
  navItem: { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', margin: '4px 16px', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', fontWeight: '500' },
  navItemActive: { background: '#3b82f6', color: 'white', boxShadow: '0 4px 8px rgba(59,130,246,0.3)' },
  navItemInactive: { color: '#cbd5e1' },
  logoutBtn: { margin: 'auto 16px 24px 16px', padding: '12px', background: 'var(--bg-logout-btn)', border: 'none', borderRadius: '12px', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '500', transition: '0.2s' },
  main: { flex: 1, marginLeft: '280px', padding: '28px 32px', background: 'var(--bg-primary)', transition: 'background 0.3s ease' },
  header: { background: 'var(--bg-card)', borderRadius: '20px', padding: '16px 28px', marginBottom: '28px', boxShadow: 'var(--shadow)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background 0.3s ease, border 0.3s ease' },
  headerLogo: { height: '40px', marginRight: '16px' },
  headerTitle: { fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)', transition: 'color 0.3s ease' },
  headerSubtitle: { fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', transition: 'color 0.3s ease' },
  headerPhone: { fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', background: 'var(--bg-phone)', padding: '8px 16px', borderRadius: '40px', transition: 'background 0.3s ease, color 0.3s ease' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '28px' },
  statCard: { background: 'var(--bg-card)', borderRadius: '20px', padding: '20px', boxShadow: 'var(--shadow)', border: '1px solid var(--border-color)', transition: 'background 0.3s ease, border 0.3s ease' },
  statTitle: { fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' },
  statValue: { fontSize: '30px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '8px', transition: 'color 0.3s ease' },
  card: { background: 'var(--bg-card)', borderRadius: '20px', padding: '24px', boxShadow: 'var(--shadow)', border: '1px solid var(--border-color)', marginBottom: '24px', transition: 'background 0.3s ease, border 0.3s ease' },
  cardTitle: { fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', transition: 'color 0.3s ease' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '12px 12px', background: 'var(--table-header, var(--bg-table-header))', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', transition: 'background 0.3s ease, color 0.3s ease' },
  td: { padding: '12px 12px', borderBottom: '1px solid var(--border-color)', fontSize: '14px', color: 'var(--text-primary)', transition: 'color 0.3s ease, border 0.3s ease' },
  badge: { display: 'inline-block', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600' },
  badgeSuccess: { background: '#dcfce7', color: '#166534' },
  badgeWarning: { background: '#fef3c7', color: '#92400e' },
  btnPrimary: { background: '#3b82f6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '40px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', transition: '0.2s' },
  btnSecondary: { background: 'var(--bg-btn-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', padding: '10px 20px', borderRadius: '40px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', transition: '0.2s' },
  btnSuccess: { background: '#10b981', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '40px', cursor: 'pointer', fontWeight: '600' },
  btnDanger: { background: '#ef4444', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '30px', cursor: 'pointer', fontWeight: '500' },
  formGroup: { marginBottom: '18px' },
  label: { display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-secondary)', transition: 'color 0.3s ease' },
  input: { width: '100%', padding: '10px 14px', border: '1px solid var(--input-border)', borderRadius: '12px', fontSize: '14px', outline: 'none', transition: '0.2s', background: 'var(--bg-input)', color: 'var(--text-primary)' },
  modal: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
  modalContent: { background: 'var(--bg-card)', borderRadius: '24px', padding: '28px', width: '500px', maxWidth: '90%', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-color)', transition: 'background 0.3s ease, border 0.3s ease' },
  flexBetween: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  gap2: { display: 'flex', gap: '12px' },
  productGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px', marginTop: '16px' },
  productCard: { border: '1px solid var(--border-color)', borderRadius: '16px', padding: '16px', background: 'var(--bg-card)', transition: 'background 0.3s ease, border 0.3s ease' },
  productName: { fontSize: '15px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-primary)' },
  productPrice: { fontSize: '18px', fontWeight: '800', color: '#3b82f6', marginBottom: '6px' },
  productStock: { fontSize: '12px', color: 'var(--text-muted)', transition: 'color 0.3s ease' },
};

// ==================== TOKENS DASHBOARD : 1 jeu clair + 1 jeu sombre ====================
const DASH_TOKENS = {
  dark: {
    bg0: '#0d0f14', bg1: '#13161e', bg2: '#1a1e2a', bg3: '#232838', bg4: '#2d3347',
    acc: '#3b82f6', ind: '#6366f1', grn: '#10b981', amb: '#f59e0b', rose: '#f43f5e',
    tx1: '#f1f5f9', tx2: '#94a3b8', tx3: '#475569',
    chartGrid: 'rgba(255,255,255,0.06)',
    badgeBg: '#1e3a5f', badgeTx: '#60a5fa', badgeBorder: '#1e40af',
  },
  light: {
    bg0: '#f8fafc', bg1: '#ffffff', bg2: '#ffffff', bg3: '#f1f5f9', bg4: '#e2e8f0',
    acc: '#3b82f6', ind: '#6366f1', grn: '#059669', amb: '#d97706', rose: '#e11d48',
    tx1: '#0f172a', tx2: '#64748b', tx3: '#94a3b8',
    chartGrid: '#e2e8f0',
    badgeBg: '#eff6ff', badgeTx: '#2563eb', badgeBorder: '#bfdbfe',
  },
};

const SERIES_COLORS = ['#3b82f6', '#6366f1', '#10b981', '#f59e0b', '#f43f5e'];
const RANK_BG_DARK  = ['#1e3a5f', '#1a2e3a', '#2d1b46', '#1a3a2a', '#3a1a1a'];
const RANK_TX_DARK  = ['#60a5fa', '#22d3ee', '#a78bfa', '#34d399', '#fb7185'];
const RANK_BG_LIGHT = ['#dbeafe', '#cffafe', '#ede9fe', '#d1fae5', '#ffe4e6'];
const RANK_TX_LIGHT = ['#2563eb', '#0e7490', '#7c3aed', '#059669', '#e11d48'];

// ==================== TOOLTIP THEME-AWARE ====================
const DashTooltip = ({ active, payload, label, T }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: T.bg2, border: `1px solid ${T.bg4}`, borderRadius: 10, padding: '10px 14px', fontSize: 12, color: T.tx2 }}>
      <div style={{ color: T.tx1, fontWeight: 500, marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || T.acc }}>{p.name}: <strong>{p.value}</strong></div>
      ))}
    </div>
  );
};

// ==================== KPI CARD ====================
const KpiCard = ({ title, value, icon, accentColor, subText, subColor, T }) => (
  <div
    style={{ background: T.bg2, border: `1px solid ${T.bg4}`, borderRadius: 14, padding: 16, position: 'relative', overflow: 'hidden', transition: 'transform .2s, background .3s, border .3s', cursor: 'default' }}
    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
  >
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: accentColor }} />
    <div style={{ width: 36, height: 36, borderRadius: 10, background: accentColor.replace('linear-gradient(90deg,', '').split(',')[0].trim() + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, marginBottom: 12 }}>
      {icon}
    </div>
    <div style={{ fontSize: 11, color: T.tx2, textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 4 }}>{title}</div>
    <div style={{ fontSize: 22, fontWeight: 600, color: T.tx1, letterSpacing: '-.5px' }}>{value}</div>
    {subText && <div style={{ fontSize: 11, color: subColor || T.grn, marginTop: 4 }}>{subText}</div>}
  </div>
);

// ==================== DASH CARD ====================
const DCard = ({ children, style = {}, T }) => (
  <div style={{ background: T.bg2, border: `1px solid ${T.bg4}`, borderRadius: 14, padding: 18, transition: 'background .3s, border .3s', ...style }}>
    {children}
  </div>
);
const DCardHeader = ({ title, sub, badge, T }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
    <div>
      <div style={{ fontSize: 14, fontWeight: 500, color: T.tx1 }}>{title}</div>
      {sub && <div style={{ fontSize: 11, color: T.tx2, marginTop: 2 }}>{sub}</div>}
    </div>
    {badge && (
      <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 20, background: T.badgeBg, color: T.badgeTx, border: `1px solid ${T.badgeBorder}` }}>{badge}</span>
    )}
  </div>
);

// ==================== MINI BAR ====================
const MiniBar = ({ pct, color, T }) => (
  <div style={{ height: 4, borderRadius: 2, background: T.bg3, overflow: 'hidden', marginTop: 4, width: 80 }}>
    <div style={{ height: '100%', width: `${pct}%`, borderRadius: 2, background: color, transition: 'width .6s ease' }} />
  </div>
);

// ==================== DASHBOARD (theme-aware) ====================
function DashboardContent({ stats, ventesParJour, topProduits, totalVentes, chiffreAffaire, caMois }) {
  const { theme } = useTheme();
  const T = DASH_TOKENS[theme] || DASH_TOKENS.light;
  const RANK_BG = theme === 'dark' ? RANK_BG_DARK : RANK_BG_LIGHT;
  const RANK_TX = theme === 'dark' ? RANK_TX_DARK : RANK_TX_LIGHT;

  // ── Construction des 14 derniers jours via clé YYYY-MM-DD stable ──────────
  const chartData = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (13 - i));
      const key = toDateKey(d);
      const label = i === 13 ? 'Auj.' : `J-${13 - i}`;
      const match = (ventesParJour || []).find(v => v.jour === key);
      return { jour: label, quantite: match?.quantite ?? 0 };
    });
  }, [ventesParJour]);

  const maxVentes = Math.max(...chartData.map(d => d.quantite), 1);
  const avgVentes = totalVentes ? Math.round(totalVentes / 14) : 0;

  const fmtFCFA = v =>
    v >= 1_000_000 ? `${(v / 1_000_000).toFixed(2)} M FCFA` : `${(v || 0).toLocaleString('fr-FR')} FCFA`;

  const kpis = [
    { title: 'Produits en stock',  value: stats?.totalProduits ?? 0,             icon: '📦', accentColor: `linear-gradient(90deg,${T.acc},${T.ind})`,  subText: '↑ +12 ce mois' },
    { title: 'Stock bas',          value: stats?.produitsStockBas ?? 0,           icon: '⚠️', accentColor: `linear-gradient(90deg,${T.amb},#fbbf24)`,  subText: '⚑ À réapprovisionner', subColor: T.amb },
    { title: 'Valeur du stock',    value: fmtFCFA(stats?.valeurTotaleStock ?? 0), icon: '💰', accentColor: `linear-gradient(90deg,${T.grn},#34d399)`,  subText: '↑ +8.4 % vs mois dernier' },
    { title: 'CA du mois',         value: fmtFCFA(caMois),                        icon: '📈', accentColor: `linear-gradient(90deg,${T.rose},#fb7185)`, subText: '↑ +23 % vs mois dernier' },
  ];

  return (
    <div style={{ background: T.bg0, color: T.tx1, borderRadius: 20, padding: 24, fontFamily: "'Inter', system-ui, sans-serif", transition: 'background .3s, color .3s' }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(1.3)}}`}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 500, color: T.tx1, letterSpacing: '-.3px', margin: 0 }}>Performance des ventes</h2>
          <p style={{ fontSize: 12, color: T.tx2, marginTop: 3, marginBottom: 0 }}>Tableau de bord analytique · Données en temps réel</p>
        </div>
        <div style={{ background: T.badgeBg, color: T.badgeTx, fontSize: 11, padding: '4px 12px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 6, border: `1px solid ${T.badgeBorder}` }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.grn, animation: 'pulse 2s infinite', display: 'inline-block' }} />
          En direct
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
        {kpis.map((k, i) => <KpiCard key={i} {...k} T={T} />)}
      </div>

      {/* Area chart + Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginBottom: 16 }}>
        <DCard T={T}>
          <DCardHeader T={T} title="Évolution des ventes — 14 derniers jours" sub="Quantité journalière vendue" badge="Zone" />
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top: 6, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={T.acc} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={T.acc} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={T.chartGrid} />
              <XAxis dataKey="jour" stroke={T.tx3} tick={{ fill: T.tx3, fontSize: 10 }} />
              <YAxis stroke={T.tx3} tick={{ fill: T.tx3, fontSize: 10 }} />
              <Tooltip content={<DashTooltip T={T} />} />
              <Area type="monotone" dataKey="quantite" name="Ventes" stroke={T.acc} strokeWidth={2} fill="url(#gradBlue)"
                dot={{ fill: T.acc, r: 3, strokeWidth: 2, stroke: T.bg1 }}
                activeDot={{ r: 5, strokeWidth: 2, stroke: T.bg1 }} />
            </AreaChart>
          </ResponsiveContainer>
        </DCard>

        <DCard T={T}>
          <DCardHeader T={T} title="Récapitulatif" sub="Vue globale" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div style={{ background: T.bg3, borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: T.grn }}>{totalVentes.toLocaleString('fr-FR')}</div>
              <div style={{ fontSize: 10, color: T.tx2, marginTop: 2 }}>Total ventes</div>
            </div>
            <div style={{ background: T.bg3, borderRadius: 10, padding: 12 }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: T.ind }}>{topProduits.length}</div>
              <div style={{ fontSize: 10, color: T.tx2, marginTop: 2 }}>Produits différents</div>
            </div>
            <div style={{ background: T.bg3, borderRadius: 10, padding: 12, gridColumn: 'span 2' }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: T.acc }}>{fmtFCFA(chiffreAffaire)}</div>
              <div style={{ fontSize: 10, color: T.tx2, marginTop: 2 }}>Chiffre d'affaires total</div>
            </div>
          </div>
          <div style={{ height: '1px', background: T.bg4, margin: '12px 0' }} />
          <div style={{ display: 'flex', gap: 12 }}>
            {[{ label: 'Moy./jour', val: avgVentes, color: T.amb }, { label: 'Meilleur jour', val: maxVentes, color: T.grn }].map((m, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: T.tx2, marginBottom: 4 }}>{m.label}</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: m.color }}>{m.val}</div>
              </div>
            ))}
          </div>
        </DCard>
      </div>

      {/* Bar chart + Ranking */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <DCard T={T}>
          <DCardHeader T={T} title="Top produits — nombre de ventes" sub="Classement par quantité" badge="Barres" />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topProduits.slice(0, 8).map((p, i) => ({ name: p.nom?.split(' ')[0] ?? `P${i + 1}`, ventes: p.quantite }))} margin={{ top: 6, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.chartGrid} />
              <XAxis dataKey="name" stroke={T.tx3} tick={{ fill: T.tx3, fontSize: 10 }} />
              <YAxis stroke={T.tx3} tick={{ fill: T.tx3, fontSize: 10 }} />
              <Tooltip content={<DashTooltip T={T} />} />
              <Bar dataKey="ventes" name="Ventes" fill={T.acc} radius={[6, 6, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </DCard>

        <DCard T={T}>
          <DCardHeader T={T} title="Classement produits" sub="Top 5 par volume" />
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['#', 'Produit', 'Ventes'].map((h, i) => (
                  <th key={i} style={{ fontSize: 10, color: T.tx3, textTransform: 'uppercase', letterSpacing: '.5px', paddingBottom: 10, textAlign: i === 2 ? 'right' : 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topProduits.slice(0, 5).map((p, i) => {
                const pct = Math.round(p.quantite / (topProduits[0]?.quantite || 1) * 100);
                return (
                  <tr key={i}>
                    <td style={{ padding: '8px 0', borderTop: `1px solid ${T.bg4}` }}>
                      <div style={{ width: 20, height: 20, borderRadius: 6, background: RANK_BG[i] ?? T.bg3, color: RANK_TX[i] ?? T.tx2, fontSize: 10, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</div>
                    </td>
                    <td style={{ padding: '8px 8px', borderTop: `1px solid ${T.bg4}` }}>
                      <div style={{ fontSize: 12, color: T.tx1 }}>{p.nom}</div>
                      <MiniBar T={T} pct={pct} color={RANK_TX[i] ?? T.acc} />
                    </td>
                    <td style={{ textAlign: 'right', padding: '8px 0', borderTop: `1px solid ${T.bg4}`, fontSize: 13, fontWeight: 500, color: RANK_TX[i] ?? T.tx1 }}>{p.quantite}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </DCard>
      </div>
    </div>
  );
}

// ==================== PANIER (VENDEUR) ====================
function CartComponent({ produits, user, onSaleComplete }) {
  const [panier, setPanier] = useState([]);
  const [quantites, setQuantites] = useState({});
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const setQty = (produitId, value, maxStock) => {
    let q = parseInt(value) || 0;
    if (q < 1) q = 1;
    if (q > maxStock) q = maxStock;
    setQuantites({ ...quantites, [produitId]: q });
  };

  const ajouterAuPanier = (produit) => {
    const qty = quantites[produit.id] || 1;
    if (qty > produit.quantiteStock) { toast.error(`Stock insuffisant pour ${produit.nom}`); return; }
    setPanier(prev => {
      const existing = prev.find(i => i.id === produit.id);
      if (existing) {
        if (existing.quantite + qty > produit.quantiteStock) { toast.error('Stock maximum atteint'); return prev; }
        return prev.map(i => i.id === produit.id ? { ...i, quantite: i.quantite + qty } : i);
      }
      return [...prev, { ...produit, quantite: qty }];
    });
    toast.success(`${qty} x ${produit.nom} ajouté au panier`);
  };

  const retirerDuPanier = (id) => setPanier(prev => prev.filter(i => i.id !== id));
  const modifierQuantite = (id, newQty, maxStock) => {
    if (newQty < 1) return retirerDuPanier(id);
    if (newQty > maxStock) { toast.error(`Stock maximum: ${maxStock}`); return; }
    setPanier(prev => prev.map(i => i.id === id ? { ...i, quantite: newQty } : i));
  };

  const validerVente = async () => {
    if (!panier.length) { toast.error('Panier vide'); return; }
    setLoading(true);
    try {
      const items = panier.map(i => ({ produitId: i.id, quantite: i.quantite }));
      const res = await axios.post('http://localhost:8080/api/produits/vente-multi', { items, vendeur: user?.nom || 'Vendeur', commentaire: '' });
      toast.success(`✅ Vente validée ! Facture: ${res.data.numeroFacture}`, { duration: 5000, icon: '🧾' });
      setPanier([]);
      if (onSaleComplete) onSaleComplete();
      imprimerTicketSilencieux(res.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    } finally { setLoading(false); }
  };

  const imprimerTicketSilencieux = (data) => {
    const ticketHtml = `<!DOCTYPE html><html><head><title>Ticket Powertech</title><style>body{font-family:monospace;padding:20px;margin:0}.ticket{max-width:300px;margin:auto;border:1px solid #ccc;padding:20px;border-radius:12px;text-align:center}.logo{width:80px;margin-bottom:10px}.header{font-size:18px;font-weight:bold}.sub{font-size:10px;color:#666;margin-bottom:15px}.row{display:flex;justify-content:space-between;margin:6px 0}.total{font-weight:bold;border-top:1px dashed #aaa;padding-top:8px;margin-top:8px}.footer{margin-top:15px;font-size:10px}@media print{body{margin:0;padding:0}.ticket{border:none;padding:10px}}</style></head><body><div class="ticket"><img src="${logo}" class="logo" alt="Powertech"/><div class="header">POWERTECH</div><div class="sub">ENGINEERING GROUP</div><div>Facture: ${data.numeroFacture}</div><div>${new Date().toLocaleString()}</div><div>Vendeur: ${user?.nom}</div><hr/>${data.details.map(d => `<div class="row"><span>${d.produit} x ${d.quantite}</span><span>${d.sousTotal.toLocaleString()} FCFA</span></div>`).join('')}<div class="row total"><span>TOTAL</span><span>${data.total.toLocaleString()} FCFA</span></div><div class="footer">Merci de votre visite !<br/>Dakar, Sénégal</div></div><script>window.onload=function(){window.print();setTimeout(()=>window.close(),1000)}<\/script></body></html>`;
    const win = window.open('', '_blank', 'width=400,height=300,toolbar=no,menubar=no,scrollbars=yes,resizable=yes');
    win.document.write(ticketHtml);
    win.document.close();
  };

  const posColors = { blue: '#3b82f6', green: '#10b981', amber: '#f59e0b', red: '#ef4444' };
  const avatarColors = ['#3b82f6', '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#f97316'];
  const colorFor = (name = '') => { let h = 0; for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h); return avatarColors[Math.abs(h) % avatarColors.length]; };
  const initialsFor = (name = '') => name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  const filteredProduits = produits.filter(p => p.quantiteStock > 0 && (p.nom?.toLowerCase().includes(searchTerm.toLowerCase()) || p.reference?.toLowerCase().includes(searchTerm.toLowerCase())));
  const total = panier.reduce((s, i) => s + i.prixVente * i.quantite, 0);
  const totalArticles = panier.reduce((s, i) => s + i.quantite, 0);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px', alignItems: 'start' }}>
      <style>{`
        .pt-ticket-edge {
          height: 12px;
          background:
            linear-gradient(-45deg, var(--bg-card) 8px, transparent 0) 0 0,
            linear-gradient(45deg, var(--bg-card) 8px, transparent 0) 0 0;
          background-size: 16px 16px;
          background-color: var(--bg-primary);
        }
      `}</style>

      {/* ===== CATALOGUE PRODUITS ===== */}
      <div style={{ ...styles.card, marginBottom: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 18 }}>
          <div style={styles.cardTitle}>📦 Produits disponibles</div>
          <div style={{ position: 'relative', minWidth: 240 }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>🔍</span>
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ ...styles.input, paddingLeft: 38, borderRadius: 40, height: 38 }}
            />
          </div>
        </div>

        <div style={styles.productGrid}>
          {filteredProduits.map(p => {
            const isLow = p.quantiteStock <= (p.seuilAlerte || 5);
            const color = colorFor(p.nom);
            const qty = quantites[p.id] || 1;
            return (
              <div key={p.id} style={{ ...styles.productCard, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: color + '22', color, border: `1.5px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                    {initialsFor(p.nom)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ ...styles.productName, marginBottom: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.nom}</div>
                    <div style={{ fontSize: 11, color: isLow ? posColors.amber : 'var(--text-muted)', fontWeight: 600 }}>
                      {isLow ? `⚠️ Stock: ${p.quantiteStock}` : `Stock: ${p.quantiteStock}`}
                    </div>
                  </div>
                </div>

                <div style={styles.productPrice}>{p.prixVente.toLocaleString()} FCFA</div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: 30, overflow: 'hidden' }}>
                    <button onClick={() => setQty(p.id, qty - 1, p.quantiteStock)} style={{ width: 30, height: 30, border: 'none', background: 'var(--bg-btn-secondary)', color: 'var(--text-primary)', fontWeight: 700, cursor: 'pointer' }}>-</button>
                    <span style={{ width: 32, textAlign: 'center', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{qty}</span>
                    <button onClick={() => setQty(p.id, qty + 1, p.quantiteStock)} style={{ width: 30, height: 30, border: 'none', background: 'var(--bg-btn-secondary)', color: 'var(--text-primary)', fontWeight: 700, cursor: 'pointer' }}>+</button>
                  </div>
                  <button
                    style={{ ...styles.btnSuccess, flex: 1, opacity: p.quantiteStock === 0 ? 0.5 : 1, cursor: p.quantiteStock === 0 ? 'not-allowed' : 'pointer' }}
                    disabled={p.quantiteStock === 0}
                    onClick={() => ajouterAuPanier(p)}
                  >➕ Ajouter</button>
                </div>
              </div>
            );
          })}
          {filteredProduits.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🔍</div>
              Aucun produit ne correspond à votre recherche
            </div>
          )}
        </div>
      </div>

      {/* ===== TICKET / PANIER ===== */}
      <div style={{ position: 'sticky', top: 20 }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '20px 20px 0 0', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 22px 14px 22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={styles.cardTitle}>🧾 Ticket en cours</div>
              <span style={{ fontSize: 12, fontWeight: 700, color: posColors.blue, background: posColors.blue + '1c', padding: '4px 10px', borderRadius: 20 }}>
                {totalArticles} article{totalArticles > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {panier.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🛒</div>
              Le ticket est vide
            </div>
          ) : (
            <div style={{ padding: '0 22px', maxHeight: '46vh', overflowY: 'auto' }}>
              {panier.map((item, idx) => (
                <div key={item.id} style={{ padding: '12px 0', borderBottom: idx < panier.length - 1 ? '1px dashed var(--border-color)' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>{item.nom}</div>
                      <div style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        {item.prixVente.toLocaleString()} × {item.quantite}
                      </div>
                    </div>
                    <div style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-primary)', fontSize: 14 }}>
                      {(item.prixVente * item.quantite).toLocaleString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: 30, overflow: 'hidden' }}>
                      <button onClick={() => modifierQuantite(item.id, item.quantite - 1, item.quantiteStock)} style={{ width: 26, height: 26, border: 'none', background: 'var(--bg-btn-secondary)', color: 'var(--text-primary)', fontWeight: 700, cursor: 'pointer' }}>-</button>
                      <span style={{ width: 28, textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{item.quantite}</span>
                      <button onClick={() => modifierQuantite(item.id, item.quantite + 1, item.quantiteStock)} style={{ width: 26, height: 26, border: 'none', background: 'var(--bg-btn-secondary)', color: 'var(--text-primary)', fontWeight: 700, cursor: 'pointer' }}>+</button>
                    </div>
                    <button onClick={() => retirerDuPanier(item.id)} style={{ background: posColors.red + '1c', color: posColors.red, border: 'none', borderRadius: 30, padding: '5px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>🗑️ Retirer</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-ticket-edge" />

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderTop: 'none', borderRadius: '0 0 20px 20px', padding: '18px 22px', boxShadow: 'var(--shadow)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
            <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 600 }}>Total</span>
            <span style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{total.toLocaleString()} <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>FCFA</span></span>
          </div>
          <button
            style={{ ...styles.btnPrimary, width: '100%', background: posColors.green, justifyContent: 'center', fontSize: 15, padding: '14px', opacity: (!panier.length || loading) ? 0.6 : 1, cursor: (!panier.length || loading) ? 'not-allowed' : 'pointer' }}
            onClick={validerVente}
            disabled={!panier.length || loading}
          >
            {loading ? '⏳ Validation...' : '✅ Valider la vente'}
          </button>
        </div>
      </div>
    </div>
  );
}
// ==================== CLÔTURE CAISSE ====================
function CashClosureComponent({ onCloture }) {
  const { user } = useAuth();
  const [montantReel, setMontantReel] = useState('');
  const [commentaire, setCommentaire] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [statut, setStatut] = useState(null);
  const [historiqueClotures, setHistoriqueClotures] = useState([]);
  const isVendeur = user?.role === 'VENDEUR';
  const canSeeHistorique = user?.role === 'ADMIN' || user?.role === 'STOCK_MANAGER';

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => { check(); if (canSeeHistorique) fetchHistorique(); }, [canSeeHistorique]);

  const check = async () => { try { const res = await axios.get('http://localhost:8080/api/produits/cloture/statut'); setStatut(res.data); } catch (e) { console.error(e); } };
  const fetchHistorique = async () => { try { const res = await axios.get('http://localhost:8080/api/produits/cloture/historique'); setHistoriqueClotures(res.data); } catch (e) { console.error(e); } };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!montantReel) { toast.error('Montant requis'); return; }
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:8080/api/produits/cloture', { montantReel: parseFloat(montantReel), commentaire });
      toast.success(res.data.message);
      setMessage({ type: 'success', text: res.data.message });
      setMontantReel(''); setCommentaire('');
      if (onCloture) onCloture();
      check();
      if (canSeeHistorique) fetchHistorique();
    } catch (err) {
      const errorText = err.response?.data?.error || 'Erreur';
      toast.error(errorText);
      setMessage({ type: 'error', text: errorText });
    } finally { setLoading(false); }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentClotures = historiqueClotures.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(historiqueClotures.length / itemsPerPage);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) setCurrentPage(totalPages);
  }, [historiqueClotures.length]);

  const cashColors = { blue: '#3b82f6', green: '#10b981', amber: '#f59e0b', red: '#ef4444', gray: '#94a3b8' };

  const getEcartMeta = (type) => {
    if (type === 'MANQUANT') return { label: 'Manquant', icon: '⚠️', color: cashColors.red };
    if (type === 'EXCEDENT') return { label: 'Excédent', icon: '📈', color: cashColors.amber };
    return { label: 'Équilibré', icon: '✅', color: cashColors.green };
  };

  // ===== Vue historique (ADMIN / STOCK_MANAGER) =====
  if (!isVendeur && canSeeHistorique) {
    return (
      <div style={styles.card}>
        <div style={styles.cardTitle}><span>📊</span> Historique des clôtures de caisse</div>
        {historiqueClotures.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Aucune clôture enregistrée</div>
        ) : (
          <>
            <div style={{ overflowX: 'auto', borderRadius: 16, border: '1px solid var(--border-color)', marginTop: 12 }}>
              <table style={styles.table}>
                <thead><tr><th style={styles.th}>Date</th><th style={styles.th}>Théorique</th><th style={styles.th}>Réel</th><th style={styles.th}>Écart</th><th style={styles.th}>Type</th><th style={styles.th}>Caissier</th><th style={styles.th}>Commentaire</th></tr></thead>
                <tbody>
                  {currentClotures.map(c => {
                    const meta = getEcartMeta(c.typeEcart);
                    return (
                      <tr key={c.id}>
                        <td style={styles.td}>{new Date(c.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                        <td style={styles.td}><strong>{c.montantTheorique?.toLocaleString()} FCFA</strong></td>
                        <td style={styles.td}><strong>{c.montantReel?.toLocaleString()} FCFA</strong></td>
                        <td style={{ ...styles.td, fontFamily: 'monospace', color: meta.color, fontWeight: 700 }}>
                          {c.ecart > 0 ? '+' : ''}{c.ecart?.toLocaleString()} FCFA
                        </td>
                        <td style={styles.td}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: meta.color + '1c', color: meta.color, border: `1px solid ${meta.color}33` }}>
                            {meta.icon} {meta.label}
                          </span>
                        </td>
                        <td style={styles.td}>{c.caissier}</td>
                        <td style={styles.td}>{c.commentaire || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '20px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} style={{ ...styles.btnSecondary, opacity: currentPage === 1 ? 0.5 : 1 }}>◀ Précédent</button>
                <span style={{ alignSelf: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>Page {currentPage} / {totalPages}</span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={{ ...styles.btnSecondary, opacity: currentPage === totalPages ? 0.5 : 1 }}>Suivant ▶</button>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // ===== Vue "déjà clôturée" =====
  if (statut?.estCloturee) {
    return (
      <div style={styles.card}>
        <div style={styles.cardTitle}>🔒 Clôture de caisse</div>
        <div style={{ textAlign: 'center', padding: '40px 20px', background: cashColors.green + '10', borderRadius: '20px', border: `1px solid ${cashColors.green}33`, marginTop: 12 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: cashColors.green + '1c', color: cashColors.green, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, margin: '0 auto 14px' }}>🔒</div>
          <p style={{ fontWeight: 700, color: cashColors.green, fontSize: 16, margin: 0 }}>Caisse déjà clôturée aujourd'hui</p>
          {statut.cloture && (
            <div style={{ background: 'var(--bg-card)', padding: '18px 24px', borderRadius: '16px', marginTop: '18px', border: '1px solid var(--border-color)', display: 'inline-block', textAlign: 'left', minWidth: 260 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', color: 'var(--text-primary)' }}><span>Montant théorique</span><strong>{statut.cloture.montantTheorique?.toLocaleString()} FCFA</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', color: 'var(--text-primary)' }}><span>Montant réel</span><strong>{statut.cloture.montantReel?.toLocaleString()} FCFA</strong></div>
              <div style={{ height: 1, background: 'var(--border-color)', margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                <span style={{ color: 'var(--text-primary)' }}>Écart</span>
                <strong style={{ color: statut.cloture.typeEcart === 'MANQUANT' ? cashColors.red : statut.cloture.typeEcart === 'EXCEDENT' ? cashColors.amber : cashColors.green }}>
                  {statut.cloture.ecart > 0 ? '+' : ''}{statut.cloture.ecart?.toLocaleString()} FCFA
                </strong>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===== Formulaire de clôture =====
  const montantTheorique = statut?.montantTheorique || 0;
  const ecartLive = montantReel !== '' ? (parseFloat(montantReel) - montantTheorique) : null;
  const ecartAbs = ecartLive !== null ? Math.abs(ecartLive) : 0;
  const gaugePct = montantTheorique > 0 ? Math.min(50, (ecartAbs / montantTheorique) * 100) : 0;
  const ecartColor = ecartLive === null ? cashColors.gray : ecartAbs < 1 ? cashColors.green : ecartLive > 0 ? cashColors.amber : cashColors.red;
  const ecartLabel = ecartLive === null ? '' : ecartAbs < 1 ? '✅ Caisse équilibrée' : ecartLive > 0 ? `📈 Excédent de ${ecartAbs.toLocaleString()} FCFA` : `⚠️ Manquant de ${ecartAbs.toLocaleString()} FCFA`;

  return (
    <div style={styles.card}>
      <div style={styles.cardTitle}>🔒 Clôture de caisse</div>

      {message && (
        <div style={{ padding: '12px 16px', borderRadius: '14px', marginBottom: '16px', background: message.type === 'success' ? cashColors.green + '15' : cashColors.red + '15', color: message.type === 'success' ? cashColors.green : cashColors.red, fontWeight: 600 }}>
          {message.text}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
        <div style={{ background: cashColors.blue + '10', border: `1px solid ${cashColors.blue}33`, borderRadius: 16, padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: cashColors.blue, textTransform: 'uppercase', letterSpacing: '.4px' }}>Montant théorique</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>{montantTheorique.toLocaleString()} <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>FCFA</span></div>
        </div>
        <div style={{ background: 'var(--bg-table-row-hover)', border: '1px solid var(--border-color)', borderRadius: 16, padding: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.4px' }}>Ventes du jour</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>{statut?.nombreVentes || 0}</div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Montant réel en caisse (FCFA)</label>
          <input type="number" style={{ ...styles.input, fontSize: 18, fontWeight: 700, padding: '14px 16px' }} value={montantReel} onChange={e => setMontantReel(e.target.value)} required />
        </div>

        {ecartLive !== null && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: ecartColor }}>{ecartLabel}</span>
            </div>
            <div style={{ position: 'relative', height: 8, background: 'var(--bg-table-header)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 2, background: 'var(--border-color)' }} />
              <div style={{
                position: 'absolute', top: 0, bottom: 0,
                left: ecartLive < 0 ? `${50 - gaugePct}%` : '50%',
                width: `${gaugePct}%`,
                background: ecartColor,
                borderRadius: 4, transition: 'all .3s ease'
              }} />
            </div>
          </div>
        )}

        <div style={styles.formGroup}>
          <label style={styles.label}>Commentaire (optionnel)</label>
          <input type="text" style={styles.input} value={commentaire} onChange={e => setCommentaire(e.target.value)} placeholder="Ex: Manque de monnaie" />
        </div>
        <button type="submit" style={{ ...styles.btnPrimary, width: '100%', justifyContent: 'center', padding: '14px', fontSize: 15 }} disabled={loading}>
          {loading ? '⏳ Clôture...' : '🔒 Valider la clôture'}
        </button>
      </form>
    </div>
  );
}
// ==================== GESTION UTILISATEURS ====================
function UserManagementComponent() {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ nom: '', email: '', motDePasse: '', role: 'VENDEUR' });

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:8080/api/auth/utilisateurs', { headers: { Authorization: `Bearer ${token}` } });
      setUsers(res.data);
    } catch (err) { console.error(err); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:8080/api/auth/register', formData, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Utilisateur créé'); fetchUsers(); setShowModal(false);
      setFormData({ nom: '', email: '', motDePasse: '', role: 'VENDEUR' });
    } catch (err) { toast.error(err.response?.data?.error || 'Erreur'); }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const updateData = { nom: formData.nom, email: formData.email, role: formData.role };
      if (formData.motDePasse.trim()) updateData.motDePasse = formData.motDePasse;
      await axios.put(`http://localhost:8080/api/auth/utilisateurs/${editingUser.id}`, updateData, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Utilisateur modifié'); fetchUsers(); setShowEditModal(false);
      setFormData({ nom: '', email: '', motDePasse: '', role: 'VENDEUR' });
    } catch (err) { toast.error(err.response?.data?.error || 'Erreur'); }
  };

  const deleteUser = async (id) => {
    if (window.confirm('Supprimer cet utilisateur ?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:8080/api/auth/utilisateurs/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        toast.success('Utilisateur supprimé'); fetchUsers();
      } catch (err) { toast.error('Erreur'); }
    }
  };

  const openEdit = (user) => { setEditingUser(user); setFormData({ nom: user.nom, email: user.email, motDePasse: '', role: user.role }); setShowEditModal(true); };

  const getRoleBadge = (role) => {
    if (role === 'ADMIN') return { label: 'Admin', color: '#8b5cf6', bg: '#f3e8ff' };
    if (role === 'STOCK_MANAGER') return { label: 'Gestionnaire', color: '#3b82f6', bg: '#eff6ff' };
    return { label: 'Vendeur', color: '#10b981', bg: '#ecfdf5' };
  };

  const UserForm = ({ onSubmit, submitLabel }) => (
    <form onSubmit={onSubmit}>
      <div style={styles.formGroup}><label style={styles.label}>Nom</label><input style={styles.input} value={formData.nom} onChange={e => setFormData({ ...formData, nom: e.target.value })} required /></div>
      <div style={styles.formGroup}><label style={styles.label}>Email</label><input type="email" style={styles.input} value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required /></div>
      <div style={styles.formGroup}><label style={styles.label}>Mot de passe{submitLabel === 'Enregistrer' ? ' (laisser vide pour ne pas changer)' : ''}</label><input type="password" style={styles.input} value={formData.motDePasse} onChange={e => setFormData({ ...formData, motDePasse: e.target.value })} required={submitLabel !== 'Enregistrer'} /></div>
      <div style={styles.formGroup}><label style={styles.label}>Rôle</label><select style={styles.input} value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}><option value="VENDEUR">Vendeur</option><option value="STOCK_MANAGER">Gestionnaire</option><option value="ADMIN">Administrateur</option></select></div>
      <div style={styles.gap2}><button type="submit" style={styles.btnPrimary}>{submitLabel}</button><button type="button" onClick={() => { setShowModal(false); setShowEditModal(false); }} style={{ ...styles.btnPrimary, background: '#94a3b8' }}>Annuler</button></div>
    </form>
  );

  return (
    <div style={styles.card}>
      <div style={styles.flexBetween}><div style={styles.cardTitle}>👥 Utilisateurs</div><button style={styles.btnPrimary} onClick={() => { setFormData({ nom: '', email: '', motDePasse: '', role: 'VENDEUR' }); setShowModal(true); }}>➕ Nouveau</button></div>
      <table style={styles.table}>
        <thead><tr><th style={styles.th}>Nom</th><th style={styles.th}>Email</th><th style={styles.th}>Rôle</th><th style={styles.th}>Actions</th></tr></thead>
        <tbody>
          {users.map(u => { const badge = getRoleBadge(u.role); return (
            <tr key={u.id}>
              <td style={styles.td}>{u.nom}</td><td style={styles.td}>{u.email}</td>
              <td style={styles.td}><span style={{ background: badge.bg, color: badge.color, padding: '4px 14px', borderRadius: '40px', fontSize: '12px', fontWeight: '600' }}>{badge.label}</span></td>
              <td style={styles.td}>
                <button style={{ ...styles.btnPrimary, padding: '6px 12px', marginRight: '8px', fontSize: '12px' }} onClick={() => openEdit(u)}>✏️ Modifier</button>
                <button style={styles.btnDanger} onClick={() => deleteUser(u.id)}>🗑️ Supprimer</button>
              </td>
            </tr>
          ); })}
        </tbody>
      </table>
      {showModal && (<div style={styles.modal}><div style={styles.modalContent}><div style={styles.flexBetween}><h3 style={{ color: 'var(--text-primary)' }}>Nouvel utilisateur</h3><button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '22px' }}>✖️</button></div><UserForm onSubmit={handleCreate} submitLabel="Créer" /></div></div>)}
      {showEditModal && editingUser && (<div style={styles.modal}><div style={styles.modalContent}><div style={styles.flexBetween}><h3 style={{ color: 'var(--text-primary)' }}>Modifier l'utilisateur</h3><button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', fontSize: '22px' }}>✖️</button></div><UserForm onSubmit={handleUpdate} submitLabel="Enregistrer" /></div></div>)}
    </div>
  );
}
// ==================== HELPERS HISTORIQUE (avatar vendeur, stats) ====================
const HIST_COLORS = ['#3b82f6', '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#f97316'];
const colorForVendeur = (name = '') => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return HIST_COLORS[Math.abs(hash) % HIST_COLORS.length];
};
const initialsForVendeur = (name = '') =>
  name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

const VendeurAvatar = ({ nom, size = 34 }) => {
  const color = colorForVendeur(nom || '');
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.3, background: color + '22', color,
      border: `1.5px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: size * 0.36, flexShrink: 0,
    }}>
      {initialsForVendeur(nom)}
    </div>
  );
};

const HistStatCard = ({ icon, label, value, color }) => (
  <div style={{
    flex: 1, minWidth: 160, background: 'var(--bg-card)', border: '1px solid var(--border-color)',
    borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
    transition: 'background .3s ease, border .3s ease',
  }}>
    <div style={{
      width: 38, height: 38, borderRadius: 10, background: color + '1c', color,
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0,
    }}>{icon}</div>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.4px' }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
    </div>
  </div>
);

// ==================== COMPOSANT PRINCIPAL ====================
function StockManagement() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const role = user?.role;
  const [activeSection, setActiveSection] = useState('');
  const [produits, setProduits] = useState([]);
  const [stats, setStats] = useState({ totalProduits: 0, produitsStockBas: 0, valeurTotaleStock: 0 });
  const [ventes, setVentes] = useState([]);
  const [ventesParJour, setVentesParJour] = useState([]);
  const [topProduits, setTopProduits] = useState([]);
  const [totalVentes, setTotalVentes] = useState(0);
  const [chiffreAffaire, setChiffreAffaire] = useState(0);
  const [caMois, setCaMois] = useState(0);
  const [newProduct, setNewProduct] = useState({ reference: '', nom: '', prixVente: '', quantiteStock: '', fournisseurId: '' });
  const [refresh, setRefresh] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockTab, setStockTab] = useState('add');
  const [restockProductId, setRestockProductId] = useState('');
  const [restockQuantity, setRestockQuantity] = useState(1);
  const [restockSupplier, setRestockSupplier] = useState('');
  const [restockLoading, setRestockLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [produitEdit, setProduitEdit] = useState(null);
  const [filtreDateDebut, setFiltreDateDebut] = useState('');
  const [filtreDateFin, setFiltreDateFin] = useState('');
  const [filtreVendeur, setFiltreVendeur] = useState('');
  const [filtreProduit, setFiltreProduit] = useState('');
  const [fournisseurs, setFournisseurs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  useEffect(() => { fetchProduits(); fetchStats(); fetchVentes(); fetchCAMois(); fetchFournisseurs(); }, [refresh]);

  const playSound = (type) => {
    if (!window.hasUserInteracted) return;
    const sounds = { warning: '/sounds/warning.wav', success: '/sounds/success.wav', error: '/sounds/error.wav' };
    if (sounds[type]) { const audio = new Audio(sounds[type]); audio.volume = 0.3; audio.play().catch(() => {}); }
  };

  useEffect(() => {
    const markInteraction = () => { window.hasUserInteracted = true; document.removeEventListener('click', markInteraction); };
    document.addEventListener('click', markInteraction);
    return () => document.removeEventListener('click', markInteraction);
  }, []);

  useEffect(() => { if ('Notification' in window) Notification.requestPermission().catch(() => {}); }, []);

  const handleWebsocketNotification = (notification) => {
    if (notification?.type === 'VENTE') {
      setRefresh(prev => prev + 1);
    }
  };

  const fetchCAMois = async () => { try { const res = await axios.get('http://localhost:8080/api/produits/ca-mois'); setCaMois(res.data); } catch (e) { console.error(e); } };

  const fetchProduits = async () => {
    try {
      const res = await axios.get('http://localhost:8080/api/produits');
      setProduits(res.data);
      const lowStock = res.data.filter(p => p.quantiteStock <= (p.seuilAlerte || 5));
      if (lowStock.length > 0) {
        const lastAlert = localStorage.getItem('lastLowStockAlert');
        const today = new Date().toDateString();
        if (lastAlert !== today) {
          playSound('warning');
          toast.error(`⚠️ ${lowStock.length} produit(s) en stock bas !`, { duration: 10000, position: 'top-right', icon: '⚠️' });
          if (Notification.permission === 'granted') new Notification('Stock bas !', { body: `${lowStock.length} produit(s) ont atteint leur seuil d'alerte`, icon: '/logo.png' });
          localStorage.setItem('lastLowStockAlert', today);
        }
      }
    } catch (e) { console.error(e); }
  };

  const fetchStats = async () => { try { const res = await axios.get('http://localhost:8080/api/produits/dashboard/stats'); setStats(res.data); } catch (e) { console.error(e); } };

  // ── fetchVentes corrigé : clés YYYY-MM-DD + tri chronologique avant slice ──
  const fetchVentes = async () => {
    try {
      const res = await axios.get('http://localhost:8080/api/produits/ventes');
      const ventesData = Array.isArray(res.data) ? res.data : [];
      const sortedVentes = ventesData.slice().sort((a, b) => new Date(b.dateVente) - new Date(a.dateVente));
      setVentes(sortedVentes);
      setTotalVentes(sortedVentes.length);
      setChiffreAffaire(sortedVentes.reduce((s, v) => s + (v.montantTotal || 0), 0));

      // Regroupement par jour avec clé stable
      const jourMap = new Map();
      sortedVentes.forEach(v => {
        const key = toDateKey(v.dateVente);
        jourMap.set(key, (jourMap.get(key) || 0) + (v.quantite || 0));
      });
      // Tri chronologique explicite AVANT de garder les 30 derniers jours
      const sortedDays = Array.from(jourMap.entries())
        .map(([jour, quantite]) => ({ jour, quantite }))
        .sort((a, b) => a.jour.localeCompare(b.jour)); // "YYYY-MM-DD" se trie correctement en texte
      setVentesParJour(sortedDays.slice(-30));

      const prodMap = new Map();
      sortedVentes.forEach(v => {
        const nom = v.produit?.nom || 'Inconnu';
        prodMap.set(nom, (prodMap.get(nom) || 0) + (v.quantite || 0));
      });
      setTopProduits(Array.from(prodMap.entries())
        .map(([nom, quantite]) => ({ nom, quantite }))
        .sort((a, b) => b.quantite - a.quantite)
        .slice(0, 8));
    } catch (e) { console.error(e); }
  };

  const fetchFournisseurs = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:8080/api/fournisseurs', { headers: { Authorization: `Bearer ${token}` } });
      setFournisseurs(res.data);
    } catch (err) { console.error('Erreur chargement fournisseurs', err); }
  };

  const addProduct = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:8080/api/produits', { reference: newProduct.reference, nom: newProduct.nom, prixVente: parseFloat(newProduct.prixVente), quantiteStock: parseInt(newProduct.quantiteStock), fournisseurId: newProduct.fournisseurId || null });
      setRefresh(prev => prev + 1);
      setNewProduct({ reference: '', nom: '', prixVente: '', quantiteStock: '', fournisseurId: '' });
      setShowStockModal(false); setActiveSection('stocks');
      toast.success('Produit ajouté avec succès');
    } catch (err) { toast.error(err.response?.data?.error || 'Erreur'); }
  };

  const deleteProduct = async () => {
    if (!productToDelete) return;
    try {
      await axios.delete(`http://localhost:8080/api/produits/${productToDelete}`);
      setRefresh(prev => prev + 1); toast.success('Produit supprimé');
    } catch (err) { toast.error(err.response?.data?.error || 'Erreur'); }
    finally { setShowDeleteConfirm(false); setProductToDelete(null); }
  };

  const handleRestock = async (e) => {
    e.preventDefault();
    if (!restockProductId || restockQuantity < 1) { toast.error('Choisissez un produit et une quantité'); return; }
    setRestockLoading(true);
    try {
      const res = await axios.post(`http://localhost:8080/api/produits/${restockProductId}/entree`, { quantite: restockQuantity, fournisseur: restockSupplier || 'Inconnu', note: '' });
      toast.success(`✅ Réapprovisionné ! Nouveau stock: ${res.data.nouveauStock}`);
      setRefresh(prev => prev + 1); setRestockProductId(''); setRestockQuantity(1); setRestockSupplier(''); setShowStockModal(false);
    } catch (err) { toast.error(err.response?.data?.error || 'Erreur'); }
    finally { setRestockLoading(false); }
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    if (!produitEdit) return;
    try {
      await axios.put(`http://localhost:8080/api/produits/${produitEdit.id}`, { reference: produitEdit.reference, nom: produitEdit.nom, prixVente: produitEdit.prixVente, seuilAlerte: produitEdit.seuilAlerte || 5, fournisseurId: produitEdit.fournisseur?.id || null });
      setRefresh(prev => prev + 1); setShowEditModal(false); setProduitEdit(null); setActiveSection('stocks');
      toast.success('Produit modifié avec succès');
    } catch (err) { toast.error(err.response?.data?.error || 'Erreur lors de la modification'); }
  };

  const imprimerTicketGroupe = (ventesGroupe, total, vendeur) => {
    const doc = new jsPDF();
    doc.setFontSize(18); doc.text('POWERTECH ENGINEERING GROUP', 105, 20, { align: 'center' });
    doc.setFontSize(10); doc.text(`Date: ${new Date().toLocaleString()}`, 105, 30, { align: 'center' }); doc.text(`Vendeur: ${vendeur}`, 105, 36, { align: 'center' });
    autoTable(doc, { head: [['Produit', 'Quantité', 'Prix unit.', 'Total']], body: ventesGroupe.map(v => [v.produit?.nom, v.quantite.toString(), `${v.prixUnitaire} FCFA`, `${(v.prixUnitaire * v.quantite).toLocaleString()} FCFA`]), startY: 45, styles: { fontSize: 10 }, headStyles: { fillColor: [59, 130, 246] } });
    doc.setFontSize(12); doc.text(`TOTAL : ${total.toLocaleString()} FCFA`, 105, doc.lastAutoTable.finalY + 10, { align: 'center' });
    doc.save(`ticket_${Date.now()}.pdf`);
  };

  const menuItems = useMemo(() => {
    if (role === 'ADMIN') return [{ section: 'dashboard', label: 'Dashboard', icon: '📊' }, { section: 'stocks', label: 'Gestion des stocks', icon: '📦' }, { section: 'commandes', label: 'Commandes', icon: '📦' }, { section: 'historique', label: 'Historique', icon: '📜' }, { section: 'cloture', label: 'Clôture de caisse', icon: '💰' }, { section: 'utilisateurs', label: 'Utilisateurs', icon: '👥' }, { section: 'fournisseurs', label: 'Fournisseurs', icon: '🏭' }];
    if (role === 'STOCK_MANAGER') return [{ section: 'dashboard', label: 'Dashboard', icon: '📊' }, { section: 'stocks', label: 'Gestion des stocks', icon: '📦' }, { section: 'commandes', label: 'Commandes', icon: '📦' }, { section: 'historique', label: 'Historique', icon: '📜' }, { section: 'cloture', label: 'Clôture de caisse', icon: '💰' }, { section: 'fournisseurs', label: 'Fournisseurs', icon: '🏭' }];
    if (role === 'VENDEUR') return [{ section: 'panier', label: 'Vente', icon: '🛒' }, { section: 'cloture', label: 'Clôture caisse', icon: '💰' }];
    return [];
  }, [role]);

  useEffect(() => { if (!activeSection && menuItems.length) setActiveSection(menuItems[0].section); }, [activeSection, menuItems]);
  const getRoleLabel = () => role === 'ADMIN' ? 'Administrateur' : role === 'STOCK_MANAGER' ? 'Gestionnaire Stock' : 'Vendeur';

  const filteredProduits = produits.filter(p => p.nom?.toLowerCase().includes(searchTerm.toLowerCase()) || p.reference?.toLowerCase().includes(searchTerm.toLowerCase()));
  const totalPages = Math.ceil(filteredProduits.length / itemsPerPage);
  const paginatedProduits = filteredProduits.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // ── getVentesFiltrees corrigé : comparaison via clé YYYY-MM-DD plutôt que Date >= / <= ──
  const getVentesFiltrees = () => {
    let filtered = ventes;
    if (filtreDateDebut) filtered = filtered.filter(v => toDateKey(v.dateVente) >= filtreDateDebut);
    if (filtreDateFin) filtered = filtered.filter(v => toDateKey(v.dateVente) <= filtreDateFin);
    if (filtreVendeur) filtered = filtered.filter(v => v.vendeur === filtreVendeur);
    if (filtreProduit) filtered = filtered.filter(v => v.produit?.nom === filtreProduit);
    return filtered;
  };

  const exportPDF = () => {
    const ventesFiltrees = getVentesFiltrees();
    if (!ventesFiltrees.length) { toast.error('Aucune donnée à exporter'); return; }
    const doc = new jsPDF();
    doc.setFontSize(18); doc.text('Rapport des ventes - Powertech', 14, 20);
    doc.setFontSize(10); doc.text(`Généré le ${new Date().toLocaleString()}`, 14, 30);
    autoTable(doc, { head: [['Date', 'Produit', 'Quantité', 'Total (FCFA)', 'Vendeur']], body: ventesFiltrees.map(v => [new Date(v.dateVente).toLocaleString(), v.produit?.nom || 'N/A', v.quantite.toString(), v.montantTotal.toLocaleString(), v.vendeur]), startY: 40, styles: { fontSize: 8 }, headStyles: { fillColor: [59, 130, 246] } });
    doc.save(`rapport_ventes_${new Date().toISOString().slice(0, 19)}.pdf`);
  };

  const ventesFiltrees = getVentesFiltrees();
  const getSaleGroupKey = (sale) => {
    const hasFacture = sale.factureId !== undefined && sale.factureId !== null;
    if (hasFacture) return `facture_${sale.factureId}`;
    return `transaction_${sale.vendeur || 'inconnu'}_${toDateKey(sale.dateVente)}_${sale.produit?.id || sale.produit?.nom || 'inconnu'}`;
  };
  const groupedVentes = (() => {
    const groups = new Map();
    ventesFiltrees.forEach(v => {
      const key = getSaleGroupKey(v);
      if (!groups.has(key)) groups.set(key, { ventes: [], factureId: v.factureId, date: v.dateVente, vendeur: v.vendeur });
      groups.get(key).ventes.push(v);
    });
    // tri du plus récent au plus ancien pour un affichage cohérent dans l'historique
    return Array.from(groups.values())
      .map(group => ({ ...group, total: group.ventes.reduce((sum, v) => sum + ((v.prixUnitaire || 0) * (v.quantite || 0)), 0) }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  })();

  return (
    <div style={styles.container}>
      <Toaster position="top-right" />
      <RealTimeNotification onNotification={handleWebsocketNotification} />

      {/* ===== SIDEBAR ===== */}
<div style={{ ...styles.sidebar, position: 'fixed', overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column' }}>
  {/* Liseré d'accent en haut */}
  <div style={{ height: 3, width: '100%', background: 'linear-gradient(90deg, #f97316, #3b82f6, #6366f1)', flexShrink: 0 }} />

  <div style={{ padding: '22px 16px 8px 16px', flexShrink: 0 }}>
    <div style={{
      background: 'white', borderRadius: 16, padding: '14px 16px', display: 'flex',
      justifyContent: 'center', alignItems: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
    }}>
      <img src={logo} alt="Powertech" style={{ width: '100%', height: 'auto', display: 'block' }} />
    </div>
  </div>

  {/* ===== TOGGLE THÈME ===== */}
  <div
    onClick={toggleTheme}
    style={{
      margin: '4px 16px 18px 16px', padding: '11px 16px', background: 'var(--bg-user-card)',
      borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      cursor: 'pointer', border: '1px solid rgba(255,255,255,0.06)', transition: '0.2s', flexShrink: 0,
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: 26, height: 26, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: theme === 'dark' ? '#6366f11c' : '#f59e0b1c', fontSize: 13,
      }}>{theme === 'light' ? '☀️' : '🌙'}</div>
      <span style={{ color: '#cbd5e1', fontSize: 13, fontWeight: 600 }}>
        {theme === 'light' ? 'Mode clair' : 'Mode sombre'}
      </span>
    </div>
    <div style={{ width: 42, height: 23, background: theme === 'dark' ? '#3b82f6' : '#475569', borderRadius: 12, position: 'relative', transition: '0.3s', flexShrink: 0 }}>
      <div style={{
        width: 17, height: 17, background: 'white', borderRadius: '50%', position: 'absolute', top: 3,
        left: theme === 'dark' ? '22px' : '3px', transition: '0.3s',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9,
      }}>{theme === 'dark' ? '🌙' : '☀️'}</div>
    </div>
  </div>

  {/* ===== CARTE UTILISATEUR ===== */}
  {/* ===== CARTE UTILISATEUR (compacte) ===== */}
{(() => {
  const roleColors = { ADMIN: '#8b5cf6', STOCK_MANAGER: '#3b82f6', VENDEUR: '#10b981' };
  const rc = roleColors[role] || '#94a3b8';
  const initials = (user?.nom || '').split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
  return (
    <div style={{
      margin: '0 16px 18px 16px', padding: '12px 14px', background: 'var(--bg-user-card)',
      borderRadius: 14, display: 'flex', alignItems: 'center', gap: 12,
      border: `1px solid ${rc}33`, flexShrink: 0,
    }}>
      <div style={{
        width: 36, height: 36, minWidth: 36, borderRadius: '50%', background: rc + '22', color: rc,
        border: `1.5px solid ${rc}55`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, fontWeight: 800, flexShrink: 0,
      }}>{initials}</div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.nom}</div>
        <span style={{
          display: 'inline-block', marginTop: 3, fontSize: 10.5, fontWeight: 700, color: rc,
          background: rc + '1c', padding: '2px 10px', borderRadius: 20, border: `1px solid ${rc}44`,
        }}>{getRoleLabel()}</span>
      </div>
    </div>
  );
})()}

  {/* ===== MENU ===== */}
  <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 3, flexShrink: 0 }}>
    {(() => {
      const ITEM_COLORS = {
        dashboard: '#3b82f6', stocks: '#f59e0b', commandes: '#6366f1', historique: '#14b8a6',
        cloture: '#10b981', utilisateurs: '#8b5cf6', fournisseurs: '#f97316', panier: '#10b981',
      };
      return menuItems.map(item => {
        const isActive = activeSection === item.section;
        const c = ITEM_COLORS[item.section] || '#3b82f6';
        return (
          <div
            key={item.section}
            onClick={() => setActiveSection(item.section)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 12,
              cursor: 'pointer', fontWeight: 600, fontSize: 14, position: 'relative', flexShrink: 0,
              background: isActive ? `linear-gradient(90deg, ${c}, ${c}cc)` : 'transparent',
              color: isActive ? 'white' : '#cbd5e1',
              boxShadow: isActive ? `0 6px 16px ${c}4d` : 'none',
              transition: 'background .15s ease, color .15s ease',
            }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
          >
            <div style={{
              width: 30, height: 30, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, flexShrink: 0,
              background: isActive ? 'rgba(255,255,255,0.2)' : c + '1c',
            }}>{item.icon}</div>
            <span>{item.label}</span>
          </div>
        );
      });
    })()}
  </div>

  {/* ===== DÉCONNEXION ===== */}
  <div style={{ marginTop: 'auto', padding: '16px 16px 22px 16px', flexShrink: 0 }}>
    <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 14 }} />
    <button
      onClick={logout}
      style={{
        width: '100%', padding: '12px', background: '#ef44441c', border: '1px solid #ef444444',
        borderRadius: 14, color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: 10, fontWeight: 700, fontSize: 13.5, transition: '0.2s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = '#ef444433'; }}
      onMouseLeave={e => { e.currentTarget.style.background = '#ef44441c'; }}
    >🚪 Déconnexion</button>
  </div>
</div>

      {/* ===== MAIN ===== */}
      <div style={styles.main}>
        {/* Header */}
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '6px 16px', display: 'flex', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
              <img src={logo} alt="Powertech" style={{ height: '40px', width: 'auto', display: 'block' }} />
            </div>
            <div style={{ height: '30px', width: '1px', background: 'var(--border-color)' }} />
            <div>
              <div style={{ ...styles.headerTitle, fontSize: '18px' }}>
                {activeSection === 'dashboard' && 'Tableau de bord'}
                {activeSection === 'stocks' && 'Gestion des stocks'}
                {activeSection === 'historique' && 'Historique des ventes'}
                {activeSection === 'panier' && 'Vente'}
                {activeSection === 'cloture' && 'Clôture de caisse'}
                {activeSection === 'utilisateurs' && 'Utilisateurs'}
                {activeSection === 'fournisseurs' && 'Gestion des fournisseurs'}
                {activeSection === 'commandes' && 'Commandes fournisseurs'}
              </div>
              <div style={styles.headerSubtitle}>{getRoleLabel()} – Dakar, Sénégal</div>
            </div>
          </div>
          <div style={styles.headerPhone}>📞 (+221) 766432045</div>
        </div>

        {/* ===== SECTIONS ===== */}
        {activeSection === 'dashboard' && (
          <DashboardContent stats={stats} ventesParJour={ventesParJour} topProduits={topProduits} totalVentes={totalVentes} chiffreAffaire={chiffreAffaire} caMois={caMois} />
        )}

        {activeSection === 'stocks' && (
  <div>
    {/* ===== HEADER AVEC RECHERCHE ===== */}
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      marginBottom: '24px', 
      flexWrap: 'wrap', 
      gap: '16px' 
    }}>
      <div style={{ 
        position: 'relative', 
        flex: 1, 
        maxWidth: '400px' 
      }}>
        <span style={{ 
          position: 'absolute', 
          left: '16px', 
          top: '50%', 
          transform: 'translateY(-50%)', 
          color: 'var(--text-muted)',
          fontSize: '16px'
        }}>🔍</span>
        <input 
          type="text" 
          placeholder="Rechercher par nom ou référence..." 
          value={searchTerm} 
          onChange={e => setSearchTerm(e.target.value)} 
          style={{ 
            ...styles.input, 
            paddingLeft: '44px', 
            borderRadius: '40px',
            height: '44px',
            border: '1px solid var(--input-border)',
            transition: '0.2s'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#3b82f6';
            e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'var(--input-border)';
            e.target.style.boxShadow = 'none';
          }}
        />
      </div>
      <button 
        onClick={() => { setStockTab('add'); setShowStockModal(true); }} 
        style={{ 
          ...styles.btnPrimary, 
          padding: '10px 24px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          borderRadius: '40px',
          height: '44px'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = '#2563eb'}
        onMouseLeave={(e) => e.currentTarget.style.background = '#3b82f6'}
      >
        ➕ Nouvelle opération
      </button>
    </div>

    {/* ===== TABLEAU ===== */}
    <div style={{ 
      overflowX: 'auto', 
      borderRadius: '16px', 
      border: '1px solid var(--border-color)', 
      background: 'var(--bg-card)',
      transition: 'background 0.3s ease, border 0.3s ease'
    }}>
      <table style={{ 
        width: '100%', 
        borderCollapse: 'collapse',
        fontSize: '14px'
      }}>
        <thead>
          <tr style={{ 
            background: 'var(--bg-table-header)',
            borderBottom: '2px solid var(--border-color)'
          }}>
            <th style={{ 
              padding: '14px 16px', 
              textAlign: 'left', 
              fontSize: '12px', 
              fontWeight: '600', 
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              width: '60px'
            }}>
              Thumbnail
            </th>
            <th style={{ 
              padding: '14px 16px', 
              textAlign: 'left', 
              fontSize: '12px', 
              fontWeight: '600', 
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Référence
            </th>
            <th style={{ 
              padding: '14px 16px', 
              textAlign: 'left', 
              fontSize: '12px', 
              fontWeight: '600', 
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Nom
            </th>
            <th style={{ 
              padding: '14px 16px', 
              textAlign: 'left', 
              fontSize: '12px', 
              fontWeight: '600', 
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Prix (FCFA)
            </th>
            <th style={{ 
              padding: '14px 16px', 
              textAlign: 'center', 
              fontSize: '12px', 
              fontWeight: '600', 
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              minWidth: '60px'
            }}>
              Stock
            </th>
            <th style={{ 
              padding: '14px 16px', 
              textAlign: 'left', 
              fontSize: '12px', 
              fontWeight: '600', 
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Fournisseur
            </th>
            <th style={{ 
              padding: '14px 16px', 
              textAlign: 'center', 
              fontSize: '12px', 
              fontWeight: '600', 
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              minWidth: '180px'
            }}>
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {paginatedProduits.length === 0 ? (
            <tr>
              <td colSpan="7" style={{ 
                textAlign: 'center', 
                padding: '60px 20px', 
                color: 'var(--text-muted)'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📦</div>
                <p>Aucun produit trouvé</p>
              </td>
            </tr>
          ) : (
            paginatedProduits.map((p, index) => {
              const isLowStock = p.quantiteStock <= (p.seuilAlerte || 5);
              const isRupture = p.quantiteStock === 0;
              
              let stockBadgeStyle = { 
                background: '#dcfce7', 
                color: '#166534',
                border: '1px solid #6ee7b7'
              };
              if (isRupture) {
                stockBadgeStyle = { 
                  background: '#fee2e2', 
                  color: '#991b1b',
                  border: '1px solid #fca5a5'
                };
              } else if (isLowStock) {
                stockBadgeStyle = { 
                  background: '#fef3c7', 
                  color: '#92400e',
                  border: '1px solid #fcd34d'
                };
              }

              // Couleurs d'avatar par produit
              const avatarColors = [
                '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
                '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'
              ];
              const avatarColor = avatarColors[index % avatarColors.length];
              const initials = p.nom?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

              return (
                <tr 
                  key={p.id} 
                  style={{ 
                    borderBottom: '1px solid var(--border-color)',
                    transition: '0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-table-row-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Thumbnail / Avatar */}
                  <td style={{ 
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border-color)'
                  }}>
                    <div style={{ 
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: avatarColor + '22',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      fontWeight: '600',
                      color: avatarColor,
                      border: `2px solid ${avatarColor}44`
                    }}>
                      {initials}
                    </div>
                  </td>
                  
                  {/* Référence */}
                  <td style={{ 
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontFamily: 'monospace',
                    fontWeight: '500'
                  }}>
                    {p.reference || '-'}
                  </td>
                  
                  {/* Nom */}
                  <td style={{ 
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontWeight: '600'
                  }}>
                    {p.nom}
                  </td>
                  
                  {/* Prix */}
                  <td style={{ 
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontWeight: '500'
                  }}>
                    {p.prixVente?.toLocaleString()} FCFA
                  </td>
                  
                  {/* Stock */}
                  <td style={{ 
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border-color)',
                    textAlign: 'center'
                  }}>
                    <span style={{ 
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: '32px',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '13px',
                      fontWeight: '600',
                      ...stockBadgeStyle
                    }}>
                      {p.quantiteStock}
                    </span>
                  </td>
                  
                  {/* Fournisseur */}
                  <td style={{ 
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border-color)',
                    color: 'var(--text-primary)'
                  }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      background: 'var(--bg-badge-default)',
                      color: 'var(--text-secondary)',
                      fontSize: '12px'
                    }}>
                      🏭 {p.fournisseur?.nom || '-'}
                    </span>
                  </td>
                  
                  {/* Actions */}
                  <td style={{ 
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border-color)',
                    textAlign: 'center'
                  }}>
                    <button 
                      onClick={() => { setProduitEdit(p); setShowEditModal(true); }} 
                      style={{ 
                        background: '#3b82f6',
                        border: 'none',
                        color: 'white',
                        padding: '6px 14px',
                        borderRadius: '30px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        marginRight: '8px',
                        transition: '0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#2563eb'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#3b82f6'}
                    >
                      ✏️ Modifier
                    </button>
                    <button 
                      onClick={() => { setProductToDelete(p.id); setShowDeleteConfirm(true); }} 
                      style={{ 
                        background: '#ef4444',
                        border: 'none',
                        color: 'white',
                        padding: '6px 14px',
                        borderRadius: '30px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        transition: '0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#dc2626'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#ef4444'}
                    >
                      🗑️ Supprimer
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>

    {/* ===== PAGINATION ===== */}
    {totalPages > 1 && (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        gap: '12px', 
        marginTop: '20px', 
        paddingTop: '16px', 
        borderTop: '1px solid var(--border-color)' 
      }}>
        <button 
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
          disabled={currentPage === 1}
          style={{ 
            padding: '8px 16px',
            borderRadius: '30px',
            border: '1px solid var(--border-color)',
            background: currentPage === 1 ? 'var(--bg-btn-secondary)' : 'var(--bg-table-header)',
            color: 'var(--text-secondary)',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            fontWeight: '500',
            fontSize: '13px',
            opacity: currentPage === 1 ? 0.5 : 1,
            transition: '0.2s'
          }}
        >
          ◀ Précédent
        </button>
        <span style={{ 
          padding: '8px 16px',
          background: 'var(--bg-table-header)',
          borderRadius: '30px',
          fontSize: '13px',
          fontWeight: '500',
          color: 'var(--text-secondary)'
        }}>
          Page {currentPage} / {totalPages}
        </span>
        <button 
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
          disabled={currentPage === totalPages}
          style={{ 
            padding: '8px 16px',
            borderRadius: '30px',
            border: '1px solid var(--border-color)',
            background: currentPage === totalPages ? 'var(--bg-btn-secondary)' : 'var(--bg-table-header)',
            color: 'var(--text-secondary)',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            fontWeight: '500',
            fontSize: '13px',
            opacity: currentPage === totalPages ? 0.5 : 1,
            transition: '0.2s'
          }}
        >
          Suivant ▶
        </button>
      </div>
    )}

    {/* ===== MODAL STOCK ===== */}
    {showStockModal && (
      <div style={styles.modal}>
        <div style={{ ...styles.modalContent, maxWidth: '580px' }}>
          <div style={styles.flexBetween}>
            <h3 style={{ color: 'var(--text-primary)' }}>📦 Gestion des stocks</h3>
            <button onClick={() => setShowStockModal(false)} style={{ background: 'none', border: 'none', fontSize: '22px', color: 'var(--text-primary)' }}>✖️</button>
          </div>
          <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-color)', marginBottom: '24px' }}>
            <button 
              onClick={() => setStockTab('add')} 
              style={{ 
                padding: '10px 18px', 
                background: stockTab === 'add' ? '#3b82f6' : 'transparent', 
                color: stockTab === 'add' ? 'white' : 'var(--text-secondary)', 
                border: 'none', 
                borderRadius: '40px', 
                fontWeight: '600',
                transition: '0.2s'
              }}
            >
              ➕ Ajouter
            </button>
            <button 
              onClick={() => setStockTab('restock')} 
              style={{ 
                padding: '10px 18px', 
                background: stockTab === 'restock' ? '#3b82f6' : 'transparent', 
                color: stockTab === 'restock' ? 'white' : 'var(--text-secondary)', 
                border: 'none', 
                borderRadius: '40px', 
                fontWeight: '600',
                transition: '0.2s'
              }}
            >
              📥 Réapprovisionner
            </button>
          </div>
          
          {stockTab === 'add' && (
            <form onSubmit={addProduct}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Référence *</label>
                <input style={styles.input} value={newProduct.reference} onChange={e => setNewProduct({ ...newProduct, reference: e.target.value })} required />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Nom *</label>
                <input style={styles.input} value={newProduct.nom} onChange={e => setNewProduct({ ...newProduct, nom: e.target.value })} required />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Prix (FCFA) *</label>
                <input type="number" style={styles.input} value={newProduct.prixVente} onChange={e => setNewProduct({ ...newProduct, prixVente: e.target.value })} required />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Quantité initiale *</label>
                <input type="number" style={styles.input} value={newProduct.quantiteStock} onChange={e => setNewProduct({ ...newProduct, quantiteStock: e.target.value })} required />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Fournisseur</label>
                <select style={styles.input} value={newProduct.fournisseurId || ''} onChange={e => setNewProduct({ ...newProduct, fournisseurId: e.target.value })}>
                  <option value="">-- Aucun --</option>
                  {fournisseurs.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
                </select>
              </div>
              <div style={styles.gap2}>
                <button type="submit" style={styles.btnPrimary}>✅ Ajouter</button>
                <button type="button" onClick={() => setShowStockModal(false)} style={{ ...styles.btnPrimary, background: '#94a3b8' }}>Annuler</button>
              </div>
            </form>
          )}
          
          {stockTab === 'restock' && (
            <form onSubmit={handleRestock}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Produit *</label>
                <select style={styles.input} value={restockProductId} onChange={e => setRestockProductId(parseInt(e.target.value))} required>
                  <option value="">-- Sélectionner --</option>
                  {produits.map(p => <option key={p.id} value={p.id}>{p.nom} (Stock: {p.quantiteStock})</option>)}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Quantité *</label>
                <input type="number" style={styles.input} value={restockQuantity} onChange={e => setRestockQuantity(parseInt(e.target.value))} min="1" required />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Fournisseur</label>
                <select style={styles.input} value={restockSupplier} onChange={e => setRestockSupplier(e.target.value)}>
                  <option value="">-- Sélectionner un fournisseur --</option>
                  {fournisseurs.map(f => <option key={f.id} value={f.nom}>{f.nom}</option>)}
                </select>
              </div>
              <div style={styles.gap2}>
                <button type="submit" style={styles.btnPrimary} disabled={restockLoading}>
                  {restockLoading ? '⏳ Traitement...' : '📥 Réapprovisionner'}
                </button>
                <button type="button" onClick={() => setShowStockModal(false)} style={{ ...styles.btnPrimary, background: '#94a3b8' }}>Annuler</button>
              </div>
            </form>
          )}
        </div>
      </div>
    )}

    {/* ===== MODAL MODIFICATION ===== */}
    {showEditModal && produitEdit && (
      <div style={styles.modal}>
        <div style={{ ...styles.modalContent, maxWidth: '500px' }}>
          <div style={styles.flexBetween}>
            <h3 style={{ color: 'var(--text-primary)' }}>✏️ Modifier le produit</h3>
            <button onClick={() => { setShowEditModal(false); setProduitEdit(null); }} style={{ background: 'none', border: 'none', fontSize: '22px', color: 'var(--text-primary)' }}>✖️</button>
          </div>
          <form onSubmit={handleUpdateProduct}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Référence *</label>
              <input style={styles.input} value={produitEdit.reference} onChange={e => setProduitEdit({ ...produitEdit, reference: e.target.value })} required />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Nom *</label>
              <input style={styles.input} value={produitEdit.nom} onChange={e => setProduitEdit({ ...produitEdit, nom: e.target.value })} required />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Prix (FCFA) *</label>
              <input type="number" style={styles.input} value={produitEdit.prixVente} onChange={e => setProduitEdit({ ...produitEdit, prixVente: e.target.value })} required />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Seuil alerte</label>
              <input type="number" style={styles.input} value={produitEdit.seuilAlerte || 5} onChange={e => setProduitEdit({ ...produitEdit, seuilAlerte: e.target.value })} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Fournisseur</label>
              <select style={styles.input} value={produitEdit.fournisseur?.id || ''} onChange={e => setProduitEdit({ ...produitEdit, fournisseur: e.target.value ? { id: parseInt(e.target.value) } : null })}>
                <option value="">-- Aucun --</option>
                {fournisseurs.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
              </select>
            </div>
            <div style={styles.gap2}>
              <button type="submit" style={styles.btnPrimary}>✅ Enregistrer</button>
              <button type="button" onClick={() => { setShowEditModal(false); setProduitEdit(null); }} style={{ ...styles.btnPrimary, background: '#94a3b8' }}>Annuler</button>
            </div>
          </form>
        </div>
      </div>
    )}

    <ConfirmationModal 
      isOpen={showDeleteConfirm} 
      onClose={() => setShowDeleteConfirm(false)} 
      onConfirm={deleteProduct} 
      title="Confirmation" 
      message="Supprimer ce produit ?" 
    />
  </div>
)}

        {activeSection === 'historique' && (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

    {/* ===== STATS DE LA PÉRIODE FILTRÉE ===== */}
    {(() => {
      const caFiltre = groupedVentes.reduce((s, g) => s + g.total, 0);
      const panierMoyen = groupedVentes.length ? Math.round(caFiltre / groupedVentes.length) : 0;
      const parVendeur = new Map();
      groupedVentes.forEach(g => parVendeur.set(g.vendeur, (parVendeur.get(g.vendeur) || 0) + g.total));
      const topVendeur = [...parVendeur.entries()].sort((a, b) => b[1] - a[1])[0];
      return (
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <HistStatCard icon="🧾" label="Transactions" value={groupedVentes.length} color="#3b82f6" />
          <HistStatCard icon="💰" label="Chiffre d'affaires" value={`${caFiltre.toLocaleString('fr-FR')} FCFA`} color="#10b981" />
          <HistStatCard icon="🎯" label="Panier moyen" value={`${panierMoyen.toLocaleString('fr-FR')} FCFA`} color="#6366f1" />
          <HistStatCard icon="🏆" label="Top vendeur" value={topVendeur ? topVendeur[0] : '—'} color="#f59e0b" />
        </div>
      );
    })()}

    {/* ===== FILTRES ===== */}
    <div style={styles.card}>
      <div style={styles.cardTitle}>📜 Historique des ventes</div>

      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginTop: 16, marginBottom: 4, alignItems: 'flex-end' }}>
        <div style={{ minWidth: '160px' }}>
          <label style={styles.label}>Date début</label>
          <input type="date" value={filtreDateDebut} onChange={e => setFiltreDateDebut(e.target.value)} style={{ ...styles.input, borderRadius: 12 }} />
        </div>
        <div style={{ minWidth: '160px' }}>
          <label style={styles.label}>Date fin</label>
          <input type="date" value={filtreDateFin} onChange={e => setFiltreDateFin(e.target.value)} style={{ ...styles.input, borderRadius: 12 }} />
        </div>
        <div style={{ minWidth: '170px' }}>
          <label style={styles.label}>Vendeur</label>
          <select value={filtreVendeur} onChange={e => setFiltreVendeur(e.target.value)} style={{ ...styles.input, borderRadius: 12 }}>
            <option value="">Tous</option>
            {[...new Set(ventes.map(v => v.vendeur))].map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div style={{ minWidth: '170px' }}>
          <label style={styles.label}>Produit</label>
          <select value={filtreProduit} onChange={e => setFiltreProduit(e.target.value)} style={{ ...styles.input, borderRadius: 12 }}>
            <option value="">Tous</option>
            {[...new Set(ventes.map(v => v.produit?.nom).filter(Boolean))].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <button
          onClick={() => { setFiltreDateDebut(''); setFiltreDateFin(''); setFiltreVendeur(''); setFiltreProduit(''); }}
          style={{ ...styles.btnSecondary, height: '42px', padding: '0 18px', borderRadius: 30 }}
        >✖ Réinitialiser</button>
        <button onClick={exportPDF} style={{ ...styles.btnPrimary, height: '42px', background: '#dc2626', marginLeft: 'auto' }}>📄 Export PDF</button>
      </div>
    </div>

    {/* ===== TIMELINE DES TRANSACTIONS ===== */}
    {ventes.length === 0 ? (
      <div style={{ ...styles.card, textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>🧾</div>
        Aucune vente enregistrée pour le moment
      </div>
    ) : groupedVentes.length === 0 ? (
      <div style={{ ...styles.card, textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>🔍</div>
        Aucune vente ne correspond à ces filtres
      </div>
    ) : (
      <div style={{ position: 'relative', paddingLeft: 8 }}>
        {groupedVentes.map((group, idx) => {
          const vendeurColor = colorForVendeur(group.vendeur || '');
          const isLast = idx === groupedVentes.length - 1;
          return (
            <div key={idx} style={{ position: 'relative', display: 'flex', gap: 18 }}>
              {/* Timeline rail */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 14 }}>
                <div style={{
                  width: 12, height: 12, borderRadius: '50%', background: vendeurColor,
                  border: '3px solid var(--bg-primary)', boxShadow: `0 0 0 2px ${vendeurColor}55`,
                  marginTop: 22, flexShrink: 0,
                }} />
                {!isLast && <div style={{ flex: 1, width: 2, background: 'var(--border-color)', marginTop: 4 }} />}
              </div>

              {/* Carte transaction */}
              <div style={{
                ...styles.card, flex: 1, marginBottom: '20px', padding: 0, overflow: 'hidden',
              }}>
                <div style={{
                  padding: '16px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  flexWrap: 'wrap', gap: 12, borderBottom: '1px solid var(--border-color)',
                  background: 'var(--bg-table-row-hover)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <VendeurAvatar nom={group.vendeur} />
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14 }}>
                        {group.factureId ? `Facture #${group.factureId}` : 'Transaction'}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {group.vendeur} · {new Date(group.date).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 18, color: 'var(--text-primary)' }}>
                      {group.total.toLocaleString('fr-FR')} <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>FCFA</span>
                    </div>
                    <button
                      onClick={() => imprimerTicketGroupe(group.ventes, group.total, group.vendeur)}
                      style={{ ...styles.btnPrimary, padding: '7px 16px', fontSize: 12, height: 'auto' }}
                    >🖨️ Imprimer</button>
                  </div>
                </div>

                <div style={{ padding: '4px 22px 12px 22px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        {['Produit', 'Qté', 'Prix unitaire', 'Total'].map((h, i) => (
                          <th key={h} style={{
                            fontSize: 11, textTransform: 'uppercase', letterSpacing: '.4px', fontWeight: 700,
                            color: 'var(--text-muted)', textAlign: i > 0 ? 'right' : 'left', padding: '10px 6px',
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {group.ventes.map(v => (
                        <tr key={v.id}>
                          <td style={{ padding: '8px 6px', fontSize: 13, color: 'var(--text-primary)', borderTop: '1px dashed var(--border-color)' }}>{v.produit?.nom}</td>
                          <td style={{ padding: '8px 6px', fontSize: 13, textAlign: 'right', color: 'var(--text-secondary)', borderTop: '1px dashed var(--border-color)' }}>{v.quantite}</td>
                          <td style={{ padding: '8px 6px', fontSize: 13, textAlign: 'right', color: 'var(--text-secondary)', fontFamily: 'monospace', borderTop: '1px dashed var(--border-color)' }}>{v.prixUnitaire?.toLocaleString('fr-FR')}</td>
                          <td style={{ padding: '8px 6px', fontSize: 13, textAlign: 'right', color: 'var(--text-primary)', fontWeight: 700, fontFamily: 'monospace', borderTop: '1px dashed var(--border-color)' }}>{(v.prixUnitaire * v.quantite).toLocaleString('fr-FR')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
)}

        {activeSection === 'panier'       && <CartComponent produits={produits} user={user} onSaleComplete={() => setRefresh(prev => prev + 1)} />}
        {activeSection === 'cloture'      && <CashClosureComponent onCloture={() => setRefresh(prev => prev + 1)} />}
        {activeSection === 'utilisateurs' && <UserManagementComponent />}
        {activeSection === 'fournisseurs' && <FournisseurManagement />}
        {activeSection === 'commandes'    && <CommandeFournisseur />}
      </div>
    </div>
  );
}

// ==================== APP ROOT ====================
function AppContent() {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Chargement...</div>;
  if (!user) return <Login />;
  return <StockManagement />;
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
  <Route path="/commande/confirmer/:token"             element={<CommandeConfirmation />} />
  <Route path="/commande/accepter-modification/:token" element={<AccepterModification />} />
  <Route path="/commande/modifier/:token"              element={<CommandeModification />} />
  <Route path="/confirmation-modification"             element={<ConfirmationModification />} />
  <Route path="/commande/devis/:token"                 element={<CommandeDevis />} />
  <Route path="/commande/rejeter-demande/:token"        element={<CommandeRejeterDemande />} />
  <Route path="/commande/confirmer-date/:token"         element={<ConfirmerDateExpedition />} />
  <Route path="/*" element={<AuthProvider><AppContent /></AuthProvider>} />
</Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
