import { useState, useRef, useEffect, useCallback } from 'react'
import ChatBubble from './components/ChatBubble'

const API_BASE = ''  // proxied via Vite to http://localhost:8000

export default function App() {
  const [messages, setMessages] = useState([])
  const [sessionId, setSessionId] = useState(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Start session on mount
  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch(`${API_BASE}/start`, { method: 'POST' })
        const data = await res.json()
        setSessionId(data.session_id)
        setMessages([{ role: 'ai', content: data.message, jsonData: null }])
      } catch {
        setMessages([{
          role: 'ai',
          content: '⚠️ Could not connect to SkillBridge backend.\n\nMake sure the FastAPI server is running on **port 8000**.\n\n```\ncd backend\nuvicorn main:app --reload\n```',
          jsonData: null,
        }])
      } finally {
        setInitializing(false)
      }
    }
    init()
  }, [])

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || loading || !sessionId) return

    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: text, jsonData: null }])
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, message: text }),
      })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const data = await res.json()
      setMessages(prev => [...prev, {
        role: 'ai',
        content: data.message,
        jsonData: data.json_data ?? null,
      }])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'ai',
        content: `❌ Error: ${err.message}. Please try again.`,
        jsonData: null,
      }])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [input, loading, sessionId])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const resetSession = async () => {
    setInitializing(true)
    setMessages([])
    setInput('')
    try {
      const res = await fetch(`${API_BASE}/start`, { method: 'POST' })
      const data = await res.json()
      setSessionId(data.session_id)
      setMessages([{ role: 'ai', content: data.message, jsonData: null }])
    } catch {
      setMessages([{ role: 'ai', content: '⚠️ Could not restart. Check backend.', jsonData: null }])
    } finally {
      setInitializing(false)
    }
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <span className="logo">🎓</span>
          <div>
            <h1>SkillBridge AI</h1>
            <p>From zero to job-ready</p>
          </div>
        </div>
        <button className="btn-reset" onClick={resetSession} title="Start over">
          ↺ New Session
        </button>
      </header>

      {/* Chat window */}
      <main className="chat-window">
        {initializing && (
          <div className="init-loader">
            <div className="spinner" />
            <span>Starting SkillBridge AI...</span>
          </div>
        )}
        {messages.map((msg, i) => (
          <ChatBubble key={i} message={msg} />
        ))}
        {loading && (
          <div className="bubble ai-bubble loading-bubble">
            <span className="dot" /><span className="dot" /><span className="dot" />
          </div>
        )}
        <div ref={bottomRef} />
      </main>

      {/* Input bar */}
      <footer className="input-bar">
        <textarea
          ref={inputRef}
          className="chat-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your answer and press Enter…"
          disabled={loading || initializing}
          rows={1}
        />
        <button
          className="send-btn"
          onClick={sendMessage}
          disabled={loading || !input.trim() || initializing}
        >
          Send
        </button>
      </footer>
    </div>
  )
}
