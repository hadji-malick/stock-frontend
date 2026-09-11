import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import { Toaster, toast } from 'react-hot-toast';
import { notifyError, getErrorMessage } from './utils/notify';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';
import ConfirmationModal from './components/ui/ConfirmationModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import logo from './assets/logo.png';
import FournisseurManagement from './components/FournisseurManagement';
import CommandeFournisseur from './components/CommandeFournisseur';
import { QRCodeSVG } from 'qrcode.react';
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
import { validate, required, emailRequired, minLength, positiveNumber, positiveInteger } from './utils/validators';
import factureHeader from './assets/facture-header.png';
import factureFooter from './assets/facture-footer.png';
import PaymentModal from './components/PaymentModal';
import ZoneLivraisonManagement from './components/ZoneLivraisonManagement';
import { addToQueue, getQueue, removeFromQueue, queueLength } from './utils/offlineQueue';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { printReceiptThermal, listPrinters } from './utils/qzPrint';


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
    fontFamily: "'Inter', system-ui, sans-serif",
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
    boxShadow: '4px 0 20px rgba(247, 242, 242, 0.08)'
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
    { title: 'Produits en stock',  value: stats?.totalProduits ?? 0,             icon: '📦', accentColor: `linear-gradient(90deg,${T.acc},${T.ind})`,  subText: '↑ + ce mois' },
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
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const MODE_LABELS = {
    ESPECES: 'Espèces', WAVE: 'Wave', ORANGE_MONEY: 'Orange Money', CARTE: 'Carte bancaire'
  };

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

  const validerVente = async (paiements) => {
    if (!panier.length) { toast.error('Panier vide'); return; }
    setLoading(true);
    const items = panier.map(i => ({ produitId: i.id, quantite: i.quantite }));
    const payload = { items, vendeur: user?.nom || 'Vendeur', commentaire: '', paiements };

    if (!navigator.onLine) {
      addToQueue({ type: 'vente-directe', payload });
      toast.success('📥 Vente enregistrée hors-ligne — sera synchronisée au retour du réseau');
      setPanier([]);
      setShowPaymentModal(false);
      setLoading(false);
      if (onSaleComplete) onSaleComplete();
      return;
    }

    try {
      const res = await axios.post('http://localhost:8080/api/produits/vente-multi', payload);
      toast.success(`✅ Vente validée ! Facture: ${res.data.numeroFacture}`, { duration: 5000, icon: '🧾' });
      setPanier([]);
      setShowPaymentModal(false);
      if (onSaleComplete) onSaleComplete();
      imprimerTicketSilencieux(res.data, paiements);
    } catch (err) {
      if (!err.response) {
        // réseau → mettre en file
        addToQueue({ type: 'vente-directe', payload });
        toast.success('📥 Réseau indisponible — vente mise en attente de synchronisation');
        setPanier([]);
        setShowPaymentModal(false);
      } else {
        notifyError(err);
      }
    } finally { setLoading(false); }
  };

  const imprimerTicketSilencieux = (data, paiements) => {
    const paiementsHtml = (paiements || []).map(p => `
      <div class="row">
        <span>${MODE_LABELS[p.mode] || p.mode}</span>
        <span>${p.montant.toLocaleString('fr-FR')} FCFA</span>
      </div>
    `).join('');

    const ticketHtml = `<!DOCTYPE html><html><head><title>Ticket Powertech</title><style>
      body{font-family:'Courier New',monospace;padding:0;margin:0;background:#f1f5f9}
      .ticket{max-width:340px;margin:20px auto;background:white;border-radius:14px;padding:26px 20px 24px 20px;box-shadow:0 4px 20px rgba(0,0,0,0.1)}
      .header{display:flex;justify-content:center;align-items:center;margin-bottom:18px}
      .header img{width:170px;height:auto;display:block}
      .divider{border-top:1px dashed #cbd5e1;margin:14px 0}
      .meta{font-size:11px;color:#475569;text-align:center;line-height:1.8}
      .meta strong{color:#1e1b4b}
      .row{display:flex;justify-content:space-between;font-size:13px;margin:6px 0;color:#334155;padding:3px 0}
      .row .qty{color:#94a3b8;font-size:11px}
      .row .amount{font-weight:600;color:#1e1b4b}
      .section-title{font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;margin:14px 0 8px 0}
      .total-row{display:flex;justify-content:space-between;font-weight:bold;font-size:18px;padding-top:12px;color:#1e1b4b;border-top:2px solid #1e1b4b;margin-top:4px}
      .footer{text-align:center;font-size:10px;color:#94a3b8;margin-top:18px;line-height:1.8;border-top:1px dashed #e2e8f0;padding-top:14px}
      .footer .thanks{font-size:11px;color:#1e1b4b;font-weight:600}
      @media print{
        body{background:white}
        .ticket{box-shadow:none;margin:0;border-radius:0;padding:16px}
      }
    </style></head><body>
    <div class="ticket">
      <div class="header">
        <img src="${logo}" alt="Powertech"/>
      </div>

      <div class="meta">
        <strong>Facture</strong> ${data.numeroFacture}<br/>
        ${new Date().toLocaleString('fr-FR', {
          day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
        })}<br/>
        <strong>Vendeur</strong> : ${user?.nom || 'N/A'}
      </div>

      <div class="divider"></div>

      ${data.details.map(d => `
        <div class="row">
          <span>${d.produit} <span class="qty">×${d.quantite}</span></span>
          <span class="amount">${d.sousTotal.toLocaleString('fr-FR')} FCFA</span>
        </div>
      `).join('')}

      <div class="divider"></div>

      <div style="display:flex;justify-content:space-between;font-size:11px;color:#64748b;margin:3px 0;"><span>Sous-total HT</span><span>${(data.totalHT || 0).toLocaleString('fr-FR')} FCFA</span></div>
      <div style="display:flex;justify-content:space-between;font-size:11px;color:#64748b;margin:3px 0;"><span>TVA (18%)</span><span>${(data.tva || 0).toLocaleString('fr-FR')} FCFA</span></div>
      <div class="total-row">
        <span>TOTAL TTC</span>
        <span>${data.total.toLocaleString('fr-FR')} FCFA</span>
      </div>

      ${paiementsHtml ? `
        <div class="section-title">Paiement</div>
        ${paiementsHtml}
      ` : ''}

      <div class="footer">
        <div class="thanks">🙏 Merci de votre visite !</div>
        Dakar, Sénégal<br/>
        📞 (+221) 766432045
      </div>
    </div>
    <script>window.onload=function(){window.print();setTimeout(()=>window.close(),1000)}</script>
    </body></html>`;

    const win = window.open('', '_blank', 'width=400,height=650,toolbar=no,menubar=no,scrollbars=yes,resizable=yes');
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
            style={{ ...styles.btnPrimary, width: '100%', background: posColors.green, justifyContent: 'center', fontSize: 15, padding: '14px', opacity: !panier.length ? 0.6 : 1, cursor: !panier.length ? 'not-allowed' : 'pointer' }}
            onClick={() => setShowPaymentModal(true)}
            disabled={!panier.length}
          >
            ✅ Passer au paiement
          </button>
        </div>
      </div>

      {showPaymentModal && (
        <PaymentModal
          total={total}
          loading={loading}
          onConfirm={validerVente}
          onCancel={() => setShowPaymentModal(false)}
        />
      )}
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
      const errorText = getErrorMessage(err);
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
  }, [historiqueClotures.length, currentPage, totalPages]);

  const cash = { blue: '#3b82f6', ind: '#6366f1', green: '#10b981', amber: '#f59e0b', red: '#ef4444', gray: '#94a3b8' };

  const getEcartMeta = (type) => {
    if (type === 'MANQUANT') return { label: 'Manquant', icon: '⚠️', color: cash.red };
    if (type === 'EXCEDENT') return { label: 'Excédent', icon: '📈', color: cash.amber };
    return { label: 'Équilibré', icon: '✅', color: cash.green };
  };

  // ===== Vue historique (ADMIN / STOCK_MANAGER) =====
  if (!isVendeur && canSeeHistorique) {
    return (
      <div style={styles.card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: cash.ind + '1c', color: cash.ind, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19 }}>📊</div>
          <div>
            <div style={{ ...styles.cardTitle, marginBottom: 0 }}>Historique des clôtures de caisse</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{historiqueClotures.length} clôture{historiqueClotures.length > 1 ? 's' : ''} enregistrée{historiqueClotures.length > 1 ? 's' : ''}</div>
          </div>
        </div>

        {historiqueClotures.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
            Aucune clôture enregistrée
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto', borderRadius: 16, border: '1px solid var(--border-color)' }}>
              <table style={styles.table}>
                <thead><tr><th style={styles.th}>Date</th><th style={styles.th}>Théorique</th><th style={styles.th}>Réel</th><th style={styles.th}>Écart</th><th style={styles.th}>Type</th><th style={styles.th}>Caissier</th><th style={styles.th}>Commentaire</th></tr></thead>
                <tbody>
                  {currentClotures.map(c => {
                    const meta = getEcartMeta(c.typeEcart);
                    return (
                      <tr key={c.id}>
                        <td style={styles.td}>{new Date(c.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                        <td style={styles.td}><strong>{c.montantTheorique?.toLocaleString('fr-FR')} FCFA</strong></td>
                        <td style={styles.td}><strong>{c.montantReel?.toLocaleString('fr-FR')} FCFA</strong></td>
                        <td style={{ ...styles.td, fontFamily: 'monospace', color: meta.color, fontWeight: 700 }}>
                          {c.ecart > 0 ? '+' : ''}{c.ecart?.toLocaleString('fr-FR')} FCFA
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: cash.green + '1c', color: cash.green, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19 }}>🔒</div>
          <div style={styles.cardTitle}>Clôture de caisse</div>
        </div>

        <div style={{
          textAlign: 'center', padding: '44px 24px', borderRadius: 20,
          background: `linear-gradient(160deg, ${cash.green}12, ${cash.green}04)`,
          border: `1px solid ${cash.green}2e`,
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', background: cash.green + '1c', color: cash.green,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 16px',
            boxShadow: `0 8px 24px ${cash.green}33`,
          }}>🔒</div>
          <p style={{ fontWeight: 800, color: cash.green, fontSize: 17, margin: 0 }}>Caisse déjà clôturée aujourd'hui</p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>Reviens demain pour la prochaine clôture</p>

          {statut.cloture && (
            <div style={{ background: 'var(--bg-card)', padding: '20px 26px', borderRadius: '18px', marginTop: '22px', border: '1px solid var(--border-color)', display: 'inline-block', textAlign: 'left', minWidth: 280, boxShadow: 'var(--shadow)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', color: 'var(--text-primary)', fontSize: 14 }}><span>Montant théorique</span><strong>{statut.cloture.montantTheorique?.toLocaleString('fr-FR')} FCFA</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', color: 'var(--text-primary)', fontSize: 14 }}><span>Montant réel</span><strong>{statut.cloture.montantReel?.toLocaleString('fr-FR')} FCFA</strong></div>
              <div style={{ height: 1, background: 'var(--border-color)', margin: '6px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0' }}>
                <span style={{ color: 'var(--text-primary)', fontSize: 14 }}>Écart</span>
                <strong style={{ color: statut.cloture.typeEcart === 'MANQUANT' ? cash.red : statut.cloture.typeEcart === 'EXCEDENT' ? cash.amber : cash.green }}>
                  {statut.cloture.ecart > 0 ? '+' : ''}{statut.cloture.ecart?.toLocaleString('fr-FR')} FCFA
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
  const ecartColor = ecartLive === null ? cash.gray : ecartAbs < 1 ? cash.green : ecartLive > 0 ? cash.amber : cash.red;
  const ecartLabel = ecartLive === null ? '' : ecartAbs < 1 ? '✅ Caisse équilibrée' : ecartLive > 0 ? `📈 Excédent de ${ecartAbs.toLocaleString('fr-FR')} FCFA` : `⚠️ Manquant de ${ecartAbs.toLocaleString('fr-FR')} FCFA`;

  return (
    <div style={styles.card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: cash.blue + '1c', color: cash.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19 }}>🔒</div>
        <div>
          <div style={{ ...styles.cardTitle, marginBottom: 0 }}>Clôture de caisse</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
        </div>
      </div>

      {message && (
        <div style={{ padding: '13px 18px', borderRadius: '16px', marginBottom: '18px', background: message.type === 'success' ? cash.green + '15' : cash.red + '15', color: message.type === 'success' ? cash.green : cash.red, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>{message.type === 'success' ? '✅' : '⚠️'}</span>{message.text}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
        <div style={{
          background: `linear-gradient(160deg, ${cash.blue}14, ${cash.blue}04)`, border: `1px solid ${cash.blue}2a`, borderRadius: 18, padding: 18,
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -20, right: -20, width: 70, height: 70, borderRadius: '50%', background: cash.blue + '14' }} />
          <div style={{ fontSize: 11, fontWeight: 700, color: cash.blue, textTransform: 'uppercase', letterSpacing: '.5px' }}>💰 Montant théorique</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', marginTop: 6, fontFamily: 'monospace' }}>{montantTheorique.toLocaleString('fr-FR')} <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>FCFA</span></div>
        </div>
        <div style={{
          background: 'var(--bg-table-row-hover)', border: '1px solid var(--border-color)', borderRadius: 18, padding: 18,
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: -20, right: -20, width: 70, height: 70, borderRadius: '50%', background: cash.ind + '10' }} />
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.5px' }}>🧾 Ventes du jour</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', marginTop: 6 }}>{statut?.nombreVentes || 0}</div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Montant réel en caisse (FCFA)</label>
          <input
            type="number"
            style={{ ...styles.input, fontSize: 20, fontWeight: 700, padding: '16px 18px', borderRadius: 16, border: `1.5px solid ${ecartLive !== null ? ecartColor + '55' : 'var(--input-border)'}` }}
            value={montantReel}
            onChange={e => setMontantReel(e.target.value)}
            placeholder="0"
            required
          />
        </div>

        {ecartLive !== null && (
          <div style={{ marginBottom: 22, background: 'var(--bg-table-row-hover)', borderRadius: 16, padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: ecartColor }}>{ecartLabel}</span>
            </div>
            <div style={{ position: 'relative', height: 10, background: 'var(--bg-table-header)', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 2, background: 'var(--border-color)', zIndex: 2 }} />
              <div style={{
                position: 'absolute', top: 0, bottom: 0,
                left: ecartLive < 0 ? `${50 - gaugePct}%` : '50%',
                width: `${gaugePct}%`,
                background: `linear-gradient(90deg, ${ecartColor}aa, ${ecartColor})`,
                borderRadius: 6, transition: 'all .3s ease',
              }} />
            </div>
          </div>
        )}

        <div style={styles.formGroup}>
          <label style={styles.label}>Commentaire (optionnel)</label>
          <input type="text" style={{ ...styles.input, borderRadius: 16 }} value={commentaire} onChange={e => setCommentaire(e.target.value)} placeholder="Ex: Manque de monnaie" />
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
  <button
    type="submit"
    style={{
      padding: '12px 32px', fontSize: 14, fontWeight: 700, borderRadius: 14,
      border: 'none', color: 'white', cursor: loading ? 'not-allowed' : 'pointer',
      background: `linear-gradient(135deg, ${cash.blue}, ${cash.ind})`,
      boxShadow: `0 8px 20px ${cash.blue}40`,
      display: 'flex', alignItems: 'center', gap: 8, opacity: loading ? 0.7 : 1,
    }}
    disabled={loading}
  >
    {loading ? '⏳ Clôture en cours...' : '🔒 Valider la clôture'}
  </button>
</div>
      </form>
    </div>
  );
}
// ==================== COMPOSANT FORMULAIRE SEPARÉ ====================
// ==================== GESTION UTILISATEURS ====================

// ==================== GESTION UTILISATEURS ====================
function UserManagementComponent() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ nom: '', email: '', motDePasse: '', role: 'VENDEUR' });
  const [errors, setErrors] = useState({});

  const isDirecteur = currentUser?.role === 'DIRECTEUR';

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:8080/api/auth/utilisateurs', { headers: { Authorization: `Bearer ${token}` } });
      setUsers(res.data);
    } catch (err) { console.error(err); }
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const getRules = (isEdit) => ({
    nom: [required('Le nom')],
    email: [emailRequired("L'email")],
    motDePasse: isEdit ? [] : [required('Le mot de passe'), minLength(6, 'Le mot de passe')],
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    if (formData.role === 'DIRECTEUR' && !isDirecteur) {
      toast.error('Seul un Directeur peut créer un autre compte Directeur');
      return;
    }
    const fieldErrors = validate(formData, getRules(false));
    if (Object.keys(fieldErrors).length > 0) { setErrors(fieldErrors); toast.error('Veuillez corriger les champs en erreur'); return; }
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:8080/api/auth/register', formData, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Utilisateur créé'); fetchUsers(); setShowModal(false);
      setFormData({ nom: '', email: '', motDePasse: '', role: 'VENDEUR' }); setErrors({});
    } catch (err) { notifyError(err); }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (editingUser?.role === 'DIRECTEUR' && !isDirecteur) {
      toast.error('Seul un Directeur peut modifier un compte Directeur');
      return;
    }
    if (formData.role === 'DIRECTEUR' && !isDirecteur) {
      toast.error('Seul un Directeur peut attribuer le rôle Directeur');
      return;
    }
    const rules = getRules(true);
    if (formData.motDePasse.trim()) rules.motDePasse = [minLength(6, 'Le mot de passe')];
    const fieldErrors = validate(formData, rules);
    if (Object.keys(fieldErrors).length > 0) { setErrors(fieldErrors); toast.error('Veuillez corriger les champs en erreur'); return; }
    try {
      const token = localStorage.getItem('token');
      const updateData = { nom: formData.nom, email: formData.email, role: formData.role };
      if (formData.motDePasse.trim()) updateData.motDePasse = formData.motDePasse;
      await axios.put(`http://localhost:8080/api/auth/utilisateurs/${editingUser.id}`, updateData, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Utilisateur modifié'); fetchUsers(); setShowEditModal(false);
      setFormData({ nom: '', email: '', motDePasse: '', role: 'VENDEUR' }); setErrors({});
    } catch (err) { notifyError(err); }
  };

  const deleteUser = async (targetUser) => {
    if (targetUser.role === 'DIRECTEUR' && !isDirecteur) {
      toast.error('Seul un Directeur peut supprimer un compte Directeur');
      return;
    }
    if (targetUser.role === 'DIRECTEUR') {
      const nbDirecteurs = users.filter(u => u.role === 'DIRECTEUR').length;
      if (nbDirecteurs <= 1) {
        toast.error('Impossible de supprimer le dernier compte Directeur');
        return;
      }
    }
    if (window.confirm('Supprimer cet utilisateur ?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:8080/api/auth/utilisateurs/${targetUser.id}`, { headers: { Authorization: `Bearer ${token}` } });
        toast.success('Utilisateur supprimé'); fetchUsers();
      } catch (err) { notifyError(err); }
    }
  };

  const openEdit = (user) => { setEditingUser(user); setFormData({ nom: user.nom, email: user.email, motDePasse: '', role: user.role }); setErrors({}); setShowEditModal(true); };

  const getRoleBadge = (role) => {
    if (role === 'ADMIN') return { label: 'Chef de showroom', color: '#8b5cf6', bg: '#f3e8ff' };
    if (role === 'DIRECTEUR') return { label: '👑 Directeur', color: '#ef4444', bg: '#fee2e2' };
    if (role === 'STOCK_MANAGER') return { label: 'Stockeur', color: '#f59e0b', bg: '#fef3c7' };
    if (role === 'TECHNICO_COMMERCIAL') return { label: 'Technico-commercial', color: '#14b8a6', bg: '#ccfbf1' };
    return { label: 'Caissier', color: '#10b981', bg: '#ecfdf5' }; // VENDEUR
  };

  const errInput = (field) => ({
    ...styles.input,
    border: errors[field] ? '1.5px solid #ef4444' : styles.input.border,
    background: errors[field] ? '#ef44440a' : styles.input.background,
  });

  const UserForm = ({ onSubmit, submitLabel, isEditingDirecteur }) => (
    <form onSubmit={onSubmit}>
      <div style={styles.formGroup}>
        <label style={styles.label}>Nom</label>
        <input style={errInput('nom')} value={formData.nom} onChange={e => updateField('nom', e.target.value)} />
        <FieldError message={errors.nom} />
      </div>
      <div style={styles.formGroup}>
        <label style={styles.label}>Email</label>
        <input type="text" style={errInput('email')} value={formData.email} onChange={e => updateField('email', e.target.value)} placeholder="nom@gmail.com" />
        <FieldError message={errors.email} />
      </div>
      <div style={styles.formGroup}>
        <label style={styles.label}>Mot de passe{submitLabel === 'Enregistrer' ? ' (laisser vide pour ne pas changer)' : ''}</label>
        <input type="password" style={errInput('motDePasse')} value={formData.motDePasse} onChange={e => updateField('motDePasse', e.target.value)} />
        <FieldError message={errors.motDePasse} />
      </div>
      <div style={styles.formGroup}>
        <label style={styles.label}>Rôle</label>
        <select style={styles.input} value={formData.role} onChange={e => updateField('role', e.target.value)} disabled={isEditingDirecteur && !isDirecteur}>
          <option value="VENDEUR">Caissier</option>
          <option value="STOCK_MANAGER">Stockeur</option>
          <option value="TECHNICO_COMMERCIAL">Technico-commercial</option>
          <option value="ADMIN">Chef de showroom</option>
          {isDirecteur && <option value="DIRECTEUR">Directeur Powertech</option>}
        </select>
        {!isDirecteur && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 5 }}>
            🔒 Seul un Directeur peut attribuer ou modifier le rôle Directeur
          </div>
        )}
      </div>
      <div style={styles.gap2}>
        <button type="submit" style={styles.btnPrimary}>{submitLabel}</button>
        <button type="button" onClick={() => { setShowModal(false); setShowEditModal(false); }} style={{ ...styles.btnPrimary, background: '#94a3b8' }}>Annuler</button>
      </div>
    </form>
  );

  return (
    <div style={styles.card}>
      <div style={styles.flexBetween}>
        <div style={styles.cardTitle}>👥 Utilisateurs</div>
        <button style={styles.btnPrimary} onClick={() => { setFormData({ nom: '', email: '', motDePasse: '', role: 'VENDEUR' }); setErrors({}); setShowModal(true); }}>➕ Nouveau</button>
      </div>
      <table style={styles.table}>
        <thead><tr><th style={styles.th}>Nom</th><th style={styles.th}>Email</th><th style={styles.th}>Rôle</th><th style={styles.th}>Actions</th></tr></thead>
        <tbody>
          {users.map(u => {
            const badge = getRoleBadge(u.role);
            const protege = u.role === 'DIRECTEUR' && !isDirecteur;
            return (
              <tr key={u.id}>
                <td style={styles.td}>{u.nom}</td><td style={styles.td}>{u.email}</td>
                <td style={styles.td}><span style={{ background: badge.bg, color: badge.color, padding: '4px 14px', borderRadius: '40px', fontSize: '12px', fontWeight: '600' }}>{badge.label}</span></td>
                <td style={styles.td}>
                  {protege ? (
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>🔒 Compte protégé</span>
                  ) : (
                    <>
                      <button style={{ ...styles.btnPrimary, padding: '6px 12px', marginRight: '8px', fontSize: '12px' }} onClick={() => openEdit(u)}>✏️ Modifier</button>
                      <button style={styles.btnDanger} onClick={() => deleteUser(u)}>🗑️ Supprimer</button>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {showModal && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.flexBetween}><h3 style={{ color: 'var(--text-primary)' }}>Nouvel utilisateur</h3><button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '22px' }}>✖️</button></div>
            <UserForm onSubmit={handleCreate} submitLabel="Créer" isEditingDirecteur={false} />
          </div>
        </div>
      )}
      {showEditModal && editingUser && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.flexBetween}><h3 style={{ color: 'var(--text-primary)' }}>Modifier l'utilisateur</h3><button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', fontSize: '22px' }}>✖️</button></div>
            <UserForm onSubmit={handleUpdate} submitLabel="Enregistrer" isEditingDirecteur={editingUser.role === 'DIRECTEUR'} />
          </div>
        </div>
      )}
    </div>
  );
}
// ==================== HELPERS HISTORIQUE (avatar vendeur, stats) ====================
const HIST_COLORS = ['#3b82f6', '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#f97316'];
const TAUX_TVA = 0.18;
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
const FieldError = ({ message }) =>
  message ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5, fontSize: 12, color: '#ef4444', fontWeight: 600 }}>
      <span>⚠️</span>{message}
    </div>
  ) : null;
  // Helper à ajouter une fois, avant StockManagement
