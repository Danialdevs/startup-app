import OpenAI from 'openai'

// Use DeepSeek API key (fallback to OPENAI_API_KEY for backward compatibility)
const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY

if (!apiKey) {
  console.error('WARNING: DEEPSEEK_API_KEY or OPENAI_API_KEY is not set!')
  console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('DEEPSEEK') || k.includes('OPENAI')))
}

// Initialize OpenAI client for DeepSeek (compatible with OpenAI API format)
const openai = apiKey ? new OpenAI({
  apiKey: apiKey,
  baseURL: 'https://api.deepseek.com/v1', // DeepSeek API endpoint
}) : null

// Fallback questions when AI is unavailable
const DEFAULT_QUESTIONS = [
  'Какие конкуренты уже есть на рынке?',
  'Как вы планируете монетизировать продукт?',
  'Какие ресурсы нужны для запуска?'
]

export async function getStartupQuestions(
  name: string,
  description: string,
  audience?: string,
  problem?: string
) {
  if (!openai) {
    console.error('ERROR: DeepSeek client is not initialized - missing API key')
    return 'Ошибка: DeepSeek не настроен. Пожалуйста, проверьте конфигурацию.'
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: `Ты — опытный стартап-консультант. Твоя задача — задать уточняющие вопросы, чтобы лучше понять идею стартапа и помочь предпринимателю.
Отвечай на русском языке. Вопросы должны быть конкретными и помогать раскрыть детали бизнеса.`
        },
        {
          role: 'user',
          content: `Стартап: ${name}
Идея: ${description || 'Не указано'}
Целевая аудитория: ${audience || 'Не указано'}
Проблема: ${problem || 'Не указано'}

Задай 3-4 уточняющих вопроса, которые помогут лучше понять:
- Уникальность решения
- Бизнес-модель
- Конкурентные преимущества
- План реализации

Ответ — только JSON массив строк: ["Вопрос 1?", "Вопрос 2?", "Вопрос 3?"]`
        }
      ],
      temperature: 0.7,
      max_tokens: 400,
    })

    const content = response.choices[0]?.message?.content || '[]'
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      return jsonMatch ? JSON.parse(jsonMatch[0]) : DEFAULT_QUESTIONS
    } catch {
      return DEFAULT_QUESTIONS
    }
  } catch (error) {
      console.error('DeepSeek error:', error)
    return DEFAULT_QUESTIONS
  }
}

export async function analyzeStartupIdea(
  name: string,
  description: string,
  problem: string,
  idea: string,
  audience?: string,
  answers?: Record<string, string>
) {
  const answersText = answers
    ? Object.entries(answers).map(([q, a]) => `В: ${q}\nО: ${a}`).join('\n\n')
    : ''

  if (!openai) {
    console.error('ERROR: DeepSeek client is not initialized - missing API key')
    return 'Ошибка: DeepSeek не настроен. Пожалуйста, проверьте конфигурацию.'
  }

  if (!openai) {
    console.error('ERROR: OpenAI client is not initialized')
    return createFallbackAnalysis(name, description, problem, idea, audience, answers)
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: `Ты — опытный стартап-консультант и бизнес-аналитик.
Твоя задача — проанализировать идею стартапа и предложить улучшенные формулировки.
Отвечай на русском языке. Будь конкретным и практичным.`
        },
        {
          role: 'user',
          content: `Проанализируй стартап и предложи улучшения:

Название: ${name}
Идея: ${description || 'Не указано'}
Целевая аудитория: ${audience || 'Не указано'}
Проблема: ${problem || 'Не указано'}
${answersText ? `\nОтветы на вопросы:\n${answersText}` : ''}

Верни JSON (без markdown):
{
  "summary": "Краткий анализ идеи (2-3 предложения, оценка потенциала)",
  "suggestedName": "Более привлекательное название (если текущее хорошее, оставь его)",
  "suggestedDescription": "Улучшенное описание проекта для инвесторов (2-3 предложения)",
  "suggestedProblem": "Чёткая формулировка проблемы (1-2 предложения)",
  "suggestedIdea": "Чёткая формулировка решения (1-2 предложения)",
  "strengths": ["Сильная сторона 1", "Сильная сторона 2"],
  "improvements": ["Рекомендация 1", "Рекомендация 2", "Рекомендация 3"],
  "nextSteps": ["Следующий шаг 1", "Следующий шаг 2"]
}`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    const content = response.choices[0]?.message?.content || '{}'
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      return createFallbackAnalysis(name, description, problem, idea, audience, answers)
    } catch {
      return createFallbackAnalysis(name, description, problem, idea, audience, answers)
    }
  } catch (error) {
      console.error('DeepSeek error:', error)
    return createFallbackAnalysis(name, description, problem, idea, audience, answers)
  }
}

