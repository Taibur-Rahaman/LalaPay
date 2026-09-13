'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');
const APP_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || (typeof window !== 'undefined' ? window.location.origin : '');

type Link = { id: string; title: string; amount: number; currency: string; status: string; paymentMethods: string[]; createdAt: string; expiresAt?: string | null; description?: string | null };
type Tx = { id: string; provider: string; amount: string | number; currency: string; status: string; provider_transaction_id?: string | null; provider_payment_id?: string | null; payment_link_id?: string; payment_link_title?: string; created_at: string; completed_at?: string | null };
type Stats = { total_links: number; active_links: number; inactive_links: number; total_transactions: number; successful_transactions: number; pending_transactions: number; failed_transactions: number; total_revenue: string | number };
type Pagination = { limit: number; offset: number; count: number };

const statusLabel: Record<string, string> = { ACTIVE: 'Active', INACTIVE: 'Inactive', EXPIRED: 'Expired', SUCCESS: 'Success', PENDING: 'Pending', FAILED: 'Failed', INITIATED: 'Initiated' };

export default function DashboardPage() {
  const router = useRouter();
  const [links, setLinks] = useState<Link[]>([]);
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [merchant, setMerchant] = useState<any>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [txPagination, setTxPagination] = useState<Pagination>({ limit: 20, offset: 0, count: 0 });
  const [txStatus, setTxStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [methods, setMethods] = useState<string[]>(['bkash', 'nagad']);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState('');
  const [busyLink, setBusyLink] = useState('');
  const [selectedTx, setSelectedTx] = useState<Tx | null>(null);
  const [linkFilter, setLinkFilter] = useState('ALL');

  const token = () => typeof window !== 'undefined' ? localStorage.getItem('lalapay_token') : null;

  const api = useCallback(async (path: string, options: RequestInit = {}) => {
    const t = token();
    if (!t) { router.push('/login'); throw new Error('Not signed in'); }
    const response = await fetch(`${API_URL}${path}`, { ...options, headers: { ...(options.headers || {}), Authorization: `Bearer ${t}`, ...(options.body ? { 'Content-Type': 'application/json' } : {}) }, cache: 'no-store' });
    const body = await response.json().catch(() => null);
    if (response.status === 401) { localStorage.removeItem('lalapay_token'); router.push('/login'); throw new Error('Session expired'); }
    if (!response.ok || !body?.success) throw new Error(body?.message || 'Request failed');
    return body;
  }, [router]);

  const load = useCallback(async (showSpinner = false, offset = txPagination.offset, status = txStatus) => {
    if (!API_URL) { setError('API is not configured.'); setLoading(false); return; }
    if (showSpinner) setRefreshing(true);
    try {
      const txQuery = new URLSearchParams({ limit: String(txPagination.limit), offset: String(offset) });
      if (status) txQuery.set('status', status);
      const [me, pl, tx, st] = await Promise.all([api('/api/v1/auth/me'), api('/api/v1/payment-links?limit=50&offset=0'), api(`/api/v1/merchant/transactions?${txQuery}`), api('/api/v1/merchant/stats')]);
      setMerchant(me.data); setLinks(pl.data); setTransactions(tx.data); setStats(st.data); setTxPagination(tx.pagination || { limit: 20, offset, count: tx.data.length });
      setError('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load dashboard.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, [api, txPagination.limit, txPagination.offset, txStatus]);

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function createLink(e: FormEvent) {
    e.preventDefault();
    const parsedAmount = Number(amount);
    if (!title.trim()) return setError('Title is required.');
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return setError('Enter a valid amount greater than 0.');
    if (methods.length === 0) return setError('Select at least one payment method.');
    if (expiresAt && new Date(expiresAt).getTime() <= Date.now()) return setError('Expiry must be in the future.');
    setCreating(true); setError('');
    try {
      await api('/api/v1/payment-links', { method: 'POST', body: JSON.stringify({ title: title.trim(), amount: parsedAmount, currency: 'BDT', description: description.trim() || undefined, expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined, paymentMethods: methods }) });
      setTitle(''); setAmount(''); setDescription(''); setExpiresAt(''); setShowCreate(false); await load(true, 0, txStatus);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not create payment link.'); }
    finally { setCreating(false); }
  }

  async function copyLink(id: string) {
    try { await navigator.clipboard.writeText(`${APP_URL}/pay/${id}`); setCopied(id); setTimeout(() => setCopied(''), 1500); }
    catch { setError('Could not copy the link.'); }
  }

  async function toggleLink(link: Link) {
    if (link.status === 'EXPIRED') return;
    const next = link.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'; setBusyLink(link.id); setError('');
    try { await api(`/api/v1/merchant/payment-links/${link.id}/status`, { method: 'PATCH', body: JSON.stringify({ status: next }) }); await load(true, txPagination.offset, txStatus); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not update payment link.'); }
    finally { setBusyLink(''); }
  }

  function changeTxStatus(status: string) { setTxStatus(status); setTxPagination(p => ({ ...p, offset: 0 })); void load(true, 0, status); }
  function changeTxPage(delta: number) { const next = Math.max(0, txPagination.offset + delta * txPagination.limit); if (next >= txPagination.count && delta > 0) return; setTxPagination(p => ({ ...p, offset: next })); void load(true, next, txStatus); }
  function logout() { localStorage.removeItem('lalapay_token'); router.push('/login'); }

  const visibleLinks = useMemo(() => linkFilter === 'ALL' ? links : links.filter(l => l.status === linkFilter), [links, linkFilter]);

  if (loading) return <main style={shell}><div style={loadingCard}>Loading dashboard…</div></main>;
  return <main style={shell}>
    <header className="lalapay-dashboard-header" style={header}><div><div style={brand}>LalaPay</div><h1 style={h1}>Dashboard</h1><small>{merchant?.name || merchant?.email}</small></div><div style={actions}><button onClick={() => load(true, txPagination.offset, txStatus)} disabled={refreshing} style={secondary}>{refreshing ? 'Refreshing…' : 'Refresh'}</button><button onClick={logout} style={secondary}>Logout</button></div></header>
    {error && <div role="alert" style={alert}>{error}</div>}

    <section className="lalapay-dashboard-grid" style={statsGrid}>
      <Stat label="Total revenue" value={`BDT ${Number(stats?.total_revenue || 0).toLocaleString('en-BD', { minimumFractionDigits: 2 })}`} />
      <Stat label="Successful payments" value={String(stats?.successful_transactions ?? 0)} />
      <Stat label="Pending payments" value={String(stats?.pending_transactions ?? 0)} />
      <Stat label="Payment links" value={String(stats?.total_links ?? links.length)} />
    </section>
    <div style={summary}><span>Transactions: <b>{stats?.total_transactions ?? transactions.length}</b></span><span>Failed: <b>{stats?.failed_transactions ?? 0}</b></span><span>Active: <b>{stats?.active_links ?? 0}</b></span><span>Inactive: <b>{stats?.inactive_links ?? 0}</b></span></div>

    <div className="lalapay-dashboard-toolbar" style={toolbar}><div style={filterGroup}><h2 style={sectionTitle}>Payment links</h2><select aria-label="Filter payment links" value={linkFilter} onChange={e => setLinkFilter(e.target.value)} style={select}><option value="ALL">All</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option><option value="EXPIRED">Expired</option></select></div><button onClick={() => setShowCreate(!showCreate)} style={primary}>{showCreate ? 'Close' : 'Create payment link'}</button></div>
    {showCreate && <form onSubmit={createLink} style={card} noValidate><h3 style={{ margin: 0 }}>New payment link</h3><input aria-label="Title" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} required maxLength={150} style={input} /><input aria-label="Amount in BDT" placeholder="Amount (BDT)" type="number" min="0.01" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required style={input} /><textarea aria-label="Description" placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} maxLength={1000} style={{ ...input, minHeight: 80 }} /><label style={fieldLabel}>Expiry (optional)<input aria-label="Expiry date and time" type="datetime-local" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} style={input} /></label><div style={methodsRow}><label><input type="checkbox" checked={methods.includes('bkash')} onChange={e => setMethods(v => e.target.checked ? [...new Set([...v, 'bkash'])] : v.filter(x => x !== 'bkash'))} /> bKash</label><label><input type="checkbox" checked={methods.includes('nagad')} onChange={e => setMethods(v => e.target.checked ? [...new Set([...v, 'nagad'])] : v.filter(x => x !== 'nagad'))} /> Nagad</label></div><button disabled={creating || methods.length === 0} style={{ ...primary, opacity: creating || methods.length === 0 ? .6 : 1 }}>{creating ? 'Creating…' : 'Create link'}</button></form>}

    <div style={list}>{visibleLinks.map(l => <article key={l.id} style={card}><div className="lalapay-dashboard-linktop" style={linkTop}><div style={{ minWidth: 0 }}><strong style={{ fontSize: 17 }}>{l.title}</strong><div style={amountStyle}>BDT {l.amount.toFixed(2)}</div><small>{l.paymentMethods.join(' + ')} · <span style={badge(l.status)}>{statusLabel[l.status] || l.status}</span>{l.expiresAt && <> · expires {new Date(l.expiresAt).toLocaleString()}</>}</small></div><div className="lalapay-dashboard-actions" style={actions}><button onClick={() => copyLink(l.id)} style={secondary}>{copied === l.id ? 'Copied!' : 'Copy link'}</button><button disabled={busyLink === l.id || l.status === 'EXPIRED'} onClick={() => toggleLink(l)} style={secondary}>{busyLink === l.id ? 'Saving…' : l.status === 'ACTIVE' ? 'Deactivate' : 'Reactivate'}</button></div></div></article>)}{visibleLinks.length === 0 && <div style={card}>No matching payment links.</div>}</div>

    <div className="lalapay-dashboard-toolbar" style={toolbar}><div style={filterGroup}><h2 style={sectionTitle}>Transactions</h2><select aria-label="Filter transactions" value={txStatus} onChange={e => changeTxStatus(e.target.value)} style={select}><option value="">All statuses</option><option value="SUCCESS">Success</option><option value="PENDING">Pending</option><option value="FAILED">Failed</option><option value="INITIATED">Initiated</option></select></div><small>{txPagination.count ? `${txPagination.offset + 1}–${Math.min(txPagination.offset + transactions.length, txPagination.count)} of ${txPagination.count}` : '0 transactions'}</small></div>
    <div style={list}>{transactions.map(t => <button key={t.id} className="lalapay-dashboard-tx" onClick={() => setSelectedTx(t)} style={txRow}><span style={{ textTransform: 'capitalize' }}>{t.provider}</span><strong>BDT {Number(t.amount).toFixed(2)}</strong><span style={badge(t.status)}>{statusLabel[t.status] || t.status}</span><small>{new Date(t.created_at).toLocaleString()}</small></button>)}{transactions.length === 0 && <div style={card}>No transactions yet.</div>}</div>
    <div style={pagination}><button disabled={txPagination.offset === 0 || refreshing} onClick={() => changeTxPage(-1)} style={secondary}>Previous</button><button disabled={refreshing || txPagination.offset + transactions.length >= txPagination.count} onClick={() => changeTxPage(1)} style={secondary}>Next</button></div>

    {selectedTx && <div role="presentation" style={overlay} onClick={() => setSelectedTx(null)}><div role="dialog" aria-modal="true" aria-labelledby="transaction-title" style={modal} onClick={e => e.stopPropagation()}><div style={modalHeader}><h3 id="transaction-title" style={{ margin: 0 }}>Transaction details</h3><button aria-label="Close transaction details" onClick={() => setSelectedTx(null)} style={close}>×</button></div><Detail label="Status" value={statusLabel[selectedTx.status] || selectedTx.status} /><Detail label="Provider" value={selectedTx.provider} /><Detail label="Amount" value={`BDT ${Number(selectedTx.amount).toFixed(2)}`} /><Detail label="Payment link" value={selectedTx.payment_link_title || selectedTx.payment_link_id || '—'} /><Detail label="Payment ID" value={selectedTx.provider_payment_id || '—'} /><Detail label="Transaction ID" value={selectedTx.provider_transaction_id || selectedTx.id} /><Detail label="Created" value={new Date(selectedTx.created_at).toLocaleString()} />{selectedTx.completed_at && <Detail label="Completed" value={new Date(selectedTx.completed_at).toLocaleString()} />}<button onClick={() => setSelectedTx(null)} style={{ ...primary, width: '100%', marginTop: 8 }}>Close</button></div></div>}
  </main>;
}

function Stat({ label, value }: { label: string; value: string }) { return <div style={statCard}><small>{label}</small><strong style={statValue}>{value}</strong></div>; }
function Detail({ label, value }: { label: string; value: string }) { return <div style={detail}><small>{label}</small><span style={{ wordBreak: 'break-word' }}>{value}</span></div>; }
function badge(status: string): React.CSSProperties { return { display: 'inline-block', padding: '3px 8px', borderRadius: 999, background: status === 'SUCCESS' || status === 'ACTIVE' ? '#e8f7ee' : status === 'FAILED' || status === 'INACTIVE' || status === 'EXPIRED' ? '#fff0f0' : '#fff7df', fontWeight: 700, fontSize: 12 }; }

const shell: React.CSSProperties = { minHeight: '100vh', background: '#f6f7f9', padding: '32px max(16px,calc((100vw - 1050px)/2))', fontFamily: 'system-ui' };
const header: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 28 };
const brand: React.CSSProperties = { fontWeight: 900, fontSize: 20 }; const h1: React.CSSProperties = { margin: '5px 0', fontSize: 32 }; const statsGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 12, marginBottom: 14 }; const statCard: React.CSSProperties = { background: '#fff', padding: 18, borderRadius: 16, boxShadow: '0 8px 30px rgba(0,0,0,.05)' }; const statValue: React.CSSProperties = { display: 'block', fontSize: 22, marginTop: 7 }; const summary: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 13, color: '#555', marginBottom: 25 }; const toolbar: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, margin: '25px 0 12px' }; const filterGroup: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }; const sectionTitle: React.CSSProperties = { margin: 0 }; const card: React.CSSProperties = { background: '#fff', padding: 20, borderRadius: 16, boxShadow: '0 8px 30px rgba(0,0,0,.05)', display: 'grid', gap: 12 }; const list: React.CSSProperties = { display: 'grid', gap: 10 }; const linkTop: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }; const actions: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }; const amountStyle: React.CSSProperties = { fontSize: 22, fontWeight: 800, margin: '5px 0' }; const primary: React.CSSProperties = { border: 0, borderRadius: 10, padding: '11px 16px', fontWeight: 800, cursor: 'pointer' }; const secondary: React.CSSProperties = { border: '1px solid #ddd', background: '#fff', borderRadius: 10, padding: '10px 14px', fontWeight: 700, cursor: 'pointer' }; const input: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: 12, border: '1px solid #ddd', borderRadius: 10, fontSize: 15 }; const select: React.CSSProperties = { ...input, width: 'auto', minWidth: 140, padding: '9px 10px', background: '#fff' }; const fieldLabel: React.CSSProperties = { display: 'grid', gap: 6, fontSize: 13, fontWeight: 700 }; const alert: React.CSSProperties = { background: '#fff1f1', color: '#b42318', padding: 12, borderRadius: 10, marginBottom: 15 }; const methodsRow: React.CSSProperties = { display: 'flex', gap: 20 }; const txRow: React.CSSProperties = { background: '#fff', padding: 14, border: 0, borderRadius: 12, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 2fr', gap: 10, alignItems: 'center', textAlign: 'left', cursor: 'pointer' }; const loadingCard: React.CSSProperties = { background: '#fff', padding: 30, borderRadius: 16 }; const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', display: 'grid', placeItems: 'center', padding: 16, zIndex: 10 }; const modal: React.CSSProperties = { background: '#fff', width: 'min(520px,100%)', borderRadius: 18, padding: 22, boxSizing: 'border-box' }; const modalHeader: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }; const close: React.CSSProperties = { border: 0, background: 'transparent', fontSize: 28, cursor: 'pointer' }; const detail: React.CSSProperties = { display: 'grid', gap: 4, padding: '10px 0', borderBottom: '1px solid #eee' }; const pagination: React.CSSProperties = { display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 };

if (typeof document !== 'undefined') { const styleId = 'lalapay-dashboard-responsive'; if (!document.getElementById(styleId)) { const style = document.createElement('style'); style.id = styleId; style.textContent = `@media (max-width:720px){.lalapay-dashboard-grid{grid-template-columns:1fr 1fr!important}.lalapay-dashboard-linktop{flex-direction:column!important;align-items:stretch!important}.lalapay-dashboard-actions{justify-content:stretch!important}.lalapay-dashboard-actions button{flex:1}.lalapay-dashboard-tx{grid-template-columns:1fr 1fr!important}.lalapay-dashboard-tx small{grid-column:1/-1}}@media (max-width:480px){.lalapay-dashboard-grid{grid-template-columns:1fr!important}.lalapay-dashboard-header{align-items:flex-start!important}.lalapay-dashboard-header>div:last-child{flex-wrap:wrap}.lalapay-dashboard-toolbar{align-items:stretch!important;flex-direction:column!important}.lalapay-dashboard-toolbar button{width:100%}.lalapay-dashboard-toolbar select{width:100%}}`; document.head.appendChild(style); } }