const imageToDataUrl = (src) => new Promise((resolve, reject) => {
  const img = new Image();
  img.crossOrigin = 'Anonymous';
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    canvas.getContext('2d').drawImage(img, 0, 0);
    resolve({ dataUrl: canvas.toDataURL('image/png'), width: img.width, height: img.height });
  };
  img.onerror = reject;
  img.src = src;
});

// Formate un nombre en FCFA avec une vraie espace ASCII (évite le bug d'espace insécable de jsPDF)
const formatFCFA = (n) => {
  const num = Math.round(n || 0);
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

function OfflineSyncManager() {
  const online = useOnlineStatus();
  const [pending, setPending] = useState(getQueue().length);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const update = () => setPending(getQueue().length);
    window.addEventListener('pt-offline-queue-changed', update);
    return () => window.removeEventListener('pt-offline-queue-changed', update);
  }, []);

  useEffect(() => {
    if (online && pending > 0) {
      // perform sync
      (async () => {
        setSyncing(true);
        const token = localStorage.getItem('token');
        const queue = getQueue();
        for (const item of queue) {
          try {
            if (item.type === 'vente-directe') {
              await axios.post('http://localhost:8080/api/produits/vente-multi', item.payload, { headers: { Authorization: `Bearer ${token}` } });
            } else if (item.type === 'encaissement') {
              await axios.post(`http://localhost:8080/api/commandes-client/code/${item.code}/encaisser`, item.payload, { headers: { Authorization: `Bearer ${token}` } });
            }
            removeFromQueue(item.localId);
          } catch (err) {
            console.error('Échec sync', item.localId, err);
            break;
          }
        }
        setSyncing(false);
        toast.success('Ventes hors-ligne synchronisées');
      })();
    }
  }, [online, pending]);

  if (online && pending === 0) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20, zIndex: 2000,
      background: online ? '#f59e0b' : '#ef4444', color: 'white', padding: '10px 18px', borderRadius: 30,
      fontSize: 13, fontWeight: 700, boxShadow: '0 8px 24px rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', gap: 8,
    }}>
      {online ? (syncing ? '⏳ Synchronisation...' : `🟡 ${pending} vente(s) en attente`) : '🔴 Mode hors-ligne'}
    </div>
  );
}
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
  const [newProduct, setNewProduct] = useState({ reference: '', nom: '', marque: '', prixVente: '', quantiteStock: '', fournisseurNom: '' });
  const [productErrors, setProductErrors] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const productRules = {
  reference: [required('La référence')],
  nom: [required('Le nom')],
  prixVente: [positiveNumber('Le prix')],
  quantiteStock: [positiveInteger('La quantité initiale')],
  };
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const getFournisseurIdByName = (nom) => {
    const fournisseur = fournisseurs.find(f => f.nom === nom);
    return fournisseur ? fournisseur.id : null;
  };

   const addProduct = async (e) => {
  e.preventDefault();
  const fieldErrors = validate(newProduct, productRules);
  if (Object.keys(fieldErrors).length > 0) {
    setProductErrors(fieldErrors);
    toast.error('Veuillez corriger les champs en erreur');
    return;
  }
  try {
      const fournisseurId = getFournisseurIdByName(newProduct.fournisseurNom);
      await axios.post('http://localhost:8080/api/produits', { reference: newProduct.reference, nom: newProduct.nom, marque: newProduct.marque || '', prixVente: parseFloat(newProduct.prixVente), quantiteStock: parseInt(newProduct.quantiteStock), fournisseurId: fournisseurId || null });
      setRefresh(prev => prev + 1);
      setNewProduct({ reference: '', nom: '', marque: '', prixVente: '', quantiteStock: '', fournisseurNom: '' });
    setShowStockModal(false); setActiveSection('stocks');
    toast.success('Produit ajouté avec succès');
  } catch (err) { notifyError(err); }
};

  const deleteProduct = async () => {
    if (!productToDelete) return;
    try {
      await axios.delete(`http://localhost:8080/api/produits/${productToDelete}`);
      setRefresh(prev => prev + 1); toast.success('Produit supprimé');
    } catch (err) { notifyError(err); }
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
    } catch (err) { notifyError(err); }
    finally { setRestockLoading(false); }
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    if (!produitEdit) return;
    try {
      await axios.put(`http://localhost:8080/api/produits/${produitEdit.id}`, { reference: produitEdit.reference, nom: produitEdit.nom, marque: produitEdit.marque || '', prixVente: produitEdit.prixVente, seuilAlerte: produitEdit.seuilAlerte || 5, fournisseurId: produitEdit.fournisseur?.id || null });
      setRefresh(prev => prev + 1); setShowEditModal(false); setProduitEdit(null); setActiveSection('stocks');
      toast.success('Produit modifié avec succès');
    } catch (err) { notifyError(err, 'Erreur lors de la modification'); }
  };