function createFallbackAnalysis(
  name: string,
  description: string,
  problem: string,
  idea: string,
  audience?: string,
  answers?: Record<string, string>
) {
  const strengths = []
  const improvements = []

  if (name) strengths.push('Есть чёткое название проекта')
  if (description) strengths.push('Описана основная идея')
  if (problem) strengths.push('Определена проблема аудитории')
  if (audience) strengths.push('Определена целевая аудитория')
  if (answers && Object.keys(answers).length > 0) strengths.push('Продуманы детали реализации')

  if (!problem) improvements.push('Чётче сформулируйте проблему, которую решаете')
  if (!audience) improvements.push('Опишите целевую аудиторию подробнее')
  improvements.push('Изучите конкурентов на рынке')
  improvements.push('Продумайте бизнес-модель монетизации')

  return {
    summary: `Проект "${name}" имеет потенциал. Идея понятна, но требует доработки деталей для привлечения инвесторов.`,
    suggestedName: name,
    suggestedDescription: description || `${name} — инновационное решение для ${audience || 'целевой аудитории'}.`,
    suggestedProblem: problem || 'Опишите конкретную проблему вашей целевой аудитории',
    suggestedIdea: idea || description || 'Опишите как ваш продукт решает проблему',
    strengths: strengths.length > 0 ? strengths : ['Начало положено — идея сформулирована'],
    improvements: improvements,
    nextSteps: ['Провести исследование рынка', 'Создать MVP', 'Найти первых пользователей']
  }
}

