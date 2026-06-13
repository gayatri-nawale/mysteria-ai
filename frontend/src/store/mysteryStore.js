import { create } from 'zustand'

const STORAGE_KEY = 'mysteria_completed_cases'

function loadCases() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

const useMysteryStore = create((set) => ({
  currentMystery: null,
  discoveredEvidence: [],
  interrogatedSuspects: [],
  playerNotes: '',
  xp: 0,
  completedCases: loadCases(),

  setMystery: (mystery) => set({ currentMystery: mystery }),

  discoverEvidence: (evidenceId) =>
    set((state) => ({
      discoveredEvidence: state.discoveredEvidence.includes(evidenceId)
        ? state.discoveredEvidence
        : [...state.discoveredEvidence, evidenceId],
    })),

  markSuspectInterrogated: (suspectId) =>
    set((state) => ({
      interrogatedSuspects: state.interrogatedSuspects.includes(suspectId)
        ? state.interrogatedSuspects
        : [...state.interrogatedSuspects, suspectId],
    })),

  setNotes: (notes) => set({ playerNotes: notes }),

  addXP: (amount) => set((state) => ({ xp: state.xp + amount })),

  saveCase: (caseData) =>
    set((state) => {
      const updated = [caseData, ...state.completedCases].slice(0, 50)
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)) } catch {}
      return { completedCases: updated }
    }),

  reset: () =>
    set({
      currentMystery: null,
      discoveredEvidence: [],
      interrogatedSuspects: [],
      playerNotes: '',
      xp: 0,
    }),
}))

export default useMysteryStore
