'use client'

import { useState, useEffect } from 'react'
import {
  SparklesIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  LightBulbIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  CpuChipIcon,
  GlobeAltIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  RocketLaunchIcon,
  BeakerIcon,
  PresentationChartLineIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'

interface AIThinkingAnimationProps {
  currentStep: number
  totalSteps: number
  currentAction: string
}

const THINKING_PHRASES = [
  'Анализирую рыночные тренды...',
  'Изучаю конкурентную среду...',
  'Оцениваю потенциал роста...',
  'Проверяю бизнес-модель...',
  'Исследую целевую аудиторию...',
  'Калибрую модели прогнозирования...',
  'Обрабатываю отраслевые данные...',
  'Синтезирую рекомендации...',
]

const DATA_STREAMS = [
  'market_size: $2.4B → $8.7B',
  'growth_rate: 24.5% CAGR',
  'competitors: 12 identified',
  'tam_sam_som: calculating...',
  'risk_score: evaluating...',
  'funding_trends: $340M Q3',
  'user_adoption: 45% YoY',
  'market_fit: analyzing...',
]

export function AIThinkingAnimation({ currentStep, totalSteps, currentAction }: AIThinkingAnimationProps) {
  const [dots, setDots] = useState('')
  const [streamIndex, setStreamIndex] = useState(0)
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; delay: number }[]>([])
  const [neuralNodes, setNeuralNodes] = useState<{ id: number; x: number; y: number; active: boolean }[]>([])

  // Animate dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.')
    }, 400)
    return () => clearInterval(interval)
  }, [])

  // Cycle through data streams
  useEffect(() => {
    const interval = setInterval(() => {
      setStreamIndex(prev => (prev + 1) % DATA_STREAMS.length)
    }, 800)
    return () => clearInterval(interval)
  }, [])

  // Cycle through phrases
  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex(prev => (prev + 1) % THINKING_PHRASES.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  // Generate particles
  useEffect(() => {
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2
    }))
    setParticles(newParticles)
  }, [])

  // Generate neural network nodes
  useEffect(() => {
    const nodes = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: 10 + (i % 5) * 20 + Math.random() * 10,
      y: 20 + Math.floor(i / 5) * 30 + Math.random() * 10,
      active: false
    }))
    setNeuralNodes(nodes)

    // Animate nodes
    const interval = setInterval(() => {
      setNeuralNodes(prev => prev.map(node => ({
        ...node,
        active: Math.random() > 0.6
      })))
    }, 300)
    return () => clearInterval(interval)
  }, [])

  const progress = ((currentStep + 1) / totalSteps) * 100

  const icons = [
    MagnifyingGlassIcon,
    ChartBarIcon,
    GlobeAltIcon,
    CpuChipIcon,
    PresentationChartLineIcon,
    LightBulbIcon,
    CurrencyDollarIcon,
    UserGroupIcon,
    BeakerIcon,
    ShieldCheckIcon,
    DocumentTextIcon,
    CheckCircleIcon
  ]

  const CurrentIcon = icons[currentStep % icons.length]

  return (
    <div className="relative w-full min-h-[500px] overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      {/* Animated background grid */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(139, 92, 246, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139, 92, 246, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          animation: 'gridMove 20s linear infinite'
        }} />
      </div>

      {/* Floating particles */}
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute w-1 h-1 bg-purple-400 rounded-full opacity-60"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            animation: `float ${3 + particle.delay}s ease-in-out infinite`,
            animationDelay: `${particle.delay}s`
          }}
        />
      ))}

      {/* Neural network visualization */}
      <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 100 100">
        {/* Connections */}
        {neuralNodes.map((node, i) => 
          neuralNodes.slice(i + 1).map((targetNode, j) => {
            if (Math.abs(node.x - targetNode.x) < 30 && Math.abs(node.y - targetNode.y) < 40) {
              const isActive = node.active || targetNode.active
              return (
                <line
                  key={`${i}-${j}`}
                  x1={node.x}
                  y1={node.y}
                  x2={targetNode.x}
                  y2={targetNode.y}
                  stroke={isActive ? '#a855f7' : '#6b21a8'}
                  strokeWidth={isActive ? 0.3 : 0.1}
                  opacity={isActive ? 0.8 : 0.3}
                  className="transition-all duration-300"
                />
              )
            }
            return null
          })
        )}
        {/* Nodes */}
        {neuralNodes.map(node => (
          <circle
            key={node.id}
            cx={node.x}
            cy={node.y}
            r={node.active ? 1.5 : 0.8}
            fill={node.active ? '#c084fc' : '#7c3aed'}
            className="transition-all duration-300"
          >
            {node.active && (
              <animate
                attributeName="r"
                values="1.5;2.5;1.5"
                dur="0.6s"
                repeatCount="1"
              />
            )}
          </circle>
        ))}
      </svg>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full space-y-8">
        {/* Central AI brain */}
        <div className="relative">
          {/* Outer rings */}
          <div className="absolute -inset-8 rounded-full border-2 border-purple-500/20 animate-ping" style={{ animationDuration: '2s' }} />
          <div className="absolute -inset-6 rounded-full border border-purple-400/30 animate-spin" style={{ animationDuration: '8s' }} />
          <div className="absolute -inset-4 rounded-full border border-purple-300/40 animate-spin" style={{ animationDuration: '6s', animationDirection: 'reverse' }} />
          
          {/* Core */}
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-purple-500/50">
            <div className="absolute inset-1 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 animate-pulse" />
            <CurrentIcon className="relative z-10 h-10 w-10 text-white" />
          </div>

          {/* Orbiting icons */}
          <div className="absolute -inset-16 animate-spin" style={{ animationDuration: '10s' }}>
            <SparklesIcon className="absolute top-0 left-1/2 -translate-x-1/2 h-5 w-5 text-yellow-400" />
            <ChartBarIcon className="absolute bottom-0 left-1/2 -translate-x-1/2 h-5 w-5 text-blue-400" />
            <CpuChipIcon className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-5 text-green-400" />
            <GlobeAltIcon className="absolute right-0 top-1/2 -translate-y-1/2 h-5 w-5 text-pink-400" />
          </div>
        </div>

        {/* Status text */}
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-bold text-white">
            AI Анализирует{dots}
          </h3>
          <p className="text-purple-300 text-lg animate-pulse">
            {THINKING_PHRASES[phraseIndex]}
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-md space-y-2">
          <div className="flex justify-between text-sm text-purple-300">
            <span>Прогресс анализа</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-purple-900/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 rounded-full transition-all duration-500 relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </div>
          </div>
        </div>

        {/* Current action */}
        <div className="bg-purple-900/40 backdrop-blur-sm rounded-xl px-6 py-4 border border-purple-500/30 max-w-lg">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 bg-green-400 rounded-full animate-pulse" />
            <span className="text-white font-medium">{currentAction}</span>
          </div>
        </div>

        {/* Data stream */}
        <div className="flex flex-wrap justify-center gap-3 max-w-lg">
          {DATA_STREAMS.slice(0, 4).map((stream, i) => (
            <div
              key={i}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all duration-300 ${
                i === streamIndex % 4
                  ? 'bg-purple-500/40 text-purple-100 border border-purple-400/50'
                  : 'bg-purple-900/30 text-purple-400 border border-purple-800/50'
              }`}
            >
              {stream}
            </div>
          ))}
        </div>

        {/* Step indicators */}
        <div className="flex gap-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i < currentStep
                  ? 'w-8 bg-green-400'
                  : i === currentStep
                  ? 'w-8 bg-purple-400 animate-pulse'
                  : 'w-2 bg-purple-700'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-4 left-4 flex items-center gap-2 text-purple-400 text-xs">
        <RocketLaunchIcon className="h-4 w-4" />
        <span className="font-mono">Launch Pad AI v2.0</span>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          25% { transform: translateY(-10px) translateX(5px); }
          50% { transform: translateY(-5px) translateX(-5px); }
          75% { transform: translateY(-15px) translateX(3px); }
        }
        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(40px, 40px); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  )
}

// Analysis steps for the wizard
export const ANALYSIS_STEPS = [
  { 
    text: 'Исследование рыночных данных...', 
    detail: 'Сбор информации о размере рынка и тенденциях',
    icon: MagnifyingGlassIcon 
  },
  { 
    text: 'Анализ конкурентов...', 
    detail: 'Изучение ключевых игроков и их стратегий',
    icon: ChartBarIcon 
  },
  { 
    text: 'Оценка отраслевых тенденций...', 
    detail: 'Прогнозирование развития рынка',
    icon: GlobeAltIcon 
  },
  { 
    text: 'Обработка данных нейросетью...', 
    detail: 'Глубокий анализ с помощью AI',
    icon: CpuChipIcon 
  },
  { 
    text: 'Оценка бизнес-модели...', 
    detail: 'Проверка жизнеспособности модели',
    icon: PresentationChartLineIcon 
  },
  { 
    text: 'Генерация инсайтов...', 
    detail: 'Формирование ключевых выводов',
    icon: LightBulbIcon 
  },
  { 
    text: 'Расчёт финансовых показателей...', 
    detail: 'Оценка потенциальной доходности',
    icon: CurrencyDollarIcon 
  },
  { 
    text: 'Анализ целевой аудитории...', 
    detail: 'Сегментация и портреты пользователей',
    icon: UserGroupIcon 
  },
  { 
    text: 'Тестирование гипотез...', 
    detail: 'Валидация ключевых предположений',
    icon: BeakerIcon 
  },
  { 
    text: 'Оценка рисков...', 
    detail: 'Идентификация потенциальных угроз',
    icon: ShieldCheckIcon 
  },
  { 
    text: 'Формирование отчёта...', 
    detail: 'Структурирование результатов анализа',
    icon: DocumentTextIcon 
  },
  { 
    text: 'Финализация рекомендаций...', 
    detail: 'Подготовка плана действий',
    icon: CheckCircleIcon 
  },
]

