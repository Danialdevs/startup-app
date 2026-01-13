'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useStore } from '@/store/useStore'
import {
  PlusIcon,
  TrashIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BanknotesIcon,
  ChartBarIcon,
  SparklesIcon,
  LightBulbIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { ArrowPathIcon } from '@heroicons/react/24/solid'

interface Transaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  category: string
  description: string
  date: string
}

const INCOME_CATEGORIES = [
  'Продажи',
  'Инвестиции',
  'Гранты',
  'Услуги',
  'Другое'
]

const EXPENSE_CATEGORIES = [
  'Маркетинг',
  'Зарплаты',
  'Разработка',
  'Офис/Аренда',
  'Серверы/ПО',
  'Налоги',
  'Юридические',
  'Другое'
]

interface AnalysisResult {
  healthScore: number
  summary: string
  observations: string[]
  costSavingTips: string[]
  missedOpportunities: string[]
  verdict: 'excellent' | 'good' | 'fair' | 'poor'
}

interface Startup {
  id: string
  name: string
}

export default function FinancePage() {
  const params = useParams()
  const router = useRouter()
  const { setUser } = useStore()
  const [startup, setStartup] = useState<Startup | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])

  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [analysisError, setAnalysisError] = useState<string | null>(null)

  // ...

  const [newTransaction, setNewTransaction] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await fetch('/api/auth/me')
        if (!userRes.ok) {
          router.push('/')
          return
        }
        const userData = await userRes.json()
        setUser(userData.user)

        const startupRes = await fetch(`/api/startups/${params.id}`)
        if (!startupRes.ok) {
          router.push('/dashboard')
          return
        }
        const startupData = await startupRes.json()
        setStartup(startupData.startup)

        // Fetch transactions
        const financeRes = await fetch(`/api/startups/${params.id}/finance`)
        if (financeRes.ok) {
          const financeData = await financeRes.json()
          setTransactions(financeData.transactions || [])
        }
      } catch {
        router.push('/dashboard')
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [params.id, router, setUser])

  const handleAddTransaction = async () => {
    if (!newTransaction.amount || !newTransaction.category) return
    setIsAdding(true)
    try {
      const res = await fetch(`/api/startups/${params.id}/finance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTransaction,
          amount: parseFloat(newTransaction.amount)
        })
      })
      if (res.ok) {
        const data = await res.json()
        setTransactions(prev => [data.transaction, ...prev])
        setNewTransaction({
          type: 'expense',
          amount: '',
          category: '',
          description: '',
          date: new Date().toISOString().split('T')[0]
        })
        setIsModalOpen(false)
      }
    } catch { }
    finally { setIsAdding(false) }
  }

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('Удалить?')) return
    try {
      const res = await fetch(`/api/startups/${params.id}/finance`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: id })
      })
      if (res.ok) {
        setTransactions(prev => prev.filter(t => t.id !== id))
      }
    } catch { }
  }

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    setIsAnalysisModalOpen(true)
    setAnalysisError(null)
    setAnalysis(null)
    try {
      const res = await fetch(`/api/startups/${params.id}/finance/analyze`, {
        method: 'POST'
      })
      const data = await res.json()

      if (res.ok) {
        setAnalysis(data.analysis)
      } else {
        setAnalysisError(data.error || 'Ошибка при анализе')
      }
    } catch (error) {
      console.error('Analysis failed', error)
      setAnalysisError('Не удалось соединиться с сервером')
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Calculate totals
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
  const balance = totalIncome - totalExpenses

  // Group expenses by category
  const expensesByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount
      return acc
    }, {} as Record<string, number>)

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', { style: 'decimal', maximumFractionDigits: 0 }).format(amount) + ' ₸'
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar startupId={startup?.id} startupName={startup?.name} />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold">Финансы</h1>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleAnalyze} className="gap-2 border-purple-200 hover:bg-purple-50 hover:text-purple-700 text-purple-600">
                <SparklesIcon className="h-4 w-4" />
                AI Анализ
              </Button>
              <Button onClick={() => setIsModalOpen(true)}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Добавить
              </Button>
            </div>
          </div>

          {/* Dashboard Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className={balance >= 0 ? 'bg-gradient-to-br from-green-50 to-green-100/50 border-green-200' : 'bg-gradient-to-br from-red-50 to-red-100/50 border-red-200'}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${balance >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                    <BanknotesIcon className={`h-5 w-5 ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Баланс</p>
                    <p className={`text-xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatMoney(balance)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100">
                    <ArrowTrendingUpIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Доходы</p>
                    <p className="text-xl font-bold text-green-600">{formatMoney(totalIncome)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-100">
                    <ArrowTrendingDownIcon className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Расходы</p>
                    <p className="text-xl font-bold text-red-600">{formatMoney(totalExpenses)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <ChartBarIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Операций</p>
                    <p className="text-xl font-bold">{transactions.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Expenses by Category */}
          {Object.keys(expensesByCategory).length > 0 && (
            <Card className="mb-6">
              <CardContent className="p-4">
                <h3 className="font-medium mb-3">Расходы по категориям</h3>
                <div className="space-y-2">
                  {Object.entries(expensesByCategory)
                    .sort((a, b) => b[1] - a[1])
                    .map(([category, amount]) => (
                      <div key={category} className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-1">
                            <span>{category}</span>
                            <span className="text-muted-foreground">{formatMoney(amount)}</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-red-500 rounded-full"
                              style={{ width: `${(amount / totalExpenses) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Transactions Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Категория</TableHead>
                  <TableHead>Описание</TableHead>
                  <TableHead className="text-right">Сумма</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Нет операций
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="text-muted-foreground">
                        {new Date(t.date).toLocaleDateString('ru-RU')}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 text-sm ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                          {t.type === 'income' ? <ArrowTrendingUpIcon className="h-4 w-4" /> : <ArrowTrendingDownIcon className="h-4 w-4" />}
                          {t.type === 'income' ? 'Доход' : 'Расход'}
                        </span>
                      </TableCell>
                      <TableCell>{t.category}</TableCell>
                      <TableCell className="text-muted-foreground">{t.description || '—'}</TableCell>
                      <TableCell className={`text-right font-medium ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {t.type === 'income' ? '+' : '-'}{formatMoney(t.amount)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteTransaction(t.id)}
                        >
                          <TrashIcon className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить операцию</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Тип</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setNewTransaction({ ...newTransaction, type: 'expense' })}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${newTransaction.type === 'expense' ? 'bg-red-100 text-red-700' : 'bg-muted text-muted-foreground'
                    }`}
                >
                  <ArrowTrendingDownIcon className="h-4 w-4" />
                  Расход
                </button>
                <button
                  type="button"
                  onClick={() => setNewTransaction({ ...newTransaction, type: 'income' })}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${newTransaction.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'
                    }`}
                >
                  <ArrowTrendingUpIcon className="h-4 w-4" />
                  Доход
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Сумма *</Label>
              <Input
                type="number"
                value={newTransaction.amount}
                onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label>Категория *</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={newTransaction.category}
                onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
              >
                <option value="" disabled>Выберите категорию</option>
                {(newTransaction.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Описание</Label>
              <Input
                value={newTransaction.description}
                onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                placeholder="Комментарий..."
              />
            </div>
            <div className="space-y-2">
              <Label>Дата</Label>
              <Input
                type="date"
                value={newTransaction.date}
                onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Отмена</Button>
            <Button onClick={handleAddTransaction} disabled={isAdding || !newTransaction.amount || !newTransaction.category}>
              {isAdding && <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />}
              Добавить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAnalysisModalOpen} onOpenChange={setIsAnalysisModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SparklesIcon className="h-5 w-5 text-purple-500" />
              Финансовый AI Анализ
            </DialogTitle>
          </DialogHeader>

          {isAnalyzing ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ArrowPathIcon className="h-10 w-10 text-purple-500 animate-spin mb-4" />
              <h3 className="text-lg font-medium mb-2">Анализируем финансы...</h3>
              <p className="text-muted-foreground">Ищем способы оптимизации и точки роста</p>
            </div>
          ) : analysis ? (
            <div className="space-y-6 py-4">
              {/* Health Score */}
              <div className="flex items-center gap-4 bg-muted/50 p-4 rounded-xl">
                <div className={`text-4xl font-bold ${analysis.healthScore >= 80 ? 'text-green-500' :
                  analysis.healthScore >= 50 ? 'text-yellow-500' : 'text-red-500'
                  }`}>
                  {analysis.healthScore}
                </div>
                <div>
                  <div className="font-semibold mb-1">Оценка здоровья</div>
                  <p className="text-sm text-muted-foreground">{analysis.summary}</p>
                </div>
              </div>

              {/* Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Cost Saving */}
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2 text-red-600">
                    <ArrowTrendingDownIcon className="h-4 w-4" />
                    Где можно сэкономить
                  </h4>
                  <div className="space-y-2">
                    {analysis.costSavingTips.map((tip, i) => (
                      <div key={i} className="bg-red-50 border border-red-100 p-3 rounded-lg text-sm text-red-800">
                        {tip}
                      </div>
                    ))}
                    {analysis.costSavingTips.length === 0 && (
                      <p className="text-sm text-muted-foreground italic">Явных проблем не обнаружено</p>
                    )}
                  </div>
                </div>

                {/* Opportunities */}
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2 text-green-600">
                    <LightBulbIcon className="h-4 w-4" />
                    Упущенные возможности
                  </h4>
                  <div className="space-y-2">
                    {analysis.missedOpportunities.map((opp, i) => (
                      <div key={i} className="bg-green-50 border border-green-100 p-3 rounded-lg text-sm text-green-800">
                        {opp}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Observations */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <CheckCircleIcon className="h-4 w-4 text-primary" />
                  Наблюдения
                </h4>
                <div className="space-y-2">
                  {analysis.observations.map((obs, i) => (
                    <div key={i} className="flex gap-2 text-sm text-muted-foreground">
                      <span>•</span>
                      <span>{obs}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground flex flex-col items-center gap-4">
              <p>{analysisError || 'Не удалось провести анализ. Попробуйте добавить больше транзакций.'}</p>
              {analysisError && (
                <Button variant="outline" onClick={() => setIsAnalysisModalOpen(false)}>Понятно</Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