export async function generateComprehensiveAnalysis(
  name: string,
  description: string,
  problem: string,
  idea: string,
  audience: string,
  answers: Record<string, string>
) {
  const answersText = Object.entries(answers).map(([q, a]) => `Q: ${q}\nA: ${a}`).join('\n')

  if (!openai) {
    console.error('ERROR: DeepSeek client is not initialized - missing API key')
    return 'Ошибка: DeepSeek не настроен. Пожалуйста, проверьте конфигурацию.'
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: `Ты — эксперт по рыночному анализу стартапов. Проведи глубокий анализ идеи стартапа.
Отвечай на русском языке. Все данные должны быть реалистичными и основанными на общих знаниях о рынках.
Генерируй полезные и применимые рекомендации.`
        },
        {
          role: 'user',
          content: `Проанализируй стартап и найди похожие стартапы в СНГ и мире:

Название: ${name}
Описание: ${description}
Проблема: ${problem}
Решение: ${idea}
Аудитория: ${audience}

Ответы на вопросы:
${answersText}

ВАЖНО: Используй свои знания для поиска реальных похожих стартапов в СНГ и мире. 
Найди 3-5 реальных стартапов, которые решают похожие проблемы. 
Для каждого укажи:
- Название стартапа
- Страну/регион (СНГ или другой)
- Процент схожести (0-100%)
- В чем они лучше (преимущества)
- В чем они хуже (недостатки)
- Размер финансирования (если известно)
- Стадию развития

Верни JSON (без markdown, только чистый JSON):
{
  "executiveSummary": {
    "marketSize": "Примерный объем рынка в долларах",
    "growthRate": "Среднегодовой темп роста %",
    "targetYear": "2024",
    "projectedSize": "Прогноз к 2030",
    "recentFunding": "Примеры недавних инвестиций в отрасли",
    "overallScore": 75,
    "verdict": "excellent/good/moderate/risky",
    "keyRecommendations": ["Рекомендация 1", "Рекомендация 2", "Рекомендация 3"]
  },
  "marketAnalysis": {
    "greenFlags": ["Положительный фактор 1", "Положительный фактор 2", "Положительный фактор 3"],
    "redFlags": ["Риск 1", "Риск 2"]
  },
  "confidenceScores": {
    "problemValidation": {"score": 80, "description": "Описание оценки"},
    "solutionValidation": {"score": 70, "description": "Описание оценки"},
    "marketValidation": {"score": 75, "description": "Описание оценки"}
  },
  "keyAdvantages": ["Преимущество 1", "Преимущество 2"],
  "problemAreas": ["Проблема 1", "Проблема 2"],
  "marketFactors": [
    {"name": "Ясность целевого рынка", "score": 68, "description": "Пояснение"},
    {"name": "Тайминг выхода на рынок", "score": 85, "description": "Пояснение"},
    {"name": "Готовность к выходу", "score": 65, "description": "Пояснение"},
    {"name": "Барьеры входа", "score": 55, "description": "Пояснение"},
    {"name": "Уровень конкуренции", "score": 48, "description": "Пояснение"},
    {"name": "Соответствие проблема-решение", "score": 78, "description": "Пояснение"}
  ],
  "executionFactors": [
    {"name": "Соответствие основателя", "score": 70, "description": "Пояснение"},
    {"name": "Жизнеспособность MVP", "score": 82, "description": "Пояснение"},
    {"name": "Ценностное предложение", "score": 72, "description": "Пояснение"},
    {"name": "Начальная осуществимость", "score": 80, "description": "Пояснение"},
    {"name": "Требования к ресурсам", "score": 75, "description": "Пояснение"}
  ],
  "strategicSuggestions": ["Предложение 1", "Предложение 2", "Предложение 3", "Предложение 4", "Предложение 5"],
  "quickWins": [
    {"title": "Задача 1", "effort": "low", "description": "Описание", "result": "Ожидаемый результат"},
    {"title": "Задача 2", "effort": "medium", "description": "Описание", "result": "Ожидаемый результат"},
    {"title": "Задача 3", "effort": "low", "description": "Описание", "result": "Ожидаемый результат"},
    {"title": "Задача 4", "effort": "medium", "description": "Описание", "result": "Ожидаемый результат"}
  ],
  "roadmap": [
    {"phase": "Немедленно", "period": "1 неделя", "items": ["Шаг 1", "Шаг 2"]},
    {"phase": "Краткосрочно", "period": "1-3 месяца", "items": ["Шаг 1", "Шаг 2"]},
    {"phase": "Среднесрочно", "period": "3-6 месяцев", "items": ["Шаг 1", "Шаг 2"]}
  ],
  "teamRequirements": {
    "initialSize": 4,
    "mvpTimeline": "3 месяца",
    "roles": [
      {"role": "Разработчик", "description": "Создание продукта"},
      {"role": "Маркетолог", "description": "Привлечение пользователей"},
      {"role": "Продакт-менеджер", "description": "Развитие продукта"}
    ]
  },
  "implementationPlan": [
    {"title": "Исследование и валидация", "period": "Месяц 1", "cost": "$5,000", "risk": "low"},
    {"title": "Разработка MVP", "period": "Месяц 2-3", "cost": "$30,000", "risk": "medium"},
    {"title": "Запуск и первые пользователи", "period": "Месяц 4-6", "cost": "$20,000", "risk": "high"}
  ],
  "resources": [
    {
      "category": "Инструменты",
      "items": [
        {"name": "Figma", "description": "Дизайн интерфейса"},
        {"name": "Notion", "description": "Управление проектом"}
      ]
    },
    {
      "category": "Обучение",
      "items": [
        {"name": "Y Combinator Startup School", "description": "Бесплатный курс"},
        {"name": "Product Hunt", "description": "Запуск продукта"}
      ]
    },
    {
      "category": "Финансирование",
      "items": [
        {"name": "Y Combinator", "description": "Акселератор"},
        {"name": "Местные гранты", "description": "Госпрограммы"}
      ]
    }
  ],
  "keyQuestions": ["Вопрос 1?", "Вопрос 2?", "Вопрос 3?", "Вопрос 4?"],
  "sources": ["Grand View Research", "Crunchbase", "Industry Reports", "Market Analysis"],
  "competitors": [
    {
      "name": "Название похожего стартапа",
      "region": "СНГ/Мир",
      "similarity": 75,
      "advantages": ["Преимущество 1", "Преимущество 2"],
      "disadvantages": ["Недостаток 1", "Недостаток 2"],
      "funding": "Размер финансирования",
      "stage": "Стадия развития"
    }
  ]
}`
        }
      ],
      temperature: 0.8,
      max_tokens: 4000,
    })

    const content = response.choices[0]?.message?.content || '{}'
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
      return createFallbackComprehensiveAnalysis(name, description, problem, idea, audience)
    } catch {
      return createFallbackComprehensiveAnalysis(name, description, problem, idea, audience)
    }
  } catch (error: unknown) {
    console.error('OpenAI comprehensive analysis error:', error)
    if (error && typeof error === 'object' && 'response' in error) {
      const err = error as { response?: { status?: number; data?: unknown } }
      console.error('OpenAI API response status:', err.response?.status)
      console.error('OpenAI API response data:', err.response?.data)
    }
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    return createFallbackComprehensiveAnalysis(name, description, problem, idea, audience)
  }
}

