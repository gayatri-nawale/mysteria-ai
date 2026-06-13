import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import useMysteryStore from '../store/mysteryStore'
import { generateMystery } from '../lib/api'

const GENRES = [
  { id: 'Campus Crimes', emoji: '🎓', name: 'Campus Crimes', cases: 'Missing student, Hackathon sabotage, Stolen research' },
  { id: 'Cyberpunk', emoji: '🤖', name: 'Cyberpunk', cases: 'AI rebellion, Data theft, Corporate conspiracy' },
  { id: 'Fantasy Kingdom', emoji: '👑', name: 'Fantasy Kingdom', cases: 'Royal assassination, Magic theft, Dragon crime' },
  { id: 'Space Station', emoji: '🚀', name: 'Space Station', cases: 'Sabotage, Alien infiltration, Missing scientist' },
  { id: 'Historical', emoji: '🏛️', name: 'Historical', cases: 'Victorian murder, Ancient betrayal, War secrets' },
  { id: 'Horror', emoji: '👻', name: 'Horror', cases: 'Haunted mansion, Supernatural disappearance' },
]

const DIFFICULTIES = [
  { id: 'rookie', emoji: '🟢', name: 'Rookie', desc: '3 suspects, 3 clues, No plot twists' },
  { id: 'detective', emoji: '🟡', name: 'Detective', desc: '4 suspects, 5 clues, 1 plot twist' },
  { id: 'master', emoji: '🔴', name: 'Master', desc: '5 suspects, 7 clues, 2 plot twists, Red herrings' },
]

const LOADING_MESSAGES = [
  '🔍 Assembling crime scene...',
  '👤 Creating suspects...',
  '🔎 Planting evidence...',
  '🗝️ Hiding the truth...',
  '📁 Your case is ready.',
]

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