// ===== IMPRIMER TICKET GROUPE =====
const imprimerTicketGroupe = async (ventesGroupe, total, vendeur) => {
  const [header, footer] = await Promise.all([
    imageToDataUrl(factureHeader),
    imageToDataUrl(factureFooter),
  ]);

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const headerH = (header.height / header.width) * pageWidth;
  const footerH = (footer.height / footer.width) * pageWidth;

  doc.addImage(header.dataUrl, 'PNG', 0, 0, pageWidth, headerH);

  doc.setFontSize(10);
  doc.setTextColor(30, 27, 75);
  doc.text(`Date: ${new Date().toLocaleDateString('fr-FR')} ${new Date().toLocaleTimeString('fr-FR')}`, 105, headerH + 12, { align: 'center' });
  doc.text(`Vendeur: ${vendeur}`, 105, headerH + 18, { align: 'center' });

  autoTable(doc, {
    head: [['Produit', 'Quantité', 'Prix unit.', 'Total']],
    body: ventesGroupe.map(v => [
      v.produit?.nom || 'N/A',
      v.quantite.toString(),
      `${formatFCFA(v.prixUnitaire)} FCFA`,
      `${formatFCFA((v.prixUnitaire || 0) * (v.quantite || 0))} FCFA`
    ]),
    startY: headerH + 26,
    margin: { left: 14, right: 14 },
    styles: {
      font: 'helvetica',
      fontSize: 10,
      cellPadding: 6,
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      textColor: [30, 41, 59],
      valign: 'middle',
    },
    headStyles: {
      fillColor: [249, 115, 22],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
    },
    alternateRowStyles: {
      fillColor: [255, 247, 237],
    },
    columnStyles: {
      1: { halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'right', fontStyle: 'bold', textColor: [249, 115, 22] },
    },
  });

  doc.setFontSize(14);
  doc.setTextColor(30, 27, 75);
  doc.setFont('helvetica', 'bold');
  doc.text(`TOTAL : ${formatFCFA(total)} FCFA`, 105, doc.lastAutoTable.finalY + 14, { align: 'center' });

  const pageHeight = doc.internal.pageSize.getHeight();
  doc.addImage(footer.dataUrl, 'PNG', 0, pageHeight - footerH, pageWidth, footerH);

  doc.save(`ticket_${Date.now()}.pdf`);
};

  const menuItems = useMemo(() => {
    if (role === 'ADMIN') return [
      { section: 'dashboard', label: 'Dashboard', icon: '📊' },
      { section: 'stocks', label: 'Gestion des stocks', icon: '📦' },
      { section: 'commandes', label: 'Commandes', icon: '📦' },
      { section: 'historique', label: 'Historique', icon: '📜' },
      { section: 'cloture', label: 'Clôtures', icon: '💰' },
      { section: 'utilisateurs', label: 'Utilisateurs', icon: '👥' },
      { section: 'fournisseurs', label: 'Fournisseurs', icon: '🏭' },
      { section: 'zones', label: 'Zones de livraison', icon: '🚚' },
    ];
    if (role === 'DIRECTEUR') return [
      { section: 'dashboard', label: 'Dashboard', icon: '📊' },
      { section: 'stocks', label: 'Gestion des stocks', icon: '📦' },
      { section: 'commandes', label: 'Commandes', icon: '📦' },
      { section: 'historique', label: 'Historique', icon: '📜' },
      { section: 'cloture', label: 'Clôtures', icon: '💰' },
      { section: 'utilisateurs', label: 'Utilisateurs', icon: '👥' },
      { section: 'fournisseurs', label: 'Fournisseurs', icon: '🏭' },
      { section: 'zones', label: 'Zones de livraison', icon: '🚚' },
    ];
    if (role === 'STOCK_MANAGER') return [
  { section: 'dashboard', label: 'Dashboard', icon: '📊' },
  { section: 'stocks', label: 'Gestion des stocks', icon: '📦' },
  { section: 'retraits', label: 'Bons de retrait', icon: '🧾' },
  { section: 'historique', label: 'Historique', icon: '📜' },
  { section: 'rapport-activite', label: 'Mon rapport du jour', icon: '📊' },
  { section: 'fournisseurs', label: 'Fournisseurs', icon: '🏭' },
];
    if (role === 'VENDEUR') return [
  { section: 'caisse', label: 'Encaisser (code client)', icon: '🔎' },
  { section: 'panier', label: 'Vente directe', icon: '🛒' },
  { section: 'cloture', label: 'Clôture caisse', icon: '💰' },
];
  if (role === 'TECHNICO_COMMERCIAL') return [
  { section: 'commande-client', label: 'Nouvelle commande', icon: '📝' },
  { section: 'rapport-activite', label: 'Mon rapport du jour', icon: '📊' },
];
    return [];
  }, [role]);

  useEffect(() => { if (!activeSection && menuItems.length) setActiveSection(menuItems[0].section); }, [activeSection, menuItems]);
  const getRoleLabel = () => {
    switch (role) {
      case 'ADMIN': return 'Chef de showroom';
      case 'STOCK_MANAGER': return 'Stockeur';
      case 'VENDEUR': return 'Caissier';
      case 'TECHNICO_COMMERCIAL': return 'Technico-commercial';
      case 'DIRECTEUR': return 'Directeur Powertech';
      default: return role;
    }
  };

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

