
'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  LayoutDashboard,
  Map,
  CalendarDays,
  Code2,
  ClipboardCheck,
  Settings,
  Plus,
  Search,
  CheckCircle2,
  Clock3,
  Target,
  Flame,
  BookOpen,
  ChevronRight,
  Upload,
  ExternalLink,
  Trash2,
  Save,
} from 'lucide-react';

const phases = [
  {
    name: 'DSA foundations',
    weeks: 'Weeks 1–8',
    items: [
      'Arrays & strings',
      'Hashing',
      'Two pointers',
      'Sliding window',
      'Binary search',
      'Linked lists',
      'Stacks & queues',
      'Trees & BSTs',
      'Graphs: BFS / DFS',
      'Topological sort',
      'Union-find',
      'Heaps / top-K',
      'Backtracking',
      'Intervals',
      'Dynamic programming: 1D → 2D → knapsack / LIS',
      'Greedy',
      'Tries',
    ],
  },
  {
    name: 'CS fundamentals + SQL',
    weeks: 'Sprint',
    items: [
      'Operating systems: processes, threads, context switching',
      'Race conditions, mutex vs semaphore, deadlocks',
      'Virtual memory, paging, stack vs heap',
      'DBMS: ACID, isolation, indexes, transactions',
      'SQL: joins, CTEs, window functions',
      'Networks: DNS, TCP/UDP, HTTP/TLS, REST/WebSockets',
      'OOP, SOLID, design patterns',
      'Git, APIs, authn/authz, CI/CD, testing & debugging',
    ],
  },
  {
    name: 'System design',
    weeks: 'Core + practice',
    items: [
      'Requirements & non-functional requirements',
      'Entities and API design',
      'Data flow and high-level design',
      'Caching, queues, load balancing, CDN',
      'Replication, sharding, consistency',
      'Rate limiting, retries, idempotency',
      'URL shortener',
      'Rate limiter',
      'Chat / messaging',
      'File storage',
      'AI feature / semantic search design',
    ],
  },
  {
    name: 'Online assessments',
    weeks: 'Ongoing',
    items: [
      'Language standard library fluency',
      'Timed OA practice #1',
      'Timed OA practice #2',
      'Timed OA practice #3',
      'Timed OA practice #4',
      'Timed OA practice #5',
      'Edge-case checklist drills',
      'SQL practice',
    ],
  },
  {
    name: 'Coding interviews',
    weeks: 'Ongoing',
    items: [
      'Clarify → constraints → brute force → optimize → code → test',
      'Think aloud and explain trade-offs',
      'Manual dry runs and complexity',
      'Class / design-flavored coding: LRU, TTL store, rate limiter',
      'Mock interview #1',
      'Mock interview #2',
      'Mock interview #3',
      'Mock interview #4',
      'Mock interview #5',
    ],
  },
  {
    name: 'AI-assisted engineering',
    weeks: 'New format',
    items: [
      'Read unfamiliar repository before prompting',
      'Repo feature drill (60 minutes)',
      'Bug hunt: explain root cause before fix',
      'Verify AI output: edge case / complexity / assumptions',
      'Staged in-memory store exercise',
      'Prompt small, precise requests',
      'Review diffs and run tests early',
    ],
  },
  {
    name: 'Behavioral + project deep dive',
    weeks: 'Final preparation',
    items: [
      'Story: biggest project / ownership',
      'Story: technical challenge',
      'Story: conflict / stakeholder',
      'Story: failure and learning',
      'Story: ambiguous problem',
      'Story: learning fast / leadership',
      'Ask-me-anything project deep dive',
      'AI helped me + AI was wrong stories',
      'Why Google / role; questions for interviewer',
    ],
  },
];

const nav = [
  ['Overview', LayoutDashboard],
  ['Roadmap', Map],
  ['Daily log', CalendarDays],
  ['DSA tracker', Code2],
  ['Reviews & mocks', ClipboardCheck],
];

