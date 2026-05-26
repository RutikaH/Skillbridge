import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ChatBubble from '../components/ChatBubble'
import { fetchWithAuth, getProfile, logout } from '../services/authService'

const languages = ['English', 'Hindi', 'Telugu', 'Tamil', 'Spanish']

export default function Dashboard() {
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

        const data = await fetchWithAuth(
          `/start?language=${encodeURIComponent(language)}`,
          {
            method: 'POST',
          }
        )

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
    bottomRef.current?.scrollIntoView({
      behavior: 'smooth',
    })
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

    if (!("webkitSpeechRecognition" in window)) {
      alert("Speech recognition not supported in this browser")
      return
    }

    const recognition = new window.webkitSpeechRecognition()

    const languageMap = {
      English: "en-US",
      Hindi: "hi-IN",
      Telugu: "te-IN",
      Tamil: "ta-IN",
      Spanish: "es-ES"
    }

    recognition.lang = languageMap[language] || "en-US"

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

      const data = await fetchWithAuth(
        `/start?language=${encodeURIComponent(language)}`,
        {
          method: 'POST',
        }
      )

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

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="dashboard-shell">

      {/* Floating Top Right User */}
      <div className="floating-user-profile">

        <div className="user-avatar-small">
          {user?.name?.charAt(0) ?? 'U'}
        </div>

        <span className="floating-user-name">
          {user?.name ?? 'User'}
        </span>

      </div>

      <div className="dashboard-container">

        {/* Top Header */}
        <div className="dashboard-top">

          <div>
            <div className="dashboard-title">
              SkillBridge AI
            </div>

            <div className="dashboard-subtitle">
              From zero to job-ready
            </div>
          </div>

          <div className="dashboard-actions">

            <div className="credentials-group">

              <select
                className="top-language-selector"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                {languages.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>

              <button
                className="logout-button"
                onClick={handleLogout}
              >
                Logout
              </button>

            </div>

            <button
              className="secondary-button"
              onClick={resetSession}
              disabled={initializing || loading}
            >
              ↻ New Session
            </button>

          </div>
        </div>

        {/* Main Layout */}
        <div className="dashboard-main no-sidebar">

          {/* Center Chat */}
          <div className="center-column">

            <div className="chat-card">

              {/* Chat Window */}
              <div className="chat-window">

                {initializing && (
                  <div className="init-loader">
                    <div className="spinner" />
                    <span>Initializing your chat...</span>
                  </div>
                )}

                {error && (
                  <div className="field-error panel-error">
                    {error}
                  </div>
                )}

                {messages.map((msg, i) => (
                  <ChatBubble
                    key={i}
                    message={msg}
                  />
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

              {/* Footer Input */}
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
                  <button
                    className="mic-btn"
                    onClick={startVoiceInput}
                    disabled={loading || initializing}
                  >
                    {listening ? "🎙️ " : "🎤"}
                  </button>
                  <button
                    className="send-btn"
                    onClick={sendMessage}
                    disabled={
                      loading ||
                      !input.trim() ||
                      initializing
                    }
                  >
                    Send
                  </button>

                </div>

              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  )
}