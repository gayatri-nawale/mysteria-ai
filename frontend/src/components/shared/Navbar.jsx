import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../hooks/useAuth'
import useMysteryStore from '../../store/mysteryStore'

const NAV_LINKS = [
  { label: 'Home',         to: '/' },
  { label: 'My Cases',     to: '/history' },
  { label: 'Theory Board', to: '/theory/case-001' },
]

export default function Navbar() {
  const navigate = useNavigate()
  const { user, loading, signIn, signOut } = useAuth()
  const xp = useMysteryStore((s) => s.xp)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [signingIn, setSigningIn] = useState(false)

  async function handleSignIn() {
    setSigningIn(true)
    try { await signIn() } catch { /* user dismissed */ }
    finally { setSigningIn(false) }
  }

  const initial = user?.displayName?.[0] ?? user?.email?.[0] ?? '?'

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backgroundColor: 'rgba(10,10,15,0.92)',
      backdropFilter: 'blur(14px)',
      borderBottom: '1px solid #1E1E2E',
      height: 56,
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      gap: 32,
      fontFamily: 'Inter, sans-serif',
    }}>

      {/* Logo */}
      <Link to="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
        <motion.span
          whileHover={{ scale: 1.05 }}
          style={{
            fontFamily: 'Cinzel, serif',
            fontSize: 17,
            fontWeight: 700,
            color: '#8B5CF6',
            letterSpacing: '0.08em',
            cursor: 'pointer',
          }}
        >
          🔍 MYSTERIA
        </motion.span>
      </Link>

      {/* Nav links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
        {NAV_LINKS.map(({ label, to }) => (
          <Link key={to} to={to} style={{ textDecoration: 'none' }}>
            <motion.span
              whileHover={{ color: '#F8FAFC', backgroundColor: 'rgba(255,255,255,0.05)' }}
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: '#64748B',
                padding: '5px 12px',
                borderRadius: 8,
                cursor: 'pointer',
                display: 'block',
                transition: 'color 0.15s',
              }}
            >
              {label}
            </motion.span>
          </Link>
        ))}
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>

        {/* XP counter */}
        {xp > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              backgroundColor: 'rgba(245,158,11,0.12)',
              border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: 9999,
              padding: '4px 12px',
            }}
          >
            <span style={{ fontSize: 12 }}>⭐</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#F59E0B' }}>{xp} XP</span>
          </motion.div>
        )}

        {/* Auth area */}
        {loading ? (
          <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: '#1E1E2E' }} />
        ) : user ? (
          <div style={{ position: 'relative' }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setUserMenuOpen((v) => !v)}
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                border: '2px solid #8B5CF6',
                overflow: 'hidden',
                cursor: 'pointer',
                background: 'none',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
              ) : (
                <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', backgroundColor: '#8B5CF6', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {initial.toUpperCase()}
                </span>
              )}
            </motion.button>

            <AnimatePresence>
              {userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    position: 'absolute',
                    top: 42,
                    right: 0,
                    backgroundColor: '#12121A',
                    border: '1px solid #1E1E2E',
                    borderRadius: 12,
                    padding: '8px',
                    minWidth: 180,
                    zIndex: 200,
                    boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
                  }}
                  onMouseLeave={() => setUserMenuOpen(false)}
                >
                  <div style={{ padding: '8px 12px 12px', borderBottom: '1px solid #1E1E2E', marginBottom: 6 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#F8FAFC', margin: 0 }}>
                      {user.displayName ?? 'Detective'}
                    </p>
                    <p style={{ fontSize: 11, color: '#475569', margin: 0, marginTop: 2 }}>{user.email}</p>
                  </div>
                  <button
                    onClick={() => { signOut(); setUserMenuOpen(false) }}
                    style={{
                      width: '100%',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderRadius: 8,
                      padding: '8px 12px',
                      fontSize: 13,
                      color: '#EF4444',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'Inter, sans-serif',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                    onMouseEnter={(e) => { e.target.style.backgroundColor = 'rgba(239,68,68,0.1)' }}
                    onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent' }}
                  >
                    ↩ Sign out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleSignIn}
            disabled={signingIn}
            style={{
              backgroundColor: '#8B5CF6',
              border: 'none',
              borderRadius: 8,
              padding: '7px 16px',
              fontSize: 13,
              fontWeight: 600,
              color: '#fff',
              cursor: signingIn ? 'wait' : 'pointer',
              fontFamily: 'Inter, sans-serif',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              opacity: signingIn ? 0.7 : 1,
            }}
          >
            <span style={{ fontSize: 14 }}>G</span>
            {signingIn ? 'Signing in…' : 'Sign in'}
          </motion.button>
        )}
      </div>
    </nav>
  )
}
