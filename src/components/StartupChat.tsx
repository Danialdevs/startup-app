'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  PaperAirplaneIcon, 
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface StartupChatProps {
  startupId: string
  isOpen: boolean
  onClose: () => void
}

export function StartupChat({ startupId, isOpen, onClose }: StartupChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Load chat history
  useEffect(() => {
    if (!isOpen || !startupId) return

    const loadHistory = async () => {
      setIsLoadingHistory(true)
      try {
        const res = await fetch(`/api/startups/${startupId}/chat`)
        if (res.ok) {
          const data = await res.json()
          if (data.messages && data.messages.length > 0) {
            const loadedMessages = data.messages.map((m: { role: string; content: string; createdAt: string }) => ({
              role: m.role as 'user' | 'assistant',
              content: m.content,
              timestamp: new Date(m.createdAt)
            }))
            setMessages(loadedMessages)
          } else {
            // No history, show greeting
            setMessages([{
              role: 'assistant',
              content: 'Привет! Я AI-ассистент вашего стартапа. Задайте мне любой вопрос о проекте, и я помогу с развитием, стратегией и решениями.',
              timestamp: new Date()
            }])
          }
        } else {
          // Error loading, show greeting
          setMessages([{
            role: 'assistant',
            content: 'Привет! Я AI-ассистент вашего стартапа. Задайте мне любой вопрос о проекте, и я помогу с развитием, стратегией и решениями.',
            timestamp: new Date()
          }])
        }
      } catch (error) {
        console.error('Failed to load chat history:', error)
        setMessages([{
          role: 'assistant',
          content: 'Привет! Я AI-ассистент вашего стартапа. Задайте мне любой вопрос о проекте, и я помогу с развитием, стратегией и решениями.',
          timestamp: new Date()
        }])
      } finally {
        setIsLoadingHistory(false)
      }
    }

    loadHistory()
  }, [isOpen, startupId])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // Send only the new user message - API will handle context from database
      console.log('Sending chat request...')
      const res = await fetch(`/api/startups/${startupId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [{ role: 'user', content: userMessage.content }]
        })
      })

      console.log('Chat response status:', res.status)
      
      let data
      try {
        data = await res.json()
        console.log('Chat response data:', { 
          hasResponse: !!data.response, 
          hasError: !!data.error,
          responseLength: data.response?.length || 0
        })
      } catch (parseError) {
        console.error('Failed to parse response:', parseError)
        const errorMessage: Message = {
          role: 'assistant',
          content: 'Ошибка: Не удалось получить ответ от сервера. Попробуйте еще раз.',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, errorMessage])
        return
      }

      if (res.ok && data.response && typeof data.response === 'string') {
        console.log('Success! Adding assistant message')
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        console.error('Chat API error:', {
          status: res.status,
          ok: res.ok,
          data: data
        })
        const errorMessage: Message = {
          role: 'assistant',
          content: data.response || data.error || data.details || 'Извините, произошла ошибка. Попробуйте еще раз позже.',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, errorMessage])
      }
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Не удалось отправить сообщение. Проверьте подключение к интернету.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!isOpen) return null

  if (isLoadingHistory) {
    return (
      <div className="w-full h-full flex items-center justify-center border rounded-lg bg-card">
        <div className="flex items-center gap-2 text-muted-foreground">
          <ArrowPathIcon className="h-4 w-4 animate-spin" />
          <span className="text-sm">Загрузка истории...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col border rounded-lg bg-card shadow-sm">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-4 py-2">
              <p className="text-sm">Привет! Я AI-ассистент вашего стартапа. Задайте мне любой вопрос о проекте, и я помогу с развитием, стратегией и решениями.</p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground'
              }`}
            >
              {message.role === 'assistant' ? (
                <div className="text-sm markdown-content">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1 ml-2">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1 ml-2">{children}</ol>,
                      li: ({ children }) => <li className="ml-1">{children}</li>,
                      h1: ({ children }) => <h1 className="text-lg font-bold mb-2 mt-3 first:mt-0">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-base font-bold mb-2 mt-3 first:mt-0">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-sm font-semibold mb-1 mt-2 first:mt-0">{children}</h3>,
                      code: ({ children, className }) => {
                        const isInline = !className
                        return isInline ? (
                          <code className="bg-muted/50 dark:bg-muted/30 px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>
                        ) : (
                          <code className="block bg-muted/50 dark:bg-muted/30 p-2 rounded text-xs font-mono overflow-x-auto mb-2 whitespace-pre">{children}</code>
                        )
                      },
                      pre: ({ children }) => <pre className="mb-2">{children}</pre>,
                      blockquote: ({ children }) => <blockquote className="border-l-4 border-primary/30 pl-3 italic my-2 opacity-80">{children}</blockquote>,
                      a: ({ href, children }) => (
                        <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">
                          {children}
                        </a>
                      ),
                      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                      em: ({ children }) => <em className="italic">{children}</em>,
                      hr: () => <hr className="my-3 border-muted-foreground/20" />,
                      table: ({ children }) => <div className="overflow-x-auto my-2"><table className="min-w-full border-collapse">{children}</table></div>,
                      th: ({ children }) => <th className="border border-muted-foreground/20 px-2 py-1 text-left font-semibold bg-muted/30">{children}</th>,
                      td: ({ children }) => <td className="border border-muted-foreground/20 px-2 py-1">{children}</td>,
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              )}
              <p className={`text-xs mt-2 ${
                message.role === 'user' 
                  ? 'text-primary-foreground/70' 
                  : 'text-muted-foreground'
              }`}>
                {message.timestamp.toLocaleTimeString('ru-RU', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
          </div>
        ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-4 py-2">
              <div className="flex items-center gap-2">
                <ArrowPathIcon className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Печатает...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Задайте вопрос о вашем стартапе..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon"
          >
            {isLoading ? (
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
            ) : (
              <PaperAirplaneIcon className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          AI знает контекст вашего стартапа и может помочь с развитием
        </p>
      </div>
    </div>
  )
}
