'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  RocketLaunchIcon,
  ChartBarIcon,
  UserGroupIcon,
  ClockIcon,
  CurrencyDollarIcon,
  LightBulbIcon,
  ArrowTrendingUpIcon,
  ShieldCheckIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  DocumentTextIcon,
  LinkIcon
} from '@heroicons/react/24/outline'
import { SparklesIcon } from '@heroicons/react/24/solid'

interface MarketFactor {
  name: string
  score: number
  description: string
}

interface ExecutionFactor {
  name: string
  score: number
  description: string
}

interface QuickWin {
  title: string
  effort: 'low' | 'medium' | 'high'
  description: string
  result: string
}

interface RoadmapItem {
  phase: string
  period: string
  items: string[]
}

interface TeamRequirement {
  role: string
  description?: string
}

interface ImplementationStep {
  title: string
  period: string
  cost: string
  risk: 'low' | 'medium' | 'high'
}

interface Resource {
  category: string
  items: { name: string; description: string; url?: string }[]
}

export interface AnalysisData {
  executiveSummary: {
    marketSize: string
    growthRate: string
    targetYear: string
    projectedSize: string
    recentFunding?: string
    overallScore: number
    verdict: 'excellent' | 'good' | 'moderate' | 'risky'
    keyRecommendations: string[]
  }
  marketAnalysis: {
    greenFlags: string[]
    redFlags: string[]
  }
  confidenceScores: {
    problemValidation: { score: number; description: string }
    solutionValidation: { score: number; description: string }
    marketValidation: { score: number; description: string }
  }
  keyAdvantages: string[]
  problemAreas: string[]
  marketFactors: MarketFactor[]
  executionFactors: ExecutionFactor[]
  strategicSuggestions: string[]
  quickWins: QuickWin[]
  roadmap: RoadmapItem[]
  teamRequirements: {
    initialSize: number
    mvpTimeline: string
    roles: TeamRequirement[]
  }
  implementationPlan: ImplementationStep[]
  resources: Resource[]
  keyQuestions: string[]
  sources: string[]
}

interface StartupAnalysisProps {
  analysis: AnalysisData
  startupName: string
  onCreateStartup: () => void
  isCreating?: boolean
}

