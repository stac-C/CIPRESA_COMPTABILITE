import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownToLine, ArrowUpFromLine, Check, CircleAlert, Download, FilePlus2,
  Paperclip, Plus, Search, Trash2, Upload, X, CheckCircle2, Filter, Calculator,
  RefreshCw, FileText, LockKeyhole, Save, TrendingUp, WalletCards, ReceiptText, Scale, BookOpen,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { accountClasses, chartOfAccounts, fixedAssets, journalEntries, journals, trialBalance } from '../data/accountingData';
import { supabase, supabaseConfigured } from '../lib/supabaseClient';
import ExportDialog from './ExportDialog';

const SECTIONS = [
  ['plan-comptable', 'Plan comptable'], ['journal', 'Journal'], ['grand-livre', 'Grand livre'],
  ['balance', 'Balance'], ['bilan', 'Bilan'], ['compte-resultat', 'Compte de résultat'],
  ['tresorerie', 'Trésorerie'], ['rapprochement', 'Rapprochement'], ['tva-taxes', 'TVA & Taxes'],
  ['immobilisations', 'Immobilisations'], ['clotures', 'Clôtures'],
];

const money = (value) => `${Number(value || 0).toLocaleString('fr-FR')} XAF`;
const today = () => new Date().toISOString().slice(0, 10);
const monthStart = () => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
const localKey = 'cipresa-accounting-drafts';

export default function ComptabiliteWorkspace({ section = 'journal', session, can = () => true, onNavigate }) {
  const normalized = section || 'comptabilite';
  const [current, setCurrent] = useState(normalized);
  const [periodType, setPeriodType] = useState('mensuelle');
  const [period, setPeriod] = useState(today());
  const [filterOpen, setFilterOpen] = useState(false);
  useEffect(() => setCurrent(normalized), [normalized]);

  if (normalized === 'ecritures') return <EntryForm userId={session?.user?.id} onCancel={() => onNavigate?.('journal')} onSaved={() => onNavigate?.('journal')} />;
  if (normalized === 'bilans') return <BilansWorkspace can={can} />;
  if (normalized === 'rapports') return <ReportsWorkspace can={can} />;

  const titles = {
    'plan-comptable': ['Plan comptable', 'Référentiel SYSCOHADA adapté aux opérations CIPRESA.'],
    journal: ['Journal comptable', 'Enregistrez et contrôlez les opérations de l’entreprise.'],
    'grand-livre': ['Grand livre', 'Mouvements détaillés par compte et par période.'],
    balance: ['Balance générale', 'Contrôle global des mouvements et des soldes.'],
    bilan: ['Bilan comptable', 'Synthèse de l’actif et du passif à la date de clôture.'],
    'compte-resultat': ['Compte de résultat', 'Analyse des charges, produits et du résultat de la période.'],
    tresorerie: ['Trésorerie', 'Vision consolidée des comptes caisse, banque et mobile money.'],
    rapprochement: ['Rapprochement bancaire', 'Identifiez les écarts entre la comptabilité et les relevés.'],
    'tva-taxes': ['TVA & Taxes', 'Suivi fiscal adapté au régime comptable de CIPRESA.'],
    immobilisations: ['Immobilisations', 'Registre des biens, mises en service et amortissements.'],
    clotures: ['Clôtures', 'Préparez et sécurisez la clôture des périodes comptables.'],
    'nouveau-compte': ['Nouveau compte comptable', 'Créez un nouveau compte dans le plan comptable SYSCOHADA.'],
    'nouvelle-immobilisation': ['Nouvelle immobilisation', 'Enregistrez un bien durable et son plan d’amortissement.'],
  };

  const navigate = (id) => { setCurrent(id); onNavigate?.(id); };
  return <div className="accounting-page">
    <header className="accounting-header">
      <div><p className="section-kicker">Espace comptable · SYSCOHADA</p><h1>{titles[current]?.[0] || 'Comptabilité'}</h1><p>{titles[current]?.[1]}</p></div>
      <div className="accounting-header-actions">
        <label className="period-control"><span>Type</span><select className="accounting-period" value={periodType} onChange={e => setPeriodType(e.target.value)}><option>journaliere</option><option>hebdomadaire</option><option>mensuelle</option><option>trimestrielle</option><option>annuelle</option><option>pluriannuelle</option></select></label>
        <label className="period-control"><span>Période</span><input className="accounting-period" type="date" value={period} onChange={e => setPeriod(e.target.value)} /></label>
        <button className="outline-button" type="button" onClick={() => setFilterOpen(v => !v)}><Filter size={15}/> Filtres</button>
        {current === 'journal' && <button className="primary-button" type="button" onClick={() => navigate('ecritures')}><Plus size={15}/> Nouvelle écriture</button>}
        {current === 'plan-comptable' && <button className="primary-button" type="button" onClick={() => setCurrent('nouveau-compte')}><Plus size={15}/> Nouveau compte</button>}
        {current === 'bilan' && <button className="primary-button" type="button" onClick={() => navigate('bilans')}><FilePlus2 size={15}/> Générer le bilan</button>}
        {current === 'immobilisations' && <button className="primary-button" type="button" onClick={() => setCurrent('nouvelle-immobilisation')}><Plus size={15}/> Nouvelle immobilisation</button>}
      </div>
    </header>
    {filterOpen && <div className="accounting-filter-row"><span>Filtres actifs :</span><strong>{periodType}</strong><strong>{period}</strong><button className="link-button" type="button" onClick={() => { setPeriodType('mensuelle'); setPeriod(today()); }}>Réinitialiser</button></div>}
    <div className="accounting-tabs">{SECTIONS.map(([id, label]) => <button key={id} onClick={() => navigate(id)} className={current === id ? 'active' : ''}>{label}</button>)}</div>
    {current === 'comptabilite' && <AccountingOverview onNavigate={navigate} can={can} />}
    {current === 'plan-comptable' && <ChartOfAccountsView />}
    {current === 'journal' && <JournalView onNavigate={navigate} />}
    {current === 'nouveau-compte' && <AccountForm onCancel={() => setCurrent('plan-comptable')} onSaved={() => setCurrent('plan-comptable')} />}
    {current === 'grand-livre' && <GeneralLedgerView />}
    {current === 'balance' && <TrialBalanceView />}
    {current === 'bilan' && <BalanceSheetView onNavigate={navigate} />}
    {current === 'compte-resultat' && <IncomeStatementView />}
    {current === 'tresorerie' && <TreasuryView />}
    {current === 'rapprochement' && <ReconciliationView />}
    {current === 'tva-taxes' && <TaxesView />}
    {current === 'immobilisations' && <FixedAssetsView />}
    {current === 'clotures' && <ClosuresView />}
    {current === 'nouvelle-immobilisation' && <AssetForm onCancel={() => setCurrent('immobilisations')} onSaved={() => setCurrent('immobilisations')} />}
  </div>;
}

function SectionCard({ title, description, actions, children, className = '' }) {
  return <section className={`content-panel accounting-card ${className}`}><div className="section-heading"><div><h2>{title}</h2>{description && <p className="panel-description">{description}</p>}</div>{actions}</div>{children}</section>;
}

