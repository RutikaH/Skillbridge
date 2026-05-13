import JsonCard from './JsonCard'

/**
 * Lightly parse markdown-ish text into React elements.
 * Handles: **bold**, `code`, ```code blocks```, bullet lists, newlines.
 * Does NOT try to fully replicate a markdown parser — just what the AI returns.
 */
function parseInline(text) {
  // Split on **bold**, `code`, keeping delimiters
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i}>{part.slice(1, -1)}</code>
    }
    return part
  })
}

function renderText(text, stripAllCodeBlocks = false) {
  // Remove JSON code blocks from visible text — they're rendered as cards
  let clean = text.replace(/```json[\s\S]*?```/g, '')

  if (stripAllCodeBlocks) {
    // Also strip plain ``` blocks when a card already displays the data
    clean = clean.replace(/```[\s\S]*?```/g, '')
  } else {
    clean = clean.replace(/```[\s\S]*?```/g, (match) => match) // keep non-json code blocks
  }

  clean = clean.trim()

  if (!clean) return null

  const lines = clean.split('\n')
  const elements = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // Heading: ## Step N — Title
    if (/^##\s/.test(line)) {
      elements.push(<h3 key={`h3-${i}`} className="step-heading">{line.replace(/^##\s/, '')}</h3>)
      i++
      continue
    }

    // Heading: # Title
    if (/^#\s/.test(line)) {
      elements.push(<h2 key={`h2-${i}`} className="step-heading">{line.replace(/^#\s/, '')}</h2>)
      i++
      continue
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      elements.push(<hr key={`hr-${i}`} className="step-divider" />)
      i++
      continue
    }

    // Fenced non-JSON code block
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim()
      const codeLines = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      elements.push(
        <pre key={i}>
          <code>{codeLines.join('\n')}</code>
        </pre>
      )
      i++
      continue
    }

    // Bullet list item
    if (/^[-*•→]\s/.test(line)) {
      const listItems = []
      while (i < lines.length && /^[-*•→]\s/.test(lines[i])) {
        listItems.push(<li key={i}>{parseInline(lines[i].replace(/^[-*•→]\s/, ''))}</li>)
        i++
      }
      elements.push(<ul key={`ul-${i}`}>{listItems}</ul>)
      continue
    }

    // Numbered list
    if (/^\d+\.\s/.test(line)) {
      const listItems = []
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        listItems.push(<li key={i}>{parseInline(lines[i].replace(/^\d+\.\s/, ''))}</li>)
        i++
      }
      elements.push(<ol key={`ol-${i}`}>{listItems}</ol>)
      continue
    }

    // Blank line → spacer
    if (line.trim() === '') {
      elements.push(<br key={`br-${i}`} />)
      i++
      continue
    }

    // Normal line
    elements.push(<p key={i}>{parseInline(line)}</p>)
    i++
  }

  return <div className="msg-text">{elements}</div>
}

export default function ChatBubble({ message, loading }) {
  const isAI = message.role === 'ai'

  return (
    <div className={`bubble-row ${isAI ? 'ai' : 'user'}`}>
      {isAI && <div className="avatar">🎓</div>}

      <div className="bubble-col">
        {loading ? (
          <div className="bubble ai-bubble loading-bubble">
            <span className="dot" /><span className="dot" /><span className="dot" />
          </div>
        ) : (
          <>
            {message.content?.trim() && (
              <div className={`bubble ${isAI ? 'ai-bubble' : 'user-bubble'}`}>
                {renderText(message.content, isAI && !!message.jsonData)}
              </div>
            )}
            {isAI && message.jsonData && <JsonCard data={message.jsonData} />}
          </>
        )}
      </div>

      {!isAI && <div className="avatar">👤</div>}
    </div>
  )
}
