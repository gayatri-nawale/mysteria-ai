import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import useMysteryStore from '../store/mysteryStore'

const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } }

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return '—'
  }
}

function ScoreBadge({ score, correct }) {
  const color = correct ? '#14B8A6' : '#EF4444'
  const bg = correct ? 'rgba(20,184,166,0.1)' : 'rgba(239,68,68,0.1)'
  const border = correct ? 'rgba(20,184,166,0.3)' : 'rgba(239,68,68,0.3)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{
        backgroundColor: bg,
        border: `1px solid ${border}`,
        borderRadius: 9999,
        padding: '4px 12px',
        fontSize: 12,
        fontWeight: 700,
        color,
      }}>
        {correct ? '✓ SOLVED' : '✗ WRONG'}
      </div>
      {score !== undefined && (
        <div style={{
          backgroundColor: 'rgba(139,92,246,0.1)',
          border: '1px solid rgba(139,92,246,0.3)',
          borderRadius: 9999,
          padding: '4px 10px',
          fontSize: 12,
          fontWeight: 700,
          color: '#c4b5fd',
        }}>
          {score}/100
        </div>
      )}
    </div>
  )
}

export default function CaseHistory() {
  const navigate = useNavigate()
  const { completedCases } = useMysteryStore()

  const totalSolved = completedCases.filter((c) => c.correct).length
  const avgScore = completedCases.length
    ? Math.round(completedCases.reduce((a, c) => a + (c.score || 0), 0) / completedCases.length)
    : 0

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0A0A0F', fontFamily: 'Inter, sans-serif', color: '#F8FAFC' }}>
      {/* ── Header ── */}
      <div style={{
        maxWidth: 900,
        margin: '0 auto',
        padding: '60px 24px 0',
      }}>
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#475569', marginBottom: 8 }}>
            DETECTIVE RECORDS
          </p>
          <h1 style={{ fontFamily: 'Cinzel, serif', fontSize: 36, fontWeight: 700, color: '#F8FAFC', margin: 0, marginBottom: 8 }}>
            Case History
          </h1>
          <p style={{ fontSize: 14, color: '#475569', marginBottom: 40 }}>
            All mysteries you have investigated
          </p>
        </motion.div>

        {/* ── Stats Row ── */}
        {completedCases.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            style={{ display: 'flex', gap: 16, marginBottom: 40, flexWrap: 'wrap' }}
          >
            {[
              { label: 'Cases Investigated', value: completedCases.length },
              { label: 'Solved', value: totalSolved },
              { label: 'Failed', value: completedCases.length - totalSolved },
              { label: 'Avg Score', value: `${avgScore}/100` },
            ].map((stat) => (
              <div key={stat.label} style={{
                backgroundColor: '#12121A',
                border: '1px solid #1E1E2E',
                borderRadius: 12,
                padding: '16px 22px',
                minWidth: 140,
                flex: '1 1 140px',
              }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#F8FAFC', marginBottom: 2 }}>{stat.value}</div>
                <div style={{ fontSize: 11, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{stat.label}</div>
              </div>
            ))}
          </motion.div>
        )}

        {/* ── Empty State ── */}
        {completedCases.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              textAlign: 'center',
              padding: '80px 24px',
              backgroundColor: '#12121A',
              border: '1px solid #1E1E2E',
              borderRadius: 20,
            }}
          >
            <div style={{ fontSize: 56, marginBottom: 20 }}>🕵️</div>
            <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: 22, color: '#F8FAFC', marginBottom: 12 }}>
              No Cases on Record Yet
            </h2>
            <p style={{ fontSize: 14, color: '#475569', marginBottom: 32, maxWidth: 360, margin: '0 auto 32px' }}>
              Solve your first mystery to see your detective record here. Each case you close will be archived.
            </p>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/generate')}
              style={{
                backgroundColor: '#8B5CF6',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                padding: '14px 32px',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'Cinzel, serif',
                letterSpacing: '0.05em',
              }}
            >
              Start a New Case
            </motion.button>
          </motion.div>
        )}

        {/* ── Case Cards ── */}
        <AnimatePresence>
          {completedCases.length > 0 && (
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="visible"
              style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 80 }}
            >
              {completedCases.map((c, i) => (
                <motion.div
                  key={c.id || i}
                  variants={fadeUp}
                  style={{
                    backgroundColor: '#12121A',
                    border: `1px solid ${c.correct ? 'rgba(20,184,166,0.2)' : 'rgba(239,68,68,0.15)'}`,
                    borderRadius: 16,
                    padding: '24px 28px',
                  }}
                >
                  {/* Top row */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#475569', marginBottom: 4 }}>
                        {c.genre} · {c.difficulty} · {formatDate(c.solvedAt)}
                      </p>
                      <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: 20, color: '#F8FAFC', margin: 0 }}>
                        {c.title}
                      </h3>
                    </div>
                    <ScoreBadge score={c.score} correct={c.correct} />
                  </div>

                  {/* Details grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: c.ending ? 16 : 0 }}>
                    {[
                      { label: 'Victim', value: c.victim?.name || '—', icon: '💀' },
                      { label: 'Real Culprit', value: c.culprit, icon: '🔍' },
                      { label: 'You Accused', value: c.accused, icon: '⚖️', highlight: !c.correct },
                      { label: 'Evidence Found', value: `${c.evidenceFound} clue${c.evidenceFound !== 1 ? 's' : ''}`, icon: '🔎' },
                      { label: 'Suspects Questioned', value: `${c.suspectsInterrogated} suspect${c.suspectsInterrogated !== 1 ? 's' : ''}`, icon: '🗣️' },
                    ].map((detail) => (
                      <div key={detail.label} style={{
                        backgroundColor: '#0E0E16',
                        border: `1px solid ${detail.highlight ? 'rgba(239,68,68,0.25)' : '#1E1E2E'}`,
                        borderRadius: 10,
                        padding: '10px 14px',
                      }}>
                        <p style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                          {detail.icon} {detail.label}
                        </p>
                        <p style={{ fontSize: 13, fontWeight: 600, color: detail.highlight ? '#FCA5A5' : '#F8FAFC', margin: 0 }}>
                          {detail.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Ending reveal */}
                  {c.ending && (
                    <div style={{
                      backgroundColor: c.correct ? 'rgba(20,184,166,0.06)' : 'rgba(239,68,68,0.06)',
                      border: `1px solid ${c.correct ? 'rgba(20,184,166,0.15)' : 'rgba(239,68,68,0.15)'}`,
                      borderRadius: 10,
                      padding: '12px 16px',
                    }}>
                      <p style={{ fontSize: 11, color: '#475569', fontStyle: 'italic', margin: 0 }}>
                        "{c.ending}"
                      </p>
                    </div>
                  )}
                </motion.div>
              ))}

              {/* New case CTA */}
              <motion.button
                variants={fadeUp}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/generate')}
                style={{
                  backgroundColor: 'transparent',
                  border: '2px dashed #1E1E2E',
                  borderRadius: 16,
                  padding: '24px',
                  cursor: 'pointer',
                  color: '#475569',
                  fontSize: 14,
                  fontFamily: 'Inter, sans-serif',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                }}
              >
                <span style={{ fontSize: 20 }}>+</span>
                Start a New Investigation
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
