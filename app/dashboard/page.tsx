'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://lalapay-api.vercel.app').replace(/\/$/, '');
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://lalapay.vercel.app').replace(/\/$/, '') || (typeof window !== 'undefined' ? window.location.origin : '');

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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [linkStatus, setLinkStatus] = useState('ALL');
  const [txStatus, setTxStatus] = useState('ALL');
  const [txPagination, setTxPagination] = useState<Pagination>({ limit: 20, offset: 0, count: 0 });
  const [selectedTx, setSelectedTx] = useState<Tx | null>(null);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [methods, setMethods] = useState<string[]>(['bkash', 'nagad']);

  const token = typeof window !== 'undefined' ? localStorage.getItem('lalapay_token') : null;
  const headers = useMemo(() => token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }, [token]);

  const load = useCallback(async (withSpinner = true, offset = txPagination.offset, status = txStatus) => {
    if (withSpinner) setLoading(true); setError('');
    if (!token) { router.push('/login'); return; }
    try {
      const qs = new URLSearchParams({ limit: '50', offset: '0' });
      const txQs = new URLSearchParams({ limit: String(txPagination.limit), offset: String(offset) });
      if (status !== 'ALL') txQs.set('status', status);
      const [me, linksRes, statsRes, txRes] = await Promise.all([
        fetch(`${API_URL}/api/v1/auth/me`, { headers }),
        fetch(`${API_URL}/api/v1/payment-links?${qs}`, { headers }),
        fetch(`${API_URL}/api/v1/merchant/stats`, { headers }),
        fetch(`${API_URL}/api/v1/merchant/transactions?${txQs}`, { headers })
      ]);
      if ([me, linksRes, statsRes, txRes].some(r => r.status === 401)) { localStorage.removeItem('lalapay_token'); router.push('/login'); return; }
      const [meBody, linksBody, statsBody, txBody] = await Promise.all([me.json(), linksRes.json(), statsRes.json(), txRes.json()]);
      if (!meBody.success) throw new Error(meBody.message || 'Unable to load merchant.');
      if (!linksBody.success) throw new Error(linksBody.message || 'Unable to load payment links.');
      if (!statsBody.success) throw new Error(statsBody.message || 'Unable to load stats.');
      if (!txBody.success) throw new Error(txBody.message || 'Unable to load transactions.');
      setMerchant(meBody.merchant); setLinks(linksBody.data || []); setStats(statsBody.data || null); setTransactions(txBody.data || []); setTxPagination(txBody.pagination || { limit: txPagination.limit, offset, count: (txBody.data || []).length });
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to load dashboard.'); }
    finally { if (withSpinner) setLoading(false); }
  }, [headers, router, token, txPagination.limit, txPagination.offset, txStatus]);

  useEffect(() => { void load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  async function createLink(event: FormEvent) {
    event.preventDefault(); setCreating(true); setError('');
    const numericAmount = Number(amount);
    if (!title.trim() || !Number.isFinite(numericAmount) || numericAmount <= 0 || Math.round(numericAmount * 100) !== numericAmount * 100) { setError('Enter a valid title and amount.'); setCreating(false); return; }
    if (!methods.length) { setError('Select at least one payment method.'); setCreating(false); return; }
    try {
      const response = await fetch(`${API_URL}/api/v1/payment-links`, { method: 'POST', headers, body: JSON.stringify({ title: title.trim(), amount: numericAmount, currency: 'BDT', description: description.trim() || undefined, expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined, paymentMethods: methods }) });
      const body = await response.json(); if (!response.ok || !body.success) throw new Error(body.message || 'Could not create payment link.');
      setTitle(''); setAmount(''); setDescription(''); setExpiresAt(''); setMethods(['bkash', 'nagad']); await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not create payment link.'); } finally { setCreating(false); }
  }

  async function toggleLink(id: string, status: string) {
    try { const response = await fetch(`${API_URL}/api/v1/merchant/payment-links/${id}/status`, { method: 'PATCH', headers, body: JSON.stringify({ status }) }); const body = await response.json(); if (!response.ok || !body.success) throw new Error(body.message || 'Could not update link.'); await load(false); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not update link.'); }
  }

  function copyLink(id: string) { const url = `${APP_URL}/pay/${id}`; void navigator.clipboard?.writeText(url); }
  function changeTxStatus(status: string) { setTxStatus(status); void load(true, 0, status); }
  function nextPage() { if (txPagination.offset + txPagination.limit < txPagination.count) void load(true, txPagination.offset + txPagination.limit, txStatus); }
  function previousPage() { if (txPagination.offset > 0) void load(true, Math.max(0, txPagination.offset - txPagination.limit), txStatus); }

  const filteredLinks = links.filter(l => linkStatus === 'ALL' || l.status === linkStatus);

  if (loading) return <main style={{ minHeight: '100vh', padding: 32, fontFamily: 'system-ui' }}><h1>LalaPay Dashboard</h1><p>Loading…</p></main>;
  return <main style={{ minHeight: '100vh', padding: 24, fontFamily: 'system-ui', background: '#f6f7f9' }}><div style={{ maxWidth: 1180, margin: '0 auto' }}><header style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', marginBottom: 24 }}><div><strong style={{ fontSize: 24 }}>LalaPay</strong><div>Welcome, {merchant?.name || 'Merchant'}</div></div><button onClick={() => { localStorage.removeItem('lalapay_token'); router.push('/login'); }}>Logout</button></header>{error && <p style={{ color: '#b42318', background: '#fff', padding: 12, borderRadius: 10 }}>{error}</p>}<section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 24 }}>{[['Links', stats?.total_links], ['Active', stats?.active_links], ['Transactions', stats?.total_transactions], ['Successful', stats?.successful_transactions], ['Revenue', `৳${stats?.total_revenue ?? 0}`]].map(([label, value]) => <div key={String(label)} style={{ background: '#fff', padding: 18, borderRadius: 14 }}><small>{label}</small><div style={{ fontSize: 24, fontWeight: 800 }}>{value}</div></div>)}</section><section style={{ background: '#fff', padding: 20, borderRadius: 16, marginBottom: 24 }}><h2>Create payment link</h2><form onSubmit={createLink} style={{ display: 'grid', gap: 10 }}><input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} required /><input placeholder="Amount (BDT)" type="number" step="0.01" min="0.01" value={amount} onChange={e => setAmount(e.target.value)} required /><textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} /><input type="datetime-local" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} /><div>{['bkash', 'nagad'].map(m => <label key={m} style={{ marginRight: 16 }}><input type="checkbox" checked={methods.includes(m)} onChange={e => setMethods(x => e.target.checked ? [...new Set([...x, m])] : x.filter(v => v !== m))} /> {m}</label>)}</div><button disabled={creating}>{creating ? 'Creating…' : 'Create link'}</button></form></section><section style={{ background: '#fff', padding: 20, borderRadius: 16, marginBottom: 24 }}><h2>Payment links</h2><select value={linkStatus} onChange={e => setLinkStatus(e.target.value)}><option>ALL</option><option>ACTIVE</option><option>INACTIVE</option><option>EXPIRED</option></select>{filteredLinks.map(link => <div key={link.id} style={{ borderTop: '1px solid #eee', padding: '14px 0', display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}><div><strong>{link.title}</strong><div>৳{link.amount.toFixed(2)} · {link.paymentMethods.join(', ')} · {statusLabel[link.status] || link.status}</div><small>{link.expiresAt ? `Expires ${new Date(link.expiresAt).toLocaleString()}` : 'No expiry'}</small></div><div><button onClick={() => copyLink(link.id)}>Copy link</button>{link.status === 'ACTIVE' ? <button onClick={() => void toggleLink(link.id, 'INACTIVE')}>Deactivate</button> : <button onClick={() => void toggleLink(link.id, 'ACTIVE')}>Activate</button>}</div></div>)}</section><section style={{ background: '#fff', padding: 20, borderRadius: 16 }}><h2>Transactions</h2><select value={txStatus} onChange={e => changeTxStatus(e.target.value)}><option>ALL</option><option>INITIATED</option><option>PENDING</option><option>SUCCESS</option><option>FAILED</option></select>{transactions.map(tx => <button key={tx.id} onClick={() => setSelectedTx(tx)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: 14, border: 0, borderTop: '1px solid #eee', background: '#fff' }}><strong>৳{Number(tx.amount).toFixed(2)}</strong> · {tx.provider} · {statusLabel[tx.status] || tx.status}<br /><small>{tx.payment_link_title || tx.payment_link_id} · {new Date(tx.created_at).toLocaleString()}</small></button>)}<div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14 }}><button disabled={txPagination.offset === 0} onClick={previousPage}>Previous</button><span>{txPagination.count ? `${txPagination.offset + 1}–${Math.min(txPagination.offset + txPagination.limit, txPagination.count)} of ${txPagination.count}` : '0 transactions'}</span><button disabled={txPagination.offset + txPagination.limit >= txPagination.count} onClick={nextPage}>Next</button></div></section>{selectedTx && <div onClick={() => setSelectedTx(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', display: 'grid', placeItems: 'center', padding: 20 }}><div onClick={e => e.stopPropagation()} style={{ background: '#fff', padding: 24, borderRadius: 16, width: '100%', maxWidth: 520 }}><h2>Transaction</h2><p>ID: {selectedTx.id}</p><p>Provider: {selectedTx.provider}</p><p>Status: {selectedTx.status}</p><p>Amount: ৳{Number(selectedTx.amount).toFixed(2)}</p><button onClick={() => setSelectedTx(null)}>Close</button></div></div>}</div></main>;
}
