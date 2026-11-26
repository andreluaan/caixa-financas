import { useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { Field, MemoryMark } from '../components/ui';

// Plain usernames become an address on a private domain, so no real e-mail is needed.
const USERNAME_DOMAIN = 'caixa.local';
const toEmail = (login: string) => {
  const value = login.trim().toLowerCase();
  return value.includes('@') ? value : `${value}@${USERNAME_DOMAIN}`;
};

const messages: Record<string, string> = {
  'Invalid login credentials': 'Usuário ou senha incorretos.',
  'User already registered': 'Esse usuário já existe. Entre com ele.',
  'Signups not allowed for this instance': 'Novos cadastros estão desligados.',
  'Email not confirmed': 'Conta ainda não confirmada.',
};

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
    const address = toEmail(email);
    const result =
      mode === 'signin'
        ? await supabase.auth.signInWithPassword({ email: address, password })
        : await supabase.auth.signUp({ email: address, password, options: { emailRedirectTo: window.location.origin } });
    setBusy(false);
    if (result.error) {
      setMessage(messages[result.error.message] ?? result.error.message);
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
        <Field label="Usuário ou e-mail">
          <input
            className="field"
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
            pattern="[A-Za-z0-9._@+-]{3,}"
            title="Letras, números, ponto, hífen ou um e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
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
