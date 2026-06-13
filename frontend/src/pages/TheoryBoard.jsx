import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import useMysteryStore from '../store/mysteryStore'

// ─── Card factory ────────────────────────────────────────────────────────────
function buildCards(mystery, discoveredEvidence, playerNotes) {
  const cards = []

  // Suspects — left column
  mystery.suspects?.forEach((s, i) => {
    cards.push({
      id: `sus-${s.id}`,
      type: 'SUSPECT',
      title: s.name,
      body: `${s.occupation} · ${s.personality}`,
      accent: '#8B5CF6',
      bg: 'rgba(26, 16, 40, 0.95)',
      textColor: '#F8FAFC',
      mutedColor: '#94A3B8',
      editable: false,
      content: '',
      x: 50 + (i % 2) * 210,
      y: 90 + Math.floor(i / 2) * 195,
      rotation: +(Math.random() * 6 - 3).toFixed(2),
    })
  })

  // Evidence — right column
  discoveredEvidence.forEach((evId, i) => {
    const ev = mystery.evidence?.find((e) => e.id === evId)
    if (!ev) return
    cards.push({
      id: `ev-${ev.id}`,
      type: 'EVIDENCE',
      title: ev.title,
      body: ev.description,
      accent: '#F59E0B',
      bg: 'rgba(26, 21, 5, 0.95)',
      textColor: '#F8FAFC',
      mutedColor: '#94A3B8',
      editable: false,
      content: '',
      x: 510 + (i % 2) * 210,
      y: 90 + Math.floor(i / 2) * 195,
      rotation: +(Math.random() * 6 - 3).toFixed(2),
    })
  })

  // Sticky note
  cards.push({
    id: 'note-main',
    type: 'NOTE',
    title: 'My Theory',
    body: '',
    accent: '#F59E0B',
    bg: '#FEF9C3',
    textColor: '#1A1A1A',
    mutedColor: '#6B6B6B',
    editable: true,
    content: playerNotes || '',
    x: 310,
    y: 480,
    rotation: +(Math.random() * 4 - 2).toFixed(2),
  })

  return cards
}