function AccountingOverview({ onNavigate, can }) {
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
  const parseDate = (value) => {
    const [day, month, year] = String(value || '').split('/');
    return year && month ? { year: Number(year), month: Number(month) - 1 } : null;
  };
  const years = journalEntries.map((entry) => parseDate(entry.date)?.year).filter(Boolean);
  const referenceYear = years.length ? Math.max(...years) : new Date().getFullYear();
  const entriesOfYear = journalEntries.filter((entry) => parseDate(entry.date)?.year === referenceYear);
  const monthly = months.map((month, index) => {
    const rows = entriesOfYear.filter((entry) => parseDate(entry.date)?.month === index);
    return { month, debit: rows.reduce((sum, row) => sum + Number(row.debit || 0), 0), credit: rows.reduce((sum, row) => sum + Number(row.credit || 0), 0), operations: new Set(rows.map((row) => row.number)).size };
  });
  const totalDebit = entriesOfYear.reduce((sum, row) => sum + Number(row.debit || 0), 0);
  const totalCredit = entriesOfYear.reduce((sum, row) => sum + Number(row.credit || 0), 0);
  const expenses = trialBalance.filter((row) => String(row[0]).startsWith('6')).reduce((sum, row) => sum + Number(row[2] || 0), 0);
  const revenue = trialBalance.filter((row) => String(row[0]).startsWith('7')).reduce((sum, row) => sum + Number(row[3] || 0), 0);
  const cash = trialBalance.filter((row) => String(row[0]).startsWith('5')).reduce((sum, row) => sum + Number(row[2] || 0) - Number(row[3] || 0), 0);
  const balanceGap = totalDebit - totalCredit;
  const formatCompact = (value) => `${(Number(value || 0) / 1000000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} M`;
  const kpis = [
    ['Chiffre d’affaires', revenue, 'Produits enregistrés', 'good', TrendingUp],
    ['Charges', expenses, 'Charges constatées', 'warn', ArrowDownToLine],
    ['Trésorerie nette', cash, 'Comptes de classe 5', 'neutral', WalletCards],
    ['Opérations', new Set(entriesOfYear.map((row) => row.number)).size, `${entriesOfYear.length} lignes comptables`, 'neutral', ReceiptText],
    ['Écart de contrôle', Math.abs(balanceGap), balanceGap === 0 ? 'Balance équilibrée' : 'À contrôler', balanceGap === 0 ? 'good' : 'danger', Scale],
    ['Comptes référencés', chartOfAccounts.length, 'Plan comptable visible', 'neutral', BookOpen],
  ];
  const quickActions = [
    ['journal', 'Journal', 'Consulter les écritures'], ['grand-livre', 'Grand livre', 'Suivre les soldes'], ['balance', 'Balance', 'Contrôler les totaux'],
    ['compte-resultat', 'Résultat', 'Comparer produits et charges'], ['tresorerie', 'Trésorerie', 'Voir les disponibilités'], ['rapprochement', 'Rapprochement', 'Traiter les écarts'],
  ];
  return <div className="accounting-overview">
    <section className="content-panel accounting-hero-panel">
      <div><p className="section-kicker">ESPACE COMPTABLE · SYSCOHADA</p><h2>Tableau de bord comptable</h2><p className="panel-description">Retrouvez ici tous les outils de comptabilité de CIPRESA. Chaque module est prêt à être connecté aux données Supabase et aux flux ventes, achats, facturation et trésorerie.</p></div>
      <div className="accounting-quick-actions">
        {can('COMPTA_CREATE') && <button className="primary-button" type="button" onClick={() => onNavigate?.('ecritures')}><Plus size={15}/> Nouvelle écriture</button>}
        {can('COMPTA_PLAN_CREATE') && <button className="outline-button" type="button" onClick={() => onNavigate?.('nouveau-compte')}><Plus size={15}/> Nouveau compte</button>}
      </div>
    </section>
    <section className="accounting-kpi-grid">{kpis.map(([label, value, hint, tone, Icon]) => <article className={`accounting-kpi-card ${tone}`} key={label}><div className="accounting-kpi-icon"><Icon size={17} /></div><div><span>{label}</span><strong>{label === 'Opérations' || label === 'Comptes référencés' ? value.toLocaleString('fr-FR') : formatCompact(value)}{label !== 'Opérations' && label !== 'Comptes référencés' && <small> XAF</small>}</strong><em>{hint}</em></div></article>)}</section>
    <section className="accounting-dashboard-grid">
      <article className="content-panel accounting-dashboard-panel accounting-dashboard-wide"><div className="accounting-dashboard-heading"><div><p className="section-kicker">Performance mensuelle · {referenceYear}</p><h2>Débit et crédit par mois</h2></div><span className={balanceGap === 0 ? 'accounting-status good' : 'accounting-status danger'}>{balanceGap === 0 ? 'Équilibré' : 'À contrôler'}</span></div><div className="accounting-chart"><ResponsiveContainer width="100%" height={270}><LineChart data={monthly}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="month" /><YAxis tickFormatter={formatCompact} /><Tooltip formatter={(value) => `${Number(value).toLocaleString('fr-FR')} XAF`} /><Legend /><Line type="monotone" dataKey="debit" name="Débit" stroke="#0d9488" strokeWidth={3} dot={{ r: 3 }} /><Line type="monotone" dataKey="credit" name="Crédit" stroke="#d97706" strokeWidth={3} dot={{ r: 3 }} /></LineChart></ResponsiveContainer></div></article>
      <article className="content-panel accounting-dashboard-panel"><div className="accounting-dashboard-heading"><div><p className="section-kicker">Structure annuelle</p><h2>Produits et charges</h2></div></div><div className="accounting-chart accounting-pie-chart"><ResponsiveContainer width="100%" height={230}><PieChart><Pie data={[{ name: 'Produits', value: revenue }, { name: 'Charges', value: expenses }]} dataKey="value" nameKey="name" innerRadius={58} outerRadius={84} paddingAngle={4}>{['#0d9488', '#d97706'].map((color) => <Cell key={color} fill={color} />)}</Pie><Tooltip formatter={(value) => `${Number(value).toLocaleString('fr-FR')} XAF`} /><Legend /></PieChart></ResponsiveContainer></div><div className="accounting-result-line"><span>Résultat indicatif</span><strong className={revenue - expenses >= 0 ? 'positive' : 'negative'}>{formatCompact(revenue - expenses)} XAF</strong></div></article>
      <article className="content-panel accounting-dashboard-panel"><div className="accounting-dashboard-heading"><div><p className="section-kicker">Contrôle de période</p><h2>Totaux de la balance</h2></div></div><div className="accounting-control-list"><div><span>Total débit</span><strong>{formatCompact(totalDebit)} XAF</strong></div><div><span>Total crédit</span><strong>{formatCompact(totalCredit)} XAF</strong></div><div><span>Écart constaté</span><strong className={balanceGap === 0 ? 'positive' : 'negative'}>{formatCompact(Math.abs(balanceGap))} XAF</strong></div></div><button className="outline-button accounting-dashboard-link" type="button" onClick={() => onNavigate?.('balance')}>Ouvrir la balance <ArrowDownToLine size={14} /></button></article>
    </section>
    <section className="accounting-module-grid">{quickActions.map(([id, title, description]) => <button key={id} className="accounting-module-card" type="button" onClick={() => onNavigate?.(id)}><span className="module-accent"/><div><strong>{title}</strong><p>{description}</p></div><span className="module-arrow">›</span></button>)}</section>
  </div>;
}

