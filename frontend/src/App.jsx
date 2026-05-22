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
  const [listening, setListening] = useState(false);
  const [language, setLanguage] = useState("English");
  const [messages, setMessages] = useState([])
  const [sessionId, setSessionId] = useState(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {

  const startSession = async () => {

    try {

      setInitializing(true);

      const res = await fetch(
        `${API_BASE}/start?language=${language}`,
        {
          method: 'POST',
        }
      );

      const data = await res.json();

      setSessionId(data.session_id);

      setMessages([
        {
          role: 'ai',
          content: data.message,
          jsonData: null,
        },
      ]);

    } catch (err) {

      console.error(err);

    } finally {

      setInitializing(false);

    }
  };

  startSession();

}, [language]);
  const startVoiceInput = () => {

    if (!("webkitSpeechRecognition" in window)) {
      alert("Speech recognition not supported in this browser");
      return;
    }

    const recognition = new window.webkitSpeechRecognition();

        // MULTILINGUAL SUPPORT

    const languageMap = {
      English: "en-US",
      Hindi: "hi-IN",
      Telugu: "te-IN",
      Tamil: "ta-IN",
      Spanish: "es-ES"
    };

    recognition.lang = languageMap[language] || "en-US";

    recognition.continuous = false;
    recognition.interimResults = false;

    setListening(true);

    recognition.start();

    recognition.onresult = (event) => {

      const transcript = event.results[0][0].transcript;

        setInput(transcript);
      };

    recognition.onerror = (event) => {
      console.error(event.error);
      };

    recognition.onend = () => {
        setListening(false);
      };
    };
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
        body: JSON.stringify({ session_id: sessionId, message: text ,language: language}),
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

  const resetSession = async () => {

  try {

    setInitializing(true);

    setMessages([]);

    setInput('');

    const res = await fetch(
      `${API_BASE}/start?language=${language}`,
      {
        method: 'POST',
      }
    );

    const data = await res.json();

    setSessionId(data.session_id);

    setMessages([
      {
        role: 'ai',
        content: data.message,
        jsonData: null,
      },
    ]);

  } catch (err) {

    console.error(err);

  } finally {

    setInitializing(false);

  }
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
        <button
          className="mic-btn"
          onClick={startVoiceInput}
          disabled={loading || initializing}
        >
          {listening ? "🎙️ Listening..." : "🎤"}
        </button>
        <button className="send-btn" onClick={sendMessage} disabled={loading || !input.trim() || initializing}>
          Send
        </button>
      </footer>
    </div>
  )
}