const initial = {
  sessions: [],
  problems: [],
  done: {},
  notes: {},
};

function load() {
  try {
    return JSON.parse(localStorage.getItem('sweprep') || 'null') || initial;
  } catch {
    return initial;
  }
}

export default function Home() {
  const [data, setData] = useState(initial);
  const [page, setPage] = useState('Overview');
  const [phase, setPhase] = useState(0);
  const [query, setQuery] = useState('');

  const [user, setUser] = useState<any>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authMode, setAuthMode] = useState<'in' | 'up'>('in');
  const [authMessage, setAuthMessage] = useState('');
  const [cloudReady, setCloudReady] = useState(false);

  const [session, setSession] = useState({
    date: new Date().toISOString().slice(0, 10),
    duration: 90,
    topic: 'DSA',
    title: '',
    notes: '',
    takeaways: '',
    blockers: '',
    evidence: '',
  });

  const [problem, setProblem] = useState({
    name: '',
    url: '',
    pattern: '',
    difficulty: 'Medium',
    status: 'Solved',
    minutes: 30,
    hints: 0,
    reflection: '',
  });

  useEffect(() => {
    setData(load());

    if (!supabase) {
      setCloudReady(true);
      return;
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user || null);

      if (session?.user) {
        const { data: row } = await supabase
          .from('user_workspace')
          .select('payload')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (row?.payload) {
          setData(row.payload);
        }
      }

      setCloudReady(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user || null)
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem('sweprep', JSON.stringify(data));

    if (supabase && user && cloudReady) {
      const timer = setTimeout(() => {
        supabase
          .from('user_workspace')
          .upsert(
            {
              user_id: user.id,
              payload: data,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          )
          .then(({ error }) => {
            if (error) console.error('Cloud sync failed', error);
          });
      }, 700);

      return () => clearTimeout(timer);
    }
  }, [data, user, cloudReady]);

  async function authSubmit() {
    if (!supabase) {
      setAuthMessage(
        'Add Supabase environment variables to enable cloud login.'
      );
      return;
    }

    setAuthMessage('');

    const credentials = {
      email: authEmail,
      password: authPassword,
    };

    const result =
      authMode === 'in'
        ? await supabase.auth.signInWithPassword(credentials)
        : await supabase.auth.signUp(credentials);

    if (result.error) {
      setAuthMessage(result.error.message);
      return;
    }

    setAuthMessage(
      authMode === 'up'
        ? 'Account created. Check your email if confirmation is enabled.'
        : 'Signed in.'
    );
  }

  async function signOut() {
    await supabase?.auth.signOut();
    setUser(null);
    setData(load());
  }

  const all = phases.flatMap((p, i) =>
    p.items.map((x, j) => ({
      name: x,
      phase: i,
      index: j,
      key: i + '-' + j,
    }))
  );

  const doneCount = Object.values(data.done).filter(Boolean).length;
  const pct = Math.round((doneCount / all.length) * 100);

  const hours = (
    data.sessions.reduce((a, s) => a + Number(s.duration || 0), 0) / 60
  ).toFixed(1);

  const filtered = all.filter((x) =>
    x.name.toLowerCase().includes(query.toLowerCase())
  );

  function toggle(key) {
    setData((d) => ({
      ...d,
      done: {
        ...d.done,
        [key]: !d.done[key],
      },
    }));
  }

  function saveSession() {
    if (!session.title.trim()) return alert('Add a session title');

    setData((d) => ({
      ...d,
      sessions: [{ ...session, id: Date.now() }, ...d.sessions],
    }));

    setSession((s) => ({
      ...s,
      title: '',
      notes: '',
      takeaways: '',
      blockers: '',
      evidence: '',
    }));
  }

  function saveProblem() {
    if (!problem.name.trim()) return alert('Add a problem name');

    setData((d) => ({
      ...d,
      problems: [{ ...problem, id: Date.now() }, ...d.problems],
    }));

    setProblem((p) => ({
      ...p,
      name: '',
      url: '',
      reflection: '',
    }));
  }

  function exportData() {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });

    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'swe-prep-backup.json';
    a.click();

    URL.revokeObjectURL(a.href);
  }

  if (!user && supabase)
    return (
      <main className="authShell">
        <div className="authCard">
          <div className="brandIcon">S</div>
          <span className="eyebrow">PERSONAL PREPARATION WORKSPACE</span>
          <h1>SWE Prep OS</h1>
          <p>Sign in to sync your preparation logs across devices.</p>

          <div className="form">
            <label>
              Email
              <input
                type="email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
              />
            </label>

            <button className="primary full" onClick={authSubmit}>
              {authMode === 'in' ? 'Sign in' : 'Create account'}
            </button>

            <button
              className="textBtn"
              onClick={() =>
                setAuthMode(authMode === 'in' ? 'up' : 'in')
              }
            >
              {authMode === 'in'
                ? 'New here? Create an account'
                : 'Already registered? Sign in'}
            </button>

            {authMessage && <p className="muted">{authMessage}</p>}
          </div>

          <small>
            Supabase Auth · Your data is private under Row Level Security
          </small>
        </div>
      </main>
    );

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brandIcon">S</div>
          <div>
            <b>SWE Prep OS</b>
            <small>GOOGLE SDE-1 · 2027</small>
          </div>
        </div>

        <div className="navLabel">WORKSPACE</div>

        {nav.map(([n, I]) => (
          <button
            key={n as string}
            className={'nav ' + (page === n ? 'active' : '')}
            onClick={() => setPage(n as string)}
          >
            <I size={17} />
            {n as string}
          </button>
        ))}

        <div className="sideBottom">
          <div className="target">
            <div>
              <b>{user?.email || 'Local mode'}</b>
              <small>
                {user ? 'Cloud sync enabled' : 'Browser storage only'}
              </small>
            </div>
          </div>

          <button className="nav" onClick={signOut}>
            <Save size={17} />
            Sign out
          </button>

          <div className="target">
            <Target size={17} />
            <div>
              <b>Target window</b>
              <small>May–June 2027</small>
            </div>
          </div>

          <button className="nav" onClick={exportData}>
            <Save size={17} />
            Export backup
          </button>

          <p>Local prototype · data stays in this browser</p>
        </div>
      </aside>

      <section className="main">
        <header>
          <div>
            <span className="eyebrow">PREPARATION WORKSPACE</span>
            <h1>{page}</h1>
          </div>

          <div className="headerRight">
            <span className="status">
              <i />
              Plan active
            </span>

            <button
              className="iconBtn"
              onClick={exportData}
              title="Export data"
            >
              <Save size={18} />
            </button>
          </div>
        </header>

        {page === 'Overview' && (
          <>
            <div className="welcome">
              <div>
                <span className="eyebrow light">YOUR NEXT 6–7 MONTHS</span>
                <h2>
                  Build consistency.
                  <br />
                  Become interview-ready.
                </h2>
                <p>
                  One focused session at a time. Keep the evidence, learn from
                  the misses.
                </p>
              </div>

              <div className="welcomeOrb">
                <Target size={40} />
                <b>GOAL</b>
                <span>Google SDE-1</span>
              </div>
            </div>

            <div className="stats">
              <Stat
                icon={Map}
                label="Roadmap completion"
                value={pct + '%'}
                sub={`${doneCount} / ${all.length} milestones`}
                color="blue"
              />

              <Stat
                icon={Clock3}
                label="Logged study time"
                value={hours + 'h'}
                sub={`${data.sessions.length} sessions recorded`}
                color="purple"
              />

              <Stat
                icon={Code2}
                label="Problems logged"
                value={data.problems.length}
                sub={`${data.problems.filter((p) => p.status === 'Solved').length} solved`}
                color="green"
              />

              <Stat
                icon={Flame}
                label="Study sessions"
                value={data.sessions.length}
                sub="Evidence-backed sessions"
                color="orange"
              />
            </div>

            <div className="grid2">
              <div className="panel">
                <div className="panelHead">
                  <div>
                    <h3>Roadmap progress</h3>
                    <p>Completion across all curriculum sections</p>
                  </div>

                  <button
                    className="textBtn"
                    onClick={() => setPage('Roadmap')}
                  >
                    View roadmap <ChevronRight size={15} />
                  </button>
                </div>

                {phases.map((p, i) => {
                  const n = p.items.filter(
                    (_, j) => data.done[i + '-' + j]
                  ).length;

                  return (
                    <div className="phaseProgress" key={p.name}>
                      <div>
                        <span>{p.name}</span>
                        <small>
                          {n}/{p.items.length}
                        </small>
                      </div>

                      <div className="bar">
                        <i
                          style={{
                            width: (n / p.items.length) * 100 + '%',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="panel">
                <div className="panelHead">
                  <div>
                    <h3>Recent study sessions</h3>
                    <p>Your latest documented work</p>
                  </div>

                  <button
                    className="textBtn"
                    onClick={() => setPage('Daily log')}
                  >
                    All sessions <ChevronRight size={15} />
                  </button>
                </div>

                {data.sessions.slice(0, 4).map((s) => (
                  <div className="recent" key={s.id}>
                    <div className="recentIcon">
                      <BookOpen size={17} />
                    </div>

                    <div>
                      <b>{s.title}</b>
                      <small>
                        {s.date} · {s.topic} · {s.duration} min
                      </small>
                    </div>
                  </div>
                ))}

                {!data.sessions.length && (
                  <div className="empty">
                    No sessions yet. Log your first study session to begin.
                  </div>
                )}

                <button
                  className="primary full"
                  onClick={() => setPage('Daily log')}
                >
                  <Plus size={16} />
                  Log today's work
                </button>
              </div>
            </div>
          </>
        )}

        {page === 'Roadmap' && (
          <div className="roadmapLayout">
            <div className="panel phaseList">
              <h3>Curriculum</h3>

              {phases.map((p, i) => (
                <button
                  className={
                    'phaseChoice ' + (phase === i ? 'selected' : '')
                  }
                  onClick={() => setPhase(i)}
                  key={p.name}
                >
                  <span className="phaseNum">
                    {String(i + 1).padStart(2, '0')}
                  </span>

                  <span>
                    <b>{p.name}</b>
                    <small>{p.weeks}</small>
                  </span>

                  <ChevronRight size={16} />
                </button>
              ))}
            </div>

            <div className="panel">
              <div className="panelHead">
                <div>
                  <span className="eyebrow">
                    PHASE {String(phase + 1).padStart(2, '0')}
                  </span>

                  <h2>{phases[phase].name}</h2>

                  <p>
                    {
                      phases[phase].items.filter(
                        (_, j) => data.done[phase + '-' + j]
                      ).length
                    }{' '}
                    of {phases[phase].items.length} complete
                  </p>
                </div>
              </div>

              {phases[phase].items.map((it, j) => (
                <div className="roadItem" key={it}>
                  <button
                    className={
                      'check ' +
                      (data.done[phase + '-' + j] ? 'checked' : '')
                    }
                    onClick={() => toggle(phase + '-' + j)}
                  >
                    {data.done[phase + '-' + j] && (
                      <CheckCircle2 size={17} />
                    )}
                  </button>

                  <div>
                    <b
                      className={
                        data.done[phase + '-' + j] ? 'strike' : ''
                      }
                    >
                      {it}
                    </b>
                    <small>
                      Mark complete only when you can explain or demonstrate
                      it.
                    </small>
                  </div>

                  <button
                    className="iconBtn"
                    onClick={() => {
                      setSession((s) => ({
                        ...s,
                        topic: phases[phase].name,
                        title: it,
                      }));
                      setPage('Daily log');
                    }}
                    title="Document this topic"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {page === 'Daily log' && (
          <div className="grid2 logGrid">
            <div className="panel">
              <div className="panelHead">
                <div>
                  <h3>Document a session</h3>
                  <p>Capture what happened, not just time spent.</p>
                </div>
              </div>

              <div className="form">
                <label>
                  Date
                  <input
                    type="date"
                    value={session.date}
                    onChange={(e) =>
                      setSession({ ...session, date: e.target.value })
                    }
                  />
                </label>

                <label>
                  Duration (minutes)
                  <input
                    type="number"
                    value={session.duration}
                    onChange={(e) =>
                      setSession({
                        ...session,
                        duration: Number(e.target.value),
                      })
                    }
                  />
                </label>

                <label>
                  Area
                  <select
                    value={session.topic}
                    onChange={(e) =>
                      setSession({ ...session, topic: e.target.value })
                    }
                  >
                    {[
                      'DSA',
                      'CS Fundamentals',
                      'System Design',
                      'OA',
                      'Coding Interview',
                      'AI-assisted',
                      'Behavioral',
                      'Project',
                    ].map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Session title
                  <input
                    value={session.title}
                    onChange={(e) =>
                      setSession({ ...session, title: e.target.value })
                    }
                    placeholder="e.g. Sliding window — variable window"
                  />
                </label>

                <label>
                  What did you do?
                  <textarea
                    value={session.notes}
                    onChange={(e) =>
                      setSession({ ...session, notes: e.target.value })
                    }
                    placeholder="Concepts, problems, implementation details…"
                  />
                </label>

                <label>
                  Key takeaways
                  <textarea
                    value={session.takeaways}
                    onChange={(e) =>
                      setSession({ ...session, takeaways: e.target.value })
                    }
                    placeholder="What can you now explain independently?"
                  />
                </label>

                <label>
                  Blockers / mistakes
                  <textarea
                    value={session.blockers}
                    onChange={(e) =>
                      setSession({ ...session, blockers: e.target.value })
                    }
                    placeholder="Where did you struggle? What was the root cause?"
                  />
                </label>

                <label>
                  Evidence links
                  <input
                    value={session.evidence}
                    onChange={(e) =>
                      setSession({ ...session, evidence: e.target.value })
                    }
                    placeholder="GitHub, docs, attachment link"
                  />
                </label>

                <button className="primary" onClick={saveSession}>
                  <Save size={16} />
                  Save session
                </button>
              </div>
            </div>

            <div className="panel">
              <div className="panelHead">
                <div>
                  <h3>Session history</h3>
                  <p>{data.sessions.length} entries · newest first</p>
                </div>
              </div>

              {data.sessions.map((s) => (
                <article className="sessionCard" key={s.id}>
                  <div className="sessionMeta">
                    {s.date} · {s.topic} · {s.duration} min
                  </div>

                  <b>{s.title}</b>

                  {s.notes && <p>{s.notes}</p>}

                  {s.takeaways && (
                    <div className="insight">
                      <b>Takeaway</b>
                      <p>{s.takeaways}</p>
                    </div>
                  )}

                  {s.blockers && (
                    <div className="warning">
                      <b>Blockers</b>
                      <p>{s.blockers}</p>
                    </div>
                  )}

                  {s.evidence && (
                    <a href={s.evidence} target="_blank" rel="noreferrer">
                      <ExternalLink size={13} /> Evidence
                    </a>
                  )}
                </article>
              ))}
            </div>
          </div>
        )}

        {page === 'DSA tracker' && (
          <div className="grid2">
            <div className="panel">
              <h3>Log a problem</h3>
              <p className="muted">
                Track process and independence—not just acceptance.
              </p>

              <div className="form">
                <label>
                  Problem name
                  <input
                    value={problem.name}
                    onChange={(e) =>
                      setProblem({ ...problem, name: e.target.value })
                    }
                  />
                </label>

                <label>
                  LeetCode URL
                  <input
                    value={problem.url}
                    onChange={(e) =>
                      setProblem({ ...problem, url: e.target.value })
                    }
                  />
                </label>

                <label>
                  Pattern
                  <input
                    value={problem.pattern}
                    onChange={(e) =>
                      setProblem({ ...problem, pattern: e.target.value })
                    }
                    placeholder="e.g. BFS, sliding window"
                  />
                </label>

                <label>
                  Difficulty
                  <select
                    value={problem.difficulty}
                    onChange={(e) =>
                      setProblem({ ...problem, difficulty: e.target.value })
                    }
                  >
                    <option>Easy</option>
                    <option>Medium</option>
                    <option>Hard</option>
                  </select>
                </label>

                <label>
                  Outcome
                  <select
                    value={problem.status}
                    onChange={(e) =>
                      setProblem({ ...problem, status: e.target.value })
                    }
                  >
                    <option>Solved</option>
                    <option>Hint used</option>
                    <option>Editorial</option>
                    <option>Unsolved</option>
                  </select>
                </label>

                <label>
                  Time (minutes)
                  <input
                    type="number"
                    value={problem.minutes}
                    onChange={(e) =>
                      setProblem({
                        ...problem,
                        minutes: Number(e.target.value),
                      })
                    }
                  />
                </label>

                <label>
                  Hints used
                  <input
                    type="number"
                    value={problem.hints}
                    onChange={(e) =>
                      setProblem({
                        ...problem,
                        hints: Number(e.target.value),
                      })
                    }
                  />
                </label>

                <label>
                  Reflection
                  <textarea
                    value={problem.reflection}
                    onChange={(e) =>
                      setProblem({
                        ...problem,
                        reflection: e.target.value,
                      })
                    }
                    placeholder="Recognition, approach, bug, complexity, next revision…"
                  />
                </label>

                <button className="primary" onClick={saveProblem}>
                  <Plus size={16} />
                  Add problem
                </button>
              </div>
            </div>

            <div className="panel">
              <div className="panelHead">
                <div>
                  <h3>Problem history</h3>
                  <p>{data.problems.length} logged</p>
                </div>
              </div>

              {data.problems.map((p) => (
                <article className="problemRow" key={p.id}>
                  <div>
                    <b>{p.name}</b>

                    <small>
                      {p.pattern || 'Pattern not tagged'} · {p.difficulty} ·{' '}
                      {p.minutes} min · {p.hints} hints
                    </small>

                    {p.reflection && <p>{p.reflection}</p>}

                    {p.url && (
                      <a href={p.url} target="_blank" rel="noreferrer">
                        <ExternalLink size={13} /> Open problem
                      </a>
                    )}
                  </div>

                  <span
                    className={
                      'pill ' +
                      (p.status === 'Solved' ? 'success' : 'pending')
                    }
                  >
                    {p.status}
                  </span>
                </article>
              ))}
            </div>
          </div>
        )}

        {page === 'Reviews & mocks' && (
          <div className="panel">
            <div className="panelHead">
              <div>
                <h3>Review & mock interview log</h3>
                <p>
                  Coming next: structured rubric, scores, trend analysis, and
                  mock feedback.
                </p>
              </div>
            </div>

            <div className="empty large">
              <ClipboardCheck size={32} />
              <b>Mock interview module is next</b>
              <p>
                We'll add separate coding, communication, correctness,
                complexity, testing, and behavioral scorecards.
              </p>
            </div>
          </div>
        )}

        <footer>
          Prototype v0.1 · Built around your roadmap ·{' '}
          <button onClick={exportData}>Export your data</button>
        </footer>
      </section>
    </main>
  );
}

function Stat({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="stat">
      <div className={'statIcon ' + color}>
        <Icon size={18} />
      </div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{sub}</small>
    </div>
  );
}
