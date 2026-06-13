import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import useMysteryStore from '../store/mysteryStore'
import { submitAccusation } from '../lib/api'

// ─── Constants ────────────────────────────────────────────────
const TOP_H = 56
const BOT_H = 64

const TYPE_META = {
  document: { icon: '📄', color: '#F59E0B' },
  photo:    { icon: '📸', color: '#3B82F6' },
  message:  { icon: '💬', color: '#8B5CF6' },
  physical: { icon: '🔧', color: '#14B8A6' },
}

const KNOWLEDGE_SOURCES = ['Criminal Psychology', 'Forensic Procedures', 'Behavioral Analysis', 'Legal Evidence Standards']

// ─── Tiny helpers ─────────────────────────────────────────────
const avatarColor = (name = '') => {
  const colors = ['#8B5CF6', '#14B8A6', '#F59E0B', '#EF4444', '#3B82F6', '#EC4899']
  return colors[name.charCodeAt(0) % colors.length]
}

const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }

// ─── Inline sub-components ────────────────────────────────────
function EvidenceCard({ evidence, discovered, suspects }) {
  const meta = TYPE_META[evidence.type] || TYPE_META.physical
  const pointedSuspect = suspects.find((s) => s.id === evidence.pointsTo)

  if (!discovered) {
    return (
      <motion.div
        variants={fadeUp}
        style={{
          backgroundColor: '#0E0E16',
          border: '1px solid #1E1E2E',
          borderRadius: 12,
          padding: '16px',
          filter: 'blur(0px)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ filter: 'blur(4px)', opacity: 0.3 }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>?</div>
          <div style={{ height: 10, backgroundColor: '#1E1E2E', borderRadius: 4, marginBottom: 6, width: '70%' }} />
          <div style={{ height: 8, backgroundColor: '#1E1E2E', borderRadius: 4, width: '90%' }} />
        </div>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
          }}
        >
          <span style={{ fontSize: 22 }}>🔒</span>
          <span style={{ fontSize: 11, color: '#475569', textAlign: 'center' }}>Visit location<br />to discover</span>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      variants={fadeUp}
      style={{
        backgroundColor: '#12121A',
        border: `1px solid ${meta.color}40`,
        borderLeft: `3px solid ${meta.color}`,
        borderRadius: 12,
        padding: '16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 20 }}>{meta.icon}</span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: meta.color,
            backgroundColor: `${meta.color}18`,
            padding: '2px 8px',
            borderRadius: 9999,
          }}
        >
          {evidence.type}
        </span>
      </div>
      <p style={{ fontSize: 13, fontWeight: 600, color: '#F8FAFC', marginBottom: 6, fontFamily: 'Inter, sans-serif' }}>
        {evidence.title}
      </p>
      <p style={{ fontSize: 12, color: '#64748B', lineHeight: 1.6, marginBottom: 8 }}>{evidence.description}</p>
      {pointedSuspect && (
        <p style={{ fontSize: 11, color: '#8B5CF6', borderTop: '1px solid #1E1E2E', paddingTop: 8 }}>
          Points toward: <strong>{pointedSuspect.name}</strong>
        </p>
      )}
    </motion.div>
  )
}

function SuspectCard({ suspect, interrogatedSuspects, mysteryId, navigate }) {
  const questioned = interrogatedSuspects.includes(suspect.id)
  return (
    <motion.div
      variants={fadeUp}
      style={{
        backgroundColor: '#12121A',
        border: '1px solid #1E1E2E',
        borderRadius: 12,
        padding: '16px',
        marginBottom: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            backgroundColor: avatarColor(suspect.name),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            fontWeight: 700,
            color: '#fff',
            flexShrink: 0,
          }}
        >
          {suspect.name?.[0] ?? '?'}
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#F8FAFC', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {suspect.name}
          </p>
          <p style={{ fontSize: 11, color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {suspect.occupation}
          </p>
        </div>
      </div>

      <p style={{ fontSize: 11, color: questioned ? '#14B8A6' : '#475569', marginBottom: 12 }}>
        {questioned ? '✓ Questioned' : '○ Not yet questioned'}
      </p>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => navigate(`/interrogate/${mysteryId}/${suspect.id}`)}
        style={{
          width: '100%',
          backgroundColor: '#1E1E2E',
          border: '1px solid #2D2D3F',
          borderRadius: 8,
          padding: '8px 0',
          fontSize: 13,
          fontWeight: 600,
          color: '#8B5CF6',
          cursor: 'pointer',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        Interrogate →
      </motion.button>
    </motion.div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate()

  const {
    currentMystery,
    discoveredEvidence,
    interrogatedSuspects,
    playerNotes,
    xp,
    setMystery,
    discoverEvidence,
    setNotes,
    addXP,
    saveCase,
  } = useMysteryStore()

  const mystery = currentMystery ?? (() => {
    try { return JSON.parse(localStorage.getItem('currentMystery')) } catch { return null }
  })()

  // hydrate store from localStorage if needed
  useEffect(() => {
    if (!currentMystery && mystery) setMystery(mystery)
  }, []) // eslint-disable-line

  const [activeLocation, setActiveLocation] = useState(null)
  const [visitedLocations, setVisitedLocations] = useState([])
  const [knowledgeOpen, setKnowledgeOpen] = useState(true)

  // Accusation modal
  const [accusationOpen, setAccusationOpen] = useState(false)
  const [accusedSuspectId, setAccusedSuspectId] = useState('')
  const [reasoning, setReasoning] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Verdict modal
  const [verdict, setVerdict] = useState(null)
  const [verdictOpen, setVerdictOpen] = useState(false)

  // ── No mystery guard ──
  if (!mystery) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0A0A0F', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, fontFamily: 'Inter, sans-serif' }}>
        <span style={{ fontSize: 48 }}>🗂️</span>
        <p style={{ color: '#94A3B8', fontSize: 16 }}>No active case.</p>
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/generate')}
          style={{ backgroundColor: '#8B5CF6', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
        >
          Generate a Mystery →
        </motion.button>
      </div>
    )
  }

  const totalEvidence = mystery.evidence?.length ?? 0
  const foundCount = discoveredEvidence.length
  const canAccuse = foundCount >= 2

  // ── Visit a location ──
  function visitLocation(loc) {
    if (!visitedLocations.includes(loc.id)) {
      setVisitedLocations((prev) => [...prev, loc.id])
    }
    setActiveLocation(loc.id)
    const undiscovered = (loc.cluesHere ?? []).filter((id) => !discoveredEvidence.includes(id))
    if (undiscovered.length > 0) {
      const pick = undiscovered[Math.floor(Math.random() * undiscovered.length)]
      discoverEvidence(pick)
      toast.success('New evidence discovered!', { icon: '🔎' })
    } else if (loc.cluesHere?.length > 0) {
      toast('All evidence here collected.', { icon: '✓' })
    } else {
      toast('Nothing found at this location.', { icon: '🚶' })
    }
  }

  // ── Submit accusation ──
  async function handleAccuse() {
    if (!accusedSuspectId || !reasoning.trim()) {
      toast.error('Select a suspect and write your reasoning.')
      return
    }
    setSubmitting(true)
    try {
      const result = await submitAccusation({ mystery, accusedSuspectId, playerReasoning: reasoning })
      if (result.error) throw new Error(result.message)
      setVerdict(result)
      setAccusationOpen(false)
      setVerdictOpen(true)
      if (result.correct) addXP(100)

      // Persist to case history
      const guiltySuspect = mystery.suspects?.find((s) => s.isGuilty)
      const accusedSuspect = mystery.suspects?.find((s) => s.id === accusedSuspectId)
      saveCase({
        id: mystery.id || `case_${Date.now()}`,
        title: mystery.title,
        genre: mystery.genre || 'Unknown',
        difficulty: mystery.difficulty || 'Medium',
        victim: mystery.victim,
        culprit: guiltySuspect?.name || 'Unknown',
        accused: accusedSuspect?.name || 'Unknown',
        correct: result.correct,
        score: result.score,
        ending: result.ending,
        evidenceFound: discoveredEvidence.length,
        suspectsInterrogated: interrogatedSuspects.length,
        solvedAt: new Date().toISOString(),
      })
    } catch {
      toast.error('Failed to submit. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Panels base style ──
  const panel = {
    overflowY: 'auto',
    padding: '20px 16px',
    height: `calc(100vh - ${TOP_H + BOT_H}px)`,
  }

  const sectionLabel = {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: '#475569',
    marginBottom: 14,
  }

  return (
    <div style={{ backgroundColor: '#0A0A0F', fontFamily: 'Inter, sans-serif', color: '#F8FAFC', height: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* ══════════ TOP BAR ══════════ */}
      <div style={{ height: TOP_H, backgroundColor: '#0A0A0F', borderBottom: '1px solid #1E1E2E', display: 'flex', alignItems: 'center', padding: '0 20px', gap: 16, flexShrink: 0, zIndex: 10 }}>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/generate')}
          style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 18, padding: 0 }}
        >
          ←
        </motion.button>
        <span style={{ fontFamily: 'Cinzel, serif', fontSize: 15, fontWeight: 600, color: '#F8FAFC', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {mystery.title}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, backgroundColor: '#12121A', border: '1px solid #1E1E2E', borderRadius: 8, padding: '5px 12px' }}>
          <span style={{ fontSize: 14 }}>⭐</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#F59E0B' }}>{xp} XP</span>
        </div>
      </div>

      {/* ══════════ MAIN CONTENT ══════════ */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── LEFT PANEL ── */}
        <div style={{ width: '25%', borderRight: '1px solid #1E1E2E', ...panel }}>
          <p style={sectionLabel}>📁 Case File</p>

          <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: 16, fontWeight: 700, color: '#F8FAFC', marginBottom: 10, lineHeight: 1.35 }}>
            {mystery.title}
          </h2>

          <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 600, backgroundColor: 'rgba(139,92,246,0.15)', color: '#c4b5fd', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 9999, padding: '3px 12px', marginBottom: 20 }}>
            {mystery.genre ?? 'Unknown Genre'}
          </span>

          {/* Victim */}
          <div style={{ backgroundColor: '#12121A', border: '1px solid #1E1E2E', borderRadius: 10, padding: 14, marginBottom: 20 }}>
            <p style={{ fontSize: 10, color: '#EF4444', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
              ☠ Victim
            </p>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#F8FAFC', marginBottom: 4 }}>{mystery.victim?.name}</p>
            <p style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>{mystery.victim?.occupation}</p>
            <p style={{ fontSize: 11, color: '#EF4444', opacity: 0.8 }}>{mystery.victim?.causeOfDeath}</p>
          </div>

          {/* Progress */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: '#64748B' }}>Evidence Found</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#8B5CF6' }}>{foundCount}/{totalEvidence}</span>
            </div>
            <div style={{ height: 6, backgroundColor: '#1E1E2E', borderRadius: 9999, overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: totalEvidence > 0 ? `${(foundCount / totalEvidence) * 100}%` : '0%' }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                style={{ height: '100%', backgroundColor: '#8B5CF6', borderRadius: 9999 }}
              />
            </div>
          </div>

          {/* Player notes */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ ...sectionLabel, marginBottom: 8 }}>📝 Your Notes</p>
            <textarea
              value={playerNotes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Write your deductions here..."
              rows={5}
              style={{
                width: '100%',
                backgroundColor: '#0E0E16',
                border: '1px solid #1E1E2E',
                borderRadius: 8,
                padding: 10,
                color: '#F8FAFC',
                fontSize: 12,
                fontFamily: 'JetBrains Mono, monospace',
                resize: 'vertical',
                outline: 'none',
                lineHeight: 1.7,
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Knowledge sources — Foundry IQ */}
          <div>
            <button
              onClick={() => setKnowledgeOpen((v) => !v)}
              style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', padding: 0, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Inter, sans-serif', marginBottom: 10 }}
            >
              🔍 Knowledge Sources {knowledgeOpen ? '▾' : '▸'}
            </button>
            <AnimatePresence>
              {knowledgeOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {KNOWLEDGE_SOURCES.map((src) => (
                      <span
                        key={src}
                        style={{ fontSize: 11, color: '#14B8A6', backgroundColor: 'rgba(20,184,166,0.1)', border: '1px solid rgba(20,184,166,0.25)', borderRadius: 9999, padding: '3px 10px' }}
                      >
                        {src}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── CENTER PANEL ── */}
        <div style={{ width: '50%', borderRight: '1px solid #1E1E2E', ...panel }}>
          <p style={sectionLabel}>🔎 Evidence Board</p>

          {/* ── LOCATION SECTION ── */}
          <div style={{
            backgroundColor: 'rgba(139,92,246,0.06)',
            border: '1px solid rgba(139,92,246,0.2)',
            borderRadius: 14,
            padding: '16px',
            marginBottom: 24,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 16 }}>🗺️</span>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#c4b5fd', margin: 0 }}>
                Visit a Location to Discover Evidence
              </p>
              <span style={{ fontSize: 11, color: '#475569', marginLeft: 'auto' }}>
                {visitedLocations.length}/{mystery.locations?.length ?? 0} visited
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
              {mystery.locations?.map((loc) => {
                const isActive = activeLocation === loc.id
                const visited = visitedLocations.includes(loc.id)
                const hasClues = loc.cluesHere?.length > 0
                return (
                  <motion.button
                    key={loc.id}
                    whileHover={{ scale: 1.04, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => visitLocation(loc)}
                    style={{
                      backgroundColor: isActive
                        ? 'rgba(139,92,246,0.2)'
                        : visited
                        ? 'rgba(20,184,166,0.06)'
                        : '#12121A',
                      border: isActive
                        ? '2px solid #8B5CF6'
                        : visited
                        ? '1px solid rgba(20,184,166,0.4)'
                        : '1px solid #2D2D3F',
                      borderRadius: 10,
                      padding: '12px 14px',
                      cursor: 'pointer',
                      fontFamily: 'Inter, sans-serif',
                      textAlign: 'left',
                      width: '100%',
                    }}
                  >
                    <div style={{ fontSize: 20, marginBottom: 6 }}>
                      {visited ? '✅' : hasClues ? '📍' : '🚪'}
                    </div>
                    <p style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: isActive ? '#c4b5fd' : visited ? '#14B8A6' : '#F8FAFC',
                      margin: 0,
                      marginBottom: 4,
                    }}>
                      {loc.name}
                    </p>
                    <p style={{ fontSize: 10, color: '#475569', margin: 0 }}>
                      {visited
                        ? 'Searched'
                        : hasClues
                        ? `${loc.cluesHere.length} clue${loc.cluesHere.length !== 1 ? 's' : ''} hidden`
                        : 'No clues'}
                    </p>
                  </motion.button>
                )
              })}
            </div>
          </div>

          {/* Active location info */}
          <AnimatePresence mode="wait">
            {activeLocation && (
              <motion.div
                key={activeLocation}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{ backgroundColor: '#0E0E16', border: '1px solid #1E1E2E', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}
              >
                {(() => {
                  const loc = mystery.locations.find((l) => l.id === activeLocation)
                  return (
                    <>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#F8FAFC', marginBottom: 4 }}>📍 {loc?.name}</p>
                      <p style={{ fontSize: 12, color: '#64748B' }}>{loc?.description}</p>
                    </>
                  )
                })()}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Evidence grid */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}
          >
            {mystery.evidence?.map((ev) => (
              <EvidenceCard
                key={ev.id}
                evidence={ev}
                discovered={discoveredEvidence.includes(ev.id)}
                suspects={discoveredEvidence.length >= 3 ? mystery.suspects : []}
              />
            ))}
          </motion.div>

          {/* Case description */}
          <div style={{ marginTop: 28, backgroundColor: '#12121A', border: '1px solid #1E1E2E', borderRadius: 12, padding: '16px 18px' }}>
            <p style={{ fontSize: 11, color: '#475569', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Case Summary</p>
            <p style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.75 }}>{mystery.caseDescription}</p>
          </div>

          {/* Timeline */}
          {mystery.timeline?.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <p style={{ ...sectionLabel, marginBottom: 14 }}>🕐 Timeline</p>
              <div style={{ position: 'relative', paddingLeft: 20 }}>
                <div style={{ position: 'absolute', left: 7, top: 6, bottom: 6, width: 1, backgroundColor: '#1E1E2E' }} />
                {mystery.timeline.map((event, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    style={{ position: 'relative', marginBottom: 14 }}
                  >
                    <div style={{ position: 'absolute', left: -16, top: 5, width: 8, height: 8, borderRadius: '50%', backgroundColor: '#1E1E2E', border: '2px solid #8B5CF6' }} />
                    <p style={{ fontSize: 11, color: '#8B5CF6', fontWeight: 600, marginBottom: 2 }}>{event.time}</p>
                    <p style={{ fontSize: 12, color: '#64748B' }}>{event.event}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={{ width: '25%', ...panel }}>
          <p style={sectionLabel}>👥 Suspects</p>
          <motion.div variants={stagger} initial="hidden" animate="visible">
            {mystery.suspects?.map((suspect) => (
              <SuspectCard
                key={suspect.id}
                suspect={suspect}
                interrogatedSuspects={interrogatedSuspects}
                mysteryId="case-001"
                navigate={navigate}
              />
            ))}
          </motion.div>
        </div>
      </div>

      {/* ══════════ BOTTOM BAR ══════════ */}
      <div
        style={{
          height: BOT_H,
          backgroundColor: '#0A0A0F',
          borderTop: '1px solid #1E1E2E',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          gap: 12,
          flexShrink: 0,
          zIndex: 10,
        }}
      >
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/theory/case-001')}
          style={{ backgroundColor: '#12121A', border: '1px solid #1E1E2E', borderRadius: 10, padding: '10px 20px', fontSize: 14, fontWeight: 600, color: '#F8FAFC', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
        >
          📋 Theory Board
        </motion.button>

        <div style={{ flex: 1 }} />

        <div style={{ fontSize: 12, color: '#334155' }}>
          {canAccuse ? 'Ready to make an accusation' : `Discover ${2 - foundCount} more evidence to accuse`}
        </div>

        <motion.button
          whileHover={canAccuse ? { scale: 1.03, boxShadow: '0 0 20px rgba(239,68,68,0.35)' } : {}}
          whileTap={canAccuse ? { scale: 0.97 } : {}}
          onClick={() => canAccuse && setAccusationOpen(true)}
          style={{
            backgroundColor: canAccuse ? '#EF4444' : '#1E1E2E',
            border: 'none',
            borderRadius: 10,
            padding: '10px 20px',
            fontSize: 14,
            fontWeight: 600,
            color: canAccuse ? '#fff' : '#334155',
            cursor: canAccuse ? 'pointer' : 'not-allowed',
            fontFamily: 'Inter, sans-serif',
            transition: 'background-color 0.2s',
          }}
        >
          ⚖️ Make Accusation
        </motion.button>
      </div>

      {/* ══════════ ACCUSATION MODAL ══════════ */}
      <AnimatePresence>
        {accusationOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
            onClick={(e) => e.target === e.currentTarget && setAccusationOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              style={{ backgroundColor: '#12121A', border: '1px solid #1E1E2E', borderRadius: 20, padding: 32, width: '100%', maxWidth: 520 }}
            >
              <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: 22, color: '#F8FAFC', marginBottom: 6 }}>Make Your Accusation</h2>
              <p style={{ fontSize: 13, color: '#475569', marginBottom: 28 }}>Choose wisely. A wrong accusation costs you rank.</p>

              <p style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600, marginBottom: 14 }}>Select the culprit:</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                {mystery.suspects?.map((s) => {
                  const selected = accusedSuspectId === s.id
                  return (
                    <motion.label
                      key={s.id}
                      whileHover={{ scale: 1.01 }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        backgroundColor: selected ? 'rgba(239,68,68,0.1)' : '#0E0E16',
                        border: selected ? '1px solid rgba(239,68,68,0.5)' : '1px solid #1E1E2E',
                        borderRadius: 10,
                        padding: '12px 16px',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      <input
                        type="radio"
                        name="suspect"
                        value={s.id}
                        checked={selected}
                        onChange={() => setAccusedSuspectId(s.id)}
                        style={{ accentColor: '#EF4444' }}
                      />
                      <div
                        style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: avatarColor(s.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}
                      >
                        {s.name?.[0]}
                      </div>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#F8FAFC' }}>{s.name}</p>
                        <p style={{ fontSize: 11, color: '#64748B' }}>{s.occupation}</p>
                      </div>
                    </motion.label>
                  )
                })}
              </div>

              <p style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600, marginBottom: 10 }}>Your reasoning:</p>
              <textarea
                value={reasoning}
                onChange={(e) => setReasoning(e.target.value)}
                placeholder="Explain why you believe this person is guilty..."
                rows={4}
                style={{
                  width: '100%',
                  backgroundColor: '#0E0E16',
                  border: '1px solid #1E1E2E',
                  borderRadius: 8,
                  padding: 12,
                  color: '#F8FAFC',
                  fontSize: 13,
                  fontFamily: 'Inter, sans-serif',
                  resize: 'none',
                  outline: 'none',
                  lineHeight: 1.7,
                  boxSizing: 'border-box',
                  marginBottom: 20,
                }}
              />

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => setAccusationOpen(false)}
                  style={{ flex: 1, backgroundColor: '#1E1E2E', border: 'none', borderRadius: 10, padding: '12px 0', fontSize: 14, fontWeight: 600, color: '#64748B', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.03, boxShadow: '0 0 24px rgba(239,68,68,0.4)' }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleAccuse}
                  disabled={submitting}
                  style={{ flex: 2, backgroundColor: '#EF4444', border: 'none', borderRadius: 10, padding: '12px 0', fontSize: 14, fontWeight: 600, color: '#fff', cursor: submitting ? 'wait' : 'pointer', fontFamily: 'Inter, sans-serif' }}
                >
                  {submitting ? 'Submitting...' : 'Submit Accusation'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════ VERDICT MODAL ══════════ */}
      <AnimatePresence>
        {verdictOpen && verdict && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              style={{
                backgroundColor: verdict.correct ? 'rgba(20,184,166,0.08)' : 'rgba(239,68,68,0.08)',
                border: `1px solid ${verdict.correct ? 'rgba(20,184,166,0.4)' : 'rgba(239,68,68,0.4)'}`,
                borderRadius: 20,
                padding: 40,
                width: '100%',
                maxWidth: 480,
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 52, marginBottom: 16 }}>{verdict.correct ? '🎉' : '❌'}</div>
              <h2
                style={{
                  fontFamily: 'Cinzel, serif',
                  fontSize: 26,
                  fontWeight: 700,
                  color: verdict.correct ? '#14B8A6' : '#EF4444',
                  marginBottom: 12,
                }}
              >
                {verdict.correct ? 'Case Solved!' : 'Wrong Accusation'}
              </h2>

              {verdict.correct && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 9999, padding: '4px 16px', marginBottom: 20 }}>
                  <span style={{ fontSize: 14 }}>⭐</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#F59E0B' }}>Score: {verdict.score}/100 · +100 XP</span>
                </div>
              )}

              <p style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.8, marginBottom: 28 }}>
                {verdict.correct ? verdict.ending : verdict.hint}
              </p>

              {verdict.correct ? (
                <div style={{ display: 'flex', gap: 12 }}>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { setVerdictOpen(false); navigate('/generate') }}
                    style={{ flex: 1, backgroundColor: '#14B8A6', border: 'none', borderRadius: 10, padding: '12px 0', fontSize: 14, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
                  >
                    New Case →
                  </motion.button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 12 }}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setVerdictOpen(false)}
                    style={{ flex: 1, backgroundColor: '#1E1E2E', border: 'none', borderRadius: 10, padding: '12px 0', fontSize: 14, fontWeight: 600, color: '#64748B', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
                  >
                    Keep Investigating
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { setVerdictOpen(false); setAccusationOpen(true) }}
                    style={{ flex: 1, backgroundColor: '#EF4444', border: 'none', borderRadius: 10, padding: '12px 0', fontSize: 14, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
                  >
                    Try Again
                  </motion.button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
