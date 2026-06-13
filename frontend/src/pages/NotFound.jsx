import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0A0A0F',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 20,
      fontFamily: 'Inter, sans-serif',
      color: '#F8FAFC',
      padding: 24,
      textAlign: 'center',
    }}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
      >
        <div style={{ fontSize: 80, marginBottom: 8 }}>🗂️</div>
        <h1 style={{
          fontFamily: 'Cinzel, serif',
          fontSize: 'clamp(1.8rem, 5vw, 3rem)',
          fontWeight: 700,
          color: '#F8FAFC',
          marginBottom: 12,
        }}>
          Case Not Found
        </h1>
        <p style={{ fontSize: 16, color: '#64748B', marginBottom: 36, maxWidth: 380 }}>
          This file doesn't exist in our archives. The lead went cold.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <motion.button
            whileHover={{ scale: 1.04, boxShadow: '0 0 24px rgba(139,92,246,0.4)' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/')}
            style={{
              backgroundColor: '#8B5CF6',
              border: 'none',
              borderRadius: 10,
              padding: '12px 28px',
              fontSize: 15,
              fontWeight: 600,
              color: '#fff',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            ← Back to HQ
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/generate')}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid #1E1E2E',
              borderRadius: 10,
              padding: '12px 28px',
              fontSize: 15,
              fontWeight: 600,
              color: '#64748B',
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Start New Case →
          </motion.button>
        </div>
      </motion.div>

      <p style={{ fontSize: 12, color: '#1E1E2E', marginTop: 40, fontFamily: 'JetBrains Mono, monospace' }}>
        404 — route not found
      </p>
    </div>
  )
}
