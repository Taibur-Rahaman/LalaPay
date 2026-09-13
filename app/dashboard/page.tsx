'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');
type Link = { id: string; title: string; amount: number; currency: string; status: string; paymentMethods: string[]; createdAt: string; expiresAt?: string | null; description?: string | null };
type Tx = { id: string; provider: string; amount: string | number; currency: string; status: string; provider_transaction_id?: string | null; provider_payment_id?: string | null; payment_link_id?: string; payment_link_title?: string; created_at: string; completed_at?: string | null };
type Stats = { total_links: number; active_links: number; inactive_links: number; total_transactions: number; successful_transactions: number; pending_transactions: number; failed_transactions: number; total_revenue: string | number };

const statusLabel: Record<string, string> = { ACTIVE: 'Active', INACTIVE: 'Inactive', EXPIRED: 'Expired', SUCCESS: 'Success', PENDING: 'Pending', FAILED: 'Failed', INITIATED: 'Initiated' };

export default function DashboardPage() {
  const router = useRouter();
  const [links, setLinks] = useState<Link[]>([]);
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [merchant, setMerchant] = useState<any>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState(''); const [amount, setAmount] = useState(''); const [description, setDescription] = useState(''); const [methods, setMethods] = useState<string[]>(['bkash','nagad']);
  const [creating, setCreating] = useState(false); const [copied, setCopied] = useState(''); const [busyLink, setBusyLink] = useState(''); const [selectedTx, setSelectedTx] = useState<Tx | null>(null);
  const token = () => typeof window !== 'undefined' ? localStorage.getItem('lalapay_token') : null;

  async function api(path: string, options: RequestInit = {}) {
    const t = token(); if (!t) { router.push('/login'); throw new Error('Not signed in'); }
    const response = await fetch(`${API_URL}${path}`, { ...options, headers: { ...(options.headers || {}), Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' } });
    const body = await response.json();
    if (response.status === 401) { localStorage.removeItem('lalapay_token'); router.push('/login'); throw new Error('Session expired'); }
    if (!response.ok || !body.success) throw new Error(body.message || 'Request failed');
    return body;
  }

  async function load() {
    if (!API_URL) { setError('API is not configured.'); setLoading(false); return; }
    try { const [me, pl, tx, st] = await Promise.all([api('/api/v1/auth/me'), api('/api/v1/payment-links?limit=50'), api('/api/v1/merchant/transactions?limit=50'), api('/api/v1/merchant/stats')]); setMerchant(me.data); setLinks(pl.data); setTransactions(tx.data); setStats(st.data); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to load dashboard.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function createLink(e: FormEvent) { e.preventDefault(); setCreating(true); setError(''); try { await api('/api/v1/payment-links', { method: 'POST', body: JSON.stringify({ title, amount: Number(amount), currency: 'BDT', description: description || undefined, paymentMethods: methods }) }); setTitle(''); setAmount(''); setDescription(''); setShowCreate(false); await load(); } catch (e) { setError(e instanceof Error ? e.message : 'Could not create payment link.'); } finally { setCreating(false); } }
  async function copyLink(id: string) { try { await navigator.clipboard.writeText(`${window.location.origin}/pay/${id}`); setCopied(id); setTimeout(() => setCopied(''), 1500); } catch { setError('Could not copy the link.'); } }
  async function toggleLink(link: Link) { if (link.status === 'EXPIRED') return; const next = link.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'; setBusyLink(link.id); setError(''); try { await api(`/api/v1/merchant/payment-links/${link.id}/status`, { method: 'PATCH', body: JSON.stringify({ status: next }) }); await load(); } catch (e) { setError(e instanceof Error ? e.message : 'Could not update payment link.'); } finally { setBusyLink(''); } }
  function logout() { localStorage.removeItem('lalapay_token'); router.push('/login'); }

  if (loading) return <main style={shell}><div style={loadingCard}>Loading dashboard…</div></main>;
  return <main style={shell}>
    <header style={header}><div><div style={brand}>LalaPay</div><h1 style={h1}>Dashboard</h1><small>{merchant?.name || merchant?.email}</small></div><button onClick={logout} style={secondary}>Logout</button></header>
    {error && <div style={alert}>{error}</div>}

    <section style={statsGrid}>
      <Stat label="Total revenue" value={`BDT ${Number(stats?.total_revenue || 0).toLocaleString('en-BD', { minimumFractionDigits: 2 })}`} />
      <Stat label="Successful payments" value={String(stats?.successful_transactions ?? 0)} />
      <Stat label="Pending payments" value={String(stats?.pending_transactions ?? 0)} />
      <Stat label="Payment links" value={String(stats?.total_links ?? links.length)} />
    </section>

    <div style={summary}><span>Transactions: <b>{stats?.total_transactions ?? transactions.length}</b></span><span>Failed: <b>{stats?.failed_transactions ?? 0}</b></span><span>Active links: <b>{stats?.active_links ?? 0}</b></span><span>Inactive links: <b>{stats?.inactive_links ?? 0}</b></span></div>

    <div style={toolbar}><h2 style={sectionTitle}>Payment links</h2><button onClick={()=>setShowCreate(!showCreate)} style={primary}>{showCreate?'Close':'Create payment link'}</button></div>
    {showCreate && <form onSubmit={createLink} style={card}><h3 style={{margin:0}}>New payment link</h3><input placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} required maxLength={150} style={input}/><input placeholder="Amount (BDT)" type="number" min="0.01" step="0.01" value={amount} onChange={e=>setAmount(e.target.value)} required style={input}/><textarea placeholder="Description (optional)" value={description} onChange={e=>setDescription(e.target.value)} maxLength={1000} style={{...input,minHeight:80}}/><div style={methodsRow}><label><input type="checkbox" checked={methods.includes('bkash')} onChange={e=>setMethods(v=>e.target.checked?[...new Set([...v,'bkash'])]:v.filter(x=>x!=='bkash'))}/> bKash</label><label><input type="checkbox" checked={methods.includes('nagad')} onChange={e=>setMethods(v=>e.target.checked?[...new Set([...v,'nagad'])]:v.filter(x=>x!=='nagad'))}/> Nagad</label></div><button disabled={creating||methods.length===0} style={primary}>{creating?'Creating…':'Create link'}</button></form>}

    <div style={list}>
      {links.map(l=><article key={l.id} style={card}><div style={linkTop}><div style={{minWidth:0}}><strong style={{fontSize:17}}>{l.title}</strong><div style={amountStyle}>BDT {l.amount.toFixed(2)}</div><small>{l.paymentMethods.join(' + ')} · <span style={badge(l.status)}>{statusLabel[l.status] || l.status}</span></small></div><div style={actions}><button onClick={()=>copyLink(l.id)} style={secondary}>{copied===l.id?'Copied!':'Copy link'}</button><button disabled={busyLink===l.id||l.status==='EXPIRED'} onClick={()=>toggleLink(l)} style={secondary}>{busyLink===l.id?'Saving…':l.status==='ACTIVE'?'Deactivate':'Reactivate'}</button></div></div></article>)}
      {links.length===0&&<div style={card}>No payment links yet. Create your first link above.</div>}
    </div>

    <div style={toolbar}><h2 style={sectionTitle}>Recent transactions</h2></div>
    <div style={list}>{transactions.slice(0,20).map(t=><button key={t.id} onClick={()=>setSelectedTx(t)} style={txRow}><span style={{textTransform:'capitalize'}}>{t.provider}</span><strong>BDT {Number(t.amount).toFixed(2)}</strong><span style={badge(t.status)}>{statusLabel[t.status] || t.status}</span><small>{new Date(t.created_at).toLocaleString()}</small></button>)}{transactions.length===0&&<div style={card}>No transactions yet.</div>}</div>

    {selectedTx && <div style={overlay} onClick={()=>setSelectedTx(null)}><div style={modal} onClick={e=>e.stopPropagation()}><div style={modalHeader}><h3 style={{margin:0}}>Transaction details</h3><button onClick={()=>setSelectedTx(null)} style={close}>×</button></div><Detail label="Status" value={statusLabel[selectedTx.status] || selectedTx.status}/><Detail label="Provider" value={selectedTx.provider}/><Detail label="Amount" value={`BDT ${Number(selectedTx.amount).toFixed(2)}`}/><Detail label="Payment ID" value={selectedTx.provider_payment_id || '—'}/><Detail label="Transaction ID" value={selectedTx.provider_transaction_id || selectedTx.id}/><Detail label="Created" value={new Date(selectedTx.created_at).toLocaleString()}/>{selectedTx.completed_at && <Detail label="Completed" value={new Date(selectedTx.completed_at).toLocaleString()}/>}<button onClick={()=>setSelectedTx(null)} style={{...primary,width:'100%',marginTop:8}}>Close</button></div></div>}
  </main>;
}

function Stat({label,value}:{label:string;value:string}) { return <div style={statCard}><small>{label}</small><strong style={statValue}>{value}</strong></div>; }
function Detail({label,value}:{label:string;value:string}) { return <div style={detail}><small>{label}</small><span>{value}</span></div>; }
function badge(status:string): React.CSSProperties { return { display:'inline-block', padding:'3px 8px', borderRadius:999, background: status==='SUCCESS'||status==='ACTIVE'?'#e8f7ee':status==='FAILED'||status==='INACTIVE'||status==='EXPIRED'?'#fff0f0':'#fff7df', fontWeight:700, fontSize:12 }; }

const shell:React.CSSProperties={minHeight:'100vh',background:'#f6f7f9',padding:'32px max(16px,calc((100vw - 1050px)/2))',fontFamily:'system-ui'};
const header:React.CSSProperties={display:'flex',justifyContent:'space-between',alignItems:'center',gap:16,marginBottom:28}; const brand:React.CSSProperties={fontWeight:900,fontSize:20}; const h1:React.CSSProperties={margin:'5px 0',fontSize:32}; const statsGrid:React.CSSProperties={display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',gap:12,marginBottom:14}; const statCard:React.CSSProperties={background:'#fff',padding:18,borderRadius:16,boxShadow:'0 8px 30px rgba(0,0,0,.05)'}; const statValue:React.CSSProperties={display:'block',fontSize:22,marginTop:7}; const summary:React.CSSProperties={display:'flex',flexWrap:'wrap',gap:16,fontSize:13,color:'#555',marginBottom:25}; const toolbar:React.CSSProperties={display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,margin:'25px 0 12px'}; const sectionTitle:React.CSSProperties={margin:0}; const card:React.CSSProperties={background:'#fff',padding:20,borderRadius:16,boxShadow:'0 8px 30px rgba(0,0,0,.05)',display:'grid',gap:12}; const list:React.CSSProperties={display:'grid',gap:10}; const linkTop:React.CSSProperties={display:'flex',justifyContent:'space-between',alignItems:'center',gap:16}; const actions:React.CSSProperties={display:'flex',gap:8,flexWrap:'wrap',justifyContent:'flex-end'}; const amountStyle:React.CSSProperties={fontSize:22,fontWeight:800,margin:'5px 0'}; const primary:React.CSSProperties={border:0,borderRadius:10,padding:'11px 16px',fontWeight:800,cursor:'pointer'}; const secondary:React.CSSProperties={border:'1px solid #ddd',background:'#fff',borderRadius:10,padding:'10px 14px',fontWeight:700,cursor:'pointer'}; const input:React.CSSProperties={width:'100%',boxSizing:'border-box',padding:12,border:'1px solid #ddd',borderRadius:10,fontSize:15}; const alert:React.CSSProperties={background:'#fff1f1',color:'#b42318',padding:12,borderRadius:10,marginBottom:15}; const methodsRow:React.CSSProperties={display:'flex',gap:20}; const txRow:React.CSSProperties={background:'#fff',padding:14,border:0,borderRadius:12,display:'grid',gridTemplateColumns:'1fr 1fr 1fr 2fr',gap:10,alignItems:'center',textAlign:'left',cursor:'pointer'}; const loadingCard:React.CSSProperties={background:'#fff',padding:30,borderRadius:16}; const overlay:React.CSSProperties={position:'fixed',inset:0,background:'rgba(0,0,0,.4)',display:'grid',placeItems:'center',padding:16,zIndex:10}; const modal:React.CSSProperties={background:'#fff',width:'min(520px,100%)',borderRadius:18,padding:22,boxSizing:'border-box'}; const modalHeader:React.CSSProperties={display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}; const close:React.CSSProperties={border:0,background:'transparent',fontSize:28,cursor:'pointer'}; const detail:React.CSSProperties={display:'grid',gap:4,padding:'10px 0',borderBottom:'1px solid #eee'};