// ===== EXPORT PDF AVEC EN-TÊTE ET PIED DE PAGE =====
const exportPDF = async () => {
  const ventesFiltrees = getVentesFiltrees();
  if (!ventesFiltrees.length) { toast.error('Aucune donnée à exporter'); return; }

  const [header, footer] = await Promise.all([
    imageToDataUrl(factureHeader),
    imageToDataUrl(factureFooter),
  ]);

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const headerH = (header.height / header.width) * pageWidth;
  const footerH = (footer.height / footer.width) * pageWidth;

  const drawHeaderFooter = () => {
    doc.addImage(header.dataUrl, 'PNG', 0, 0, pageWidth, headerH);
    doc.addImage(footer.dataUrl, 'PNG', 0, pageHeight - footerH, pageWidth, footerH);
  };

  drawHeaderFooter();
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 27, 75);
  doc.text('Rapport des ventes - Powertech', 14, headerH + 14);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 14, headerH + 20);

  autoTable(doc, {
    head: [['Date', 'Produit', 'Quantité', 'Total (FCFA)', 'Vendeur']],
    body: ventesFiltrees.map(v => [
      new Date(v.dateVente).toLocaleDateString('fr-FR') + ' ' + new Date(v.dateVente).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      v.produit?.nom || 'N/A',
      v.quantite.toString(),
      `${formatFCFA(v.montantTotal)} FCFA`,
      v.vendeur
    ]),
    startY: headerH + 28,
    margin: { top: headerH + 4, bottom: footerH + 4, left: 14, right: 14 },
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 6,
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      textColor: [30, 41, 59],
      valign: 'middle',
    },
    headStyles: {
      fillColor: [30, 27, 75],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'left',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      2: { halign: 'center' },
      3: { halign: 'right', fontStyle: 'bold', textColor: [249, 115, 22] },
    },
    didDrawPage: () => drawHeaderFooter(),
  });

  doc.save(`rapport_ventes_${new Date().toISOString().slice(0, 19)}.pdf`);
};
const exportExcel = () => {
  const ventesFiltrees = getVentesFiltrees();
  if (!ventesFiltrees.length) { toast.error('Aucune donnée à exporter'); return; }

  const data = ventesFiltrees.map(v => ({
    'Date': new Date(v.dateVente).toLocaleString('fr-FR'),
    'Produit': v.produit?.nom || 'N/A',
    'Quantité': v.quantite,
    'Total (FCFA)': v.montantTotal,
    'Vendeur': v.vendeur,
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = [{ wch: 18 }, { wch: 25 }, { wch: 10 }, { wch: 15 }, { wch: 18 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Ventes');
  XLSX.writeFile(wb, `rapport_ventes_${new Date().toISOString().slice(0, 10)}.xlsx`);
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
      <OfflineSyncManager />

     {/* ===== SIDEBAR MODERNISÉE ===== */}
<div style={{ 
  ...styles.sidebar, 
  position: 'fixed', 
  overflowY: 'auto', 
  overflowX: 'hidden', 
  display: 'flex', 
  flexDirection: 'column',
  background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
  borderRight: '1px solid rgba(255,255,255,0.06)',
}}>
  
  {/* ===== LISERÉ D'ACCENT GRADIENT ===== */}
  <div style={{ 
    height: 4, 
    width: '100%', 
    background: 'linear-gradient(90deg, #f97316, #f59e0b, #3b82f6, #6366f1, #8b5cf6)', 
    flexShrink: 0,
    boxShadow: '0 2px 12px rgba(249,115,22,0.3)'
  }} />

  {/* ===== LOGO ===== */}
  <div style={{ padding: '24px 20px 12px 20px', flexShrink: 0 }}>
    <div style={{
      background: 'white',
      borderRadius: 16,
      padding: '16px 20px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      boxShadow: '0 8px 32px rgba(249,115,22,0.2)',
      border: '1px solid rgba(249,115,22,0.1)',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'scale(1.02)';
      e.currentTarget.style.boxShadow = '0 12px 40px rgba(249,115,22,0.3)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'scale(1)';
      e.currentTarget.style.boxShadow = '0 8px 32px rgba(249,115,22,0.2)';
    }}>
      <img src={logo} alt="Powertech" style={{ width: '100%', height: 'auto', display: 'block' }} />
    </div>
  </div>

  {/* ===== INFOS UTILISATEUR ===== */}
  <div style={{ 
    margin: '4px 16px 16px 16px', 
    padding: '14px 16px', 
    background: 'rgba(255,255,255,0.06)',
    borderRadius: 14, 
    border: '1px solid rgba(255,255,255,0.06)',
    flexShrink: 0,
    backdropFilter: 'blur(10px)'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{
        width: 40,
        height: 40,
        borderRadius: 12,
        background: 'linear-gradient(135deg, #f97316, #f59e0b)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 16,
        fontWeight: 700,
        color: 'white',
        flexShrink: 0,
        boxShadow: '0 4px 12px rgba(249,115,22,0.3)'
      }}>
        {user?.nom?.charAt(0) || 'U'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'white', lineHeight: 1.3 }}>
          {user?.nom || 'Utilisateur'}
        </div>
        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
          {getRoleLabel()}
        </div>
      </div>
    </div>
  </div>

  {/* ===== TOGGLE THÈME ===== */}
  <div
    onClick={toggleTheme}
    style={{
      margin: '0 16px 20px 16px',
      padding: '10px 14px',
      background: 'rgba(255,255,255,0.05)',
      borderRadius: 12,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      cursor: 'pointer',
      border: '1px solid rgba(255,255,255,0.06)',
      transition: '0.3s ease',
      flexShrink: 0,
    }}
    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: 28,
        height: 28,
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme === 'dark' ? 'rgba(99,102,241,0.2)' : 'rgba(245,158,11,0.2)',
        fontSize: 14,
      }}>{theme === 'light' ? '☀️' : '🌙'}</div>
      <span style={{ color: '#cbd5e1', fontSize: 13, fontWeight: 500 }}>
        {theme === 'light' ? 'Mode clair' : 'Mode sombre'}
      </span>
    </div>
    <div style={{
      width: 44,
      height: 24,
      background: theme === 'dark' ? 'linear-gradient(135deg, #3b82f6, #6366f1)' : '#475569',
      borderRadius: 12,
      position: 'relative',
      transition: '0.3s',
      flexShrink: 0,
      boxShadow: theme === 'dark' ? '0 0 20px rgba(59,130,246,0.3)' : 'none'
    }}>
      <div style={{
        width: 18,
        height: 18,
        background: 'white',
        borderRadius: '50%',
        position: 'absolute',
        top: 3,
        left: theme === 'dark' ? '23px' : '3px',
        transition: '0.3s',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
      }} />
    </div>
  </div>

  {/* ===== ÉTIQUETTE SECTION ===== */}
  <div style={{ padding: '0 22px 12px 22px', flexShrink: 0 }}>
    <span style={{ 
      fontSize: 10, 
      fontWeight: 700, 
      color: '#64748b', 
      textTransform: 'uppercase', 
      letterSpacing: '1.2px',
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }}>
      <span style={{ width: 16, height: 2, background: 'linear-gradient(90deg, #f97316, transparent)' }} />
      Menu principal
    </span>
  </div>

  {/* ===== MENU ===== */}
  <div style={{ 
    padding: '0 12px', 
    display: 'flex', 
    flexDirection: 'column', 
    gap: 3, 
    flexShrink: 0,
    flex: 1
  }}>
    {(() => {
      const ITEM_COLORS = {
        dashboard: '#3b82f6', 
        stocks: '#f59e0b', 
        commandes: '#6366f1', 
        historique: '#14b8a6',
        cloture: '#10b981', 
        utilisateurs: '#8b5cf6', 
        fournisseurs: '#f97316', 
        panier: '#10b981',
      };
      return menuItems.map(item => {
        const isActive = activeSection === item.section;
        const c = ITEM_COLORS[item.section] || '#3b82f6';
        return (
          <div
            key={item.section}
            onClick={() => setActiveSection(item.section)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 13,
              padding: '11px 14px',
              borderRadius: 12,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14,
              position: 'relative',
              flexShrink: 0,
              background: isActive ? `linear-gradient(135deg, ${c}, ${c}dd)` : 'transparent',
              color: isActive ? 'white' : '#94a3b8',
              boxShadow: isActive ? `0 4px 20px ${c}4d` : 'none',
              transition: 'all .25s ease',
              transform: isActive ? 'translateX(3px)' : 'none',
            }}
            onMouseEnter={e => { 
              if (!isActive) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                e.currentTarget.style.color = '#f1f5f9';
              }
            }}
            onMouseLeave={e => { 
              if (!isActive) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#94a3b8';
              }
            }}
          >
            {/* Indicateur actif */}
            {isActive && (
              <div style={{
                position: 'absolute',
                left: -12,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 4,
                height: 24,
                borderRadius: 4,
                background: 'white',
                boxShadow: '0 0 20px rgba(255,255,255,0.3)'
              }} />
            )}
            
            {/* Icône */}
            <div style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 15,
              flexShrink: 0,
              background: isActive ? 'rgba(255,255,255,0.18)' : `rgba(255,255,255,0.04)`,
              border: isActive ? 'none' : `1px solid rgba(255,255,255,0.06)`,
              transition: '0.25s ease'
            }}>
              {item.icon}
            </div>
            
            <span style={{ 
              letterSpacing: isActive ? '0.3px' : '0',
              transition: '0.25s ease'
            }}>{item.label}</span>
          </div>
        );
      });
    })()}
  </div>

  {/* ===== DÉCONNEXION ===== */}
  <div style={{ padding: '16px 16px 22px 16px', flexShrink: 0 }}>
    <div style={{ 
      height: 1, 
      background: 'linear-gradient(90deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02))', 
      marginBottom: 16 
    }} />
    <button
      onClick={logout}
      style={{
        width: '100%',
        padding: '12px',
        background: 'rgba(239,68,68,0.08)',
        border: '1px solid rgba(239,68,68,0.15)',
        borderRadius: 12,
        color: '#fca5a5',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        fontWeight: 600,
        fontSize: 13.5,
        transition: '0.3s ease',
        letterSpacing: '0.3px'
      }}
      onMouseEnter={e => { 
        e.currentTarget.style.background = 'rgba(239,68,68,0.15)';
        e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)';
        e.currentTarget.style.color = '#f87171';
        e.currentTarget.style.transform = 'translateX(2px)';
      }}
      onMouseLeave={e => { 
        e.currentTarget.style.background = 'rgba(239,68,68,0.08)';
        e.currentTarget.style.borderColor = 'rgba(239,68,68,0.15)';
        e.currentTarget.style.color = '#fca5a5';
        e.currentTarget.style.transform = 'translateX(0)';
      }}
    >
      <span style={{ fontSize: 16 }}>🚪</span>
      Déconnexion
    </button>
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
                {activeSection === 'zones' && 'Zones de livraison'}
                {activeSection === 'commandes' && 'Commandes fournisseurs'}
                {activeSection === 'retraits' && 'Bons de retrait'}
                {activeSection === 'commande-client' && 'Nouvelle commande client'}
                {activeSection === 'caisse' && 'Encaisser une commande client'}
                {activeSection === 'rapport-activite' && 'Rapport d\'activité'}
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
        onClick={() => { setStockTab('add'); setProductErrors({}); setShowStockModal(true); }} 
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
                  
                  <td style={{ 
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontFamily: 'monospace',
                    fontWeight: '500'
                  }}>
                    {p.reference || '-'}
                  </td>
                  
                  <td style={{ 
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontWeight: '600'
                  }}>
                    {p.nom}
                  </td>
                  
                  <td style={{ 
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontWeight: '500'
                  }}>
                    {p.prixVente?.toLocaleString()} FCFA
                  </td>
                  
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
                  
                  <td style={{ 
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border-color)',
                    textAlign: 'center'
                  }}>
                    <button 
                      onClick={() => { setProduitEdit(p); setEditErrors({}); setShowEditModal(true); }} 
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
                <input
                  style={{ ...styles.input, border: productErrors.reference ? '1.5px solid #ef4444' : styles.input.border }}
                  value={newProduct.reference}
                  onChange={e => { setNewProduct({ ...newProduct, reference: e.target.value }); setProductErrors(p => ({ ...p, reference: undefined })); }}
                />
                <FieldError message={productErrors.reference} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Nom *</label>
                <input
                  style={{ ...styles.input, border: productErrors.nom ? '1.5px solid #ef4444' : styles.input.border }}
                  value={newProduct.nom}
                  onChange={e => { setNewProduct({ ...newProduct, nom: e.target.value }); setProductErrors(p => ({ ...p, nom: undefined })); }}
                />
                <FieldError message={productErrors.nom} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Marque</label>
                <input style={styles.input} value={newProduct.marque || ''} onChange={e => setNewProduct({ ...newProduct, marque: e.target.value })} placeholder="Ex: DELL, HP, SAMSUNG" />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Prix (FCFA) *</label>
                <input
                  type="number"
                  style={{ ...styles.input, border: productErrors.prixVente ? '1.5px solid #ef4444' : styles.input.border }}
                  value={newProduct.prixVente}
                  onChange={e => { setNewProduct({ ...newProduct, prixVente: e.target.value }); setProductErrors(p => ({ ...p, prixVente: undefined })); }}
                />
                <FieldError message={productErrors.prixVente} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Quantité initiale *</label>
                <input
                  type="number"
                  style={{ ...styles.input, border: productErrors.quantiteStock ? '1.5px solid #ef4444' : styles.input.border }}
                  value={newProduct.quantiteStock}
                  onChange={e => { setNewProduct({ ...newProduct, quantiteStock: e.target.value }); setProductErrors(p => ({ ...p, quantiteStock: undefined })); }}
                />
                <FieldError message={productErrors.quantiteStock} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Fournisseur</label>
                <input
                  type="text"
                  autoComplete="off"
                  spellCheck="false"
                  style={styles.input}
                  value={newProduct.fournisseurNom}
                  onChange={e => setNewProduct({ ...newProduct, fournisseurNom: e.target.value })}
                  placeholder="Nom du fournisseur"
                />
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
                <input
                  type="text"
                  autoComplete="off"
                  spellCheck="false"
                  style={styles.input}
                  value={restockSupplier}
                  onChange={e => setRestockSupplier(e.target.value)}
                  placeholder="Nom du fournisseur"
                />
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

    {/* ===== MODAL MODIFICATION (avec validation) ===== */}
    {showEditModal && produitEdit && (
      <div style={styles.modal}>
        <div style={{ ...styles.modalContent, maxWidth: '500px' }}>
          <div style={styles.flexBetween}>
            <h3 style={{ color: 'var(--text-primary)' }}>✏️ Modifier le produit</h3>
            <button onClick={() => { setShowEditModal(false); setProduitEdit(null); setEditErrors({}); }} style={{ background: 'none', border: 'none', fontSize: '22px', color: 'var(--text-primary)' }}>✖️</button>
          </div>
          <form onSubmit={handleUpdateProduct}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Référence *</label>
              <input
                style={{ ...styles.input, border: editErrors.reference ? '1.5px solid #ef4444' : styles.input.border }}
                value={produitEdit.reference}
                onChange={e => { setProduitEdit({ ...produitEdit, reference: e.target.value }); setEditErrors(p => ({ ...p, reference: undefined })); }}
              />
              <FieldError message={editErrors.reference} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Nom *</label>
              <input
                style={{ ...styles.input, border: editErrors.nom ? '1.5px solid #ef4444' : styles.input.border }}
                value={produitEdit.nom}
                onChange={e => { setProduitEdit({ ...produitEdit, nom: e.target.value }); setEditErrors(p => ({ ...p, nom: undefined })); }}
              />
              <FieldError message={editErrors.nom} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Marque</label>
              <input style={styles.input} value={produitEdit.marque || ''} onChange={e => setProduitEdit({ ...produitEdit, marque: e.target.value })} placeholder="Ex: DELL, HP, SAMSUNG" />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Prix (FCFA) *</label>
              <input
                type="number"
                style={{ ...styles.input, border: editErrors.prixVente ? '1.5px solid #ef4444' : styles.input.border }}
                value={produitEdit.prixVente}
                onChange={e => { setProduitEdit({ ...produitEdit, prixVente: e.target.value }); setEditErrors(p => ({ ...p, prixVente: undefined })); }}
              />
              <FieldError message={editErrors.prixVente} />
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
              <button type="button" onClick={() => { setShowEditModal(false); setProduitEdit(null); setEditErrors({}); }} style={{ ...styles.btnPrimary, background: '#94a3b8' }}>Annuler</button>
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
        <button onClick={exportExcel} style={{ ...styles.btnPrimary, height: '42px', background: '#10b981' }}>📊 Export Excel</button>
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
{activeSection === 'cloture' && (
  (role === 'ADMIN' || role === 'DIRECTEUR')
    ? <ClotureShowroomPanel />
    : <CashClosureComponent onCloture={() => setRefresh(prev => prev + 1)} />
)}        {activeSection === 'utilisateurs' && <UserManagementComponent />}
        {activeSection === 'fournisseurs' && <FournisseurManagement />}
        {activeSection === 'zones' && <ZoneLivraisonManagement />}
        {activeSection === 'commandes'    && <CommandeFournisseur />}
        {activeSection === 'retraits' && <StockeurPanel user={user} />}
        {activeSection === 'commande-client' && <CommandeClientPanel produits={produits} user={user} />}
        {activeSection === 'caisse' && <CaissierPanel user={user} />}
        {activeSection === 'rapport-activite' && <RapportActivitePanel user={user} />}
      </div>
    </div>
  );
}

