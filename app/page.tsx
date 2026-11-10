'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

// Interview Quest: the game engine lives in public/quest-engine.js (plain JS, no deps).
// This page handles auth + cloud sync: progress is stored at user_workspace.payload.quest.
export default function Home() {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [skip, setSkip] = useState(false);
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [msg, setMsg] = useState('');
  const timer = useRef<any>(null);
  const payload = useRef<any>({});

  useEffect(() => {
    if (!supabase) { setReady(true); return; }
    supabase.auth.getSession().then(({ data }) => { setUser(data.session?.user ?? null); setReady(true); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  const live = ready && (!supabase || user || skip);

  useEffect(() => {
    if (!live) return;
    const w = window as any;
    if (w.__iqLoaded) return;
    (async () => {
      if (supabase && user) {
        const { data } = await supabase.from('user_workspace').select('payload').eq('user_id', user.id).maybeSingle();
        payload.current = data?.payload ?? {};
        if (payload.current.quest) localStorage.setItem('iq', JSON.stringify(payload.current.quest));
        w.iqSync = (state: any) => {
          clearTimeout(timer.current);
          timer.current = setTimeout(() => {
            supabase!.from('user_workspace').upsert({
              user_id: user.id,
              payload: { ...payload.current, quest: state },
              updated_at: new Date().toISOString(),
            });
          }, 700);
        };
      }
      w.__iqLoaded = true;
      const s = document.createElement('script');
      s.src = '/quest-engine.js';
      document.body.appendChild(s);
    })();
  }, [live, user]);

  async function auth() {
    if (!supabase) return;
    const r = mode === 'in'
      ? await supabase.auth.signInWithPassword({ email, password: pw })
      : await supabase.auth.signUp({ email, password: pw });
    setMsg(r.error ? r.error.message : mode === 'up' ? 'Check your email if confirmation is on, then sign in.' : '');
  }

  if (!ready) return null;
  if (!live) {
    return (
      <main>
        <div className="card">
          <h2>⚔️ Interview Quest</h2>
          <input type="text" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" value={pw} onChange={(e) => setPw(e.target.value)} style={{ marginTop: 8, width: '100%' }} />
          <div className="row" style={{ marginTop: 8 }}>
            <button className="p" onClick={auth}>{mode === 'in' ? 'Sign in' : 'Sign up'}</button>
            <button onClick={() => setMode(mode === 'in' ? 'up' : 'in')}>{mode === 'in' ? 'Need an account?' : 'Have an account?'}</button>
            <button onClick={() => setSkip(true)}>Local only</button>
          </div>
          {msg && <p className="m">{msg}</p>}
        </div>
      </main>
    );
  }
  return (
    <>
      <main>
        <div className="row sp">
          <h1>⚔️ Interview Quest</h1>
          {supabase && user && <button onClick={() => { supabase!.auth.signOut(); (window as any).__iqLoaded = false; location.reload(); }}>Sign out</button>}
        </div>
        <div className="tabs" id="tabs" />
        <div id="v" />
      </main>
      <div id="modal" />
    </>
  );
}