function createFallbackComprehensiveAnalysis(
  name: string,
  description: string,
  problem: string,
  idea: string,
  audience: string
) {
  const baseScore = Math.floor(Math.random() * 20) + 60 // 60-80

  return {
    executiveSummary: {
      marketSize: "$1-5 млрд",
      growthRate: "15-25%",
      targetYear: "2024",
      projectedSize: "$3-10 млрд к 2030",
      recentFunding: "Активное инвестирование в отрасли",
      overallScore: baseScore,
      verdict: baseScore >= 75 ? 'good' : 'moderate',
      keyRecommendations: [
        `Сфокусируйтесь на узком сегменте ${audience || 'целевой аудитории'}`,
        'Создайте MVP за 2-3 месяца для быстрой валидации',
        'Найдите первых 10-20 клиентов для обратной связи'
      ]
    },
    marketAnalysis: {
      greenFlags: [
        'Растущий рынок с потенциалом',
        problem ? 'Четко определенная проблема' : 'Есть понимание направления',
        'Современные технологии позволяют создать решение',
        audience ? 'Определена целевая аудитория' : 'Широкий потенциальный рынок'
      ],
      redFlags: [
        'Необходимо более глубокое исследование конкурентов',
        'Требуется уточнение бизнес-модели монетизации',
        'Риск появления крупных игроков на рынке'
      ]
    },
    confidenceScores: {
      problemValidation: {
        score: problem ? 75 : 55,
        description: problem ? 'Проблема определена, требует подтверждения от пользователей' : 'Необходимо уточнить проблему'
      },
      solutionValidation: {
        score: idea ? 70 : 50,
        description: idea ? 'Решение имеет потенциал, требует тестирования' : 'Решение требует детализации'
      },
      marketValidation: {
        score: audience ? 65 : 45,
        description: audience ? 'Рынок определен, требует количественной оценки' : 'Требуется анализ рынка'
      }
    },
    keyAdvantages: [
      'Понимание проблемы целевой аудитории',
      'Возможность быстрого создания MVP',
      'Гибкость в адаптации решения',
      'Потенциал для масштабирования'
    ],
    problemAreas: [
      'Конкуренция на рынке',
      'Необходимость привлечения первых клиентов',
      'Ограниченные ресурсы на старте'
    ],
    marketFactors: [
      { name: 'Ясность целевого рынка', score: audience ? 70 : 50, description: audience ? `Определена аудитория: ${audience}` : 'Требуется уточнение целевой аудитории' },
      { name: 'Тайминг выхода на рынок', score: 75, description: 'Хорошее время для выхода на рынок' },
      { name: 'Готовность к выходу', score: 60, description: 'Требуется разработка MVP' },
      { name: 'Барьеры входа', score: 55, description: 'Умеренные барьеры, преодолимые' },
      { name: 'Уровень конкуренции', score: 50, description: 'Средняя конкуренция, есть ниши' },
      { name: 'Соответствие проблема-решение', score: problem && idea ? 75 : 55, description: 'Требует подтверждения пользователями' }
    ],
    executionFactors: [
      { name: 'Соответствие основателя', score: 70, description: 'Оценка зависит от опыта команды' },
      { name: 'Жизнеспособность MVP', score: 80, description: 'MVP можно создать за 2-3 месяца' },
      { name: 'Ценностное предложение', score: 65, description: 'Требует уточнения и тестирования' },
      { name: 'Начальная осуществимость', score: 75, description: 'Технически реализуемо' },
      { name: 'Требования к ресурсам', score: 70, description: 'Минимальная команда 2-4 человека' }
    ],
    strategicSuggestions: [
      'Проведите 20+ интервью с потенциальными клиентами',
      'Создайте landing page для сбора заявок',
      'Изучите конкурентов и их ценообразование',
      'Определите ключевые метрики успеха',
      'Найдите первых пилотных клиентов'
    ],
    quickWins: [
      { title: 'Интервью с клиентами', effort: 'low' as const, description: 'Провести 10-20 интервью', result: 'Понимание потребностей' },
      { title: 'Landing page', effort: 'low' as const, description: 'Создать страницу без кода', result: '50+ регистраций' },
      { title: 'Анализ конкурентов', effort: 'medium' as const, description: 'Изучить 5-10 конкурентов', result: 'Конкурентные преимущества' },
      { title: 'Прототип', effort: 'medium' as const, description: 'Создать кликабельный прототип', result: 'Визуализация идеи' }
    ],
    roadmap: [
      { phase: 'Немедленно', period: '1 неделя', items: ['Интервью с клиентами', 'Анализ конкурентов'] },
      { phase: 'Краткосрочно', period: '1-3 месяца', items: ['Разработка MVP', 'Первые пользователи'] },
      { phase: 'Среднесрочно', period: '3-6 месяцев', items: ['Масштабирование', 'Монетизация'] }
    ],
    teamRequirements: {
      initialSize: 3,
      mvpTimeline: '3 месяца',
      roles: [
        { role: 'Разработчик', description: 'Full-stack или специализированный' },
        { role: 'Продакт/Основатель', description: 'Развитие продукта и бизнеса' },
        { role: 'Маркетолог', description: 'Привлечение и удержание' }
      ]
    },
    implementationPlan: [
      { title: 'Исследование и валидация', period: 'Месяц 1', cost: '$2,000-5,000', risk: 'low' as const },
      { title: 'Разработка MVP', period: 'Месяц 2-3', cost: '$10,000-30,000', risk: 'medium' as const },
      { title: 'Запуск и тестирование', period: 'Месяц 4-6', cost: '$5,000-15,000', risk: 'high' as const }
    ],
    resources: [
      {
        category: 'Инструменты',
        items: [
          { name: 'Figma', description: 'Дизайн интерфейса' },
          { name: 'Notion', description: 'Управление проектом' },
          { name: 'Tally/Typeform', description: 'Сбор обратной связи' }
        ]
      },
      {
        category: 'Обучение',
        items: [
          { name: 'Y Combinator Startup School', description: 'Бесплатный курс для стартапов' },
          { name: 'The Mom Test', description: 'Книга о Customer Development' }
        ]
      },
      {
        category: 'Финансирование',
        items: [
          { name: 'Bootstrapping', description: 'Самофинансирование на старте' },
          { name: 'Angel инвесторы', description: 'Для seed раунда' }
        ]
      }
    ],
    keyQuestions: [
      'Какова ваша уникальная ценность по сравнению с конкурентами?',
      'Как вы привлечете первых 100 клиентов?',
      'Какая бизнес-модель монетизации?',
      'Какой опыт команды в этой области?',
      'Какой минимальный бюджет нужен до первой прибыли?'
    ],
    sources: ['Market Research', 'Industry Analysis', 'Startup Best Practices', 'Competitor Analysis'],
    competitors: [
      {
        name: 'Похожий стартап в отрасли',
        region: 'СНГ/Мир',
        similarity: 65,
        advantages: ['Больше финансирования', 'Больше опыта'],
        disadvantages: ['Медленнее адаптация', 'Выше затраты'],
        funding: 'Неизвестно',
        stage: 'Ранняя стадия'
      }
    ]
  }
}