export default function Generator() {
  const navigate = useNavigate()
  const setMystery = useMysteryStore((s) => s.setMystery)

  const [selectedGenre, setSelectedGenre] = useState(null)
  const [selectedDifficulty, setSelectedDifficulty] = useState(null)
  const [loading, setLoading] = useState(false)

  const canGenerate = selectedGenre && selectedDifficulty

  async function handleGenerate() {
    if (!canGenerate) return
    setLoading(true)
    try {
      const mystery = await generateMystery(selectedGenre, selectedDifficulty)
      if (mystery.error) throw new Error(mystery.message)
      setMystery(mystery)
      localStorage.setItem('currentMystery', JSON.stringify(mystery))
      // let last message animate in before navigating
      setTimeout(() => navigate('/dashboard/case-001'), LOADING_MESSAGES.length * 800 + 400)
    } catch {
      setLoading(false)
      toast.error('Mystery generation failed. Try again.')
    }
  }

  return (
    <div
      style={{
        backgroundColor: '#0A0A0F',
        minHeight: '100vh',
        color: '#F8FAFC',
        fontFamily: 'Inter, sans-serif',
        padding: '60px 24px 100px',
      }}
    >
      {/* ── Loading overlay ── */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 50,
              backgroundColor: 'rgba(10,10,15,0.97)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {/* Pulsing orb */}
            <motion.div
              animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'radial-gradient(circle, #8B5CF6 0%, transparent 70%)',
                filter: 'blur(12px)',
                marginBottom: 32,
              }}
            />

            {LOADING_MESSAGES.map((msg, i) => (
              <motion.p
                key={msg}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.8, duration: 0.45, ease: 'easeOut' }}
                style={{
                  fontFamily: i === LOADING_MESSAGES.length - 1 ? 'Cinzel, serif' : 'Inter, sans-serif',
                  fontSize: i === LOADING_MESSAGES.length - 1 ? 20 : 15,
                  color: i === LOADING_MESSAGES.length - 1 ? '#c4b5fd' : '#64748B',
                  fontWeight: i === LOADING_MESSAGES.length - 1 ? 600 : 400,
                  marginTop: i === LOADING_MESSAGES.length - 1 ? 16 : 0,
                }}
              >
                {msg}
              </motion.p>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ maxWidth: 1000, margin: '0 auto' }}>

        {/* Back link */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => navigate('/')}
          style={{
            background: 'none',
            border: 'none',
            color: '#475569',
            cursor: 'pointer',
            fontSize: 14,
            marginBottom: 48,
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          ← Back
        </motion.button>

        {/* ══════════════ STEP 1 — GENRE ══════════════ */}
        <motion.section variants={stagger} initial="hidden" animate="visible" style={{ marginBottom: 72 }}>
          <motion.div variants={fadeUp} style={{ marginBottom: 36 }}>
            <p style={{ fontSize: 12, color: '#8B5CF6', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>
              Step 1
            </p>
            <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', color: '#F8FAFC', margin: 0 }}>
              Choose Your Mystery World
            </h2>
          </motion.div>

          <motion.div
            variants={stagger}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 16,
            }}
          >
            {GENRES.map((genre) => {
              const selected = selectedGenre === genre.id
              return (
                <motion.div
                  key={genre.id}
                  variants={fadeUp}
                  whileHover={{ y: -4, boxShadow: selected ? undefined : '0 0 0 1px rgba(139,92,246,0.35), 0 12px 32px rgba(139,92,246,0.08)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedGenre(genre.id)}
                  style={{
                    backgroundColor: selected ? 'rgba(139,92,246,0.12)' : '#12121A',
                    border: selected ? '2px solid #8B5CF6' : '1px solid #1E1E2E',
                    boxShadow: selected ? '0 0 0 1px rgba(139,92,246,0.3), 0 0 24px rgba(139,92,246,0.15)' : undefined,
                    borderRadius: 16,
                    padding: '28px 24px',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'border-color 0.15s, background-color 0.15s',
                  }}
                >
                  {selected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      style={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        backgroundColor: '#8B5CF6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        color: '#fff',
                        fontWeight: 700,
                      }}
                    >
                      ✓
                    </motion.div>
                  )}
                  <div style={{ fontSize: 40, marginBottom: 14, lineHeight: 1 }}>{genre.emoji}</div>
                  <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: 17, fontWeight: 600, marginBottom: 8, color: '#F8FAFC' }}>
                    {genre.name}
                  </h3>
                  <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>{genre.cases}</p>
                </motion.div>
              )
            })}
          </motion.div>
        </motion.section>

        {/* ══════════════ STEP 2 — DIFFICULTY ══════════════ */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          style={{ marginBottom: 72 }}
        >
          <div style={{ marginBottom: 36 }}>
            <p style={{ fontSize: 12, color: '#8B5CF6', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 8 }}>
              Step 2
            </p>
            <h2 style={{ fontFamily: 'Cinzel, serif', fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', color: '#F8FAFC', margin: 0 }}>
              Select Difficulty
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: 16,
            }}
          >
            {DIFFICULTIES.map((diff) => {
              const selected = selectedDifficulty === diff.id
              return (
                <motion.div
                  key={diff.id}
                  whileHover={{ y: -4, boxShadow: selected ? undefined : '0 0 0 1px rgba(139,92,246,0.35), 0 12px 32px rgba(139,92,246,0.08)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedDifficulty(diff.id)}
                  style={{
                    backgroundColor: selected ? 'rgba(139,92,246,0.12)' : '#12121A',
                    border: selected ? '2px solid #8B5CF6' : '1px solid #1E1E2E',
                    boxShadow: selected ? '0 0 0 1px rgba(139,92,246,0.3), 0 0 24px rgba(139,92,246,0.15)' : undefined,
                    borderRadius: 16,
                    padding: '28px 24px',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'border-color 0.15s, background-color 0.15s',
                    textAlign: 'center',
                  }}
                >
                  {selected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      style={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        backgroundColor: '#8B5CF6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        color: '#fff',
                        fontWeight: 700,
                      }}
                    >
                      ✓
                    </motion.div>
                  )}
                  <div style={{ fontSize: 36, marginBottom: 12 }}>{diff.emoji}</div>
                  <h3 style={{ fontFamily: 'Cinzel, serif', fontSize: 18, fontWeight: 600, marginBottom: 10, color: '#F8FAFC' }}>
                    {diff.name}
                  </h3>
                  <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.65 }}>{diff.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </motion.section>

        {/* ══════════════ GENERATE BUTTON ══════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}
        >
          <motion.button
            whileHover={canGenerate ? { scale: 1.04, boxShadow: '0 0 40px rgba(139,92,246,0.55)' } : {}}
            whileTap={canGenerate ? { scale: 0.97 } : {}}
            onClick={handleGenerate}
            disabled={!canGenerate}
            style={{
              backgroundColor: canGenerate ? '#8B5CF6' : '#1E1E2E',
              color: canGenerate ? '#fff' : '#334155',
              border: 'none',
              borderRadius: 14,
              padding: '18px 56px',
              fontSize: 18,
              fontWeight: 600,
              cursor: canGenerate ? 'pointer' : 'not-allowed',
              fontFamily: 'Inter, sans-serif',
              letterSpacing: '0.01em',
              transition: 'background-color 0.2s, color 0.2s',
            }}
          >
            Generate Mystery →
          </motion.button>

          {!canGenerate && (
            <p style={{ fontSize: 13, color: '#334155' }}>
              Select a genre and difficulty to continue
            </p>
          )}
        </motion.div>

      </div>
    </div>
  )
}
