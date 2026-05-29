import { useCallback, useEffect, useRef, useState } from 'react'
import ChatBubble from './ChatBubble'
import { fetchWithAuth, getProfile, logout } from '../services/authService'
import { useNavigate } from 'react-router-dom'

const languages = ['English', 'Hindi', 'Telugu', 'Tamil', 'Spanish']

export default function AssessmentChatbot({ className = '' }) {
  const navigate = useNavigate()

  const [user, setUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [sessionId, setSessionId] = useState(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const [language, setLanguage] = useState('English')
  const [error, setError] = useState('')
  const [listening, setListening] = useState(false)

  const bottomRef = useRef(null)
  const inputRef = useRef(null)


  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profile = await getProfile()
        setUser(profile)
      } catch {
        navigate('/login')
      }
    }

    loadProfile()
  }, [navigate])

  useEffect(() => {
    const startSession = async () => {
      try {
        setInitializing(true)

        const data = await fetchWithAuth(`/start?language=${encodeURIComponent(language)}`, {
          method: 'POST',
        })

        setSessionId(data.session_id)
        setMessages([
          {
            role: 'ai',
            content: data.message,
            jsonData: null,
          },
        ])
      } catch (err) {
        setError(err.message)
      } finally {
        setInitializing(false)
      }
    }

    startSession()
  }, [language])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading, initializing])

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || loading || !sessionId) return

    setInput('')
    setMessages((prev) => [
      ...prev,
      {
        role: 'user',
        content: text,
        jsonData: null,
      },
    ])

    setLoading(true)
    setError('')

    try {
      const data = await fetchWithAuth('/chat', {
        method: 'POST',
        body: JSON.stringify({
          session_id: sessionId,
          message: text,
          language,
        }),
      })

      const newMessages = [
        {
          role: 'ai',
          content: data.message,
          jsonData: data.json_data ?? null,
        },
      ]

      if (data.extra_messages?.length) {
        data.extra_messages.forEach((m) => {
          newMessages.push({
            role: 'ai',
            content: m.message,
            jsonData: m.json_data ?? null,
          })
        })
      }

      setMessages((prev) => [...prev, ...newMessages])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          content: `❌ Error: ${err.message}. Please try again.`,
          jsonData: null,
        },
      ])
    } finally {
      setLoading(false)
      setTimeout(() => {
        inputRef.current?.focus()
      }, 0)
    }
  }, [input, loading, sessionId, language])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const startVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser')
      return
    }

    const recognition = new window.webkitSpeechRecognition()

    const languageMap = {
      English: 'en-US',
      Hindi: 'hi-IN',
      Telugu: 'te-IN',
      Tamil: 'ta-IN',
      Spanish: 'es-ES',
    }

    recognition.lang = languageMap[language] || 'en-US'
    recognition.continuous = false
    recognition.interimResults = false

    setListening(true)
    recognition.start()

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setInput(transcript)
    }

    recognition.onerror = (event) => {
      console.error(event.error)
    }

    recognition.onend = () => {
      setListening(false)
    }
  }

  const resetSession = async () => {
    try {
      setInitializing(true)
      setMessages([])
      setInput('')

      const data = await fetchWithAuth(`/start?language=${encodeURIComponent(language)}`, {
        method: 'POST',
      })

      setSessionId(data.session_id)
      setMessages([
        {
          role: 'ai',
          content: data.message,
          jsonData: null,
        },
      ])
    } catch (err) {
      setError(err.message)
    } finally {
      setInitializing(false)
    }
  }

  return (
    <div className="assessment-shell">
      <div className="assessment-header">
        <div>
          <div className="assessment-title-row">
            <div className="assessment-title">AI Assessment Chat</div>
            <span className="assessment-status" aria-label="Assessment active">
              <span className="assessment-status-dot" aria-hidden />
              Assessment Active
            </span>
          </div>
          <div className="assessment-subtitle">Answer questions to generate verified skill scores</div>
        </div>

        <div className="assessment-actions">
          <select
            className="assessment-language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            aria-label="Assessment language"
          >
            {languages.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>

          <button className="btn" type="button" onClick={resetSession} disabled={initializing || loading}>
            ↻ New Session
          </button>
        </div>
      </div>

      <div className="assessment-grid">
        <div className="assessment-chat">
          <div className="chat-window">
            {initializing && (
              <div className="init-loader">
                <div className="spinner" />
                <span>Initializing your chat...</span>
              </div>
            )}

            {error && <div className="field-error panel-error">{error}</div>}

            <div className="chat-messages" aria-live="polite">
              {messages.map((msg, i) => (
                <ChatBubble key={i} message={msg} loading={false} />
              ))}

              {loading && (
                <div className="bubble ai-bubble loading-bubble">
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </div>

          <div className="card-footer">
            <div className="input-bar">
              <textarea
                ref={inputRef}
                className="chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your message and press Enter..."
                disabled={loading || initializing}
                rows={1}
              />
              <button className="mic-btn" type="button" onClick={startVoiceInput} disabled={loading || initializing}>
                {listening ? '🎙️ ' : '🎤'}
              </button>
              <button
                className="send-btn"
                type="button"
                onClick={sendMessage}
                disabled={loading || !input.trim() || initializing}
              >
                Send
              </button>
            </div>
          </div>
        </div>

        <div className="assessment-side">
          <div className="card">
            <div className="section-title">You</div>
            <div className="muted">{user?.name ?? 'User'}</div>
            <div className="muted">Language: {language}</div>
          </div>

          <div style={{ height: 12 }} />

          <div className="card">
            <div className="section-title">Tip</div>
            <div className="muted">Answer the assessment questions directly to progress.</div>
          </div>
        </div>
      </div>
    </div>
  )
}