export async function suggestTasks(name: string, description: string, idea: string, existingTasks: string[]) {
  if (!openai) {
    console.error('ERROR: OpenAI client is not initialized')
    return [
      { title: 'Исследование рынка', description: 'Изучить конкурентов и целевую аудиторию', priority: 'high' },
      { title: 'MVP план', description: 'Определить минимальный функционал', priority: 'high' },
      { title: 'Прототип', description: 'Создать первую версию продукта', priority: 'medium' },
      { title: 'Тестирование', description: 'Получить обратную связь от пользователей', priority: 'medium' },
      { title: 'Презентация', description: 'Подготовить pitch deck', priority: 'low' },
    ]
  }

  const defaultTasks = [
    { title: 'Исследование рынка', description: 'Изучить конкурентов и целевую аудиторию', priority: 'high' },
    { title: 'MVP план', description: 'Определить минимальный функционал', priority: 'high' },
    { title: 'Прототип', description: 'Создать первую версию продукта', priority: 'medium' },
    { title: 'Тестирование', description: 'Получить обратную связь от пользователей', priority: 'medium' },
    { title: 'Презентация', description: 'Подготовить pitch deck', priority: 'low' },
  ]

  if (!openai) {
    console.error('ERROR: DeepSeek client is not initialized - missing API key')
    return 'Ошибка: DeepSeek не настроен. Пожалуйста, проверьте конфигурацию.'
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: `Ты — проектный менеджер стартапов. Отвечай на русском.`
        },
        {
          role: 'user',
          content: `Стартап: ${name} (${description || idea || 'IT-стартап'})
${existingTasks.length > 0 ? `Уже есть задачи: ${existingTasks.join(', ')}` : ''}

Предложи 5 конкретных задач для развития проекта.

Ответ — только JSON массив:
[{"title": "Название задачи", "description": "Описание", "priority": "high/medium/low"}]`
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    })

    const content = response.choices[0]?.message?.content || '[]'
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      return jsonMatch ? JSON.parse(jsonMatch[0]) : defaultTasks
    } catch {
      return defaultTasks
    }
  } catch (error) {
      console.error('DeepSeek error:', error)
    return defaultTasks
  }
}

