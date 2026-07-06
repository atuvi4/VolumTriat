import { useState } from 'react';
import { useAuth } from './useAuth';

export default function AuthGate() {
  const { signIn, status, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const busy = status === 'loading';

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-surface">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-card p-6 space-y-4">
        <div>
          <h1 className="text-xl font-bold">Project75</h1>
          <p className="text-[13px] text-muted mt-1">Entra o crea el teu compte per començar.</p>
        </div>
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="El teu email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-surface2 border border-line2 rounded-[10px] px-3 py-2.5 text-[14px] font-semibold focus:outline-none focus:border-accent"
        />
        <input
          type="password"
          autoComplete="current-password"
          placeholder="Contrasenya (mín. 6)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && email.trim() && password.length >= 6) signIn(email, password);
          }}
          className="w-full bg-surface2 border border-line2 rounded-[10px] px-3 py-2.5 text-[14px] font-semibold focus:outline-none focus:border-accent"
        />
        <button
          disabled={busy || !email.trim() || password.length < 6}
          onClick={() => signIn(email, password)}
          className="w-full bg-accent text-white font-semibold rounded-xl px-4 py-3 disabled:opacity-55"
        >
          {busy ? 'Entrant…' : 'Entrar / Crear compte'}
        </button>
        {error && <p className="text-[12.5px] text-warn m-0">{error}</p>}
        <p className="text-[12px] text-muted leading-relaxed m-0">
          La primera vegada es crea el compte. Cada persona té les seves pròpies dades.
        </p>
      </div>
    </div>
  );
}
