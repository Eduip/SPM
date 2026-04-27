'use client'

import { FormEvent, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { Bot, RotateCcw, Send, Sparkles } from 'lucide-react'
import { consultarAsistenteProyecto } from '../../app/cartera-proyectos/actions/ai-assistant'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  notice?: string
}

const quickQuestions = [
  '¿En qué estado está el proyecto?',
  '¿Qué documentos faltan?',
  '¿Qué falta para la rendición?',
  '¿Hay garantías por vencer?',
  '¿Qué pagos están pendientes?',
  '¿Cuál es el próximo paso recomendado?',
]

export default function ProjectAIAssistant({
  projectId,
  userId,
}: {
  projectId: string
  userId: string
}) {
  const storageKey = useMemo(
    () => `project-ai-chat:${userId}:${projectId}`,
    [projectId, userId]
  )
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    readStoredMessages(storageKey)
  )
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()
  const messageCounter = useRef(
    getHighestMessageId(readStoredMessages(storageKey))
  )

  const welcomeMessage = useMemo<ChatMessage>(
    () => ({
      id: 'welcome',
      role: 'assistant',
      content:
        'Puedo revisar el estado del proyecto, documentos, rendiciones, garantías, pagos y próximos pasos.',
    }),
    []
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(storageKey, JSON.stringify(messages))
  }, [messages, storageKey])

  const submitQuestion = (value: string) => {
    const cleanQuestion = value.trim()
    if (!cleanQuestion || isPending) return
    messageCounter.current += 1

    const userMessage: ChatMessage = {
      id: `user-${messageCounter.current}`,
      role: 'user',
      content: cleanQuestion,
    }

    setMessages((current) => [...current, userMessage])
    setQuestion('')
    setError('')

    startTransition(async () => {
      const result = await consultarAsistenteProyecto({
        proyectoId: projectId,
        pregunta: cleanQuestion,
      })

      if (!result.success) {
        setError(result.error || 'No se pudo consultar el asistente.')
        return
      }

      messageCounter.current += 1
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${messageCounter.current}`,
          role: 'assistant',
          content: result.answer || 'No encontré información suficiente para responder.',
          notice: 'notice' in result ? result.notice : undefined,
        },
      ])
    })
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    submitQuestion(question)
  }

  const clearConversation = () => {
    setMessages([])
    setError('')
    messageCounter.current = 0

    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(storageKey)
    }
  }

  return (
    <section
      style={{
        background: '#ffffff',
        borderRadius: 18,
        border: '1px solid var(--border)',
        boxShadow: '0 12px 28px rgba(15, 23, 42, 0.06)',
        overflow: 'hidden',
        position: 'sticky',
        top: 24,
        alignSelf: 'flex-start',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: 680,
          maxHeight: 'calc(100vh - 48px)',
        }}
      >
        <div
          style={{
            padding: 20,
            background:
              'linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: 'rgba(255,255,255,0.16)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bot size={22} />
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 800, opacity: 0.82 }}>
                VERSIÓN 3.1
              </div>
              <h2 style={{ margin: '4px 0 4px 0', fontSize: 20, lineHeight: 1.15 }}>
                Asistente IA
              </h2>
              <p style={{ margin: 0, fontSize: 12, lineHeight: 1.45, opacity: 0.86 }}>
                Conversación y consultas rápidas sobre la ficha.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={clearConversation}
            disabled={messages.length === 0 || isPending}
            title="Limpiar conversación"
            aria-label="Limpiar conversación"
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.1)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: messages.length === 0 || isPending ? 'not-allowed' : 'pointer',
              opacity: messages.length === 0 || isPending ? 0.45 : 1,
              flexShrink: 0,
            }}
          >
            <RotateCcw size={16} />
          </button>
        </div>

        <div
          style={{
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            flex: 1,
            minHeight: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 8,
              paddingBottom: 4,
            }}
          >
            {quickQuestions.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => submitQuestion(item)}
                disabled={isPending}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 999,
                  background: 'var(--surface-muted)',
                  color: 'var(--text)',
                  padding: '7px 11px',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: isPending ? 'not-allowed' : 'pointer',
                  opacity: isPending ? 0.7 : 1,
                }}
              >
                {item}
              </button>
            ))}
          </div>

          <div
            style={{
              flex: 1,
              minHeight: 220,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              paddingRight: 4,
              paddingBottom: 4,
            }}
          >
            {[welcomeMessage, ...messages].map((message) => {
              const isUser = message.role === 'user'

              return (
                <div
                  key={message.id}
                  style={{
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: '92%',
                    borderRadius: 14,
                    padding: '10px 12px',
                    background: isUser ? 'var(--primary)' : 'var(--surface-muted)',
                    color: isUser ? '#ffffff' : 'var(--text-strong)',
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.5,
                    fontSize: 13,
                  }}
                >
                  {isUser ? message.content : renderAssistantContent(message.content)}
                  {message.notice && (
                    <div
                      style={{
                        marginTop: 8,
                        paddingTop: 8,
                        borderTop: '1px solid rgba(148, 163, 184, 0.28)',
                        color: isUser ? '#ffffff' : 'var(--text-muted)',
                        fontSize: 11,
                      }}
                    >
                      {message.notice}
                    </div>
                  )}
                </div>
              )
            })}

            {isPending && (
              <div
                style={{
                  alignSelf: 'flex-start',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  color: 'var(--text-muted)',
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '8px 0',
                }}
              >
                <Sparkles size={15} />
                Analizando proyecto...
              </div>
            )}
          </div>

          {error && (
            <div
              style={{
                border: '1px solid #fecaca',
                background: '#fef2f2',
                color: '#b91c1c',
                borderRadius: 12,
                padding: '10px 12px',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10 }}>
            <input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Pregunta sobre este proyecto..."
              disabled={isPending}
              style={{
                flex: 1,
                height: 40,
                borderRadius: 12,
                border: '1px solid var(--border)',
                padding: '0 14px',
                outline: 'none',
                fontSize: 13,
                color: 'var(--text-strong)',
                background: '#ffffff',
              }}
            />
            <button
              type="submit"
              disabled={!question.trim() || isPending}
              aria-label="Enviar consulta al asistente"
              style={{
                width: 42,
                height: 40,
                borderRadius: 12,
                border: 'none',
                background: 'var(--primary)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: !question.trim() || isPending ? 'not-allowed' : 'pointer',
                opacity: !question.trim() || isPending ? 0.65 : 1,
              }}
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}

function renderAssistantContent(content: string) {
  const lines = content.split(/\r?\n/).filter((line, index, all) => {
    if (line.trim() !== '') return true
    return index > 0 && all[index - 1].trim() !== ''
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {lines.map((line, index) => {
        const trimmed = line.trim()

        if (!trimmed) {
          return <div key={index} style={{ height: 6 }} />
        }

        if (
          trimmed.startsWith('**') &&
          trimmed.endsWith('**') &&
          trimmed.length > 4
        ) {
          return (
            <div
              key={index}
              style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-strong)' }}
            >
              {renderInlineFormatting(trimmed.slice(2, -2))}
            </div>
          )
        }

        const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/)
        if (headingMatch) {
          const level = headingMatch[1].length
          const title = headingMatch[2]
          const fontSize = level <= 2 ? 18 : level === 3 ? 16 : 15

          return (
            <div
              key={index}
              style={{
                fontSize,
                fontWeight: 800,
                color: 'var(--text-strong)',
                marginTop: index === 0 ? 0 : 4,
              }}
            >
              {renderInlineFormatting(title)}
            </div>
          )
        }

        if (trimmed.startsWith('- ')) {
          return (
            <div
              key={index}
              style={{
                display: 'grid',
                gridTemplateColumns: '10px minmax(0, 1fr)',
                gap: 8,
                alignItems: 'start',
              }}
            >
              <span style={{ fontWeight: 900, color: 'var(--primary)', lineHeight: 1.5 }}>
                •
              </span>
              <span>{renderInlineFormatting(trimmed.slice(2))}</span>
            </div>
          )
        }

        return <div key={index}>{renderInlineFormatting(trimmed)}</div>
      })}
    </div>
  )
}

function renderInlineFormatting(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g).filter(Boolean)

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={index} style={{ fontWeight: 800 }}>
          {part.slice(2, -2)}
        </strong>
      )
    }

    return <span key={index}>{part}</span>
  })
}

function readStoredMessages(storageKey: string) {
  if (typeof window === 'undefined') return []

  try {
    const savedConversation = window.localStorage.getItem(storageKey)
    if (!savedConversation) return []

    const parsed = JSON.parse(savedConversation) as ChatMessage[]
    return Array.isArray(parsed)
      ? parsed.filter(
          (item) =>
            item &&
            typeof item.id === 'string' &&
            (item.role === 'user' || item.role === 'assistant') &&
            typeof item.content === 'string'
        )
      : []
  } catch {
    return []
  }
}

function getHighestMessageId(messages: ChatMessage[]) {
  return messages.reduce((max, item) => {
    const numericId = Number(item.id.split('-').pop() ?? 0)
    return Number.isFinite(numericId) ? Math.max(max, numericId) : max
  }, 0)
}