// ==================== COMMANDE CLIENT PANEL ====================
function CommandeClientPanel({ produits, user }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [panier, setPanier] = useState([]);
  const [quantites, setQuantites] = useState({});
  const [clientNom, setClientNom] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [printerName, setPrinterName] = useState(localStorage.getItem('printerName') || '');
  const [showPrinterPicker, setShowPrinterPicker] = useState(false);
  const [printers, setPrinters] = useState([]);
  const [zones, setZones] = useState([]);
  const [zoneId, setZoneId] = useState('');
  const [adresseClient, setAdresseClient] = useState('');
  const [contactClient, setContactClient] = useState('');
  const [interlocuteur, setInterlocuteur] = useState('');
  const [transporteur, setTransporteur] = useState('');

  const avatarColors = ['#3b82f6', '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#f97316'];
  const colorFor = (name = '') => { let h = 0; for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h); return avatarColors[Math.abs(h) % avatarColors.length]; };
  const initialsFor = (name = '') => name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  const setQty = (produitId, value, maxStock) => {
    let q = parseInt(value) || 0;
    if (q < 1) q = 1;
    if (q > maxStock) q = maxStock;
    setQuantites({ ...quantites, [produitId]: q });
  };

  useEffect(() => {
    axios.get('http://localhost:8080/api/zones-livraison').then(res => setZones(res.data)).catch(() => {});
  }, []);

  const zoneSelectionnee = zones.find(z => z.id === parseInt(zoneId));
  const fraisTransportSelectionne = zoneSelectionnee?.prixTransport || 0;

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
    toast.success(`${qty} x ${produit.nom} ajouté`);
  };

  const retirerDuPanier = (id) => setPanier(prev => prev.filter(i => i.id !== id));
  const modifierQuantite = (id, newQty, maxStock) => {
    if (newQty < 1) return retirerDuPanier(id);
    if (newQty > maxStock) { toast.error(`Stock maximum: ${maxStock}`); return; }
    setPanier(prev => prev.map(i => i.id === id ? { ...i, quantite: newQty } : i));
  };

  const totalProduitsHT = panier.reduce((s, i) => s + i.prixVente * i.quantite, 0);
  const totalHT = totalProduitsHT + fraisTransportSelectionne;
  const tva = totalHT * TAUX_TVA;
  const total = totalHT + tva;

  const genererFactureProForma = async () => {
    if (!panier.length) { toast.error('Ajoutez au moins un produit'); return; }
    try {
      const [header, footer] = await Promise.all([
        imageToDataUrl(factureHeader),
        imageToDataUrl(factureFooter),
      ]);
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const headerH = (header.height / header.width) * pageWidth;
      const footerH = (footer.height / footer.width) * pageWidth;

      doc.addImage(header.dataUrl, 'PNG', 0, 0, pageWidth, headerH);

      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 27, 75);
      doc.text('FACTURE PRO FORMA', pageWidth / 2, headerH + 16, { align: 'center' });

      const numeroPF = 'PF-' + Date.now();
      const dateEmission = new Date();
      const dateValidite = new Date(dateEmission.getTime() + 7 * 24 * 60 * 60 * 1000);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100);
      let yInfo = headerH + 26;
      doc.text(`N° ${numeroPF}`, 14, yInfo); yInfo += 6;
      doc.text(`Date d'émission : ${dateEmission.toLocaleDateString('fr-FR')}`, 14, yInfo); yInfo += 6;
      doc.text(`Valable jusqu'au : ${dateValidite.toLocaleDateString('fr-FR')}`, 14, yInfo); yInfo += 6;
      doc.text(`Technico-commercial : ${user?.nom || ''}`, 14, yInfo); yInfo += 6;
      if (clientNom) { doc.text(`Client : ${clientNom}`, 14, yInfo); yInfo += 6; }

      const totalProduitsHT = panier.reduce((s, i) => s + i.prixVente * i.quantite, 0);
      const totalHTProForma = Math.round(totalProduitsHT + fraisTransportSelectionne);
      const tvaProForma = Math.round(totalHTProForma * 0.18);
      const ttc = totalHTProForma + tvaProForma;

      autoTable(doc, {
        head: [['Produit', 'Quantité', 'Prix unitaire HT', 'Total HT']],
        body: [
          ...panier.map(l => [
            l.nom,
            l.quantite.toString(),
            `${formatFCFA(l.prixVente)} FCFA`,
            `${formatFCFA(l.prixVente * l.quantite)} FCFA`
          ]),
          ...(fraisTransportSelectionne > 0 ? [[`Transport (${zoneSelectionnee?.nom})`, '1', `${formatFCFA(fraisTransportSelectionne)} FCFA`, `${formatFCFA(fraisTransportSelectionne)} FCFA`]] : []),
        ],
        startY: yInfo + 6,
        margin: { left: 14, right: 14 },
        tableWidth: 182,
        styles: { font: 'helvetica', fontSize: 9.5, cellPadding: 7, lineColor: [226, 232, 240], lineWidth: 0.2, overflow: 'linebreak', valign: 'middle' },
        headStyles: { fillColor: [30, 27, 75], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9.5 },
        columnStyles: {
          0: { cellWidth: 62 },
          1: { cellWidth: 30, halign: 'center' },
          2: { cellWidth: 45, halign: 'right' },
          3: { cellWidth: 45, halign: 'right', fontStyle: 'bold' },
        },
      });

      const boxW = 90;
      const boxX = pageWidth - 14 - boxW;
      let y = doc.lastAutoTable.finalY + 14;

      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(boxX, y, boxW, 44, 3, 3, 'FD');

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text('Sous-total HT', boxX + 8, y + 12);
      doc.text(`${formatFCFA(totalHTProForma)} FCFA`, boxX + boxW - 8, y + 12, { align: 'right' });

      doc.text('TVA (18%)', boxX + 8, y + 22);
      doc.text(`${formatFCFA(tvaProForma)} FCFA`, boxX + boxW - 8, y + 22, { align: 'right' });

      doc.setDrawColor(30, 27, 75);
      doc.line(boxX + 8, y + 27, boxX + boxW - 8, y + 27);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12.5);
      doc.setTextColor(30, 27, 75);
      doc.text('TOTAL TTC', boxX + 8, y + 37);
      doc.text(`${formatFCFA(ttc)} FCFA`, boxX + boxW - 8, y + 37, { align: 'right' });

      y += 56;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        "Ce document est une facture pro forma, sans valeur comptable ni fiscale. Il ne constitue pas une facture définitive et ne peut servir de preuve de paiement.",
        14, y, { maxWidth: 182 }
      );

      doc.addImage(footer.dataUrl, 'PNG', 0, pageHeight - footerH, pageWidth, footerH);
      doc.save(`facture_proforma_${numeroPF}.pdf`);
    } catch (err) {
      toast.error('Erreur lors de la génération du document');
      console.error(err);
    }
  };

  const creerCommande = async () => {
    if (!panier.length) { toast.error('Ajoutez au moins un produit'); return; }
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const lignes = panier.map(i => ({ produitId: i.id, quantite: i.quantite }));
      const res = await axios.post('http://localhost:8080/api/commandes-client', {
        clientNom,
        lignes,
        zoneLivraisonId: zoneId ? parseInt(zoneId) : null,
        adresse: adresseClient || undefined,
        contact: contactClient || undefined,
        interlocuteur: interlocuteur || undefined,
        transporteur: transporteur || undefined,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setResult({ commande: res.data, lignes: panier, total: res.data.montantTotal });
      toast.success('Commande créée avec succès');
    } catch (err) {
      notifyError(err);
    } finally { setSubmitting(false); }
  };

  const nouvelleCommande = () => {
    setPanier([]); setQuantites({}); setClientNom(''); setResult(null); setSearchTerm('');
    setAdresseClient(''); setContactClient(''); setInterlocuteur(''); setTransporteur(''); setZoneId('');
  };

  const filteredProduits = produits.filter(p => p.quantiteStock > 0 && (p.nom?.toLowerCase().includes(searchTerm.toLowerCase()) || p.reference?.toLowerCase().includes(searchTerm.toLowerCase())));

  if (result) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <style>{`
          @media print {
            body * { visibility: hidden; }
            .pt-coupon, .pt-coupon * { visibility: visible; }
            .pt-coupon { position: absolute; top: 0; left: 0; width: 100%; }
            .pt-print-hide { display: none !important; }
          }
        `}</style>
        <div className="pt-coupon" style={{ ...styles.card, maxWidth: 420, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#10b981', marginBottom: 4 }}>✅ Commande créée</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>À remettre au client pour la caisse</div>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
            <div style={{ background: 'white', padding: 14, borderRadius: 16, border: '1px solid var(--border-color)' }}>
              <QRCodeSVG value={result.commande.code} size={160} />
            </div>
          </div>

          <div style={{
            fontFamily: 'monospace', fontSize: 30, fontWeight: 800, letterSpacing: 4, color: 'var(--text-primary)',
            background: 'var(--bg-table-row-hover)', borderRadius: 14, padding: '12px 20px', marginBottom: 18,
          }}>{result.commande.code}</div>

          {result.commande.clientNom && (
            <div className="pt-print-hide" style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>Client : <strong>{result.commande.clientNom}</strong></div>
          )}

          <div className="pt-print-hide" style={{ textAlign: 'left', margin: '18px 0', borderTop: '1px dashed var(--border-color)', paddingTop: 14 }}>
            {result.lignes.map(l => (
              <div key={l.id || `${l.produitId}-${l.quantite}`} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', color: 'var(--text-primary)' }}>
                <span>{l.nom || 'Produit'} × {l.quantite}</span>
                <span style={{ fontFamily: 'monospace' }}>{(l.prixVente * l.quantite).toLocaleString('fr-FR')} FCFA</span>
              </div>
            ))}
          </div>

          <div className="pt-print-hide" style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 18, borderTop: '2px solid var(--text-primary)', paddingTop: 12, color: 'var(--text-primary)' }}>
            <span>TOTAL</span>
            <span>{total.toLocaleString('fr-FR')} FCFA</span>
          </div>

          <div className="pt-print-hide" style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            <button onClick={() => window.print()} style={{ ...styles.btnPrimary, flex: 1, justifyContent: 'center' }}>🖨️ Imprimer</button>
            <button onClick={nouvelleCommande} style={{ ...styles.btnPrimary, flex: 1, justifyContent: 'center', background: '#10b981' }}>➕ Nouvelle commande</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px', alignItems: 'start' }}>
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
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Stock: {p.quantiteStock}</div>
                  </div>
                </div>
                <div style={styles.productPrice}>{p.prixVente.toLocaleString('fr-FR')} FCFA</div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: 30, overflow: 'hidden' }}>
                    <button onClick={() => setQty(p.id, qty - 1, p.quantiteStock)} style={{ width: 30, height: 30, border: 'none', background: 'var(--bg-btn-secondary)', color: 'var(--text-primary)', fontWeight: 700, cursor: 'pointer' }}>-</button>
                    <span style={{ width: 32, textAlign: 'center', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{qty}</span>
                    <button onClick={() => setQty(p.id, qty + 1, p.quantiteStock)} style={{ width: 30, height: 30, border: 'none', background: 'var(--bg-btn-secondary)', color: 'var(--text-primary)', fontWeight: 700, cursor: 'pointer' }}>+</button>
                  </div>
                  <button style={{ ...styles.btnSuccess, flex: 1 }} onClick={() => ajouterAuPanier(p)}>➕ Ajouter</button>
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

      <div style={{ position: 'sticky', top: 20 }}>
        <div style={{ ...styles.card, marginBottom: 0 }}>
          <div style={styles.cardTitle}>📝 Commande en cours</div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Nom du client (optionnel)</label>
            <input type="text" style={styles.input} value={clientNom} onChange={e => setClientNom(e.target.value)} placeholder="Ex: M. Diallo" />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Zone de livraison</label>
            <select style={styles.input} value={zoneId} onChange={e => setZoneId(e.target.value)}>
              <option value="">-- Aucune (retrait en magasin) --</option>
              {zones.map(z => <option key={z.id} value={z.id}>{z.nom} — {z.prixTransport.toLocaleString('fr-FR')} FCFA</option>)}
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Adresse du client</label>
            <input type="text" style={styles.input} value={adresseClient} onChange={e => setAdresseClient(e.target.value)} placeholder="Adresse du client (rue, ville)" />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Contact</label>
            <input type="text" style={styles.input} value={contactClient} onChange={e => setContactClient(e.target.value)} placeholder="Téléphone ou email" />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Interlocuteur</label>
            <input type="text" style={styles.input} value={interlocuteur} onChange={e => setInterlocuteur(e.target.value)} placeholder="Nom de l'interlocuteur" />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Transporteur</label>
            <input type="text" style={styles.input} value={transporteur} onChange={e => setTransporteur(e.target.value)} placeholder="Nom du transporteur (optionnel)" />
          </div>

          {panier.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🛒</div>
              Aucun produit sélectionné
            </div>
          ) : (
            <div style={{ maxHeight: '40vh', overflowY: 'auto', marginBottom: 16 }}>
              {panier.map((item, idx) => (
                <div key={item.id} style={{ padding: '10px 0', borderBottom: idx < panier.length - 1 ? '1px dashed var(--border-color)' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>{item.nom}</div>
                    <div style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-primary)', fontSize: 13 }}>{(item.prixVente * item.quantite).toLocaleString('fr-FR')}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: 30, overflow: 'hidden' }}>
                      <button onClick={() => modifierQuantite(item.id, item.quantite - 1, item.quantiteStock)} style={{ width: 24, height: 24, border: 'none', background: 'var(--bg-btn-secondary)', color: 'var(--text-primary)', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>-</button>
                      <span style={{ width: 24, textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>{item.quantite}</span>
                      <button onClick={() => modifierQuantite(item.id, item.quantite + 1, item.quantiteStock)} style={{ width: 24, height: 24, border: 'none', background: 'var(--bg-btn-secondary)', color: 'var(--text-primary)', fontWeight: 700, cursor: 'pointer', fontSize: 12 }}>+</button>
                    </div>
                    <button onClick={() => retirerDuPanier(item.id)} style={{ background: '#ef44441c', color: '#ef4444', border: 'none', borderRadius: 30, padding: '4px 10px', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}><span>Sous-total produits HT</span><span>{totalProduitsHT.toLocaleString('fr-FR')} FCFA</span></div>
            {fraisTransportSelectionne > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-secondary)', padding: '4px 0' }}>
                <span>Transport ({zoneSelectionnee?.nom})</span>
                <span>{fraisTransportSelectionne.toLocaleString('fr-FR')} FCFA</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}><span>TVA (18%)</span><span>{tva.toLocaleString('fr-FR')} FCFA</span></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
            <span style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 600 }}>Total TTC</span>
            <span style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{total.toLocaleString()} <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>FCFA</span></span>
          </div>

          <button
            style={{ ...styles.btnPrimary, width: '100%', justifyContent: 'center', padding: '13px', fontSize: 14, opacity: (!panier.length || submitting) ? 0.6 : 1, cursor: (!panier.length || submitting) ? 'not-allowed' : 'pointer' }}
            onClick={creerCommande}
            disabled={!panier.length || submitting}
          >
            {submitting ? 'Création...' : '✅ Créer la commande'}
          </button>
          <button
            onClick={genererFactureProForma}
            style={{ ...styles.btnPrimary, width: '100%', justifyContent: 'center', padding: '12px', fontSize: 13.5, background: '#6366f1', marginTop: 10 }}
          >🧾 Générer une facture pro forma</button>
        </div>
      </div>
    </div>
  );
}
function CaissierPanel({ user }) {
  const [codeInput, setCodeInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [commande, setCommande] = useState(null);
  const [lignes, setLignes] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paying, setPaying] = useState(false);
  const [result, setResult] = useState(null);
  const [printerName, setPrinterName] = useState(localStorage.getItem('printerName') || '');
  const [showPrinterPicker, setShowPrinterPicker] = useState(false);
  const [printers, setPrinters] = useState([]);

  const MODE_LABELS = { ESPECES: 'Espèces', WAVE: 'Wave', ORANGE_MONEY: 'Orange Money', CARTE: 'Carte bancaire' };

  const rechercherCommande = async (e) => {
    e?.preventDefault();
    if (!codeInput.trim()) { toast.error('Entrez un code'); return; }
    setSearching(true);
    setCommande(null);
    try {
      const res = await axios.get(`http://localhost:8080/api/commandes-client/code/${codeInput.trim().toUpperCase()}`);
      if (res.data.commande.statut !== 'EN_ATTENTE_PAIEMENT') {
        toast.error(`Cette commande a déjà été traitée (statut: ${res.data.commande.statut})`);
        return;
      }
      setCommande(res.data.commande);
      setLignes(res.data.lignes);
    } catch (err) {
      notifyError(err, 'Commande introuvable');
    } finally { setSearching(false); }
  };

  const encaisser = async (paiements) => {
    setPaying(true);
    const payload = { paiements };
    if (!navigator.onLine) {
      addToQueue({ type: 'encaissement', code: commande.code, payload });
      toast.success('📥 Paiement mis en attente — synchronisation au retour du réseau');
      setShowPaymentModal(false);
      setPaying(false);
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `http://localhost:8080/api/commandes-client/code/${commande.code}/encaisser`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult({ ...res.data, paiements, commande, lignes });
      setShowPaymentModal(false);
      toast.success('Paiement encaissé avec succès');
    } catch (err) {
      if (!err.response) {
        addToQueue({ type: 'encaissement', code: commande.code, payload });
        toast.success('📥 Réseau indisponible — paiement mis en attente');
        setShowPaymentModal(false);
      } else {
        notifyError(err, "Erreur lors de l'encaissement");
      }
    } finally { setPaying(false); }
  };

  const choisirImprimante = async () => {
    try {
      const list = await listPrinters();
      setPrinters(list);
      setShowPrinterPicker(true);
    } catch (err) {
      toast.error("QZ Tray n'est pas lancé sur cet ordinateur");
    }
  };

  const imprimerThermique = async () => {
    try {
      let chosenPrinter = printerName;
      if (!chosenPrinter) {
        // Try to discover printers via QZ Tray before failing
        try {
          const list = await listPrinters();
          if (list && list.length > 0) {
            setPrinters(list);
            // Auto-select first available printer to simplify UX
            chosenPrinter = list[0];
            setPrinterName(chosenPrinter);
            localStorage.setItem('printerName', chosenPrinter);
            toast.success(`Imprimante sélectionnée : ${chosenPrinter}`);
          } else {
            toast.error("Aucune imprimante détectée. Lancez QZ Tray et reconnectez l'imprimante.");
            return;
          }
        } catch (err) {
          toast.error("QZ Tray n'est pas lancé sur cet ordinateur");
          return;
        }
      }

      await printReceiptThermal(chosenPrinter, {
        numeroFacture: result.numeroFacture, caissier: user?.nom,
        clientNom: result.commande.clientNom, details: result.details,
        totalHT: result.totalHT, tva: result.tva, total: result.total, paiements: result.paiements,
      });
      toast.success('Ticket imprimé');
    } catch (err) {
      console.error('imprimerThermique error', err);
      toast.error("Erreur d'impression — QZ Tray est-il lancé et l'imprimante disponible ?");
    }
  };

  const nouvelleRecherche = () => {
    setCodeInput(''); setCommande(null); setLignes([]); setResult(null);
  };

  // ===== ÉCRAN RÉSULTAT (payé, prêt à imprimer) =====
  if (result) {
    return (
      <div>
        <style>{`
          @media print {
            body * { visibility: hidden; }
            .pt-print-zone, .pt-print-zone * { visibility: visible; }
            .pt-print-zone { position: static !important; left: 0 !important; top: 0 !important; width: 100% !important; }
            .pt-doc { page-break-after: always; }
            .pt-doc:last-child { page-break-after: auto; }
          }
        `}</style>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <div style={{ ...styles.card, maxWidth: 420, width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#10b981', marginBottom: 6 }}>Paiement encaissé</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 18 }}>Facture {result.numeroFacture}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'monospace', marginBottom: 18 }}>
              {Math.round(result.total).toLocaleString('fr-FR')} FCFA
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => window.print()} style={{ ...styles.btnPrimary, flex: 1, justifyContent: 'center' }}>🖨️ Imprimer (reçu + 2 BR)</button>
              <button onClick={imprimerThermique} style={{ ...styles.btnPrimary, flex: 1, justifyContent: 'center', background: '#6366f1' }}>🖨️ Ticket thermique</button>
              <button onClick={nouvelleRecherche} style={{ ...styles.btnPrimary, flex: 1, justifyContent: 'center', background: '#3b82f6' }}>🔎 Nouvelle recherche</button>
            </div>
          </div>
        </div>

        {/* Zone imprimable — invisible à l'écran, révélée uniquement à l'impression */}
        <div className="pt-print-zone" style={{ position: 'absolute', left: -9999, top: 0 }}>
          {/* PAGE 1 : REÇU */}
          <div className="pt-doc" style={{ maxWidth: 340, margin: '20px auto', padding: 24, fontFamily: "'Courier New', monospace" }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
              <img src={logo} alt="Powertech" style={{ width: 150 }} />
            </div>
            <div style={{ textAlign: 'center', fontSize: 11, color: '#475569', lineHeight: 1.8, marginBottom: 14 }}>
              <strong>Facture</strong> {result.numeroFacture}<br />
              {new Date().toLocaleString('fr-FR')}<br />
              <strong>Caissier</strong> : {user?.nom}
              {result.commande.clientNom && <><br /><strong>Client</strong> : {result.commande.clientNom}</>}
            </div>
            <div style={{ borderTop: '1px dashed #cbd5e1', margin: '10px 0' }} />
            {result.details.map((d, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, margin: '4px 0' }}>
                <span>{d.produit} × {d.quantite}</span>
                <span>{d.sousTotal.toLocaleString('fr-FR')} FCFA</span>
              </div>
            ))}
            <div style={{ borderTop: '1px dashed #cbd5e1', margin: '10px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '2px 0', color: '#64748b' }}><span>Sous-total HT</span><span>{result.totalHT?.toLocaleString('fr-FR')} FCFA</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '2px 0', color: '#64748b' }}><span>TVA (18%)</span><span>{result.tva?.toLocaleString('fr-FR')} FCFA</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 17, borderTop: '2px solid #1e1b4b', paddingTop: 8, marginTop: 6 }}>
              <span>TOTAL TTC</span><span>{result.total.toLocaleString('fr-FR')} FCFA</span>
            </div>
            <div style={{ marginTop: 14, fontSize: 11, color: '#94a3b8' }}>
              <strong>Paiement</strong>
              {result.paiements.map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{MODE_LABELS[p.mode] || p.mode}</span><span>{p.montant.toLocaleString('fr-FR')} FCFA</span>
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', fontSize: 10, color: '#94a3b8', marginTop: 16 }}>Merci de votre visite ! Dakar, Sénégal</div>
          </div>

          {/* PAGES 2 & 3 : LES 2 BONS DE RETRAIT */}
          {result.bonsRetrait?.map((br, idx) => (
            <div key={br.id} className="pt-doc" style={{ maxWidth: 380, margin: '20px auto', padding: 24, border: '2px dashed #1e1b4b' }}>
              <div style={{ textAlign: 'center', fontSize: 15, fontWeight: 800, color: '#1e1b4b', marginBottom: 4 }}>
                BON DE RETRAIT {idx + 1}/2
              </div>
              <div style={{ textAlign: 'center', fontSize: 11, color: '#64748b', marginBottom: 14 }}>
                Commande {result.commande.code} — Facture {result.numeroFacture}
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                <QRCodeSVG value={br.code} size={130} />
              </div>
              <div style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 22, fontWeight: 800, letterSpacing: 3, marginBottom: 14 }}>
                {br.code}
              </div>
              {result.commande.clientNom && (
                <div style={{ textAlign: 'center', fontSize: 12, marginBottom: 10 }}>Client : <strong>{result.commande.clientNom}</strong></div>
              )}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: '4px 2px' }}>Produit</th>
                    <th style={{ textAlign: 'center', borderBottom: '1px solid #ccc', padding: '4px 2px' }}>Qté</th>
                    <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: '4px 2px' }}>Marque</th>
                    <th style={{ textAlign: 'left', borderBottom: '1px solid #ccc', padding: '4px 2px' }}>Emplacement</th>
                  </tr>
                </thead>
                <tbody>
                  {result.lignes.map(l => (
                    <tr key={l.id}>
                      <td style={{ padding: '4px 2px', borderBottom: '1px dashed #eee' }}>{l.produit.nom}</td>
                      <td style={{ padding: '4px 2px', textAlign: 'center', borderBottom: '1px dashed #eee' }}>{l.quantite}</td>
                      <td style={{ padding: '4px 2px', borderBottom: '1px dashed #eee' }}>{l.produit.marque || '-'}</td>
                      <td style={{ padding: '4px 2px', borderBottom: '1px dashed #eee' }}>{l.produit.emplacement || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop: 20, borderTop: '1px solid #ccc', paddingTop: 10, fontSize: 10, color: '#94a3b8', textAlign: 'center' }}>
                Cachet stockeur :
                <div style={{ height: 50, border: '1px dashed #ccc', borderRadius: 8, marginTop: 6 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ===== ÉCRAN RECHERCHE =====
  if (!commande) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{ ...styles.card, maxWidth: 460, width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🔎</div>
            <div style={styles.cardTitle}>Retrouver une commande client</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Demandez le code au client (ou scannez son QR)</div>
          </div>
          <form onSubmit={rechercherCommande}>
            <input
              type="text"
              value={codeInput}
              onChange={e => setCodeInput(e.target.value.toUpperCase())}
              placeholder="Ex: P2PZ69"
              maxLength={6}
              style={{ ...styles.input, textAlign: 'center', fontSize: 24, fontWeight: 800, letterSpacing: 4, fontFamily: 'monospace', padding: '16px', borderRadius: 16, marginBottom: 16 }}
              autoFocus
            />
            <button type="submit" disabled={searching} style={{ ...styles.btnPrimary, width: '100%', justifyContent: 'center', padding: '13px' }}>
              {searching ? 'Recherche...' : '🔎 Rechercher'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ===== ÉCRAN RÉCAP AVANT PAIEMENT =====
  const totalHT = commande.montantTotal || 0;
  const tva = totalHT * TAUX_TVA;
  const total = totalHT + tva;
  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <div style={{ ...styles.card, maxWidth: 480, width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={styles.cardTitle}>Commande {commande.code}</div>
          <button onClick={nouvelleRecherche} style={styles.btnSecondary}>✖ Annuler</button>
        </div>

        {commande.clientNom && (
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>Client : <strong>{commande.clientNom}</strong></div>
        )}
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>Technico-commercial : {commande.technicoCommercialNom}</div>

        <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: 10, marginBottom: 16 }}>
          {lignes.map(l => (
            <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', color: 'var(--text-primary)' }}>
              <span>{l.produit.nom} × {l.quantite}</span>
              <span style={{ fontFamily: 'monospace' }}>{(l.prixUnitaire * l.quantite).toLocaleString('fr-FR')} FCFA</span>
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: 10, marginBottom: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}><span>Sous-total HT</span><span>{totalHT.toLocaleString('fr-FR')} FCFA</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}><span>TVA (18%)</span><span>{tva.toLocaleString('fr-FR')} FCFA</span></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 20, borderTop: '2px solid var(--text-primary)', paddingTop: 12, marginBottom: 20, color: 'var(--text-primary)' }}>
          <span>TOTAL TTC</span><span>{total.toLocaleString('fr-FR')} FCFA</span>
        </div>

        <button
          onClick={() => setShowPaymentModal(true)}
          style={{ ...styles.btnPrimary, width: '100%', justifyContent: 'center', padding: '14px', fontSize: 15, background: '#10b981' }}
        >✅ Passer au paiement</button>
      </div>

      {showPaymentModal && (
        <PaymentModal
          total={total}
          loading={paying}
          onConfirm={encaisser}
          onCancel={() => setShowPaymentModal(false)}
        />
      )}
    </div>
  );
}
function StockeurPanel({ user }) {
  const [codeInput, setCodeInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [bonRetrait, setBonRetrait] = useState(null);
  const [lignes, setLignes] = useState([]);
  const [validating, setValidating] = useState(false);
  const [validated, setValidated] = useState(false);
  const [bonLivraison, setBonLivraison] = useState(null);
  const [lignesResultat, setLignesResultat] = useState([]);
  const [enAttente, setEnAttente] = useState([]);
  const [loadingListe, setLoadingListe] = useState(true);
  const [printerName, setPrinterName] = useState(localStorage.getItem('printerName') || '');
  const [showPrinterPicker, setShowPrinterPicker] = useState(false);
  const [printers, setPrinters] = useState([]);

  useEffect(() => { fetchEnAttente(); }, []);

  const fetchEnAttente = async () => {
    setLoadingListe(true);
    try {
      const res = await axios.get('http://localhost:8080/api/bons-retrait/en-attente');
      setEnAttente(res.data);
    } catch (err) { console.error(err); }
    finally { setLoadingListe(false); }
  };

  const rechercherBR = async (code) => {
    const c = (code || codeInput).trim().toUpperCase();
    if (!c) { toast.error('Entrez un code'); return; }
    setSearching(true);
    setBonRetrait(null);
    setValidated(false);
    try {
      const res = await axios.get(`http://localhost:8080/api/bons-retrait/code/${c}`);
      if (res.data.bonRetrait.statut === 'RETIRE') {
        toast.error(`Ce bon a déjà été retiré le ${new Date(res.data.bonRetrait.dateRetrait).toLocaleString('fr-FR')} par ${res.data.bonRetrait.stockeurNom}`);
        return;
      }
      setBonRetrait(res.data.bonRetrait);
      setLignes(res.data.lignes);
      setCodeInput(c);
    } catch (err) {
      notifyError(err, 'Bon de retrait introuvable');
    } finally { setSearching(false); }
  };

  const validerRetrait = async () => {
    setValidating(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`http://localhost:8080/api/bons-retrait/code/${bonRetrait.code}/valider`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setBonLivraison(res.data.bonLivraison);
      setLignesResultat(res.data.lignes);
      setValidated(true);
      toast.success('Retrait validé avec succès');
      fetchEnAttente();
    } catch (err) {
      notifyError(err, 'Erreur lors de la validation');
    } finally { setValidating(false); }
  };

  const nouvelleRecherche = () => {
    setCodeInput(''); setBonRetrait(null); setLignes([]); setValidated(false);
  };

  const genererBonLivraisonPDF = async () => {
    try {
      const footer = await imageToDataUrl(factureFooter);
      const logoImg = await imageToDataUrl(logo);

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const footerH = (footer.height / footer.width) * pageWidth;

      // ===== EN-TÊTE =====
      const logoW = 45;
      const logoH = (logoImg.height / logoImg.width) * logoW;
      doc.addImage(logoImg.dataUrl, 'PNG', 14, 12, logoW, logoH);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(30, 27, 75);
      doc.text('BON DE LIVRAISON', pageWidth - 14, 28, { align: 'right' });

      doc.setDrawColor(249, 115, 22);
      doc.setLineWidth(1.2);
      doc.line(14, 42, pageWidth - 14, 42);

      let y = 52;

      // ===== STATUT =====
      doc.setFillColor(241, 245, 249);
      doc.rect(14, y, pageWidth - 28, 10, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.text('Statut de la livraison :', 18, y + 7);
      doc.setTextColor(16, 185, 129);
      doc.text('LIVRÉE', 90, y + 7);
      y += 20;

      // ===== INFOS CLIENT (gauche) / INFOS BL (droite) =====
      const leftX = 14, rightLabelX = 118, rightValueX = 160;
      const drawField = (x, labelY, label, value, lineWidth) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(30, 41, 59);
        doc.text(label, x, labelY);
        doc.setDrawColor(180, 190, 200);
        const labelW = doc.getTextWidth(label) + 4;
        doc.line(x + labelW, labelY, x + labelW + lineWidth, labelY);
        if (value) {
          doc.setFont('helvetica', 'normal');
          doc.text(String(value), x + labelW + 2, labelY - 1);
        }
      };

      const clientNom = bonRetrait?.commandeClient?.clientNom || '';
      const zoneNom = bonRetrait?.commandeClient?.zoneLivraisonNom || '';

      drawField(leftX, y, 'Nom du client :', clientNom, 55);
      drawField(rightLabelX - 104, y, '', '', 0); // no-op placeholder to keep alignment consistent
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(30, 41, 59);
      doc.text('N° BL :', rightLabelX, y);
      doc.line(rightLabelX + 18, y, pageWidth - 14, y);
      doc.setFont('helvetica', 'normal');
      doc.text(bonLivraison?.numero || '', rightLabelX + 20, y - 1);

      y += 10;
      drawField(leftX, y, 'Adresse du client :', '', 55);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(30, 41, 59);
      doc.text('Date livraison :', rightLabelX, y);
      doc.line(rightLabelX + 28, y, pageWidth - 14, y);
      doc.setFont('helvetica', 'normal');
      doc.text(new Date().toLocaleDateString('fr-FR'), rightLabelX + 30, y - 1);

      y += 10;
      drawField(leftX, y, 'Contact :', '', 55);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(30, 41, 59);
      doc.text('N° Commande :', rightLabelX, y);
      doc.line(rightLabelX + 27, y, pageWidth - 14, y);
      doc.setFont('helvetica', 'normal');
      doc.text(bonRetrait?.commandeClient?.code || '', rightLabelX + 29, y - 1);

      y += 10;
      drawField(leftX, y, 'Votre référence :', '', 55);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(30, 41, 59);
      doc.text('Chantier / Site :', rightLabelX, y);
      doc.line(rightLabelX + 28, y, pageWidth - 14, y);
      doc.setFont('helvetica', 'normal');
      doc.text(zoneNom, rightLabelX + 30, y - 1);

      y += 10;
      drawField(leftX, y, 'Interlocuteur :', '', 55);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5); doc.setTextColor(30, 41, 59);
      doc.text('Transporteur :', rightLabelX, y);
      doc.line(rightLabelX + 25, y, pageWidth - 14, y);

      y += 16;

      // ===== TABLEAU PRODUITS =====
      autoTable(doc, {
        head: [['N°', 'Désignation', 'Référence', 'Qté commandée', 'Unité', 'Qté livrée', 'Qté reçue']],
        body: lignesResultat.map((l, i) => [
          (i + 1).toString(),
          l.produit?.nom || '',
          l.produit?.reference || '',
          l.quantite.toString(),
          'U',
          l.quantite.toString(),
          '',
        ]),
        startY: y,
        margin: { left: 14, right: 14 },
        styles: { font: 'helvetica', fontSize: 9, cellPadding: 6, lineColor: [200, 200, 200], lineWidth: 0.2, valign: 'middle' },
        headStyles: { fillColor: [30, 27, 75], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
        columnStyles: {
          0: { cellWidth: 12, halign: 'center' },
          3: { cellWidth: 24, halign: 'center' },
          4: { cellWidth: 18, halign: 'center' },
          5: { cellWidth: 22, halign: 'center' },
          6: { cellWidth: 22, halign: 'center' },
        },
      });

      y = doc.lastAutoTable.finalY + 12;

      // ===== OBSERVATIONS =====
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(30, 41, 59);
      doc.text('Observations / Remarques', 14, y);
      y += 4;
      doc.setDrawColor(200, 200, 200);
      doc.rect(14, y, pageWidth - 28, 22);
      y += 34;

      // ===== SIGNATURES =====
      const colW = (pageWidth - 28 - 8) / 2;
      doc.setFillColor(30, 27, 75);
      doc.rect(14, y, colW, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.text('LIVRÉ PAR (POWERTECH)', 18, y + 5.5);

      doc.setFillColor(249, 115, 22);
      doc.rect(14 + colW + 8, y, colW, 8, 'F');
      doc.text('REÇU PAR (CLIENT)', 14 + colW + 8 + 4, y + 5.5);

      y += 14;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      doc.text(`Nom : ${bonLivraison?.stockeurNom || ''}`, 14, y);
      doc.text(`Nom : ${clientNom}`, 14 + colW + 8, y);
      y += 7;
      doc.text(`Date : ${new Date().toLocaleDateString('fr-FR')}`, 14, y);
      doc.text('Date :', 14 + colW + 8, y);

      y += 6;
      doc.setDrawColor(200, 200, 200);
      doc.rect(14, y, colW, 24);
      doc.rect(14 + colW + 8, y, colW, 24);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Signature et cachet', 17, y + 5);
      doc.text('Signature et cachet', 14 + colW + 8 + 3, y + 5);

      y += 32;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(
        "NB : ce bon fait foi de réception de marchandise. Toute anomalie (quantité, état des articles) doit être mentionnée dans les observations avant signature.",
        14, y, { maxWidth: pageWidth - 28 }
      );

      // ===== PIED DE PAGE (image officielle) =====
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.addImage(footer.dataUrl, 'PNG', 0, pageHeight - footerH, pageWidth, footerH);

      doc.save(`${bonLivraison?.numero || 'BL'}.pdf`);
    } catch (err) {
      toast.error('Erreur lors de la génération du bon de livraison');
      console.error(err);
    }
  };

  // ===== ÉCRAN CONFIRMATION =====
  if (validated) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{ ...styles.card, maxWidth: 420, width: '100%', textAlign: 'center' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', background: '#10b9811c', color: '#10b981',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 16px',
          }}>✅</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#10b981', marginBottom: 6 }}>Retrait validé</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
            Bon {bonRetrait.code} — produits remis au client
          </div>
          <button onClick={nouvelleRecherche} style={{ ...styles.btnPrimary, width: '100%', justifyContent: 'center', padding: '13px' }}>
            🔎 Nouvelle recherche
          </button>
          {bonLivraison && (
            <button onClick={genererBonLivraisonPDF} style={{ ...styles.btnPrimary, width: '100%', justifyContent: 'center', padding: '13px', marginTop: 10 }}>🖨️ Bon de livraison</button>
          )}
        </div>
      </div>
    );
  }

  // ===== ÉCRAN DÉTAIL BR (avant validation) =====
  if (bonRetrait) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{ ...styles.card, maxWidth: 500, width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={styles.cardTitle}>Bon de retrait {bonRetrait.code}</div>
            <button onClick={nouvelleRecherche} style={styles.btnSecondary}>✖ Annuler</button>
          </div>

          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
            Commande {bonRetrait.commandeClient?.code}
          </div>
          {bonRetrait.commandeClient?.clientNom && (
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Client : <strong>{bonRetrait.commandeClient.clientNom}</strong>
            </div>
          )}

          <div style={{ overflowX: 'auto', borderRadius: 14, border: '1px solid var(--border-color)', marginBottom: 20 }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Produit</th>
                  <th style={styles.th}>Qté</th>
                  <th style={styles.th}>Marque</th>
                  <th style={styles.th}>Emplacement</th>
                </tr>
              </thead>
              <tbody>
                {lignes.map(l => (
                  <tr key={l.id}>
                    <td style={styles.td}><strong>{l.produit.nom}</strong></td>
                    <td style={styles.td}>{l.quantite}</td>
                    <td style={styles.td}>{l.produit.marque || '-'}</td>
                    <td style={styles.td}>{l.produit.emplacement || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{
            background: '#f59e0b14', border: '1px solid #f59e0b33', borderRadius: 14, padding: '12px 16px',
            fontSize: 12.5, color: '#b45309', marginBottom: 20, display: 'flex', gap: 8, alignItems: 'flex-start',
          }}>
            <span>⚠️</span>
            <span>Vérifiez que le client présente bien ce bon avant de remettre les produits. Une fois validé, ce bon ne pourra plus être retiré une seconde fois.</span>
          </div>

          <button
            onClick={validerRetrait}
            disabled={validating}
            style={{ ...styles.btnPrimary, width: '100%', justifyContent: 'center', padding: '14px', fontSize: 15, background: '#10b981', opacity: validating ? 0.6 : 1 }}
          >
            {validating ? 'Validation...' : '✅ Valider le retrait et remettre les produits'}
          </button>
        </div>
      </div>
    );
  }

  // ===== ÉCRAN RECHERCHE + LISTE EN ATTENTE =====
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 24, alignItems: 'start' }}>
      <div style={{ ...styles.card, marginBottom: 0 }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>📦</div>
          <div style={styles.cardTitle}>Valider un retrait</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Demandez le bon au client (ou scannez son QR)</div>
        </div>
        <form onSubmit={e => { e.preventDefault(); rechercherBR(); }}>
          <input
            type="text"
            value={codeInput}
            onChange={e => setCodeInput(e.target.value.toUpperCase())}
            placeholder="Code du bon"
            maxLength={6}
            style={{ ...styles.input, textAlign: 'center', fontSize: 22, fontWeight: 800, letterSpacing: 4, fontFamily: 'monospace', padding: '14px', borderRadius: 16, marginBottom: 16 }}
            autoFocus
          />
          <button type="submit" disabled={searching} style={{ ...styles.btnPrimary, width: '100%', justifyContent: 'center', padding: '13px' }}>
            {searching ? 'Recherche...' : '🔎 Rechercher'}
          </button>
        </form>
      </div>

      <div style={{ ...styles.card, marginBottom: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={styles.cardTitle}>🧾 Bons en attente</div>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', background: '#f59e0b1c', padding: '4px 12px', borderRadius: 20 }}>
            {enAttente.length}
          </span>
        </div>

        {loadingListe ? (
          <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>Chargement...</div>
        ) : enAttente.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
            Aucun bon en attente
          </div>
        ) : (
          <div style={{ maxHeight: '50vh', overflowY: 'auto' }}>
            {enAttente.map(br => (
              <div
                key={br.id}
                onClick={() => rechercherBR(br.code)}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px',
                  borderRadius: 12, cursor: 'pointer', marginBottom: 6, border: '1px solid var(--border-color)',
                  transition: '0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-table-row-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div>
                    <div style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-primary)' }}>{br.code}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                      Imprimante: {printerName || '—'}
                      <button
                        onClick={async () => {
                          try {
                            const list = await listPrinters();
                            const pick = window.prompt('Imprimantes disponibles:\n' + list.join('\n'));
                            if (pick) { setPrinterName(pick); localStorage.setItem('printerName', pick); toast.success(`Imprimante : ${pick}`); }
                          } catch (err) { toast.error("QZ Tray n'est pas lancé sur cet ordinateur"); }
                        }}
                        style={{ ...styles.btnSecondary, marginLeft: 8, padding: '6px 10px', fontSize: 12 }}
                      >Choisir</button>
                    </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Commande {br.commandeClient?.code} {br.commandeClient?.clientNom ? `— ${br.commandeClient.clientNom}` : ''}
                  </div>
                </div>
                <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>En attente</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
function RapportActivitePanel({ user }) {
  const [commentaire, setCommentaire] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [compteur, setCompteur] = useState(null);

  const roleLabel = user?.role === 'TECHNICO_COMMERCIAL' ? 'commandes créées' : 'bons de retrait traités';

  const soumettre = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:8080/api/rapports-activite', { commentaire }, { headers: { Authorization: `Bearer ${token}` } });
      setCompteur(res.data.compteur);
      setSubmitted(true);
      toast.success('Rapport soumis avec succès');
    } catch (err) {
      const msg = getErrorMessage(err);
      toast.error(msg);
      if (msg.includes('déjà')) setSubmitted(true);
    } finally { setLoading(false); }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <div style={{ ...styles.card, maxWidth: 460, width: '100%', textAlign: 'center' }}>
        {submitted ? (
          <>
            <div style={{
              width: 72, height: 72, borderRadius: '50%', background: '#10b9811c', color: '#10b981',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 16px',
            }}>✅</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#10b981', marginBottom: 6 }}>Rapport du jour soumis</div>
            {compteur !== null && (
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{compteur} {roleLabel} aujourd'hui</div>
            )}
          </>
        ) : (
          <>
            <div style={{ fontSize: 40, marginBottom: 10 }}>📊</div>
            <div style={styles.cardTitle}>Rapport d'activité du jour</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
              Le compteur ({roleLabel}) est calculé automatiquement à partir de votre activité réelle.
            </div>
            <textarea
              value={commentaire}
              onChange={e => setCommentaire(e.target.value)}
              placeholder="Commentaire (optionnel)"
              rows={3}
              style={{ ...styles.input, marginBottom: 16, resize: 'vertical' }}
            />
            <button
              onClick={soumettre}
              disabled={loading}
              style={{ ...styles.btnPrimary, width: '100%', justifyContent: 'center', padding: '13px', opacity: loading ? 0.6 : 1 }}
            >{loading ? 'Envoi...' : '📤 Soumettre mon rapport'}</button>
          </>
        )}
      </div>
    </div>
  );
}
function DetailRapportModal({ rapport, onClose }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const isTechnico = rapport.role === 'TECHNICO_COMMERCIAL';

  useEffect(() => {
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const dateStr = typeof rapport.date === 'string' ? rapport.date.slice(0, 10) : toDateKey(rapport.date);
        const url = isTechnico
          ? `http://localhost:8080/api/commandes-client/technico/${encodeURIComponent(rapport.utilisateurNom)}/date/${dateStr}`
          : `http://localhost:8080/api/bons-retrait/stockeur/${encodeURIComponent(rapport.utilisateurNom)}/date/${dateStr}`;
        const res = await axios.get(url);
        setItems(res.data);
      } catch (err) {
        toast.error('Erreur lors du chargement des détails');
      } finally { setLoading(false); }
    };
    fetchDetail();
  }, [rapport, isTechnico]);

  const color = isTechnico ? '#14b8a6' : '#f59e0b';

  return (
    <div style={styles.modal}>
      <div style={{ ...styles.modalContent, maxWidth: 640 }}>
        <div style={styles.flexBetween}>
          <div>
            <h3 style={{ color: 'var(--text-primary)', margin: 0 }}>
              {isTechnico ? '📝 Commandes créées' : '📦 Bons de retrait validés'}
            </h3>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              {rapport.utilisateurNom} — {new Date(rapport.date).toLocaleDateString('fr-FR')}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: 'var(--text-primary)' }}>✖️</button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 50, color: 'var(--text-muted)' }}>Chargement...</div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 50, color: 'var(--text-muted)' }}>Aucune donnée trouvée pour ce jour</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '60vh', overflowY: 'auto' }}>
            {items.map((item, idx) => {
              const entete = isTechnico ? item.commande : item.bonRetrait;
              const code = isTechnico ? entete.code : entete.code;
              const clientNom = isTechnico ? entete.clientNom : entete.commandeClient?.clientNom;
              return (
                <div key={idx} style={{ border: '1px solid var(--border-color)', borderRadius: 16, overflow: 'hidden' }}>
                  <div style={{
                    padding: '10px 16px', background: color + '14', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {isTechnico ? code : `Commande ${entete.commandeClient?.code} — BR ${code}`}
                    </div>
                    {clientNom && <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{clientNom}</div>}
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ ...styles.th, fontSize: 10 }}>Produit</th>
                        <th style={{ ...styles.th, fontSize: 10, textAlign: 'center' }}>Qté</th>
                      </tr>
                    </thead>
                    <tbody>
                      {item.lignes.map(l => (
                        <tr key={l.id}>
                          <td style={{ ...styles.td, fontSize: 13 }}>{l.produit?.nom}</td>
                          <td style={{ ...styles.td, fontSize: 13, textAlign: 'center' }}>{l.quantite}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
function ClotureShowroomPanel() {
  const [commandesClient, setCommandesClient] = useState([]);
  const [bonsEnAttente, setBonsEnAttente] = useState([]);
  const [rapports, setRapports] = useState([]);
  const [cloturesCaisse, setCloturesCaisse] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rapportDetail, setRapportDetail] = useState(null);
  const [annulationLoading, setAnnulationLoading] = useState(null);

  const CS = { blue: '#3b82f6', ind: '#6366f1', teal: '#14b8a6', amber: '#f59e0b', green: '#10b981', red: '#ef4444', gray: '#94a3b8' };

  const ROLE_META = {
    TECHNICO_COMMERCIAL: { label: 'Technico-commercial', color: CS.teal },
    STOCK_MANAGER: { label: 'Stockeur', color: CS.amber },
  };

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const [cc, br, ra, hc] = await Promise.all([
        axios.get('http://localhost:8080/api/commandes-client', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://localhost:8080/api/bons-retrait/en-attente'),
        axios.get('http://localhost:8080/api/rapports-activite'),
        axios.get('http://localhost:8080/api/produits/cloture/historique'),
      ]);
      setCommandesClient(cc.data);
      setBonsEnAttente(br.data);
      setRapports(ra.data);
      setCloturesCaisse(hc.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const annulerCommande = async (code) => {
    if (!window.confirm(`Annuler la commande ${code} ?`)) return;
    setAnnulationLoading(code);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:8080/api/commandes-client/code/${code}/annuler`, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Commande annulée');
      fetchAll(true);
    } catch (err) {
      notifyError(err);
    } finally { setAnnulationLoading(null); }
  };

  const todayKey = toDateKey(new Date());

  const commandesCreeesAuj = commandesClient.filter(c => toDateKey(c.dateCreation) === todayKey).length;
  const commandesPayeesAuj = commandesClient.filter(c => c.statut === 'PAYEE' && c.datePaiement && toDateKey(c.datePaiement) === todayKey).length;
  const commandesStales = commandesClient.filter(c => c.statut === 'EN_ATTENTE_PAIEMENT' && toDateKey(c.dateCreation) !== todayKey);

  const ecartsParJour = (() => {
    const map = new Map();
    commandesClient.forEach(c => {
      const jourCreation = toDateKey(c.dateCreation);
      if (!map.has(jourCreation)) map.set(jourCreation, { jour: jourCreation, creees: 0, payees: 0 });
      map.get(jourCreation).creees += 1;
      if (c.statut === 'PAYEE' && c.datePaiement) {
        const jourPaiement = toDateKey(c.datePaiement);
        if (!map.has(jourPaiement)) map.set(jourPaiement, { jour: jourPaiement, creees: 0, payees: 0 });
        map.get(jourPaiement).payees += 1;
      }
    });
    return Array.from(map.values())
      .sort((a, b) => b.jour.localeCompare(a.jour))
      .slice(0, 14);
  })();

  const getEcartMeta = (type) => {
    if (type === 'MANQUANT') return { label: 'Manquant', icon: '⚠️', color: CS.red };
    if (type === 'EXCEDENT') return { label: 'Excédent', icon: '📈', color: CS.amber };
    return { label: 'Équilibré', icon: '✅', color: CS.green };
  };

  const StatCard = ({ icon, label, value, color, alerte }) => (
    <div style={{
      flex: 1, minWidth: 190, background: `linear-gradient(160deg, ${color}12, ${color}03)`,
      border: `1px solid ${alerte ? color + '55' : color + '22'}`, borderRadius: 18, padding: '18px 18px',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: -24, right: -24, width: 80, height: 80, borderRadius: '50%', background: color + '10' }} />
      <div style={{
        width: 40, height: 40, borderRadius: 11, background: color + '1c', color,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, marginBottom: 12, position: 'relative',
      }}>{icon}</div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.4px', position: 'relative' }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: alerte ? color : 'var(--text-primary)', marginTop: 4, position: 'relative' }}>{value}</div>
    </div>
  );

  const SectionHeader = ({ icon, title, subtitle, color }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
      <div style={{
        width: 40, height: 40, borderRadius: 11, background: color + '1c', color,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0,
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{subtitle}</div>}
      </div>
    </div>
  );

  if (loading) return <div style={{ textAlign: 'center', padding: 70, color: 'var(--text-muted)' }}>Chargement...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* ===== EN-TÊTE ===== */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>📊 Vue d'ensemble du showroom</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
        <button
          onClick={() => fetchAll(true)}
          disabled={refreshing}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-card)', border: '1px solid var(--border-color)',
            padding: '10px 18px', borderRadius: 30, cursor: 'pointer', fontWeight: 600, fontSize: 13, color: 'var(--text-secondary)',
          }}
        >{refreshing ? '⏳ Actualisation...' : '🔄 Actualiser'}</button>
      </div>

      {/* ===== STATS DU JOUR ===== */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <StatCard icon="📝" label="Commandes créées" value={commandesCreeesAuj} color={CS.teal} />
        <StatCard icon="💰" label="Commandes payées" value={commandesPayeesAuj} color={CS.blue} />
        <StatCard icon="⚠️" label="Non réglées" value={commandesStales.length} color={CS.red} alerte={commandesStales.length > 0} />
        <StatCard icon="📦" label="BR en attente" value={bonsEnAttente.length} color={CS.amber} alerte={bonsEnAttente.length > 0} />
      </div>

      {/* ===== BANNIÈRE D'ALERTE ===== */}
      {commandesStales.length > 0 && (
        <div style={{
          background: `linear-gradient(135deg, ${CS.red}14, ${CS.red}06)`, border: `1px solid ${CS.red}33`,
          borderRadius: 16, padding: '16px 20px',
        }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 12 }}>
            <div style={{
              width: 42, height: 42, borderRadius: '50%', background: CS.red + '1c', color: CS.red,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0,
            }}>⚠️</div>
            <div style={{ fontSize: 13.5, color: 'var(--text-primary)' }}>
              <strong>{commandesStales.length} commande{commandesStales.length > 1 ? 's' : ''} en attente depuis un jour précédent.</strong>
              <div style={{ color: 'var(--text-muted)', marginTop: 2 }}>Vérifiez auprès du technico-commercial, ou annulez si le client ne reviendra pas.</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {commandesStales.map(c => (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)', borderRadius: 12, padding: '8px 14px' }}>
                <div style={{ fontSize: 12.5 }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-primary)' }}>{c.code}</span>
                  <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>
                    {c.technicoCommercialNom} — {new Date(c.dateCreation).toLocaleDateString('fr-FR')} — {c.montantTotal?.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
                <button
                  onClick={() => annulerCommande(c.code)}
                  disabled={annulationLoading === c.code}
                  style={{ background: CS.red + '1c', color: CS.red, border: 'none', borderRadius: 20, padding: '5px 14px', fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}
                >{annulationLoading === c.code ? '...' : '✖ Annuler'}</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== ÉCARTS PAR JOUR ===== */}
      <div style={styles.card}>
        <SectionHeader icon="📈" title="Écarts commandes créées / payées" subtitle="14 derniers jours" color={CS.ind} />
        <div style={{ overflowX: 'auto', borderRadius: 14, border: '1px solid var(--border-color)' }}>
          <table style={styles.table}>
            <thead><tr><th style={styles.th}>Date</th><th style={styles.th}>Créées</th><th style={styles.th}>Payées</th><th style={styles.th}>Écart</th></tr></thead>
            <tbody>
              {ecartsParJour.map(j => {
                const ecart = j.creees - j.payees;
                const isPast = j.jour !== todayKey;
                const alerte = isPast && ecart > 0;
                return (
                  <tr key={j.jour}>
                    <td style={styles.td}>{new Date(j.jour).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</td>
                    <td style={styles.td}>{j.creees}</td>
                    <td style={styles.td}>{j.payees}</td>
                    <td style={styles.td}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20,
                        fontSize: 12, fontWeight: 700,
                        background: alerte ? CS.red + '1c' : ecart === 0 ? CS.green + '1c' : 'var(--bg-badge-default)',
                        color: alerte ? CS.red : ecart === 0 ? CS.green : 'var(--text-secondary)',
                      }}>
                        {alerte ? '⚠️' : ecart === 0 ? '✅' : '•'} {ecart > 0 ? '+' : ''}{ecart}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {ecartsParJour.length === 0 && (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Aucune donnée pour le moment</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== HISTORIQUE CLÔTURES CAISSE ===== */}
      <div style={styles.card}>
        <SectionHeader icon="💰" title="Historique des clôtures de caisse" subtitle="Montants réels enregistrés par le caissier" color={CS.blue} />
        {cloturesCaisse.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
            Aucune clôture enregistrée
          </div>
        ) : (
          <div style={{ overflowX: 'auto', borderRadius: 14, border: '1px solid var(--border-color)' }}>
            <table style={styles.table}>
              <thead><tr><th style={styles.th}>Date</th><th style={styles.th}>Théorique</th><th style={styles.th}>Réel</th><th style={styles.th}>Écart</th><th style={styles.th}>Caissier</th></tr></thead>
              <tbody>
                {cloturesCaisse.map(c => {
                  const meta = getEcartMeta(c.typeEcart);
                  return (
                    <tr key={c.id}>
                      <td style={styles.td}>{new Date(c.date).toLocaleDateString('fr-FR')}</td>
                      <td style={styles.td}><strong>{c.montantTheorique?.toLocaleString('fr-FR')}</strong> FCFA</td>
                      <td style={styles.td}><strong>{c.montantReel?.toLocaleString('fr-FR')}</strong> FCFA</td>
                      <td style={styles.td}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20,
                          fontSize: 12, fontWeight: 700, background: meta.color + '1c', color: meta.color,
                        }}>
                          {meta.icon} {c.ecart > 0 ? '+' : ''}{c.ecart?.toLocaleString('fr-FR')} FCFA
                        </span>
                      </td>
                      <td style={styles.td}>{c.caissier}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===== RAPPORTS D'ACTIVITÉ ===== */}
      <div style={styles.card}>
        <SectionHeader icon="📋" title="Rapports d'activité" subtitle="Technico-commercial et Stockeur" color={CS.teal} />
        {rapports.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
            Aucun rapport soumis
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto', borderRadius: 14, border: '1px solid var(--border-color)' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Rôle</th>
                    <th style={styles.th}>Utilisateur</th>
                    <th style={styles.th}>Compteur</th>
                    <th style={styles.th}>Commentaire</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rapports.map(r => {
                    const meta = ROLE_META[r.role] || { label: r.role, color: CS.gray };
                    const unite = r.role === 'STOCK_MANAGER' ? 'BR' : `commande${r.compteur > 1 ? 's' : ''}`;
                    return (
                      <tr key={r.id}>
                        <td style={styles.td}>{new Date(r.date).toLocaleDateString('fr-FR')}</td>
                        <td style={styles.td}>
                          <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: meta.color + '1c', color: meta.color }}>{meta.label}</span>
                        </td>
                        <td style={styles.td}>{r.utilisateurNom}</td>
                        <td style={styles.td}><strong>{r.compteur}</strong> <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{unite}</span></td>
                        <td style={styles.td}>{r.commentaire || '-'}</td>
                        <td style={styles.td}>
                          <button
                            onClick={() => setRapportDetail(r)}
                            style={{ ...styles.btnSecondary, display: 'flex', alignItems: 'center', gap: 6 }}
                          >👁️ Voir détails</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{
              marginTop: 14, fontSize: 12, color: 'var(--text-muted)', display: 'flex', gap: 8, alignItems: 'flex-start',
              background: 'var(--bg-table-row-hover)', borderRadius: 12, padding: '10px 14px',
            }}>
              <span>ℹ️</span>
              <span>Chaque vente génère systématiquement <strong>2 bons de retrait</strong> — le compteur du Stockeur ne représente donc pas un nombre de ventes distinctes, mais un nombre d'actions de retrait validées.</span>
            </div>
          </>
        )}
      </div>

      {rapportDetail && (
        <DetailRapportModal rapport={rapportDetail} onClose={() => setRapportDetail(null)} />
      )}
    </div>
  );
}
// ==================== APP CONTENT ====================
function AppContent() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>⏳</div>
          <p style={{ color: 'var(--text-muted)' }}>Chargement...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Login />;
  }
  
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