function ScoreCircle({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const getColor = (s: number) => {
    if (s >= 80) return 'text-green-500'
    if (s >= 60) return 'text-yellow-500'
    if (s >= 40) return 'text-orange-500'
    return 'text-red-500'
  }

  const getBgColor = (s: number) => {
    if (s >= 80) return 'bg-green-500/10'
    if (s >= 60) return 'bg-yellow-500/10'
    if (s >= 40) return 'bg-orange-500/10'
    return 'bg-red-500/10'
  }

  const sizeClasses = {
    sm: 'w-12 h-12 text-sm',
    md: 'w-16 h-16 text-lg',
    lg: 'w-24 h-24 text-2xl'
  }

  return (
    <div className={`${sizeClasses[size]} ${getBgColor(score)} rounded-full flex items-center justify-center`}>
      <span className={`font-bold ${getColor(score)}`}>{score}</span>
    </div>
  )
}

function ScoreBar({ score, label }: { score: number; label: string }) {
  const getColor = (s: number) => {
    if (s >= 80) return 'bg-green-500'
    if (s >= 60) return 'bg-yellow-500'
    if (s >= 40) return 'bg-orange-500'
    return 'bg-red-500'
  }

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{score}/100</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full ${getColor(score)} transition-all duration-500`} 
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}

export function StartupAnalysis({ analysis, startupName, onCreateStartup, isCreating }: StartupAnalysisProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(['summary', 'market', 'factors'])

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    )
  }

  const getVerdictDisplay = (verdict: string) => {
    switch (verdict) {
      case 'excellent':
        return { text: 'Отличный потенциал!', emoji: '🚀', color: 'text-green-500', bg: 'bg-green-500/10' }
      case 'good':
        return { text: 'Хороший потенциал', emoji: '✨', color: 'text-blue-500', bg: 'bg-blue-500/10' }
      case 'moderate':
        return { text: 'Умеренный потенциал', emoji: '💡', color: 'text-yellow-500', bg: 'bg-yellow-500/10' }
      default:
        return { text: 'Требует доработки', emoji: '⚠️', color: 'text-orange-500', bg: 'bg-orange-500/10' }
    }
  }

  const verdictInfo = getVerdictDisplay(analysis.executiveSummary.verdict)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Анализ стартапа</h1>
          <p className="text-muted-foreground mt-1">{startupName}</p>
        </div>
        <Button size="lg" onClick={onCreateStartup} disabled={isCreating}>
          {isCreating ? (
            <span className="animate-pulse">Создание...</span>
          ) : (
            <>
              <RocketLaunchIcon className="h-5 w-5 mr-2" />
              Создать стартап
            </>
          )}
        </Button>
      </div>

      {/* Executive Summary */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <SparklesIcon className="h-5 w-5 text-primary" />
            <CardTitle>Управляющее резюме</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${verdictInfo.bg}`}>
                  <span className="text-3xl">{verdictInfo.emoji}</span>
                </div>
                <div>
                  <h3 className={`text-xl font-bold ${verdictInfo.color}`}>{verdictInfo.text}</h3>
                  <p className="text-sm text-muted-foreground">Ваша идея входит в число лучших</p>
                </div>
              </div>
              
              <div className="rounded-xl bg-card border p-4">
                <p className="text-sm leading-relaxed">
                  <span className="font-semibold text-primary">Перспективный рынок:</span> объем рынка в {analysis.executiveSummary.targetYear} году составит {analysis.executiveSummary.marketSize}, 
                  а среднегодовой темп роста — {analysis.executiveSummary.growthRate}, достигнув {analysis.executiveSummary.projectedSize}.
                  {analysis.executiveSummary.recentFunding && ` Недавно привлечено инвестиций: ${analysis.executiveSummary.recentFunding}.`}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Основные рекомендации</h4>
              {analysis.executiveSummary.keyRecommendations.map((rec, i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg bg-card border p-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                    {i + 1}
                  </span>
                  <p className="text-sm">{rec}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Market Analysis */}
      <Card>
        <CardHeader 
          className="cursor-pointer flex-row items-center justify-between"
          onClick={() => toggleSection('market')}
        >
          <div className="flex items-center gap-2">
            <ChartBarIcon className="h-5 w-5 text-primary" />
            <CardTitle>Анализ рынка</CardTitle>
            <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
              analysis.executiveSummary.overallScore >= 70 ? 'bg-green-500/10 text-green-600' : 'bg-yellow-500/10 text-yellow-600'
            }`}>
              {analysis.executiveSummary.overallScore}/100
            </span>
          </div>
          {expandedSections.includes('market') ? (
            <ChevronUpIcon className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDownIcon className="h-5 w-5 text-muted-foreground" />
          )}
        </CardHeader>
        {expandedSections.includes('market') && (
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Green Flags */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  <h4 className="font-semibold text-green-600">Зелёный свет</h4>
                </div>
                <div className="space-y-2">
                  {analysis.marketAnalysis.greenFlags.map((flag, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm p-2 rounded-lg bg-green-500/5 border border-green-500/10">
                      <CheckIcon className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                      <span>{flag}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Red Flags */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                  <h4 className="font-semibold text-red-600">Красные флаги</h4>
                </div>
                <div className="space-y-2">
                  {analysis.marketAnalysis.redFlags.map((flag, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm p-2 rounded-lg bg-red-500/5 border border-red-500/10">
                      <ExclamationTriangleIcon className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                      <span>{flag}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Confidence Scores */}
            <div className="border-t pt-6">
              <h4 className="font-semibold mb-4">Система оценки достоверности</h4>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="rounded-xl border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Проверка проблемы</span>
                    <ScoreCircle score={analysis.confidenceScores.problemValidation.score} size="sm" />
                  </div>
                  <p className="text-xs text-muted-foreground">{analysis.confidenceScores.problemValidation.description}</p>
                </div>
                <div className="rounded-xl border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Проверка решения</span>
                    <ScoreCircle score={analysis.confidenceScores.solutionValidation.score} size="sm" />
                  </div>
                  <p className="text-xs text-muted-foreground">{analysis.confidenceScores.solutionValidation.description}</p>
                </div>
                <div className="rounded-xl border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Проверка рынка</span>
                    <ScoreCircle score={analysis.confidenceScores.marketValidation.score} size="sm" />
                  </div>
                  <p className="text-xs text-muted-foreground">{analysis.confidenceScores.marketValidation.description}</p>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Market & Execution Factors */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Market Factors */}
        <Card>
          <CardHeader 
            className="cursor-pointer flex-row items-center justify-between"
            onClick={() => toggleSection('marketFactors')}
          >
            <div className="flex items-center gap-2">
              <ArrowTrendingUpIcon className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Рыночные факторы</CardTitle>
            </div>
            {expandedSections.includes('marketFactors') ? (
              <ChevronUpIcon className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDownIcon className="h-5 w-5 text-muted-foreground" />
            )}
          </CardHeader>
          {expandedSections.includes('marketFactors') && (
            <CardContent className="space-y-4">
              {analysis.marketFactors.map((factor, i) => (
                <div key={i} className="space-y-2">
                  <ScoreBar score={factor.score} label={factor.name} />
                  <p className="text-xs text-muted-foreground pl-1">{factor.description}</p>
                </div>
              ))}
            </CardContent>
          )}
        </Card>

        {/* Execution Factors */}
        <Card>
          <CardHeader 
            className="cursor-pointer flex-row items-center justify-between"
            onClick={() => toggleSection('executionFactors')}
          >
            <div className="flex items-center gap-2">
              <ShieldCheckIcon className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Факторы исполнения</CardTitle>
            </div>
            {expandedSections.includes('executionFactors') ? (
              <ChevronUpIcon className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDownIcon className="h-5 w-5 text-muted-foreground" />
            )}
          </CardHeader>
          {expandedSections.includes('executionFactors') && (
            <CardContent className="space-y-4">
              {analysis.executionFactors.map((factor, i) => (
                <div key={i} className="space-y-2">
                  <ScoreBar score={factor.score} label={factor.name} />
                  <p className="text-xs text-muted-foreground pl-1">{factor.description}</p>
                </div>
              ))}
            </CardContent>
          )}
        </Card>
      </div>

      {/* Key Advantages & Problem Areas */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
              <CardTitle className="text-lg">Ключевые преимущества</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {analysis.keyAdvantages.map((advantage, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <span className="shrink-0 mt-1">✓</span>
                <p>{advantage}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />
              <CardTitle className="text-lg">Проблемные области</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {analysis.problemAreas.map((area, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <span className="shrink-0 mt-1">!</span>
                <p>{area}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Strategic Suggestions */}
      <Card className="bg-gradient-to-br from-blue-500/5 to-purple-500/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <LightBulbIcon className="h-5 w-5 text-yellow-500" />
            <CardTitle>Стратегические предложения</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analysis.strategicSuggestions.map((suggestion, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl border bg-card p-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                  {i + 1}
                </span>
                <p className="text-sm">{suggestion}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Wins */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <RocketLaunchIcon className="h-5 w-5 text-primary" />
            <CardTitle>Быстрые победы</CardTitle>
            <span className="text-xs text-muted-foreground ml-2">Менее 1 недели на каждую</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {analysis.quickWins.map((win, i) => (
              <div key={i} className="rounded-xl border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                      {i + 1}
                    </span>
                    <span className="font-medium text-sm">{win.title}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    win.effort === 'low' ? 'bg-green-500/10 text-green-600' :
                    win.effort === 'medium' ? 'bg-yellow-500/10 text-yellow-600' :
                    'bg-red-500/10 text-red-600'
                  }`}>
                    {win.effort === 'low' ? 'Низкие усилия' : win.effort === 'medium' ? 'Средние усилия' : 'Высокие усилия'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{win.description}</p>
                <p className="text-sm text-primary">→ {win.result}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Roadmap */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ClockIcon className="h-5 w-5 text-primary" />
            <CardTitle>Дорожная карта</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            {analysis.roadmap.map((phase, i) => (
              <div key={i} className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    i === 0 ? 'bg-green-500' : i === 1 ? 'bg-yellow-500' : 'bg-blue-500'
                  }`} />
                  <div>
                    <h4 className="font-semibold text-sm">{phase.phase}</h4>
                    <p className="text-xs text-muted-foreground">{phase.period}</p>
                  </div>
                </div>
                <div className="space-y-2 pl-5 border-l-2 border-muted">
                  {phase.items.map((item, j) => (
                    <div key={j} className="flex items-start gap-2 text-sm">
                      <span className="text-muted-foreground">•</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Team Requirements */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserGroupIcon className="h-5 w-5 text-primary" />
            <CardTitle>Требования к команде</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-4 rounded-xl bg-muted/50">
              <p className="text-3xl font-bold text-primary">{analysis.teamRequirements.initialSize}</p>
              <p className="text-sm text-muted-foreground">Человек в команде</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-muted/50">
              <p className="text-3xl font-bold text-primary">{analysis.teamRequirements.mvpTimeline}</p>
              <p className="text-sm text-muted-foreground">До MVP</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Ключевые роли:</p>
              {analysis.teamRequirements.roles.map((role, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <BriefcaseIcon className="h-4 w-4 text-muted-foreground" />
                  <span>{role.role}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Implementation Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CurrencyDollarIcon className="h-5 w-5 text-primary" />
            <CardTitle>План реализации</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analysis.implementationPlan.map((step, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl border">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{step.title}</h4>
                  <p className="text-sm text-muted-foreground">{step.period}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{step.cost}</p>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    step.risk === 'low' ? 'bg-green-500/10 text-green-600' :
                    step.risk === 'medium' ? 'bg-yellow-500/10 text-yellow-600' :
                    'bg-red-500/10 text-red-600'
                  }`}>
                    {step.risk === 'low' ? 'Низкий риск' : step.risk === 'medium' ? 'Средний риск' : 'Высокий риск'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resources */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AcademicCapIcon className="h-5 w-5 text-primary" />
            <CardTitle>Подборка ресурсов</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            {analysis.resources.map((category, i) => (
              <div key={i} className="space-y-3">
                <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                  {category.category}
                </h4>
                <div className="space-y-2">
                  {category.items.map((item, j) => (
                    <div key={j} className="rounded-lg border p-3">
                      <div className="flex items-center gap-2">
                        {item.url ? (
                          <LinkIcon className="h-4 w-4 text-primary" />
                        ) : (
                          <DocumentTextIcon className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="font-medium text-sm">{item.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Key Questions */}
      <Card className="border-orange-500/20 bg-orange-500/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />
            <CardTitle>Ключевые вопросы для ответа</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-3">
            {analysis.keyQuestions.map((question, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-card border">
                <span className="text-orange-500 font-bold">?</span>
                <p className="text-sm">{question}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sources */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Источники исследований ({analysis.sources.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {analysis.sources.map((source, i) => (
              <span key={i} className="text-xs px-2 py-1 rounded-full bg-muted">
                {source}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create Button */}
      <div className="flex justify-center py-8">
        <Button size="lg" onClick={onCreateStartup} disabled={isCreating} className="px-12">
          {isCreating ? (
            <span className="animate-pulse">Создание стартапа...</span>
          ) : (
            <>
              <RocketLaunchIcon className="h-5 w-5 mr-2" />
              Создать стартап на основе анализа
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

