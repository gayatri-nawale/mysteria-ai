import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
})

export const generateMystery = (genre, difficulty) =>
  api.post('/api/mystery/generate', { genre, difficulty }).then((r) => r.data)

export const interrogateSuspect = (data) =>
  api.post('/api/interrogate', data).then((r) => r.data)

export const submitAccusation = (data) =>
  api.post('/api/accusation/submit', data).then((r) => r.data)

export default api
