'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://lalapay-api.vercel.app').replace(/\/$/, '');

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true); setError('');
    try {
      const response = await fetch(`${API_URL}/api/v1/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ email, password }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.success) throw new Error(body.message || 'Login failed.');
      localStorage.setItem('lalapay_token', body.token);
      router.push('/dashboard');
    } catch (e) { setError(e instanceof Error ? e.message : 'Login failed.'); }
    finally { setLoading(false); }
  }

  return <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#f6f7f9', fontFamily: 'system-ui' }}><form onSubmit={submit} style={{ width: '100%', maxWidth: 420, background: '#fff', padding: 30, borderRadius: 20, boxShadow: '0 12px 40px rgba(0,0,0,.08)' }}><div style={{ fontWeight: 800, fontSize: 22 }}>LalaPay</div><h1>Merchant Login</h1><label>Email<input value={email} onChange={e => setEmail(e.target.value)} type="email" autoComplete="email" required style={inputStyle} /></label><label>Password<input value={password} onChange={e => setPassword(e.target.value)} type="password" autoComplete="current-password" required style={inputStyle} /></label>{error && <p style={{ color: '#b42318' }}>{error}</p>}<button disabled={loading} style={buttonStyle}>{loading ? 'Signing in…' : 'Sign in'}</button><p>New merchant? <a href="/register">Create an account</a></p></form></main>;
}

const inputStyle = { display: 'block', width: '100%', boxSizing: 'border-box' as const, margin: '7px 0 16px', padding: '12px 13px', border: '1px solid #ddd', borderRadius: 10, fontSize: 16 };
const buttonStyle = { width: '100%', padding: 13, border: 0, borderRadius: 10, fontWeight: 700, fontSize: 16, cursor: 'pointer' };
