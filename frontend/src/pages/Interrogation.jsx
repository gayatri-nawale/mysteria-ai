import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import useMysteryStore from '../store/mysteryStore'
import { interrogateSuspect } from '../lib/api'

// ─── Constants ────────────────────────────────────────────────────────────────
const QUICK_QUESTIONS = [
  'Where were you?',
  'Did you know the victim well?',
  'Who do you suspect?',
  "I think you're lying.",
]

const MOOD_MAP = {
  calm:    { label: '😌 Calm',    color: '#3B82F6', bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.3)'  },
  nervous: { label: '😰 Nervous', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' },
  angry:   { label: '😡 Angry',   color: '#EF4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)'  },
  evasive: { label: '🤫 Evasive', color: '#64748B', bg: 'rgba(100,116,139,0.12)',border: 'rgba(100,116,139,0.3)'},
}

const PERSONALITY_COLORS = {
  nervous:    '#F59E0B',
  calm:       '#3B82F6',
  aggressive: '#EF4444',
  secretive:  '#6B7280',
  friendly:   '#10B981',
  arrogant:   '#8B5CF6',
  defensive:  '#F97316',
  timid:      '#06B6D4',
  greedy:     '#F59E0B',
  paranoid:   '#EC4899',
}

function personalityColor(p = '') {
  return PERSONALITY_COLORS[p.toLowerCase()] ?? '#8B5CF6'
}

// ─── Typing dots ──────────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '14px 16px' }}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{ y: [0, -7, 0] }}
          transition={{ duration: 0.55, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
          style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#475569' }}
        />
      ))}
    </div>
  )
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function Bubble({ msg, suspect, isLatest }) {
  const isUser = msg.role === 'user'
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        alignItems: 'flex-end',
        gap: 10,
        marginBottom: 16,
      }}
    >
      {/* Suspect avatar — left side only */}
      {!isUser && (
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            backgroundColor: personalityColor(suspect?.personality),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            fontWeight: 700,
            color: '#fff',
            flexShrink: 0,
          }}
        >
          {suspect?.name?.[0] ?? '?'}
        </div>
      )}

      <div
        style={{
          maxWidth: '72%',
          backgroundColor: isUser ? '#8B5CF6' : '#1E1E2E',
          borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          padding: '10px 14px',
          boxShadow: isLatest && !isUser ? '0 0 12px rgba(139,92,246,0.1)' : undefined,
        }}
      >
        <p style={{ fontSize: 14, color: '#F8FAFC', lineHeight: 1.65, margin: 0, fontFamily: 'Inter, sans-serif' }}>
          {msg.content}
        </p>
      </div>

      {/* Detective badge — right side */}
      {isUser && (
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            backgroundColor: '#8B5CF6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            flexShrink: 0,
          }}
        >
          🔍
        </div>
      )}
    </motion.div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Interrogation() {
  const navigate = useNavigate()
  const { suspectId } = useParams()

  const { currentMystery, interrogatedSuspects, setMystery, markSuspectInterrogated } = useMysteryStore()

  const mystery = currentMystery ?? (() => {
    try { return JSON.parse(localStorage.getItem('currentMystery')) } catch { return null }
  })()

  useEffect(() => {
    if (!currentMystery && mystery) setMystery(mystery)
  }, []) // eslint-disable-line

  const suspect = mystery?.suspects?.find((s) => s.id === suspectId)

  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [mood, setMood] = useState('calm')
  const [clueShown, setClueShown] = useState(false)

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // ── No data guard ──
  if (!mystery || !suspect) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0A0A0F', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, fontFamily: 'Inter, sans-serif' }}>
        <span style={{ fontSize: 48 }}>🚫</span>
        <p style={{ color: '#94A3B8' }}>Suspect not found.</p>
        <button onClick={() => navigate('/dashboard/case-001')} style={{ backgroundColor: '#8B5CF6', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
          Back to Case
        </button>
      </div>
    )
  }

  const userMessageCount = messages.filter((m) => m.role === 'user').length
  const suspectQuestioned = interrogatedSuspects.includes(suspectId)
  const showSuspicion = userMessageCount >= 3 && suspect.isGuilty
  const moodStyle = MOOD_MAP[mood] ?? MOOD_MAP.calm
  const avatarColor = personalityColor(suspect.personality)

  // ── Send message ──
  async function sendMessage(text) {
    const playerMessage = (text ?? input).trim()
    if (!playerMessage || loading) return

    setInput('')
    const newMessages = [...messages, { role: 'user', content: playerMessage }]
    setMessages(newMessages)
    setLoading(true)

    try {
      const result = await interrogateSuspect({
        suspect,
        conversationHistory: messages,
        playerMessage,
        victim: mystery.victim,
      })

      if (result.error) throw new Error(result.message)

      const updated = [...newMessages, { role: 'assistant', content: result.message }]
      setMessages(updated)
      setMood(result.mood ?? 'calm')
      markSuspectInterrogated(suspectId)

      // Clue toast on 3rd exchange
      const count = updated.filter((m) => m.role === 'user').length
      if (count === 3 && suspect.isGuilty && !clueShown) {
        const ev = mystery.evidence?.[Math.floor(Math.random() * mystery.evidence.length)]
        toast(
          `📎 You notice ${suspect.name} avoiding eye contact about "${ev?.title ?? 'a key detail'}"`,
          { duration: 6000, style: { background: '#12121A', color: '#F8FAFC', border: '1px solid rgba(239,68,68,0.35)' } }
        )
        setClueShown(true)
      }
    } catch {
      toast.error('No response. Try again.')
      setMessages(newMessages) // revert optimistic user msg on hard fail
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // ── Shared style shortcuts ──
  const panelPad = { padding: '28px 24px' }

  return (
    <div style={{ height: '100vh', backgroundColor: '#0A0A0F', fontFamily: 'Inter, sans-serif', color: '#F8FAFC', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ══════════ TOP BAR ══════════ */}
      <div style={{ height: 56, borderBottom: '1px solid #1E1E2E', display: 'flex', alignItems: 'center', padding: '0 20px', gap: 16, flexShrink: 0 }}>
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => navigate('/dashboard/case-001')}
          style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 18, padding: 0 }}
        >
          ←
        </motion.button>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 11, color: '#475569', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
            Interrogation Room
          </p>
          <p style={{ fontSize: 13, color: '#94A3B8', margin: 0 }}>{mystery.title}</p>
        </div>
        {suspectQuestioned && (
          <span style={{ fontSize: 11, color: '#14B8A6', backgroundColor: 'rgba(20,184,166,0.1)', border: '1px solid rgba(20,184,166,0.25)', borderRadius: 9999, padding: '3px 12px' }}>
            Previously interviewed
          </span>
        )}
      </div>

      {/* ══════════ BODY ══════════ */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── LEFT — Suspect Profile ── */}
        <div
          style={{
            width: '38%',
            borderRight: '1px solid #1E1E2E',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            ...panelPad,
            gap: 0,
            overflowY: 'auto',
          }}
        >
          {/* Avatar */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 18 }}
            style={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              backgroundColor: avatarColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 48,
              fontWeight: 700,
              color: '#fff',
              marginBottom: 20,
              boxShadow: `0 0 40px ${avatarColor}40`,
              border: `3px solid ${avatarColor}60`,
            }}
          >
            {suspect.name?.[0]}
          </motion.div>

          {/* Name */}
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ fontFamily: 'Cinzel, serif', fontSize: 24, fontWeight: 700, color: '#F8FAFC', textAlign: 'center', marginBottom: 6 }}
          >
            {suspect.name}
          </motion.h2>

          {/* Occupation */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            style={{ fontSize: 14, color: '#64748B', marginBottom: 20, textAlign: 'center' }}
          >
            {suspect.occupation} · Age {suspect.age}
          </motion.p>

          {/* Mood badge */}
          <AnimatePresence mode="wait">
            <motion.div
              key={mood}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                backgroundColor: moodStyle.bg,
                border: `1px solid ${moodStyle.border}`,
                borderRadius: 9999,
                padding: '6px 18px',
                marginBottom: 28,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: moodStyle.color }}>{moodStyle.label}</span>
            </motion.div>
          </AnimatePresence>

          {/* Divider */}
          <div style={{ width: '100%', height: 1, backgroundColor: '#1E1E2E', marginBottom: 24 }} />

          {/* Known facts */}
          <div style={{ width: '100%' }}>
            <p style={{ fontSize: 11, color: '#475569', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
              Known Facts
            </p>
            <div style={{ backgroundColor: '#12121A', border: '1px solid #1E1E2E', borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
              <p style={{ fontSize: 11, color: '#8B5CF6', fontWeight: 600, marginBottom: 4 }}>Alibi</p>
              <p style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.6 }}>{suspect.alibi}</p>
            </div>
            <div style={{ backgroundColor: '#12121A', border: '1px solid #1E1E2E', borderRadius: 10, padding: '12px 14px' }}>
              <p style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginBottom: 4 }}>Personality</p>
              <p style={{ fontSize: 13, color: '#94A3B8', textTransform: 'capitalize' }}>{suspect.personality}</p>
            </div>
          </div>

          {/* Guilt hint — only after 3+ messages if guilty */}
          <AnimatePresence>
            {showSuspicion && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  marginTop: 20,
                  width: '100%',
                  backgroundColor: 'rgba(239,68,68,0.07)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  borderRadius: 10,
                  padding: '10px 14px',
                }}
              >
                <p style={{ fontSize: 12, color: '#EF4444', lineHeight: 1.6 }}>
                  ⚠ Something doesn't add up...
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── RIGHT — Chat ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Chat header */}
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #1E1E2E', flexShrink: 0 }}>
            <p style={{ fontSize: 11, color: '#475569', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
              Interrogation Session
            </p>
            <p style={{ fontSize: 12, color: '#334155', margin: 0, marginTop: 2 }}>
              {userMessageCount === 0
                ? 'Start questioning the suspect'
                : `${userMessageCount} question${userMessageCount !== 1 ? 's' : ''} asked`}
            </p>
          </div>

          {/* Messages area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ textAlign: 'center', marginTop: 60 }}
              >
                <p style={{ fontSize: 32, marginBottom: 12 }}>💬</p>
                <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.7 }}>
                  {suspect.name} is waiting.<br />Use the quick questions or type your own.
                </p>
              </motion.div>
            )}

            {messages.map((msg, i) => (
              <Bubble
                key={i}
                msg={msg}
                suspect={suspect}
                isLatest={i === messages.length - 1}
              />
            ))}

            {/* Typing indicator */}
            <AnimatePresence>
              {loading && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginBottom: 16 }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      backgroundColor: avatarColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#fff',
                      flexShrink: 0,
                    }}
                  >
                    {suspect.name?.[0]}
                  </div>
                  <div style={{ backgroundColor: '#1E1E2E', borderRadius: '16px 16px 16px 4px' }}>
                    <TypingDots />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={messagesEndRef} />
          </div>

          {/* Quick questions */}
          <div style={{ padding: '12px 20px 0', borderTop: '1px solid #1E1E2E', display: 'flex', flexWrap: 'wrap', gap: 8, flexShrink: 0 }}>
            {QUICK_QUESTIONS.map((q) => (
              <motion.button
                key={q}
                whileHover={{ scale: 1.03, backgroundColor: 'rgba(139,92,246,0.18)' }}
                whileTap={{ scale: 0.96 }}
                onClick={() => sendMessage(q)}
                disabled={loading}
                style={{
                  backgroundColor: '#12121A',
                  border: '1px solid #2D2D3F',
                  borderRadius: 9999,
                  padding: '6px 14px',
                  fontSize: 12,
                  color: loading ? '#334155' : '#94A3B8',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  transition: 'color 0.15s',
                }}
              >
                {q}
              </motion.button>
            ))}
          </div>

          {/* Input bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 20px 20px',
              flexShrink: 0,
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={`Ask ${suspect.name} something...`}
              disabled={loading}
              style={{
                flex: 1,
                backgroundColor: '#12121A',
                border: '1px solid #2D2D3F',
                borderRadius: 12,
                padding: '12px 16px',
                fontSize: 14,
                color: '#F8FAFC',
                fontFamily: 'Inter, sans-serif',
                outline: 'none',
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) => { e.target.style.borderColor = '#8B5CF6' }}
              onBlur={(e) => { e.target.style.borderColor = '#2D2D3F' }}
            />
            <motion.button
              whileHover={!loading && input.trim() ? { scale: 1.05, boxShadow: '0 0 20px rgba(139,92,246,0.4)' } : {}}
              whileTap={!loading && input.trim() ? { scale: 0.95 } : {}}
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              style={{
                backgroundColor: !loading && input.trim() ? '#8B5CF6' : '#1E1E2E',
                border: 'none',
                borderRadius: 12,
                width: 48,
                height: 48,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                cursor: !loading && input.trim() ? 'pointer' : 'not-allowed',
                transition: 'background-color 0.15s',
                flexShrink: 0,
              }}
            >
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  style={{ width: 18, height: 18, border: '2px solid #334155', borderTopColor: '#8B5CF6', borderRadius: '50%' }}
                />
              ) : '→'}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  )
}