function ChartOfAccountsView() {
  const [query, setQuery] = useState(''); const [nature, setNature] = useState('Tous');
  const [source, setSource] = useState(chartOfAccounts); const [loading, setLoading] = useState(supabaseConfigured); const [notice, setNotice] = useState('');
  useEffect(() => {
    let active = true;
    const localExtra = (() => { try { return JSON.parse(localStorage.getItem('cipresa-chart-accounts') || '[]'); } catch { return []; } })();
    if (!supabaseConfigured) { setSource([...chartOfAccounts, ...localExtra]); setLoading(false); return undefined; }
    supabase.from('comptes_comptables').select('id,numero,libelle,classe,nature,actif').order('numero').then(({ data, error }) => {
      if (!active) return;
      if (error) { setNotice(`Impossible de charger le référentiel : ${error.message}`); setSource([...chartOfAccounts, ...localExtra]); }
      else {
        const databaseRows = (data || []).map(row => ({ code: row.numero, label: row.libelle, nature: row.nature, status: row.actif ? 'Actif' : 'Inactif', usage: row.classe }));
        setSource(databaseRows.length ? databaseRows : [...chartOfAccounts, ...localExtra]);
      }
      setLoading(false);
    });
    return () => { active = false; };
  }, []);
  const rows = source.filter(row => `${row.code} ${row.label}`.toLowerCase().includes(query.toLowerCase()) && (nature === 'Tous' || row.nature === nature));
  return <SectionCard className="reference-card" title="Référentiel comptable" description={`${rows.length} comptes visibles · racines SYSCOHADA conservées`} actions={loading && <span className="panel-description">Synchronisation Supabase…</span>}>
    <div className="toolbar reference-toolbar">
      <div className="search-field"><Search size={15}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Rechercher un compte…" aria-label="Rechercher un compte"/></div>
      <select value={nature} onChange={e => setNature(e.target.value)} aria-label="Filtrer par nature"><option>Tous</option>{[...new Set(source.map(r => r.nature))].map(n => <option key={n}>{n}</option>)}</select>
    </div>
    {notice && <div className="info-strip"><CircleAlert size={15}/>{notice}</div>}
    <div className="table-scroll"><table className="data-table accounting-table reference-table"><thead><tr><th>Compte</th><th>Intitulé</th><th>Nature</th><th>Statut</th><th>Utilisation</th></tr></thead><tbody>{rows.map(row => <tr key={row.code}><td className="code-cell">{row.code}</td><td><strong>{row.label}</strong></td><td>{row.nature}</td><td><span className="badge">{row.status}</span></td><td>{row.usage}</td></tr>)}</tbody></table></div>
  </SectionCard>;
}


