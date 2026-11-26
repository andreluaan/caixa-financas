import { useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { Field, MemoryMark } from '../components/ui';

export function Login() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const result =
      mode === 'signin'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
    setBusy(false);
    if (result.error) {
      setMessage(result.error.message);
    } else if (mode === 'signup' && !result.data.session) {
      setMessage('Conta criada. Confirme pelo link enviado ao seu e-mail e depois entre.');
      setMode('signin');
    }
  }

  return (
    <div className="auth">
      <form className="glass" onSubmit={submit}>
        <div className="brand" style={{ padding: 0 }}>
          <MemoryMark />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 15, fontWeight: 500 }}>Caixa</span>
            <span className="mono" style={{ fontSize: 10 }}>andreluaan.dev</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h1 className="hero-title" style={{ fontSize: 34 }}>
            {mode === 'signin' ? 'Bem-vindo de volta' : 'Criar sua conta'}
            <span className="dot">.</span>
          </h1>
          <div className="cut" />
        </div>
        <Field label="E-mail">
          <input className="field" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Senha">
          <input
            className="field"
            type="password"
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            minLength={8}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        {message && <p className="muted" role="status" style={{ margin: 0, fontSize: 13 }}>{message}</p>}
        <button className="btn-primary" type="submit" disabled={busy}>
          {busy ? 'Aguarde…' : mode === 'signin' ? 'Entrar' : 'Criar conta'}
        </button>
        <button
          type="button"
          className="pill"
          onClick={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin');
            setMessage(null);
          }}
        >
          {mode === 'signin' ? 'Ainda não tenho conta' : 'Já tenho conta'}
        </button>
      </form>
    </div>
  );
}