export async function analyzeFinances(
  transactions: { date: string; type: string; amount: number; category: string; description?: string }[]
) {
  const transactionsText = transactions
    .slice(0, 50) // Limit to last 50 transactions to save tokens
    .map(t => `${t.date} | ${t.type} | ${t.amount} | ${t.category} | ${t.description || ''}`)
    .join('\n')

  if (!openai) {
    console.error('ERROR: DeepSeek client is not initialized - missing API key')
    return 'Ошибка: DeepSeek не настроен. Пожалуйста, проверьте конфигурацию.'
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: `Ты — финансовый аналитик стартапов. Проанализируй финансовые транзакции и дай рекомендации по оптимизации расходов и улучшению финансового здоровья.
Отвечай на русском языке. Будь конкретным и практичным.`
        },
        {
          role: 'user',
          content: `Проанализируй эти финансы стартапа:

${transactionsText}

Верни JSON (без markdown):
{
  "healthScore": 75,
  "summary": "Общее резюме финансового состояния (2-3 предложения)",
  "observations": ["Наблюдение 1", "Наблюдение 2"],
  "costSavingTips": ["Совет по экономии 1", "Совет по экономии 2 (конкретный, на основе данных)"],
  "missedOpportunities": ["Упущенная возможность 1", "Что можно улучшить"],
  "verdict": "excellent/good/fair/poor"
}`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    const content = response.choices[0]?.message?.content || '{}'
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      return jsonMatch ? JSON.parse(jsonMatch[0]) : null
    } catch {
      return null
    }
  } catch (error) {
    console.error('OpenAI finance analysis error:', error)
    return null
  }
}