// ─── Card component ───────────────────────────────────────────────────────────
function BoardCard({ card, isSelected, onCardClick, onDragStart, onDragEnd, onNoteChange, boardRef }) {
  const isDragging = useRef(false)

  return (
    <motion.div
      id={`card-${card.id}`}
      drag
      dragConstraints={boardRef}
      dragMomentum={false}
      dragElastic={0}
      onDragStart={() => { isDragging.current = true; onDragStart() }}
      onDragEnd={() => { onDragEnd(card.id); setTimeout(() => { isDragging.current = false }, 10) }}
      onClick={() => { if (!isDragging.current) onCardClick(card.id) }}
      onDoubleClick={(e) => { e.stopPropagation() }}
      whileDrag={{ scale: 1.06, zIndex: 20, cursor: 'grabbing', boxShadow: '0 20px 48px rgba(0,0,0,0.6)' }}
      style={{
        position: 'absolute',
        left: card.x,
        top: card.y,
        width: 190,
        backgroundColor: card.bg,
        border: `2px solid ${isSelected ? '#fff' : card.accent}`,
        borderRadius: 10,
        padding: '10px 12px 14px',
        rotate: card.rotation,
        cursor: 'grab',
        zIndex: isSelected ? 15 : 5,
        boxShadow: isSelected
          ? `0 0 0 3px #fff, 0 0 0 5px ${card.accent}, 0 12px 32px rgba(0,0,0,0.5)`
          : '2px 4px 16px rgba(0,0,0,0.45)',
        userSelect: 'none',
        touchAction: 'none',
      }}
    >
      {/* Pin */}
      <div style={{ textAlign: 'center', marginTop: -22, marginBottom: 6, fontSize: 24, lineHeight: 1, filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.5))' }}>
        📌
      </div>

      {/* Type badge */}
      <p style={{
        fontSize: 9,
        fontWeight: 800,
        letterSpacing: '0.14em',
        color: card.accent,
        marginBottom: 6,
        fontFamily: 'Inter, sans-serif',
      }}>
        {card.type}
      </p>

      {/* Title */}
      <p style={{
        fontSize: 13,
        fontWeight: 700,
        color: card.textColor,
        marginBottom: 6,
        lineHeight: 1.3,
        fontFamily: 'Cinzel, serif',
      }}>
        {card.title}
      </p>

      {/* Body or editable note */}
      {card.editable ? (
        <textarea
          value={card.content}
          onChange={(e) => onNoteChange(card.id, e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          placeholder="Write your theory here..."
          rows={5}
          style={{
            width: '100%',
            backgroundColor: 'transparent',
            border: 'none',
            outline: 'none',
            resize: 'none',
            fontSize: 12,
            color: card.textColor,
            fontFamily: 'Inter, sans-serif',
            lineHeight: 1.65,
            boxSizing: 'border-box',
          }}
        />
      ) : (
        <p style={{
          fontSize: 11,
          color: card.mutedColor,
          lineHeight: 1.6,
          fontFamily: 'Inter, sans-serif',
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 4,
          WebkitBoxOrient: 'vertical',
        }}>
          {card.body}
        </p>
      )}

      {/* Selected indicator */}
      {isSelected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            fontSize: 10,
            color: '#fff',
            backgroundColor: card.accent,
            borderRadius: 9999,
            padding: '2px 8px',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 600,
          }}
        >
          selected
        </motion.div>
      )}
    </motion.div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TheoryBoard() {
  const navigate = useNavigate()
  const { currentMystery, discoveredEvidence, playerNotes, setMystery } = useMysteryStore()

  const mystery = currentMystery ?? (() => {
    try { return JSON.parse(localStorage.getItem('currentMystery')) } catch { return null }
  })()

  useEffect(() => {
    if (!currentMystery && mystery) setMystery(mystery)
  }, []) // eslint-disable-line

  const boardRef = useRef(null)
  const globalDragging = useRef(false)

  const [cards, setCards] = useState([])
  const [positions, setPositions] = useState({})
  const [connections, setConnections] = useState([])
  const [selectedCard, setSelectedCard] = useState(null)

  // Build cards when mystery loads
  useEffect(() => {
    if (!mystery) return
    setCards(buildCards(mystery, discoveredEvidence, playerNotes))
  }, [mystery?.title, discoveredEvidence.length]) // eslint-disable-line

  // Read all card DOM positions after render
  const readPositions = useCallback(() => {
    const boardEl = boardRef.current
    if (!boardEl) return
    const boardRect = boardEl.getBoundingClientRect()
    setPositions((prev) => {
      const next = { ...prev }
      cards.forEach((c) => {
        const el = document.getElementById(`card-${c.id}`)
        if (!el) return
        const r = el.getBoundingClientRect()
        next[c.id] = {
          x: r.left + r.width / 2 - boardRect.left,
          y: r.top + r.height / 2 - boardRect.top,
        }
      })
      return next
    })
  }, [cards])

  useEffect(() => {
    const t = setTimeout(readPositions, 120)
    return () => clearTimeout(t)
  }, [cards.length, readPositions])

  // Update one card position after drag
  function handleDragEnd(cardId) {
    globalDragging.current = false
    const boardEl = boardRef.current
    if (!boardEl) return
    const boardRect = boardEl.getBoundingClientRect()
    const cardEl = document.getElementById(`card-${cardId}`)
    if (!cardEl) return
    const r = cardEl.getBoundingClientRect()
    setPositions((prev) => ({
      ...prev,
      [cardId]: {
        x: r.left + r.width / 2 - boardRect.left,
        y: r.top + r.height / 2 - boardRect.top,
      },
    }))
  }

  // Connection logic
  function handleCardClick(cardId) {
    if (globalDragging.current) return

    if (!selectedCard) {
      setSelectedCard(cardId)
      return
    }
    if (selectedCard === cardId) {
      setSelectedCard(null)
      return
    }
    // Create connection (no duplicates)
    const exists = connections.some(
      (c) => (c.from === selectedCard && c.to === cardId) || (c.from === cardId && c.to === selectedCard)
    )
    if (!exists) setConnections((prev) => [...prev, { from: selectedCard, to: cardId, id: `${selectedCard}-${cardId}` }])
    setSelectedCard(null)
  }

  // Add new note card
  function addNote() {
    const id = `note-${Date.now()}`
    const newCard = {
      id,
      type: 'NOTE',
      title: 'New Note',
      body: '',
      accent: '#14B8A6',
      bg: '#ECFDF5',
      textColor: '#1A1A1A',
      mutedColor: '#6B6B6B',
      editable: true,
      content: '',
      x: 200 + Math.random() * 350,
      y: 150 + Math.random() * 250,
      rotation: +(Math.random() * 6 - 3).toFixed(2),
    }
    setCards((prev) => [...prev, newCard])
    setTimeout(() => {
      const boardEl = boardRef.current
      if (!boardEl) return
      const boardRect = boardEl.getBoundingClientRect()
      const el = document.getElementById(`card-${id}`)
      if (!el) return
      const r = el.getBoundingClientRect()
      setPositions((prev) => ({
        ...prev,
        [id]: { x: r.left + r.width / 2 - boardRect.left, y: r.top + r.height / 2 - boardRect.top },
      }))
    }, 120)
  }

  function updateNoteContent(cardId, content) {
    setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, content } : c)))
  }

  // ── No mystery guard ──
  if (!mystery) {
    return (
      <div style={{ height: 'calc(100vh - 56px)', backgroundColor: '#0A0A0F', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, fontFamily: 'Inter, sans-serif' }}>
        <p style={{ color: '#94A3B8' }}>No active case to theorise about.</p>
        <button onClick={() => navigate('/generate')} style={{ backgroundColor: '#8B5CF6', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
          Generate a Mystery →
        </button>
      </div>
    )
  }

  return (
    <div style={{ height: 'calc(100vh - 56px)', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: 'Inter, sans-serif' }}>

      {/* ══════════ TOP BAR ══════════ */}
      <div style={{
        height: 56,
        backgroundColor: 'rgba(10,10,15,0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: 16,
        flexShrink: 0,
        zIndex: 30,
      }}>
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => navigate('/dashboard/case-001')}
          style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: 18, padding: 0 }}
        >
          ←
        </motion.button>

        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 11, color: '#64748B', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0 }}>
            Theory Board
          </p>
          <p style={{ fontSize: 13, fontFamily: 'Cinzel, serif', color: '#F8FAFC', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 500 }}>
            {mystery.title}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {selectedCard && (
            <motion.span
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              style={{ fontSize: 12, color: '#8B5CF6', backgroundColor: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 9999, padding: '4px 14px' }}
            >
              Click another card to connect →
            </motion.span>
          )}
          {connections.length > 0 && (
            <span style={{ fontSize: 12, color: '#64748B' }}>
              {connections.length} connection{connections.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <motion.button
          whileHover={{ scale: 1.03, boxShadow: '0 0 20px rgba(239,68,68,0.4)' }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/dashboard/case-001')}
          style={{ backgroundColor: '#EF4444', border: 'none', borderRadius: 10, padding: '8px 18px', fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap' }}
        >
          ⚖️ Make Accusation →
        </motion.button>
      </div>

      {/* ══════════ CORK BOARD ══════════ */}
      <div
        ref={boardRef}
        onClick={(e) => { if (e.target === e.currentTarget) setSelectedCard(null) }}
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: '#8B6914',
          backgroundImage: `
            radial-gradient(ellipse at 20% 30%, #9A7A2A 0%, transparent 50%),
            radial-gradient(ellipse at 80% 70%, #7A5C0F 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, #6B4F0D 0%, #8B6914 100%)
          `,
          cursor: selectedCard ? 'crosshair' : 'default',
        }}
      >
        {/* Cork texture grain overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.35,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E")`,
          pointerEvents: 'none',
          zIndex: 1,
        }} />

        {/* Board label */}
        <div style={{
          position: 'absolute',
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.2em',
          color: 'rgba(255,255,255,0.2)',
          textTransform: 'uppercase',
          zIndex: 2,
          pointerEvents: 'none',
          fontFamily: 'Inter, sans-serif',
        }}>
          MURDER BOARD — CLASSIFIED
        </div>

        {/* ── SVG connections ── */}
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 3 }}
        >
          <defs>
            <filter id="string-glow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          {connections.map((conn) => {
            const from = positions[conn.from]
            const to = positions[conn.to]
            if (!from || !to) return null

            // Slight droop for "string" effect
            const midX = (from.x + to.x) / 2
            const midY = (from.y + to.y) / 2 + 18

            return (
              <g key={conn.id}>
                {/* Shadow/glow */}
                <path
                  d={`M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`}
                  stroke="rgba(239,68,68,0.25)"
                  strokeWidth="4"
                  fill="none"
                  filter="url(#string-glow)"
                />
                {/* Main string */}
                <path
                  d={`M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`}
                  stroke="#EF4444"
                  strokeWidth="1.8"
                  strokeDasharray="5,3"
                  fill="none"
                />
                {/* Pin dots at endpoints */}
                <circle cx={from.x} cy={from.y} r="4" fill="#EF4444" opacity="0.7" />
                <circle cx={to.x} cy={to.y} r="4" fill="#EF4444" opacity="0.7" />
              </g>
            )
          })}
        </svg>

        {/* ── Cards ── */}
        <AnimatePresence>
          {cards.map((card) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, scale: 0.7, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              style={{ position: 'absolute', zIndex: 4 }}
            >
              <BoardCard
                card={card}
                isSelected={selectedCard === card.id}
                onCardClick={handleCardClick}
                onDragStart={() => { globalDragging.current = true }}
                onDragEnd={handleDragEnd}
                onNoteChange={updateNoteContent}
                boardRef={boardRef}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* ── Legend ── */}
        <div style={{
          position: 'absolute',
          bottom: 80,
          right: 20,
          backgroundColor: 'rgba(10,10,15,0.75)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 10,
          padding: '10px 14px',
          zIndex: 10,
          pointerEvents: 'none',
        }}>
          <p style={{ fontSize: 10, color: '#475569', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Legend</p>
          {[
            { color: '#8B5CF6', label: 'Suspect' },
            { color: '#F59E0B', label: 'Evidence' },
            { color: '#14B8A6', label: 'Note' },
            { color: '#EF4444', label: 'Connection' },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: color }} />
              <span style={{ fontSize: 11, color: '#64748B' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════ BOTTOM TOOLBAR ══════════ */}
      <div style={{
        height: 56,
        backgroundColor: 'rgba(10,10,15,0.92)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
        gap: 12,
        flexShrink: 0,
        zIndex: 30,
      }}>
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={addNote}
          style={{ backgroundColor: '#12121A', border: '1px solid #2D2D3F', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, color: '#F8FAFC', cursor: 'pointer', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          📝 Add Note
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setConnections([])}
          style={{ backgroundColor: '#12121A', border: '1px solid #2D2D3F', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, color: connections.length > 0 ? '#EF4444' : '#334155', cursor: connections.length > 0 ? 'pointer' : 'default', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: 6 }}
        >
          🗑️ Clear Connections
        </motion.button>

        <div style={{ flex: 1 }} />

        <p style={{ fontSize: 12, color: '#334155' }}>
          {selectedCard
            ? '📌 Click another card to draw a connection string'
            : '💡 Click a card to select it, then click another to connect'}
        </p>

        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => navigate('/dashboard/case-001')}
          style={{ backgroundColor: '#12121A', border: '1px solid #2D2D3F', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, color: '#94A3B8', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
        >
          ← Back to Dashboard
        </motion.button>
      </div>
    </div>
  )
}
