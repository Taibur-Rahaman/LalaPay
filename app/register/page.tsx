'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); if (!API_URL) return setError('API is not configured.');
    setLoading(true); setError('');
    try { const response = await fetch(`${API_URL}/api/v1/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, password }) }); const body = await response.json(); if (!response.ok || !body.success) throw new Error(body.message || 'Registration failed.'); localStorage.setItem('lalapay_token', body.token); router.push('/dashboard'); }
    catch (e) { setError(e instanceof Error ? e.message : 'Registration failed.'); } finally { setLoading(false); }
  }
  return <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#f6f7f9', fontFamily: 'system-ui' }}><form onSubmit={submit} style={{ width: '100%', maxWidth: 420, background: '#fff', padding: 30, borderRadius: 20, boxShadow: '0 12px 40px rgba(0,0,0,.08)' }}><div style={{ fontWeight: 800, fontSize: 22 }}>LalaPay</div><h1>Create merchant account</h1><label>Business / Name<input value={name} onChange={e => setName(e.target.value)} required minLength={1} maxLength={150} style={inputStyle} /></label><label>Email<input value={email} onChange={e => setEmail(e.target.value)} type="email" autoComplete="email" required style={inputStyle} /></label><label>Password<input value={password} onChange={e => setPassword(e.target.value)} type="password" autoComplete="new-password" minLength={8} required style={inputStyle} /></label>{error && <p style={{ color: '#b42318' }}>{error}</p>}<button disabled={loading} style={buttonStyle}>{loading ? 'Creating…' : 'Create account'}</button><p>Already have an account? <a href="/login">Sign in</a></p></form></main>;
}
const inputStyle = { display: 'block', width: '100%', boxSizing: 'border-box' as const, margin: '7px 0 16px', padding: '12px 13px', border: '1px solid #ddd', borderRadius: 10, fontSize: 16 };
const buttonStyle = { width: '100%', padding: 13, border: 0, borderRadius: 10, fontWeight: 700, fontSize: 16, cursor: 'pointer' };
