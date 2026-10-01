import { useCallback, useEffect, useState } from 'react'
import { api } from './api'
import { STATUSES, type Dash, type Interview, type Job, type JobIn, type Match, type Resume, type Skill } from './types'

const today = () => new Date().toISOString().slice(0, 10)
const fmt = (d: string | null) => (d ? new Date(d).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Not scheduled')
const blank = (): JobIn => ({
  company: '', role: '', location: '', salary: '', status: 'Applied', applied_date: today(),
  deadline: null, job_description: '', resume_id: null,
})

export default function App() {
  const [tab, setTab] = useState<'dashboard' | 'applications' | 'profile'>('dashboard')
  const [jobs, setJobs] = useState<Job[]>([])
  const [resumes, setResumes] = useState<Resume[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [dash, setDash] = useState<Dash | null>(null)
  const [q, setQ] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [editing, setEditing] = useState<Job | 'new' | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const p = new URLSearchParams({ q, status: statusFilter })
      const [j, r, s, d] = await Promise.all([
        api.get<Job[]>('/applications?' + p), api.get<Resume[]>('/resumes'),
        api.get<Skill[]>('/skills'), api.get<Dash>('/dashboard'),
      ])
      setJobs(j); setResumes(r); setSkills(s); setDash(d); setError('')
    } catch { setError('Cannot reach the API. Is the backend running on port 8000?') }
  }, [q, statusFilter])

  useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t) }, [load])

  return (
    <div className="shell">
      <header>
        <h1>Job Tracker</h1>
        <nav>
          {(['dashboard', 'applications', 'profile'] as const).map(t => (
            <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>
              {t === 'profile' ? 'Skills & resumes' : t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </nav>
        <button className="primary" onClick={() => setEditing('new')}>Add application</button>
      </header>
      {error && <p className="error">{error}</p>}

      {tab === 'dashboard' && dash && <Dashboard d={dash} />}

      {tab === 'applications' && (
        <section>
          <div className="filters">
            <input placeholder="Search company, role, location, description" value={q} onChange={e => setQ(e.target.value)} />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All statuses</option>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          {jobs.length === 0 && <p className="muted">No applications yet. Add your first one to start tracking.</p>}
          <ul className="jobs">
            {jobs.map(j => (
              <li key={j.id} onClick={() => setEditing(j)}>
                <div><strong>{j.role}</strong> at {j.company}<div className="muted">{[j.location, j.salary].filter(Boolean).join(' | ') || 'No location or salary'}</div></div>
                <div className="right"><span className={'pill ' + j.status}>{j.status}</span>
                  <div className="muted">{j.interviews.length} interview(s) | applied {j.applied_date}</div></div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === 'profile' && <Profile skills={skills} resumes={resumes} reload={load} />}

      {editing && (
        <JobModal job={editing === 'new' ? null : editing} resumes={resumes}
          onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load() }} reload={load} />
      )}
    </div>
  )
}

function Dashboard({ d }: { d: Dash }) {
  const stats: [string, string | number][] = [
    ['Applications this month', d.this_month], ['Interviews', d.interviews],
    ['Offers', d.offers], ['Rejection rate', d.rejection_rate + '%'],
  ]
  return (
    <section>
      <div className="stats">{stats.map(([l, v]) => <div key={l} className="stat"><b>{v}</b><span>{l}</span></div>)}</div>
      <div className="two">
        <div>
          <h2>Pipeline</h2>
          {STATUSES.map(s => (
            <div key={s} className="bar"><span>{s}</span>
              <i className={s} style={{ width: `${d.total ? (100 * d.by_status[s]) / d.total : 0}%` }} />
              <em>{d.by_status[s]}</em></div>
          ))}
        </div>
        <div>
          <h2>Upcoming interviews</h2>
          {d.upcoming.length === 0 && <p className="muted">Nothing scheduled.</p>}
          {d.upcoming.map(u => <p key={u.id}><strong>{u.company}</strong>, {u.round}<br /><span className="muted">{u.role} | {fmt(u.scheduled_at)}</span></p>)}
        </div>
      </div>
    </section>
  )
}

function Profile({ skills, resumes, reload }: { skills: Skill[]; resumes: Resume[]; reload: () => void }) {
  const [skill, setSkill] = useState('')
  const [rName, setRName] = useState('')
  const [rNotes, setRNotes] = useState('')
  return (
    <section className="two">
      <div>
        <h2>Your skills</h2>
        <p className="muted">These are compared against each job description.</p>
        <form className="row" onSubmit={async e => { e.preventDefault(); if (skill.trim()) { await api.post('/skills', { name: skill }); setSkill(''); reload() } }}>
          <input placeholder="e.g. Python, React, Docker" value={skill} onChange={e => setSkill(e.target.value)} />
          <button className="primary">Add skill</button>
        </form>
        <div className="chips">{skills.map(s => <span key={s.id} className="chip">{s.name}<button onClick={async () => { await api.del('/skills/' + s.id); reload() }}>x</button></span>)}</div>
      </div>
      <div>
        <h2>Resume versions</h2>
        <form className="col" onSubmit={async e => { e.preventDefault(); if (rName.trim()) { await api.post('/resumes', { name: rName, notes: rNotes }); setRName(''); setRNotes(''); reload() } }}>
          <input placeholder="Version name, e.g. Backend v3" value={rName} onChange={e => setRName(e.target.value)} />
          <input placeholder="What changed in this version?" value={rNotes} onChange={e => setRNotes(e.target.value)} />
          <button className="primary">Save version</button>
        </form>
        {resumes.map(r => <p key={r.id}><strong>{r.name}</strong> <button className="link" onClick={async () => { await api.del('/resumes/' + r.id); reload() }}>Delete</button><br /><span className="muted">{r.notes}</span></p>)}
      </div>
    </section>
  )
}

function JobModal({ job, resumes, onClose, onSaved, reload }: {
  job: Job | null; resumes: Resume[]; onClose: () => void; onSaved: () => void; reload: () => void
}) {
  const [f, setF] = useState<JobIn>(job ? { ...job } : blank())
  const [ivs, setIvs] = useState<Interview[]>(job?.interviews ?? [])
  const [match, setMatch] = useState<Match | null>(null)
  const [iv, setIv] = useState({ round: '', when: '', notes: '' })
  const set = <K extends keyof JobIn>(k: K, v: JobIn[K]) => setF(p => ({ ...p, [k]: v }))

  const analyse = async () => setMatch(await api.post<Match>('/extract-skills', { text: f.job_description }))
  useEffect(() => { if (job?.job_description) analyse() }, []) // eslint-disable-line

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (job) await api.put('/applications/' + job.id, f); else await api.post('/applications', f)
    onSaved()
  }
  const addIv = async () => {
    if (!job || !iv.round.trim()) return
    const created = await api.post<Interview>(`/applications/${job.id}/interviews`, { round: iv.round, scheduled_at: iv.when || null, notes: iv.notes })
    setIvs([...ivs, created]); setIv({ round: '', when: '', notes: '' }); reload()
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>{job ? 'Edit application' : 'New application'}</h2>
        <form onSubmit={save} className="grid">
          <label>Company<input required value={f.company} onChange={e => set('company', e.target.value)} /></label>
          <label>Role<input required value={f.role} onChange={e => set('role', e.target.value)} /></label>
          <label>Location<input value={f.location} onChange={e => set('location', e.target.value)} /></label>
          <label>Salary<input value={f.salary} onChange={e => set('salary', e.target.value)} /></label>
          <label>Status<select value={f.status} onChange={e => set('status', e.target.value as JobIn['status'])}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select></label>
          <label>Resume version<select value={f.resume_id ?? ''} onChange={e => set('resume_id', e.target.value ? +e.target.value : null)}>
            <option value="">None</option>{resumes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></label>
          <label>Applied on<input type="date" required value={f.applied_date} onChange={e => set('applied_date', e.target.value)} /></label>
          <label>Deadline<input type="date" value={f.deadline ?? ''} onChange={e => set('deadline', e.target.value || null)} /></label>
          <label className="full">Job description
            <textarea rows={6} value={f.job_description} onChange={e => set('job_description', e.target.value)} placeholder="Paste the job description here" /></label>
          <div className="full row">
            <button type="button" onClick={analyse}>Compare with my skills</button>
            <span className="grow" />
            {job && <button type="button" className="danger" onClick={async () => { if (confirm('Delete this application?')) { await api.del('/applications/' + job.id); onSaved() } }}>Delete</button>}
            <button type="button" onClick={onClose}>Cancel</button>
            <button className="primary">Save application</button>
          </div>
        </form>

        {match && (
          <div className="match">
            <h3>Skill match: {match.score}%</h3>
            {match.extracted.length === 0 ? <p className="muted">No known skills found in this description.</p> : <>
              <div className="chips">{match.matched.map(s => <span key={s} className="chip ok">{s}</span>)}{match.missing.map(s => <span key={s} className="chip gap">{s}</span>)}</div>
              <p className="muted">Green: you have it. Red: add it to your skills or work on it before applying.</p></>}
          </div>
        )}

        {job && (
          <div>
            <h3>Interviews</h3>
            {ivs.map(i => (
              <div key={i.id} className="iv">
                <div className="row"><strong>{i.round}</strong><span className="muted grow">{fmt(i.scheduled_at)}</span>
                  <button className="link" onClick={async () => { await api.del('/interviews/' + i.id); setIvs(ivs.filter(x => x.id !== i.id)); reload() }}>Remove</button></div>
                <textarea rows={2} defaultValue={i.notes} placeholder="Notes" onBlur={e => api.put('/interviews/' + i.id, { round: i.round, scheduled_at: i.scheduled_at, notes: e.target.value })} />
              </div>
            ))}
            <div className="row">
              <input placeholder="Round, e.g. Technical" value={iv.round} onChange={e => setIv({ ...iv, round: e.target.value })} />
              <input type="datetime-local" value={iv.when} onChange={e => setIv({ ...iv, when: e.target.value })} />
              <button onClick={addIv}>Add interview</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
