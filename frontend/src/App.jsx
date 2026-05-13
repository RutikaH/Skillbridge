import { useState, useRef, useEffect, useCallback } from 'react'
import ChatBubble from './components/ChatBubble'

const API_BASE = '' // proxied via Vite to http://localhost:8000

// Simple UUID generator
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export default function App() {
  const [messages, setMessages] = useState([])
  const [sessionId, setSessionId] = useState(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    setSessionId(uuidv4())
    setMessages([
      {
        role: 'ai',
        content:
          "Hi! I'm SkillBridge AI 👋\n\nI'll help you go from zero to job-ready — no resume needed!\n\nLet's start with 3 quick questions:\n\n1. What kind of opportunity are you looking for? (Job / Internship / Freelance)\n2. What skills do you currently know? (Vague is fine)\n3. What is your preferred language?",
        jsonData: null,
      },
    ])
    setInitializing(false)
  }, [])

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || loading || !sessionId) return

    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: text, jsonData: null }])
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, message: text }),
      })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const data = await res.json()
      const newMessages = [
        { role: 'ai', content: data.message, jsonData: data.json_data ?? null },
      ]
      if (data.extra_messages?.length > 0) {
        for (const m of data.extra_messages) {
          newMessages.push({ role: 'ai', content: m.message, jsonData: m.json_data ?? null })
        }
      }
      setMessages((prev) => [...prev, ...newMessages])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'ai', content: `❌ Error: ${err.message}. Please try again.`, jsonData: null },
      ])
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

  const resetSession = () => {
    setInitializing(true)
    setMessages([])
    setInput('')
    const id = uuidv4()
    setSessionId(id)
    setMessages([
      {
        role: 'ai',
        content:
          "Hi! I'm SkillBridge AI 👋\n\nI'll help you go from zero to job-ready — no resume needed!\n\nLet's start with 3 quick questions:\n\n1. What kind of opportunity are you looking for? (Job / Internship / Freelance)\n2. What skills do you currently know? (Vague is fine)\n3. What is your preferred language?",
        jsonData: null,
      },
    ])
    setInitializing(false)
  }

  return (
    <div className="app">
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
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
          </div>
        )}

        <div ref={bottomRef} />
      </main>

      <footer className="input-bar">
        <textarea
          ref={inputRef}
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your answer and press Enter…"
          disabled={loading || initializing}
          rows={1}
        />
        <button className="send-btn" onClick={sendMessage} disabled={loading || !input.trim() || initializing}>
          Send
        </button>
      </footer>
    </div>
  )
}
