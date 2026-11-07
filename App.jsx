import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Globe from 'react-globe.gl';
import { feature } from 'topojson-client';
import worldData from 'world-atlas/countries-110m.json';
import { COUNTRIES, COUNTRY_BY_CODE, COUNTRY_BY_ISO } from './countries';
import { isSupabaseConfigured, supabase } from './supabase';

const world = feature(worldData, worldData.objects.countries).features;

function App() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState('signin');
  const [authMessage, setAuthMessage] = useState('');
  const [games, setGames] = useState([]);
  const [game, setGame] = useState(null);
  const [nations, setNations] = useState([]);
  const [myNation, setMyNation] = useState(null);
  const [selected, setSelected] = useState(null);
  const [gameName, setGameName] = useState('New World');
  const [view, setView] = useState('globe');
  const [mapMode, setMapMode] = useState('political');
  const [busy, setBusy] = useState(false);
  const globeRef = useRef();

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setGame(null); setNations([]); setMyNation(null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const loadGames = useCallback(async () => {
    if (!supabase || !session) return;
    const { data, error } = await supabase.from('games')
      .select('id,name,status,current_year,created_at')
      .eq('status', 'open').order('created_at', { ascending: false }).limit(30);
    if (!error) setGames(data || []);
  }, [session]);

  useEffect(() => { loadGames(); }, [loadGames]);

  const loadGame = useCallback(async (gameId) => {
    if (!supabase || !session) return;
    const [{ data: g }, { data: n }, { data: p }] = await Promise.all([
      supabase.from('games').select('*').eq('id', gameId).single(),
      supabase.from('nations').select('*').eq('game_id', gameId),
      supabase.from('game_players').select('country_code').eq('game_id', gameId).eq('user_id', session.user.id).maybeSingle()
    ]);
    if (g) setGame(g);
    setNations(n || []);
    setMyNation(p ? (n || []).find(x => x.country_code === p.country_code) : null);
    if (p) setView('globe');
  }, [session]);

  useEffect(() => {
    if (!supabase || !game?.id) return;
    const channel = supabase.channel(`game-${game.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'nations', filter: `game_id=eq.${game.id}` }, () => loadGame(game.id))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'games', filter: `id=eq.${game.id}` }, () => loadGame(game.id))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [game?.id, loadGame]);

  const doAuth = async (e) => {
    e.preventDefault(); setBusy(true); setAuthMessage('');
    const result = authMode === 'signup'
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (result.error) setAuthMessage(result.error.message);
    else if (authMode === 'signup' && !result.data.session) setAuthMessage('Check your email to confirm your account, then sign in.');
  };

  const createGame = async () => {
    setBusy(true);
    const { data, error } = await supabase.rpc('create_game', { p_name: gameName.trim() || 'New World' });
    setBusy(false);
    if (error) return alert(error.message);
    await loadGame(data);
  };

  const joinGame = async (gameId, countryCode) => {
    setBusy(true);
    const { error } = await supabase.rpc('join_game', { p_game_id: gameId, p_country_code: countryCode });
    setBusy(false);
    if (error) return alert(error.message);
    await loadGame(gameId);
  };

  const leaveGame = () => { setGame(null); setNations([]); setMyNation(null); setView('lobby'); };

  const nationByCode = useMemo(() => Object.fromEntries(nations.map(n => [n.country_code, n])), [nations]);
  const countryShapes = useMemo(() => world.map(f => {
    const c = COUNTRY_BY_ISO[String(f.id).padStart(3, '0')];
    return { ...f, gameCountry: c || null };
  }), []);

  const polygonColor = (d) => {
    if (!d.gameCountry) return mapMode === 'terrain' ? 'rgba(86,111,119,0.2)' : 'rgba(105,122,139,0.18)';
    const n = nationByCode[d.gameCountry.code];
    const color = n?.color || d.gameCountry.color;
    if (mapMode === 'military') return n?.owner_user_id ? 'rgba(217,151,76,0.78)' : 'rgba(91,112,135,0.55)';
    return color + 'bb';
  };

  const handlePolygonClick = (d) => {
    if (!d.gameCountry) return;
    setSelected(d.gameCountry);
    if (globeRef.current) globeRef.current.pointOfView({ lat: d.properties?.label_y || 20, lng: 0, altitude: 1.7 }, 900);
  };

  if (!isSupabaseConfigured) return <SetupScreen />;
  if (!session) return <main className="auth-shell"><section className="auth-card">
    <div className="eyebrow">GLOBAL STRATEGY SIMULATION · 1700—2030</div>
    <h1>NEW WORLD <span>ORDER</span></h1>
    <p className="muted">Build an empire. Shape the future.</p>
    <form onSubmit={doAuth}>
      <label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required /></label>
      <label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} minLength="6" required /></label>
      <button className="primary full" disabled={busy}>{busy ? 'Please wait…' : authMode === 'signin' ? 'Sign in' : 'Create account'}</button>
    </form>
    {authMessage && <p className="notice">{authMessage}</p>}
    <button className="link-button" onClick={()=>setAuthMode(authMode==='signin'?'signup':'signin')}>{authMode==='signin'?'Need an account? Sign up':'Already registered? Sign in'}</button>
  </section></main>;

  return <div className="app-shell">
    <header className="topbar">
      <div className="brand"><span className="brand-mark">N</span><div><strong>NEW WORLD ORDER</strong><small>GRAND STRATEGY · 1700—2030</small></div></div>
      <div className="top-actions"><span className="online-dot"/> {session.user.email}<button className="quiet" onClick={()=>supabase.auth.signOut()}>Sign out</button></div>
    </header>
    <div className="layout">
      <aside className="sidebar">
        <div className="side-label">COMMAND</div>
        <button className={view==='lobby'?'nav active':'nav'} onClick={()=>setView('lobby')}>▦ <span>Game lobby</span></button>
        <button className={view==='globe'?'nav active':'nav'} onClick={()=>setView('globe')} disabled={!game}>◎ <span>World globe</span></button>
        <button className={view==='economy'?'nav active':'nav'} onClick={()=>setView('economy')} disabled={!myNation}>▤ <span>National overview</span></button>
        <div className="side-divider"/>
        <div className="side-label">CURRENT CAMPAIGN</div>
        {game ? <div className="campaign-card"><strong>{game.name}</strong><small>Year {game.current_year}</small><small>{myNation ? COUNTRY_BY_CODE[myNation.country_code]?.name : 'Choose a country'}</small><button className="text-action" onClick={leaveGame}>Leave campaign</button></div> : <p className="side-empty">Join or create a campaign to begin.</p>}
        <div className="sidebar-footer">ALPHA BUILD 0.1.0</div>
      </aside>

      <main className="main">
        {view === 'lobby' && <section className="lobby-page">
          <div className="page-heading"><div><div className="eyebrow">MULTIPLAYER COMMAND</div><h2>Campaign lobby</h2><p className="muted">Create a world or join an open campaign.</p></div><div className="year-chip">STARTING YEAR <b>1700</b></div></div>
          <div className="lobby-grid">
            <article className="panel create-panel"><div className="panel-kicker">NEW CAMPAIGN</div><h3>Write history.</h3><p className="muted">Start an alternate-history world. The first player becomes its host.</p><label>Campaign name<input value={gameName} onChange={e=>setGameName(e.target.value)} maxLength="40"/></label><button className="primary" disabled={busy} onClick={createGame}>{busy?'Creating…':'Create campaign'} <span>→</span></button></article>
            <article className="panel"><div className="panel-head"><div><div className="panel-kicker">AVAILABLE WORLDS</div><h3>Join a campaign</h3></div><button className="icon-button" onClick={loadGames} title="Refresh">↻</button></div>
              {games.length ? <div className="game-list">{games.map(g=><div className="game-row" key={g.id}><div><strong>{g.name}</strong><small>Year {g.current_year} · Open campaign</small></div><button className="secondary" onClick={()=>{setGame(g);setView('country-select');}}>Choose country</button></div>)}</div> : <div className="empty-state"><span>◎</span><strong>No open campaigns yet</strong><small>Create one and invite your friends.</small></div>}
            </article>
          </div>
          <div className="panel roster-panel"><div className="panel-head"><div><div className="panel-kicker">WORLD ROSTER</div><h3>20 playable nations</h3></div><span className="muted tiny">Modern borders · 1700 technology</span></div><div className="roster">{COUNTRIES.map(c=><div key={c.code} className="roster-item"><i style={{background:c.color}}/><span>{c.name}</span></div>)}</div></div>
        </section>}

        {view === 'country-select' && game && <section className="country-page">
          <button className="back-link" onClick={()=>setView('lobby')}>← Back to lobby</button>
          <div className="page-heading"><div><div className="eyebrow">CAMPAIGN · {game.name}</div><h2>Choose your nation</h2><p className="muted">Select an unclaimed country. Other nations will be available for AI control in a later build.</p></div></div>
          <div className="country-grid">{COUNTRIES.map(c=>{const n=nationByCode[c.code];const taken=!!n?.owner_user_id;return <button disabled={taken||busy} key={c.code} className="country-card" onClick={()=>joinGame(game.id,c.code)}><i style={{background:c.color}}/><strong>{c.name}</strong><small>{taken?'Already claimed':'Available'}</small><span>{taken?'LOCKED':'SELECT →'}</span></button>})}</div>
        </section>}

        {view === 'globe' && game && <section className="globe-page">
          <div className="globe-heading"><div><div className="eyebrow">{game.name.toUpperCase()} · YEAR {game.current_year}</div><h2>{myNation ? COUNTRY_BY_CODE[myNation.country_code]?.name : 'World situation'}</h2><p className="muted">{myNation?'Your nation is ready. Select countries on the globe to inspect them.':'Select a nation from the campaign lobby to begin.'}</p></div><div className="map-switch">{['political','terrain','military'].map(m=><button key={m} className={mapMode===m?'selected':''} onClick={()=>setMapMode(m)}>{m}</button>)}</div></div>
          <div className="globe-stage"><Globe ref={globeRef} width={undefined} height={undefined} backgroundColor="rgba(0,0,0,0)" globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg" bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png" polygonsData={countryShapes} polygonCapColor={polygonColor} polygonSideColor={()=>'rgba(20,35,48,0.35)'} polygonStrokeColor={d=>d.gameCountry?'rgba(220,231,240,0.65)':'rgba(120,145,160,0.15)'} polygonAltitude={d=>d.gameCountry?0.012:0.002} polygonLabel={d=>d.gameCountry?`<b>${d.gameCountry.name}</b>`:''} onPolygonClick={handlePolygonClick} atmosphereColor="#4c9bd4" atmosphereAltitude={0.16} showGraticules={true} /> 
            <div className="globe-overlay top-left"><span className="live-dot"/> WORLD MAP · {mapMode.toUpperCase()}</div>
            <div className="globe-overlay bottom-left">DRAG TO ROTATE · SCROLL TO ZOOM</div>
            {selected && <div className="inspect-card"><button className="close" onClick={()=>setSelected(null)}>×</button><div className="panel-kicker">NATION INSPECTOR</div><h3><i style={{background:selected.color}}/>{selected.name}</h3><p>{nationByCode[selected.code]?.owner_user_id?'Player controlled':'Unclaimed / AI pending'}</p><small>Campaign year: {game.current_year}</small></div>}
          </div>
          <div className="status-strip"><div><small>YOUR TREASURY</small><strong>{myNation?'$'+Number(myNation.treasury).toLocaleString():'—'}</strong></div><div><small>POPULATION</small><strong>{myNation?Number(myNation.population).toLocaleString():'—'}</strong></div><div><small>TECHNOLOGY</small><strong>{myNation?myNation.technology_year:'1700'}</strong></div><div><small>CAMPAIGN STATUS</small><strong>OPEN</strong></div></div>
        </section>}

        {view === 'economy' && myNation && <section className="economy-page"><div className="eyebrow">NATIONAL ADMINISTRATION</div><h2>{COUNTRY_BY_CODE[myNation.country_code]?.name}</h2><p className="muted">Your national overview. More management systems will be added in later development stages.</p><div className="stats-grid"><div className="panel stat"><small>TREASURY</small><strong>${Number(myNation.treasury).toLocaleString()}</strong><span>Starting funds</span></div><div className="panel stat"><small>POPULATION</small><strong>{Number(myNation.population).toLocaleString()}</strong><span>Abstracted population</span></div><div className="panel stat"><small>TECHNOLOGY YEAR</small><strong>{myNation.technology_year}</strong><span>Research baseline</span></div><div className="panel stat"><small>CONTROL</small><strong>PLAYER</strong><span>{session.user.email}</span></div></div><div className="panel"><div className="panel-kicker">DEVELOPMENT ROADMAP</div><h3>Coming next</h3><p className="muted">Province ownership, cities, resource deposits, mines, infrastructure, research trees, production chains, military designers, diplomacy and AI nations.</p></div></section>}
      </main>
    </div>
  </div>;
}

function SetupScreen() {
  return <main className="auth-shell"><section className="auth-card setup-card"><div className="eyebrow">ONE-TIME SETUP</div><h1>CONNECT <span>SUPABASE</span></h1><p className="muted">The game files are ready. Connect your Supabase project to enable accounts, campaigns and saved nations.</p><ol><li>Create a project at <b>supabase.com</b>.</li><li>Open <b>Project Settings → API</b> and copy the Project URL and publishable key.</li><li>Copy <code>.env.example</code> to <code>.env</code> and paste both values.</li><li>Open the SQL Editor and run <code>supabase/schema.sql</code>.</li><li>Run <code>npm install</code>, then <code>npm run dev</code>.</li></ol><div className="notice">Do not put your service-role key in this project. The browser uses only the publishable/anon key.</div></section></main>;
}

export default App;