export async function chatWithStartup(
  startupContext: {
    name: string
    description: string
    problem: string
    idea: string
    audience: string
    answers?: Record<string, string>
  },
  messages: { role: 'user' | 'assistant'; content: string }[]
) {
  console.log('=== chatWithStartup called ===')
  console.log('API Key exists:', !!apiKey)
  console.log('API Key prefix:', apiKey?.substring(0, 15) + '...' || 'N/A')
    console.log('DeepSeek client exists:', !!openai)
  console.log('Messages count:', messages.length)

  if (!apiKey) {
    console.error('ERROR: DEEPSEEK_API_KEY is not set!')
    console.error('Environment check:')
    console.error('  process.env.DEEPSEEK_API_KEY:', !!process.env.DEEPSEEK_API_KEY)
    console.error('  process.env.OPENAI_API_KEY:', !!process.env.OPENAI_API_KEY)
    console.error('  All env vars with DEEPSEEK/OPENAI:', Object.keys(process.env).filter(k => k.includes('DEEPSEEK') || k.includes('OPENAI')))
    return 'Ошибка: API ключ не настроен. Пожалуйста, свяжитесь с администратором.'
  }

  if (!openai) {
    console.error('ERROR: DeepSeek client is not initialized!')
    console.error('API Key exists but client is null - this should not happen')
    return 'Ошибка: DeepSeek клиент не инициализирован. Пожалуйста, проверьте конфигурацию.'
  }

  const contextPrompt = `
Ты — AI-ассистент стартапа "${startupContext.name}".
Твоя задача — помогать основателю развивать проект, отвечать на вопросы и давать советы, основываясь на контексте стартапа.

Контекст стартапа:
Название: ${startupContext.name}
Описание: ${startupContext.description}
Проблема: ${startupContext.problem}
Решение (Идея): ${startupContext.idea}
Целевая аудитория: ${startupContext.audience}
${startupContext.answers ? `Дополнительные детали:\n${Object.entries(startupContext.answers).map(([q, a]) => `- ${q}: ${a}`).join('\n')}` : ''}

Отвечай кратко, по делу и мотивирующе. Если не знаешь ответа, предложи гипотезу или способ проверить.
`

  try {
    if (!openai) {
      throw new Error('DeepSeek client is not initialized')
    }

    console.log('Calling DeepSeek API...')
    console.log('Model: deepseek-chat')
    console.log('System message length:', contextPrompt.length)
    console.log('User messages count:', messages.length)
    
    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: contextPrompt },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 500,
    })

    console.log('DeepSeek API response received')
    const content = response.choices[0]?.message?.content

    if (!content) {
      console.error('ERROR: Empty response from DeepSeek')
      return 'Извините, получил пустой ответ от AI. Попробуйте еще раз.'
    }

    console.log('Response content length:', content.length)
    return content
  } catch (error: unknown) {
    console.error('=== DeepSeek Chat Error ===')
    console.error('Error type:', error?.constructor?.name)
    console.error('Error:', error)
    
    // Handle OpenAI API errors
    if (error && typeof error === 'object' && 'status' in error) {
      const err = error as { 
        status?: number
        code?: string
        message?: string
        response?: { 
          status?: number
          data?: unknown
          error?: {
            message?: string
            type?: string
            code?: string
          }
        }
      }
      
      console.error('HTTP Error status:', err.status)
      console.error('Error code:', err.code)
      console.error('Error message:', err.message)
      
      if (err.response) {
        console.error('Response status:', err.response.status)
        console.error('Response error:', err.response.error)
        console.error('Response data:', err.response.data)
        
        // Check DeepSeek/OpenAI error format
        if (err.response.error) {
          const apiError = err.response.error
          console.error('DeepSeek error message:', apiError.message)
          console.error('DeepSeek error type:', apiError.type)
          console.error('DeepSeek error code:', apiError.code)
          
          if (apiError.code === 'invalid_api_key' || err.status === 401) {
            return 'Ошибка: Неверный API ключ. Пожалуйста, проверьте настройки.'
          }
          
          if (apiError.code === 'insufficient_quota' || err.status === 402) {
            return 'Ошибка: Недостаточно средств на балансе API. Пожалуйста, пополните баланс.'
          }
          
          if (apiError.code === 'rate_limit_exceeded' || err.status === 429) {
            return 'Ошибка: Превышен лимит запросов. Пожалуйста, подождите немного и попробуйте снова.'
          }
          
          return `Ошибка API: ${apiError.message || 'Неизвестная ошибка'}. Код: ${apiError.code || err.status}`
        }
      }

      // Handle specific HTTP status codes
      if (err.status === 401) {
        return 'Ошибка: Неверный API ключ. Пожалуйста, проверьте настройки.'
      }
      
      if (err.status === 402) {
        return 'Ошибка: Недостаточно средств на балансе API. Пожалуйста, пополните баланс.'
      }
      
      if (err.status === 429) {
        return 'Ошибка: Превышен лимит запросов. Пожалуйста, подождите немного и попробуйте снова.'
      }
      
      if (err.status === 500 || err.status === 503) {
        return 'Ошибка: Сервер DeepSeek временно недоступен. Попробуйте позже.'
      }

      if (err.message) {
        console.error('Full error message:', err.message)
        return `Ошибка API: ${err.message}. Попробуйте еще раз.`
      }
    }

    // Handle Error instances
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
      
      // Check for specific error messages
      if (error.message.includes('API key')) {
        return 'Ошибка: Проблема с API ключом. Пожалуйста, проверьте настройки.'
      }
      
      if (error.message.includes('network') || error.message.includes('fetch')) {
        return 'Ошибка: Проблема с сетью. Проверьте подключение к интернету.'
      }
      
      return `Ошибка: ${error.message}. Попробуйте еще раз.`
    }

    console.error('Unknown error type:', typeof error)
    return 'Произошла неизвестная ошибка при обращении к AI. Пожалуйста, попробуйте еще раз.'
  }
}