function AccountForm({ onCancel, onSaved }) {
  const [form, setForm] = useState({ code:'', label:'', classe:'Classe 4 - Comptes de tiers', nature:'ACTIF', parent:'411000 - Clients ordinaires', currency:'FCFA (XOF)', lettrable:true, reconciliable:false, notes:'', debit:'0', credit:'0' });
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const update = e => setForm(f => ({ ...f, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const emptyForm = () => ({ code:'', label:'', classe:'Classe 4 - Comptes de tiers', nature:'ACTIF', parent:'411000 - Clients ordinaires', currency:'FCFA (XOF)', lettrable:true, reconciliable:false, notes:'', debit:'0', credit:'0' });
  const save = async (createAnother = false) => {
    if (!form.code || !form.label) { setNotice('Le numéro et le libellé du compte sont obligatoires.'); return false; }
    setSaving(true); setNotice('');
    if (supabaseConfigured) {
      const nature = form.nature === 'PASSIF' ? 'PASSIF' : form.nature === 'CHARGE' ? 'CHARGE' : form.nature === 'PRODUIT' ? 'PRODUIT' : 'ACTIF';
      const { error } = await supabase.from('comptes_comptables').insert({ numero: form.code.trim(), libelle: form.label.trim(), classe: form.classe, nature, actif: true });
      if (error) { setSaving(false); setNotice(error.message); return false; }
    } else {
      const rows = JSON.parse(localStorage.getItem('cipresa-chart-accounts') || '[]');
      localStorage.setItem('cipresa-chart-accounts', JSON.stringify([...rows, form]));
    }
    setSaving(false);
    if (createAnother) { setForm(emptyForm()); setNotice('Compte enregistré. Vous pouvez en créer un autre.'); return true; }
    setNotice('Compte enregistré.');
    window.setTimeout(() => onSaved?.(), 350);
    return true;
  };
  return <SectionCard title="Nouveau compte comptable" description="Créez un compte dans votre plan comptable SYSCOHADA." className="account-form-card">
    <div className="form-section-title first">Identification du compte</div>
    <div className="form-grid two-cols">
      <FormField label="Numéro de compte"><input name="code" value={form.code} onChange={update} placeholder="Ex. 411001" /></FormField>
      <FormField label="Libellé du compte"><input name="label" value={form.label} onChange={update} placeholder="Ex. Client - Coopérative Gagnoa" /></FormField>
      <FormField label="Classe de compte"><select name="classe" value={form.classe} onChange={update}>{accountClasses.map(c=><option key={c}>{c}</option>)}</select></FormField>
      <FormField label="Type de compte"><div className="radio-row">{['ACTIF','PASSIF','CHARGE','PRODUIT'].map(type=><label key={type}><input type="radio" name="nature" value={type} checked={form.nature===type} onChange={update}/>{type.charAt(0)+type.slice(1).toLowerCase()}</label>)}</div></FormField>
    </div>
    <div className="form-section-title">Configuration & Propriétés</div>
    <div className="form-grid two-cols">
      <FormField label="Compte parent"><select name="parent" value={form.parent} onChange={update}><option>411000 - Clients ordinaires</option><option>401000 - Fournisseurs</option><option>521000 - Banques</option><option>601000 - Achats</option><option>701000 - Ventes</option></select></FormField>
      <FormField label="Devise"><select name="currency" value={form.currency} onChange={update}><option>FCFA (XOF)</option></select></FormField>
    </div>
    <div className="toggle-grid property-toggles">
      <div className="toggle-option"><button className={form.lettrable?'toggle on':'toggle'} type="button" onClick={()=>setForm(f=>({...f,lettrable:!f.lettrable}))}><span/></button><div><strong>Lettrable</strong><small>Permet d'associer des débits et des crédits</small></div></div>
      <div className="toggle-option"><button className={form.reconciliable?'toggle on':'toggle'} type="button" onClick={()=>setForm(f=>({...f,reconciliable:!f.reconciliable}))}><span/></button><div><strong>Réconciliable</strong><small>Soumis au rapprochement de trésorerie</small></div></div>
    </div>
    <FormField label="Notes / Description"><input name="notes" value={form.notes} onChange={update} placeholder="Ajoutez des détails internes sur l'affectation ou l'usage réglementaire de ce compte..." /></FormField>
    <div className="form-section-title">Solde d'ouverture</div>
    <div className="form-grid two-cols">
      <FormField label="Solde débiteur (FCFA)"><input type="number" min="0" name="debit" value={form.debit} onChange={update} /></FormField>
      <FormField label="Solde créditeur (FCFA)"><input type="number" min="0" name="credit" value={form.credit} onChange={update} /></FormField>
    </div>
    {notice && <div className="info-strip"><CircleAlert size={15}/>{notice}</div>}
    <div className="form-actions"><button className="btn-secondary" type="button" onClick={onCancel}>Annuler</button><button className="outline-button" type="button" disabled={saving} onClick={()=>save(true)}>Enregistrer et créer un autre</button><button className="primary-button" type="button" disabled={saving} onClick={save}>{saving?'Enregistrement…':'Enregistrer le compte'}</button></div>
  </SectionCard>;
}

function JournalView({ onNavigate }) {
  const [query, setQuery] = useState(''); const [journal, setJournal] = useState('Tous');
  const [entries, setEntries] = useState(journalEntries); const [loading, setLoading] = useState(false);
  useEffect(() => { let active = true; if (!supabaseConfigured) return undefined; setLoading(true); supabase.from('ecritures_comptables').select('id,numero,date_ecriture,libelle,reference_piece,statut').order('date_ecriture',{ascending:false}).limit(100).then(({data}) => { if (active && data?.length) setEntries(data.map(e => ({date:e.date_ecriture, number:e.numero, journal:'', label:e.libelle, account:'', debit:0, credit:0, status: e.statut === 'VALIDEE' ? 'Validée' : 'Brouillon'}))); }).finally(() => active && setLoading(false)); return () => { active=false; }; }, []);
  const rows = entries.filter(row => `${row.number} ${row.label} ${row.account}`.toLowerCase().includes(query.toLowerCase()) && (journal === 'Tous' || row.journal === journal));
  const deb = rows.reduce((a,r) => a + Number(r.debit || 0), 0), cred = rows.reduce((a,r) => a + Number(r.credit || 0), 0);
  return <><SectionCard title="Écritures récentes" description="Les schémas et journaux sont alignés sur l’exemple de livre comptable transmis." actions={loading && <span className="panel-description">Actualisation…</span>}>
    <div className="toolbar"><div className="search-field"><Search size={15}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="N° pièce, libellé ou compte…"/></div><select value={journal} onChange={e => setJournal(e.target.value)}><option>Tous</option>{journals.map(j => <option key={j.code}>{j.code}</option>)}</select><button className="primary-button" type="button" onClick={() => onNavigate?.('ecritures')}><FilePlus2 size={14}/> Nouvelle écriture</button></div>
    <div className="table-scroll"><table className="data-table accounting-table"><thead><tr><th>Date</th><th>Pièce</th><th>Journal</th><th>Compte</th><th>Libellé</th><th className="num">Débit</th><th className="num">Crédit</th><th>Statut</th></tr></thead><tbody>{rows.map((r,i) => <tr key={`${r.number}-${i}`}><td>{r.date}</td><td className="code-cell">{r.number}</td><td>{r.journal || '—'}</td><td className="code-cell">{r.account || '—'}</td><td>{r.label}</td><td className="num">{money(r.debit)}</td><td className="num">{money(r.credit)}</td><td><span className="badge">{r.status}</span></td></tr>)}</tbody><tfoot><tr><td colSpan="5">Total affiché</td><td className="num">{money(deb)}</td><td className="num">{money(cred)}</td><td><span className="balanced-badge"><Check size={12}/> {deb === cred ? 'Équilibré' : 'À contrôler'}</span></td></tr></tfoot></table></div>
  </SectionCard><QuickAccountingNote /> </>;
}

function QuickAccountingNote() { return <div className="notice-grid"><div><CheckCircle2 size={17}/><div><strong>Contrôle débit = crédit</strong><span>Chaque écriture validée doit être équilibrée avant comptabilisation définitive.</span></div></div><div><Calculator size={17}/><div><strong>Axes analytiques</strong><span>Site, activité, projet, emplacement et lot sont conservés pour les opérations spécialisées.</span></div></div></div>; }

function EntryForm({ onCancel, onSaved, userId }) {
  const [rows, setRows] = useState([{account:'411100',label:'Client coopérative Boundiali',debit:4200000,credit:0},{account:'701100',label:'Ventes de marchandises de café',debit:0,credit:3500000},{account:'443100',label:'TVA / ajustement commercial',debit:0,credit:700000}]);
  const [date,setDate] = useState(today()); const [journal,setJournal] = useState('VTE-N'); const [piece,setPiece] = useState(`VE-${new Date().getFullYear()}-0001`); const [reference,setReference] = useState(''); const [saving,setSaving] = useState(false); const [notice,setNotice] = useState(''); const [exerciseId,setExerciseId] = useState(''); const [journalId,setJournalId] = useState(''); const [dbJournals,setDbJournals] = useState([]); const [exercises,setExercises] = useState([]);
  useEffect(() => {
    if (!supabaseConfigured) return undefined;
    let active = true;
    Promise.all([supabase.from('exercices_comptables').select('id,code,annee,statut').eq('statut','OUVERT').order('annee',{ascending:false}).limit(1), supabase.from('journaux').select('id,code,libelle').order('code')]).then(([ex,jr]) => { if (!active) return; setExercises(ex.data || []); setDbJournals(jr.data || []); if (ex.data?.[0]) setExerciseId(ex.data[0].id); const selected = jr.data?.find(j => j.code === journal) || jr.data?.[0]; if (selected) { setJournalId(selected.id); setJournal(selected.code); } }).catch(() => {});
    return () => { active = false; };
  }, []);
  const totalDebit = rows.reduce((a,r) => a+Number(r.debit||0),0), totalCredit = rows.reduce((a,r) => a+Number(r.credit||0),0), balanced = totalDebit === totalCredit;
  const updateRow=(i,key,val)=>setRows(current => current.map((r,idx)=>idx===i ? {...r,[key]: key==='debit'||key==='credit'?Number(val):val}:r));
  const save = async (status) => {
    if (!balanced || rows.length < 2) { setNotice('L’écriture doit contenir au moins deux lignes et être équilibrée.'); return; }
    setSaving(true); setNotice('');
    if (supabaseConfigured && (!exerciseId || !journalId)) { setSaving(false); setNotice('Aucun exercice ouvert ou journal Supabase disponible. Vérifiez la configuration comptable.'); return; }
    const payload={numero:piece,date_ecriture:date,libelle:rows[0]?.label || 'Opération comptable',reference_piece:reference || piece,statut:status,exercice_id:exerciseId || null,journal_id:journalId || null,created_by:userId || null};
    let error=null;
    if (supabaseConfigured) {
      const result=await supabase.from('ecritures_comptables').insert(payload).select('id').single();
      error=result.error;
      if (!error && result.data?.id) {
        const accountRows = await supabase.from('comptes_comptables').select('id,numero').in('numero', rows.map(r=>r.account).filter(Boolean));
        if (accountRows.error) error=accountRows.error;
        const accountMap = Object.fromEntries((accountRows.data || []).map(a=>[a.numero,a.id]));
        if (!error) {
          const lines = rows.map(r=>({ecriture_id:result.data.id,compte_id:accountMap[r.account],libelle:r.label,debit:Number(r.debit||0),credit:Number(r.credit||0)}));
          if (lines.some(l=>!l.compte_id)) error={message:'Un ou plusieurs numéros de compte n’existent pas dans le plan comptable Supabase.'};
          else { const lineResult=await supabase.from('lignes_ecritures').insert(lines); error=lineResult.error; }
        }
        if (error) await supabase.from('ecritures_comptables').delete().eq('id',result.data.id);
      }
    } else {
      const drafts=JSON.parse(localStorage.getItem(localKey)||'[]'); localStorage.setItem(localKey,JSON.stringify([...drafts,{...payload,id:`local-${Date.now()}`,lignes:rows}]));
    }
    setSaving(false);
    if(error) { setNotice(error.message); return; }
    setNotice(status==='BROUILLON' ? 'Écriture enregistrée en brouillon.' : 'Écriture transmise pour validation.');
    window.setTimeout(() => onSaved?.(), 350);
  };
  return <SectionCard title="Nouvelle écriture comptable" description="Saisie guidée conforme au Journal et aux schémas d’écritures types." className="entry-form-card"><div className="form-grid four-cols"><FormField label="Date d’écriture"><input type="date" value={date} onChange={e=>setDate(e.target.value)}/></FormField><FormField label="Journal comptable"><select value={journalId || journal} onChange={e=>{const selected=e.target.value; const list=dbJournals.length?dbJournals:journals.map(j=>({id:j.code,code:j.code,label:j.label})); const j=list.find(item=>item.id===selected); setJournalId(selected); setJournal(j?.code || selected);}}>{(dbJournals.length?dbJournals:journals.map(j=>({id:j.code,code:j.code,label:j.label}))).map(j=><option value={j.id} key={j.id}>{j.code} — {j.libelle || j.label}</option>)}</select></FormField><FormField label="N° de pièce"><input value={piece} onChange={e=>setPiece(e.target.value)}/></FormField><FormField label="Référence externe"><input value={reference} onChange={e=>setReference(e.target.value)} placeholder="Facture COOP-88"/></FormField></div>{supabaseConfigured && <div className="accounting-context-row"><span>Exercice ouvert</span><strong>{exercises[0] ? `${exercises[0].code} · ${exercises[0].annee}` : 'Non disponible'}</strong></div>}<div className="form-status-row"><span className={balanced?'balanced-badge':'warning-badge'}>{balanced?<><Check size={13}/> Écriture équilibrée</>:<><CircleAlert size={13}/> Écart à contrôler</>}</span></div><div className="entry-table-wrapper"><table className="data-table accounting-table entry-table"><thead><tr><th>N° compte</th><th>Libellé de l’écriture</th><th className="num">Débit (XAF)</th><th className="num">Crédit (XAF)</th><th></th></tr></thead><tbody>{rows.map((row,i)=><tr key={i}><td><input value={row.account} onChange={e=>updateRow(i,'account',e.target.value)} /></td><td><input value={row.label} onChange={e=>updateRow(i,'label',e.target.value)} /></td><td className="num"><input type="number" value={row.debit} onChange={e=>updateRow(i,'debit',e.target.value)} /></td><td className="num"><input type="number" value={row.credit} onChange={e=>updateRow(i,'credit',e.target.value)} /></td><td><button className="icon-danger" type="button" onClick={()=>setRows(current=>current.filter((_,idx)=>idx!==i))}><Trash2 size={15}/></button></td></tr>)}</tbody><tfoot><tr><td colSpan="2">Total général</td><td className="num">{money(totalDebit)}</td><td className="num">{money(totalCredit)}</td><td></td></tr></tfoot></table></div><button className="add-line" type="button" onClick={()=>setRows(current=>[...current,{account:'',label:'',debit:0,credit:0}])}><Plus size={14}/> Ajouter une ligne</button><div className="attachment-box"><div className="upload-drop"><Upload size={22}/><strong>Glissez-déposez une pièce justificative</strong><span>PDF, PNG ou JPEG jusqu’à 10 MB</span></div><div className="file-row"><Paperclip size={15}/><span>Facture_Boundiali_88.pdf</span><small>1.2 MB</small><X size={14}/></div></div>{notice && <div className="info-strip"><CircleAlert size={15}/>{notice}</div>}<div className="form-actions"><button className="btn-secondary" type="button" onClick={onCancel}>Annuler</button><button className="outline-button" type="button" disabled={saving} onClick={()=>save('BROUILLON')}><Save size={14}/> Brouillon</button><button className="primary-button" type="button" disabled={saving} onClick={()=>save('BROUILLON')}>{saving?'Enregistrement…':'Enregistrer'}</button></div></SectionCard>;
}

function EntriesWorkspace({ can, userId }) {
  const [entries,setEntries]=useState([]), [exercises,setExercises]=useState([]), [journalsDb,setJournalsDb]=useState([]), [form,setForm]=useState({numero:'',exercice_id:'',journal_id:'',date_ecriture:today(),libelle:'',reference_piece:''}), [loading,setLoading]=useState(true), [saving,setSaving]=useState(false), [message,setMessage]=useState('');
  const loadData=async()=>{if(!supabaseConfigured){const local=JSON.parse(localStorage.getItem(localKey)||'[]');setEntries(local);setExercises([]);setJournalsDb([]);setLoading(false);return;} setLoading(true);const [a,b,c]=await Promise.all([supabase.from('ecritures_comptables').select('id,numero,exercice_id,journal_id,date_ecriture,libelle,reference_piece,statut').order('date_ecriture',{ascending:false}).limit(50),supabase.from('exercices_comptables').select('id,code,annee,statut').order('annee',{ascending:false}),supabase.from('journaux').select('id,code,libelle').order('code')]);setEntries(a.data||[]);setExercises(b.data||[]);setJournalsDb(c.data||[]);setMessage(a.error?.message||b.error?.message||c.error?.message||'');setLoading(false);};
  useEffect(()=>{loadData();},[]);
  const update=e=>setForm(f=>({...f,[e.target.name]:e.target.value}));
  const createEntry=async e=>{e.preventDefault();setSaving(true);setMessage('');if(!form.numero||!form.exercice_id||!form.journal_id||!form.libelle){setSaving(false);setMessage('Complétez les champs obligatoires.');return;} if(!supabaseConfigured){const local=[...entries,{...form,id:`local-${Date.now()}`,statut:'BROUILLON'}];setEntries(local);localStorage.setItem(localKey,JSON.stringify(local));setMessage('Écriture créée en brouillon (mode démo).');setForm({...form,numero:'',libelle:'',reference_piece:''});setSaving(false);return;}const {error}=await supabase.from('ecritures_comptables').insert({...form,created_by:userId||null,statut:'BROUILLON'});setSaving(false);if(error){setMessage(error.message);return;}setMessage('Écriture créée en brouillon.');setForm({...form,numero:'',libelle:'',reference_piece:''});loadData();};
  const validate=async id=>{if(!supabaseConfigured){setEntries(current=>current.map(e=>e.id===id?{...e,statut:'VALIDEE'}:e));setMessage('Écriture validée (mode démo).');return;}const {error}=await supabase.from('ecritures_comptables').update({statut:'VALIDEE',validated_by:userId||null,validated_at:new Date().toISOString()}).eq('id',id).eq('statut','BROUILLON');if(error)setMessage(error.message);else{setMessage('Écriture validée.');loadData();}};
  return <div className="accounting-workspace"><SectionCard title="Saisie d’une écriture comptable" description="La nouvelle écriture est créée en brouillon pour permettre le contrôle avant validation."><form className="accounting-form" onSubmit={createEntry}><FormField label="Numéro de l’écriture"><input name="numero" value={form.numero} onChange={update} placeholder="EC-2026-001" required/></FormField><FormField label="Exercice comptable"><select name="exercice_id" value={form.exercice_id} onChange={update} required><option value="">Choisir un exercice</option>{(exercises.length?exercises:[{id:'demo-ex',code:'EX-2025',annee:2025,statut:'OUVERT'}]).map(i=><option key={i.id} value={i.id}>{i.code} · {i.annee} ({i.statut})</option>)}</select></FormField><FormField label="Journal"><select name="journal_id" value={form.journal_id} onChange={update} required><option value="">Choisir un journal</option>{(journalsDb.length?journalsDb:journals.map(j=>({id:j.code,code:j.code,libelle:j.label}))).map(i=><option key={i.id} value={i.id}>{i.code} · {i.libelle}</option>)}</select></FormField><FormField label="Date"><input type="date" name="date_ecriture" value={form.date_ecriture} onChange={update} required/></FormField><FormField label="Libellé"><input name="libelle" value={form.libelle} onChange={update} placeholder="Achat de fournitures" required/></FormField><FormField label="Référence pièce"><input name="reference_piece" value={form.reference_piece} onChange={update} placeholder="FAC-2026-014"/></FormField><button className="primary-button" disabled={saving}>{saving?'Création…':'Créer l’écriture en brouillon'}</button></form>{message&&<div className="info-strip"><CircleAlert size={15}/>{message}</div>}</SectionCard><SectionCard title="Journal des écritures" description="Consultez les écritures récentes et validez les brouillons après contrôle." actions={<span className="record-count">{entries.length} affichée{entries.length>1?'s':''}</span>}>{loading?<p className="empty">Chargement des écritures...</p>:<div className="table-scroll"><table className="data-table"><thead><tr><th>Numéro</th><th>Date</th><th>Libellé</th><th>Statut</th><th>Action</th></tr></thead><tbody>{entries.map(e=><tr key={e.id}><td>{e.numero}</td><td>{e.date_ecriture}</td><td>{e.libelle}</td><td>{e.statut}</td><td>{can('COMPTA_VALIDATE')&&e.statut==='BROUILLON'&&<button className="link-button" type="button" onClick={()=>validate(e.id)}>Valider</button>}</td></tr>)}</tbody></table></div>}</SectionCard></div>;
}

function BilansWorkspace({ can }) {
  const [rows,setRows]=useState([]), [exercises,setExercises]=useState([]), [form,setForm]=useState({exercice_id:'',periode_type:'mensuelle',periode_debut:monthStart(),periode_fin:today(),total_actif:'0',total_passif:'0',resultat:'0'}), [message,setMessage]=useState('');
  const load=async()=>{if(!supabaseConfigured){setRows([]);setExercises([{id:'demo-ex',code:'EX-2025',annee:2025,statut:'OUVERT'}]);return;}const [a,b]=await Promise.all([supabase.from('bilans').select('id,exercice_id,date_generation,total_actif,total_passif,resultat,statut').order('date_generation',{ascending:false}),supabase.from('exercices_comptables').select('id,code,annee').order('annee',{ascending:false})]);setRows(a.data||[]);setExercises(b.data||[]);if(a.error||b.error)setMessage((a.error||b.error).message);};useEffect(()=>{load();},[]);const update=e=>setForm(f=>({...f,[e.target.name]:e.target.value}));const generate=async e=>{e.preventDefault();if(!can('BILAN_GENERATE'))return;const payload={...form,date_generation:today(),statut:'GENERE'};if(!supabaseConfigured){setRows(r=>[{id:`local-${Date.now()}`,...payload},...r]);setMessage(`Bilan ${form.periode_type} généré en mode démo.`);return;}const {error}=await supabase.from('bilans').insert(payload);if(error)setMessage(error.message);else{setMessage(`Bilan ${form.periode_type} généré.`);load();}};
  return <div className="accounting-workspace"><SectionCard className="balance-prep-panel" title="Préparer le bilan avant génération officielle" description="Choisissez la période et contrôlez les montants avant génération."><form className="accounting-form bilan-form"><FormField label="Type de période"><select name="periode_type" value={form.periode_type} onChange={update}><option>journaliere</option><option>hebdomadaire</option><option>mensuelle</option><option>trimestrielle</option><option>annuelle</option><option>pluriannuelle</option></select></FormField><FormField label="Début"><input type="date" name="periode_debut" value={form.periode_debut} onChange={update}/></FormField><FormField label="Fin"><input type="date" name="periode_fin" value={form.periode_fin} onChange={update}/></FormField><FormField label="Exercice"><select name="exercice_id" value={form.exercice_id} onChange={update}><option value="">Choisir</option>{exercises.map(i=><option key={i.id} value={i.id}>{i.code} · {i.annee}</option>)}</select></FormField><FormField label="Total actif"><input type="number" name="total_actif" value={form.total_actif} onChange={update}/></FormField><FormField label="Total passif"><input type="number" name="total_passif" value={form.total_passif} onChange={update}/></FormField><FormField label="Résultat"><input type="number" name="resultat" value={form.resultat} onChange={update}/></FormField><button className="primary-button billing-generate-button" type="button" onClick={generate}>Générer le bilan</button></form>{message&&<div className="info-strip"><CircleAlert size={15}/>{message}</div>}</SectionCard><SectionCard className="generated-balance-panel" title="Bilans générés" description="Historique des états générés.">{rows.length===0?<p className="empty">Aucun bilan généré.</p>:<div className="table-scroll"><table className="data-table"><thead><tr><th>Date</th><th>Actif</th><th>Passif</th><th>Résultat</th><th>Statut</th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td>{r.date_generation}</td><td>{money(r.total_actif)}</td><td>{money(r.total_passif)}</td><td>{money(r.resultat)}</td><td>{r.statut}</td></tr>)}</tbody></table></div>}</SectionCard></div>;
}

function ReportsWorkspace({ can }) {
  const [rows,setRows]=useState([]), [form,setForm]=useState({reference:'',nom:'',date_debut:monthStart(),date_fin:today(),solde_initial:'0',total_entrees:'0',total_sorties:'0',solde_final:'0'}), [message,setMessage]=useState('');
  const load=async()=>{if(!supabaseConfigured){setRows(JSON.parse(localStorage.getItem('cipresa-reports')||'[]'));return;}const result=await supabase.from('rapports_financiers').select('id,reference,nom,date_debut,date_fin,solde_initial,total_entrees,total_sorties,solde_final,statut').order('created_at',{ascending:false});setRows(result.data||[]);if(result.error)setMessage(result.error.message);};useEffect(()=>{load();},[]);const update=e=>setForm(f=>({...f,[e.target.name]:e.target.value}));const create=async e=>{e.preventDefault();if(!can('RAPPORT_CREATE'))return;if(!supabaseConfigured){const local={...form,id:`local-${Date.now()}`,statut:'BROUILLON'};const next=[local,...rows];setRows(next);localStorage.setItem('cipresa-reports',JSON.stringify(next));setMessage('Rapport créé en mode démo.');return;}const {error}=await supabase.from('rapports_financiers').insert({...form,statut:'BROUILLON'});if(error)setMessage(error.message);else{setMessage('Rapport créé.');load();}};
  return <div className="accounting-workspace"><SectionCard title="Création d’un rapport financier" description="Définissez la période, le nom du rapport et les soldes de suivi."><form className="accounting-form" onSubmit={create}><FormField label="Référence"><input name="reference" value={form.reference} onChange={update} required placeholder="RPT-2026-001"/></FormField><FormField label="Nom"><input name="nom" value={form.nom} onChange={update} required placeholder="Suivi de trésorerie"/></FormField><FormField label="Début"><input type="date" name="date_debut" value={form.date_debut} onChange={update}/></FormField><FormField label="Fin"><input type="date" name="date_fin" value={form.date_fin} onChange={update}/></FormField><FormField label="Solde initial"><input type="number" name="solde_initial" value={form.solde_initial} onChange={update}/></FormField><FormField label="Total entrées"><input type="number" name="total_entrees" value={form.total_entrees} onChange={update}/></FormField><FormField label="Total sorties"><input type="number" name="total_sorties" value={form.total_sorties} onChange={update}/></FormField><FormField label="Solde final"><input type="number" name="solde_final" value={form.solde_final} onChange={update}/></FormField><button className="primary-button">Créer le rapport</button></form>{message&&<div className="info-strip"><CircleAlert size={15}/>{message}</div>}</SectionCard><SectionCard title="Rapports disponibles" description="Historique des rapports financiers."><div className="table-scroll"><table className="data-table"><thead><tr><th>Référence</th><th>Nom</th><th>Période</th><th>Solde final</th><th>Statut</th></tr></thead><tbody>{rows.map(r=><tr key={r.id}><td>{r.reference}</td><td>{r.nom}</td><td>{r.date_debut} → {r.date_fin}</td><td>{money(r.solde_final)}</td><td>{r.statut}</td></tr>)}</tbody></table></div></SectionCard></div>;
}

function GeneralLedgerView(){const [account,setAccount]=useState('411100');const [exportOpen,setExportOpen]=useState(false);const rows=journalEntries.filter(r=>r.account===account);let balance=0;const exportRows=rows.map(r=>{balance += r.debit-r.credit;return {date:r.date,number:r.number,label:r.label,debit:r.debit,credit:r.credit,balance};});const columns=[{key:'date',label:'Date'},{key:'number',label:'Pièce'},{key:'label',label:'Libellé'},{key:'debit',label:'Débit (XAF)'},{key:'credit',label:'Crédit (XAF)'},{key:'balance',label:'Solde (XAF)'}];return <SectionCard className="ledger-panel" title="Grand livre — comptes mouvementés" description="Vue chronologique par compte, avec solde progressif."><div className="toolbar ledger-toolbar"><select value={account} onChange={e=>setAccount(e.target.value)}>{['411100','401101','701100','601101'].map(a=><option key={a}>{a}</option>)}</select><button className="outline-button" type="button" onClick={()=>setExportOpen(true)}><Download size={14}/> Exporter</button></div><div className="ledger-summary"><div><span>Compte sélectionné</span><strong>{account}</strong></div><div><span>Solde d’ouverture</span><strong>0 XAF</strong></div><div><span>Solde courant</span><strong>{money(rows.reduce((a,r)=>a+r.debit-r.credit,0))}</strong></div></div><div className="table-scroll"><table className="data-table accounting-table"><thead><tr><th>Date</th><th>Pièce</th><th>Libellé</th><th className="num">Débit</th><th className="num">Crédit</th><th className="num">Solde</th></tr></thead><tbody>{rows.map((r,i)=>{const row=exportRows[i];return <tr key={i}><td>{r.date}</td><td className="code-cell">{r.number}</td><td>{r.label}</td><td className="num">{money(r.debit)}</td><td className="num">{money(r.credit)}</td><td className="num">{money(row.balance)}</td></tr>})}</tbody></table></div>{exportOpen&&<ExportDialog title={`Grand livre — compte ${account}`} columns={columns} rows={exportRows} onClose={()=>setExportOpen(false)}/>}</SectionCard>}
function TrialBalanceView(){const rows=trialBalance;const debit=rows.reduce((a,r)=>a+r[2],0),credit=rows.reduce((a,r)=>a+r[3],0);return <SectionCard title="Balance générale" description="Balance synthétique des comptes sélectionnés."><div className="kpi-strip"><Kpi label="Total débit" value={money(debit)}/><Kpi label="Total crédit" value={money(credit)}/><Kpi label="Écart" value={money(debit-credit)} tone={debit===credit?'good':'warn'}/></div><div className="table-scroll"><table className="data-table accounting-table"><thead><tr><th>Compte</th><th>Intitulé</th><th className="num">Débit</th><th className="num">Crédit</th><th className="num">Solde</th></tr></thead><tbody>{rows.map(r=><tr key={r[0]}><td className="code-cell">{r[0]}</td><td>{r[1]}</td><td className="num">{money(r[2])}</td><td className="num">{money(r[3])}</td><td className="num">{money(r[2]-r[3])}</td></tr>)}</tbody></table></div></SectionCard>}
function BalanceSheetView({onNavigate}){return <div className="two-column-report"><SectionCard title="Actif" description="Emplois et ressources détenus par l’entreprise."><ReportRow label="Immobilisations incorporelles" value={3500000}/><ReportRow label="Immobilisations corporelles" value={20600000}/><ReportRow label="Créances clients" value={4200000}/><ReportRow label="Banque et trésorerie" value={15000000}/><ReportTotal value={43200000}/></SectionCard><SectionCard title="Passif" description="Capitaux propres et dettes."><ReportRow label="Capital social" value={50000000}/><ReportRow label="Fournisseurs" value={1250000}/><ReportRow label="Personnel" value={12400000}/><ReportRow label="Avances clients" value={15000000}/><ReportTotal value={78650000}/><div className="report-warning"><CircleAlert size={15}/> Démo : lancez la génération officielle pour enregistrer un bilan en base.</div><button className="outline-button" type="button" onClick={()=>onNavigate?.('bilans')}>Gérer les bilans</button></SectionCard></div>}
function IncomeStatementView(){return <div className="two-column-report"><SectionCard title="Produits"><ReportRow label="Ventes de marchandises" value={3500000}/><ReportRow label="Prestations plantation / irrigation" value={4200000}/><ReportRow label="Production stockée" value={1500000}/><ReportTotal value={9200000}/></SectionCard><SectionCard title="Charges"><ReportRow label="Achats de marchandises" value={1250000}/><ReportRow label="Rémunérations" value={12400000}/><ReportRow label="Loyers et sous-traitance" value={2250000}/><ReportRow label="Dotations aux amortissements" value={700000}/><ReportTotal value={16600000}/><div className="result-badge negative">Résultat indicatif : {money(-7400000)}</div></SectionCard></div>}
function TreasuryView(){const accounts=[['521000','Banque',15000000],['551000','Caisse Nomayos',2500000],['552101','MTN Mobile Money',1200000],['552102','Orange Money',900000]];return <SectionCard title="Positions de trésorerie"><div className="kpi-strip">{accounts.map(a=><Kpi key={a[0]} label={a[1]} value={money(a[2])}/>)}</div><div className="table-scroll"><table className="data-table accounting-table"><thead><tr><th>Compte</th><th>Libellé</th><th className="num">Solde</th><th>Dernier mouvement</th></tr></thead><tbody>{accounts.map(a=><tr key={a[0]}><td className="code-cell">{a[0]}</td><td>{a[1]}</td><td className="num">{money(a[2])}</td><td>15/10/2025</td></tr>)}</tbody></table></div></SectionCard>}
function ReconciliationView(){const [items,setItems]=useState([['BQ-2025-0312','Virement Ministère Agriculture','15 000 000','Rapproché'],['CAI-O-1022','Encaissement comptoir Otele','850 000','À contrôler'],['MM-MTN-2205','Commission MTN','25 000','Écart']]);const [message,setMessage]=useState('');const pendingCount=items.filter(item=>item[3]!=='Rapproché').length;function reconcile(){if(!pendingCount)return;setItems(current=>current.map(item=>item[3]==='Rapproché'?item:[item[0],item[1],item[2],'Rapproché']));setMessage(`${pendingCount} opération${pendingCount>1?'s':''} rapprochée${pendingCount>1?'s':''} avec succès.`);}return <SectionCard title="Rapprochement bancaire" description="Contrôle entre relevés et écritures internes." actions={<button className="outline-button" type="button" onClick={reconcile} disabled={!pendingCount}><RefreshCw size={14}/> {pendingCount?'Rapprocher':'Tout est rapproché'}</button>}><div className="reconciliation-summary"><span>{pendingCount} opération{pendingCount>1?'s':''} à contrôler</span>{message&&<strong>{message}</strong>}</div><div className="table-scroll"><table className="data-table accounting-table"><thead><tr><th>Référence</th><th>Libellé</th><th className="num">Montant</th><th>État</th></tr></thead><tbody>{items.map((r,i)=><tr key={i}><td className="code-cell">{r[0]}</td><td>{r[1]}</td><td className="num">{r[2]} XAF</td><td><span className={`badge ${r[3]==='Rapproché'?'badge-validée':'badge-brouillon'}`}>{r[3]}</span></td></tr>)}</tbody></table></div></SectionCard>}
function TaxesView(){return <SectionCard title="TVA & Taxes" description="Le livre comptable transmis indique un démarrage sans TVA collectée/déductible : les contrôles restent paramétrables."><div className="tax-banner"><CircleAlert size={17}/><div><strong>Régime actuel</strong><span>Pas de comptes 445 collectés/déductibles dans les schémas de démarrage.</span></div></div><div className="kpi-strip"><Kpi label="Taxes à décaisser" value={money(0)}/><Kpi label="Taxes à contrôler" value={money(0)}/><Kpi label="Déclarations en cours" value="0"/></div><div className="table-scroll"><table className="data-table accounting-table"><thead><tr><th>Type</th><th>Période</th><th>Base</th><th className="num">Montant</th><th>Statut</th></tr></thead><tbody><tr><td>TVA</td><td>T3 2025</td><td>Sans TVA collectée/déductible</td><td className="num">0 XAF</td><td><span className="badge badge-validée">Conforme</span></td></tr><tr><td>Retenues prestataires</td><td>Octobre 2025</td><td>Sous-traitance</td><td className="num">Selon justificatifs</td><td><span className="badge badge-brouillon">À contrôler</span></td></tr></tbody></table></div></SectionCard>}
function FixedAssetsView(){return <SectionCard title="Registre des immobilisations" description="Biens durables, mise en service et amortissement."><div className="table-scroll"><table className="data-table accounting-table"><thead><tr><th>Code</th><th>Immobilisation</th><th>Catégorie</th><th>Date</th><th className="num">Valeur</th><th>Durée</th><th>Méthode</th><th>Statut</th></tr></thead><tbody>{fixedAssets.map(a=><tr key={a.code}><td className="code-cell">{a.code}</td><td>{a.label}</td><td>{a.category}</td><td>{a.date}</td><td className="num">{money(a.amount)}</td><td>{a.life} ans</td><td>{a.method}</td><td><span className="badge badge-validée">{a.status}</span></td></tr>)}</tbody></table></div></SectionCard>}
function AssetForm({onCancel,onSaved}){const [form,setForm]=useState({code:'',label:'',category:'Corporelle',date:today(),amount:'0',life:'5',method:'Linéaire'});const update=e=>setForm(f=>({...f,[e.target.name]:e.target.value}));const save=()=>{const item={...form,amount:Number(form.amount),life:Number(form.life),status:'En service'};const existing=JSON.parse(localStorage.getItem('cipresa-assets')||'[]');localStorage.setItem('cipresa-assets',JSON.stringify([...existing,item]));onSaved?.();};return <SectionCard title="Nouvelle immobilisation" description="Enregistrez l’acquisition, la mise en service et le plan d’amortissement du bien."><div className="form-grid two-cols">{[['code','Code immobilisation','text'],['label','Libellé','text'],['category','Catégorie','select'],['date','Date d’acquisition','date'],['amount','Valeur d’acquisition (XAF)','number'],['life','Durée d’utilisation (années)','number'],['method','Méthode','select']].map(([name,label,type])=><FormField key={name} label={label}>{type==='select'?<select name={name} value={form[name]} onChange={update}>{name==='category'?<><option>Incorporelle</option><option>Corporelle</option></>:<><option>Linéaire</option><option>Dégressive</option></>}</select>:<input name={name} type={type} value={form[name]} onChange={update}/>}</FormField>)}</div><div className="form-actions"><button className="btn-secondary" type="button" onClick={onCancel}>Annuler</button><button className="primary-button" type="button" onClick={save}>Enregistrer l’immobilisation</button></div></SectionCard>}
function ClosuresView(){const [checks,setChecks]=useState({balance:false,bank:false,taxes:false});const ready=Object.values(checks).every(Boolean);return <SectionCard className="closure-panel" title="Clôtures comptables" description="Sécurisez les contrôles avant de fermer une période."><div className="closure-checklist">{[['balance','Balance contrôlée'],['bank','Rapprochement bancaire contrôlé'],['taxes','Taxes contrôlées']].map(([id,label])=><button type="button" key={id} className={`closure-checkline ${checks[id]?'is-checked':''}`} onClick={()=>setChecks(c=>({...c,[id]:!c[id]}))}><span className="closure-checkbox">{checks[id] && <Check size={12}/>}</span><span className="closure-checktext"><strong>{label}</strong><small>{checks[id]?'Validé':'À contrôler'}</small></span></button>)}</div><div className="closure-list"><ClosureRow period="Septembre 2025" status="Clôturée" done/><ClosureRow period="Octobre 2025" status={ready?'Prêt à clôturer':'Contrôles en cours'}/><ClosureRow period="Exercice 2025" status="Pré-clôture"/></div></SectionCard>}
function ClosureRow({period,status,done}){return <div className={`closure-row ${done?'is-done':''}`}><div className="closure-icon">{done?<Check size={15}/>:<LockKeyhole size={14}/>}</div><div className="closure-meta"><strong>{period}</strong><span>{status}</span></div><button className="outline-button" type="button">{done?'Consulter':'Préparer'}</button></div>}
function ReportRow({label,value}){return <div className="report-row"><span>{label}</span><strong>{money(value)}</strong></div>}
function ReportTotal({value}){return <div className="report-total"><span>Total</span><strong>{money(value)}</strong></div>}
function Kpi({label,value,tone}){return <div className={`kpi-card-mini ${tone||''}`}><span>{label}</span><strong>{value}</strong></div>}
function FormField({label,children}){return <label className="form-field"><span>{label}</span>{children}</label>}