export async function generateBusinessPlan(
  name: string,
  description: string,
  problem: string,
  idea: string,
  audience: string,
  analysis?: any
) {
  if (!openai) {
    console.error('ERROR: DeepSeek client is not initialized')
    return null
  }

  try {
    const analysisText = analysis ? `
Существующий анализ:
- Рынок: ${analysis.executiveSummary?.marketSize || 'Не указано'}
- Рост: ${analysis.executiveSummary?.growthRate || 'Не указано'}
- Оценка: ${analysis.executiveSummary?.overallScore || 'Не указано'}
- Преимущества: ${analysis.keyAdvantages?.join(', ') || 'Не указано'}
- Конкуренты: ${analysis.competitors?.map((c: any) => c.name).join(', ') || 'Не указано'}
- Дорожная карта: ${analysis.roadmap?.map((r: any) => `${r.phase} (${r.period})`).join(', ') || 'Не указано'}
- Команда: ${analysis.teamRequirements?.roles?.map((r: any) => r.role).join(', ') || 'Не указано'}
- Финансы: ${analysis.implementationPlan?.map((p: any) => `${p.title} - ${p.cost}`).join(', ') || 'Не указано'}
` : ''

    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: `Ты — опытный бизнес-консультант и эксперт по составлению бизнес-планов.
Твоя задача — создать подробный и структурированный бизнес-план для стартапа.
Отвечай на русском языке. Будь конкретным, детальным и профессиональным.
Используй данные из анализа, если они предоставлены.`
        },
        {
          role: 'user',
          content: `Создай подробный бизнес-план для стартапа:

Название: ${name}
Описание: ${description || 'Не указано'}
Проблема: ${problem || 'Не указано'}
Решение: ${idea || 'Не указано'}
Целевая аудитория: ${audience || 'Не указано'}
${analysisText}

Создай развернутый бизнес-план со следующими разделами:

1. ОПИСАНИЕ КОМПАНИИ И ПРОДУКТА
   - Миссия компании (2-3 предложения)
   - Видение компании (2-3 предложения)
   - Описание продукта/услуги (детальное описание, 4-5 предложений)
   - Ценностное предложение (что уникального предлагаем, 3-4 предложения)
   - Проблема, которую решаем (детальное описание, 3-4 предложения)
   - Решение (как именно решаем проблему, 4-5 предложений)

2. АНАЛИЗ РЫНКА
   - Целевая аудитория (детальное описание сегментов, их потребности, размер, 5-6 предложений)
   - Конкуренты (основные конкуренты, их преимущества и недостатки, наша позиция, 6-8 предложений)
   - Преимущества нашего решения (конкурентные преимущества, уникальность, 4-5 предложений)
   - Размер рынка и потенциал роста (если есть данные из анализа)

3. МАРКЕТИНГ И СТРАТЕГИЯ ПРОДАЖ
   - Каналы привлечения клиентов (детальное описание каждого канала, стратегия, 5-6 предложений)
   - Ценообразование (модель ценообразования, обоснование цен, 4-5 предложений)
   - Модель внедрения (как клиенты будут начинать использовать продукт, 4-5 предложений)
   - Стратегия масштабирования (как будем расти, план расширения, 5-6 предложений)

4. ОПЕРАЦИОННАЯ ДЕЯТЕЛЬНОСТЬ
   - Этапы разработки (детальное описание каждого этапа, сроки, задачи, 6-8 предложений)
   - Роли в команде (необходимые роли, их функции, требования, 5-6 предложений)
   - План-график реализации (детальный план с временными рамками, 6-8 предложений)
   - Ключевые процессы и операции (как будет работать бизнес, 4-5 предложений)

5. ФИНАНСОВЫЙ ПЛАН
   - Инвестиции (необходимые инвестиции, на что пойдут, обоснование, 5-6 предложений)
   - Расходы (детальная структура расходов по категориям, 6-8 предложений)
   - Прогноз доходов (прогноз на 1-3 года, ключевые метрики, 5-6 предложений)
   - Стратегия привлечения инвестиций (источники финансирования, план привлечения, 5-6 предложений)

Верни текст в формате Markdown с заголовками для каждого раздела.`
        }
      ],
      temperature: 0.7,
      max_tokens: 4000,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      console.error('ERROR: Empty response from DeepSeek')
      return null
    }

    return content
  } catch (error: unknown) {
    console.error('=== Business Plan Generation Error ===')
    console.error('Error:', error)
    
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }

    return null
  }
}
