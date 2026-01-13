'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useStore } from '@/store/useStore'
import { PlusIcon, TrashIcon, PencilIcon, UserIcon, CalendarIcon, CheckIcon } from '@heroicons/react/24/outline'
import { ArrowPathIcon } from '@heroicons/react/24/solid'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core'

interface TeamMember {
  id: string
  name: string
  role: string
}

interface TaskAssignee {
  id: string
  member: TeamMember
}

interface Task {
  id: string
  title: string
  description?: string
  status: string
  priority: string
  assignees: TaskAssignee[]
}

interface Startup {
  id: string
  name: string
  tasks: Task[]
  teamMembers: TeamMember[]
}

const COLUMNS = [
  { id: 'todo', title: 'К выполнению', color: 'bg-slate-100', headerColor: 'bg-slate-200' },
  { id: 'in_progress', title: 'В работе', color: 'bg-blue-50', headerColor: 'bg-blue-200' },
  { id: 'done', title: 'Готово', color: 'bg-green-50', headerColor: 'bg-green-200' },
]

const priorityConfig: Record<string, { color: string; bg: string; label: string }> = {
  high: { color: 'text-red-600', bg: 'bg-red-100', label: 'Высокий' },
  medium: { color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Средний' },
  low: { color: 'text-green-600', bg: 'bg-green-100', label: 'Низкий' },
}

// Draggable Task Card
function DraggableTask({ 
  task, 
  onEdit, 
  onDelete 
}: { 
  task: Task
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task }
  })

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined

  const priority = priorityConfig[task.priority] || priorityConfig.medium

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-xl p-4 shadow-sm border border-slate-200 group hover:shadow-md hover:border-slate-300 transition-all ${isDragging ? 'opacity-50 shadow-lg scale-105' : ''}`}
    >
      {/* Drag Handle */}
      <div 
        {...listeners} 
        {...attributes}
        className="cursor-grab active:cursor-grabbing"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="font-medium text-sm text-slate-900 leading-snug flex-1">{task.title}</h4>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => { e.stopPropagation(); onEdit(task) }}
            >
              <PencilIcon className="h-3.5 w-3.5 text-slate-400 hover:text-slate-600" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => { e.stopPropagation(); onDelete(task.id) }}
            >
              <TrashIcon className="h-3.5 w-3.5 text-slate-400 hover:text-red-500" />
            </Button>
          </div>
        </div>

        {/* Description */}
        {task.description && (
          <p className="text-xs text-slate-500 mb-3 line-clamp-2 leading-relaxed">{task.description}</p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${priority.bg} ${priority.color}`}>
          {priority.label}
        </span>

        {task.assignees && task.assignees.length > 0 ? (
          <div className="flex items-center -space-x-1.5">
            {task.assignees.slice(0, 3).map((assignee, i) => (
              <div 
                key={assignee.id}
                className="h-6 w-6 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-[10px] text-white font-medium border-2 border-white"
                title={assignee.member.name}
                style={{ zIndex: 10 - i }}
              >
                {assignee.member.name.charAt(0).toUpperCase()}
              </div>
            ))}
            {task.assignees.length > 3 && (
              <div 
                className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] text-slate-600 font-medium border-2 border-white"
                style={{ zIndex: 0 }}
              >
                +{task.assignees.length - 3}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1 text-slate-400">
            <UserIcon className="h-3.5 w-3.5" />
            <span className="text-[11px]">Не назначен</span>
          </div>
        )}
      </div>
    </div>
  )
}

// Droppable Column
function DroppableColumn({ 
  column, 
  tasks, 
  onAddTask, 
  onEditTask, 
  onDeleteTask,
  isOver 
}: { 
  column: typeof COLUMNS[0]
  tasks: Task[]
  onAddTask: (columnId: string) => void
  onEditTask: (task: Task) => void
  onDeleteTask: (taskId: string) => void
  isOver: boolean
}) {
  const { setNodeRef } = useDroppable({
    id: column.id,
  })

  return (
    <div 
      ref={setNodeRef}
      className={`w-80 flex flex-col rounded-2xl ${column.color} border-2 transition-all ${isOver ? 'border-primary ring-2 ring-primary/20 scale-[1.02]' : 'border-transparent'}`}
    >
      {/* Column Header */}
      <div className={`p-4 rounded-t-xl ${column.headerColor}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-700">{column.title}</h3>
            <span className="text-xs text-slate-500 bg-white/60 px-2 py-0.5 rounded-full font-medium">
              {tasks.length}
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 hover:bg-white/50" 
            onClick={() => onAddTask(column.id)}
          >
            <PlusIcon className="h-4 w-4 text-slate-600" />
          </Button>
        </div>
      </div>
      
      {/* Tasks */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[200px]">
        {tasks.map(task => (
          <DraggableTask
            key={task.id}
            task={task}
            onEdit={onEditTask}
            onDelete={onDeleteTask}
          />
        ))}
        
        {tasks.length === 0 && (
          <div className="text-center py-12 text-sm text-slate-400">
            <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Нет задач</p>
            <button 
              onClick={() => onAddTask(column.id)}
              className="mt-2 text-primary hover:underline text-xs"
            >
              + Добавить
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// Drag Overlay
function TaskOverlay({ task }: { task: Task }) {
  const priority = priorityConfig[task.priority] || priorityConfig.medium

  return (
    <div className="bg-white rounded-xl p-4 shadow-2xl border-2 border-primary w-72 rotate-2 cursor-grabbing">
      <div className="mb-2">
        <h4 className="font-medium text-sm text-slate-900 leading-snug">{task.title}</h4>
      </div>
      {task.description && (
        <p className="text-xs text-slate-500 mb-3 line-clamp-2">{task.description}</p>
      )}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${priority.bg} ${priority.color}`}>
          {priority.label}
        </span>
        {task.assignees && task.assignees.length > 0 && (
          <div className="flex items-center -space-x-1">
            {task.assignees.slice(0, 3).map((assignee) => (
              <div 
                key={assignee.id}
                className="h-5 w-5 rounded-full bg-primary flex items-center justify-center text-[10px] text-white font-medium border border-white"
              >
                {assignee.member.name.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function TasksPage() {
  const params = useParams()
  const router = useRouter()
  const { setUser } = useStore()
  const [startup, setStartup] = useState<Startup | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [addToColumn, setAddToColumn] = useState('todo')
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [overColumnId, setOverColumnId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    assigneeIds: [] as string[]
  })

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  )

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
      } catch {
        router.push('/dashboard')
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [params.id, router, setUser])

  const openAddModal = (columnId: string) => {
    setAddToColumn(columnId)
    setEditingTask(null)
    setFormData({ title: '', description: '', priority: 'medium', assigneeIds: [] })
    setIsModalOpen(true)
  }

  const openEditModal = (task: Task) => {
    setEditingTask(task)
    setFormData({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      assigneeIds: task.assignees?.map(a => a.member.id) || []
    })
    setIsModalOpen(true)
  }

  const toggleAssignee = (memberId: string) => {
    setFormData(prev => ({
      ...prev,
      assigneeIds: prev.assigneeIds.includes(memberId)
        ? prev.assigneeIds.filter(id => id !== memberId)
        : [...prev.assigneeIds, memberId]
    }))
  }

  const handleSubmit = async () => {
    if (!formData.title.trim()) return
    setIsSaving(true)
    
    try {
      if (editingTask) {
        const res = await fetch(`/api/startups/${params.id}/tasks`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskId: editingTask.id,
            title: formData.title,
            description: formData.description,
            priority: formData.priority,
            assigneeIds: formData.assigneeIds
          })
        })
        if (res.ok) {
          const data = await res.json()
          setStartup(prev => prev ? {
            ...prev,
            tasks: prev.tasks.map(t => t.id === editingTask.id ? data.task : t)
          } : null)
        }
      } else {
        const res = await fetch(`/api/startups/${params.id}/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formData.title,
            description: formData.description,
            status: addToColumn,
            priority: formData.priority,
            assigneeIds: formData.assigneeIds
          })
        })
        if (res.ok) {
          const data = await res.json()
          setStartup(prev => prev ? {
            ...prev,
            tasks: [...prev.tasks, data.task]
          } : null)
        }
      }
      setIsModalOpen(false)
      setFormData({ title: '', description: '', priority: 'medium', assigneeIds: [] })
    } catch (error) {
      console.error('Task error:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const task = startup?.tasks.find(t => t.id === active.id)
    if (task) setActiveTask(task)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event
    if (over && COLUMNS.some(c => c.id === over.id)) {
      setOverColumnId(over.id as string)
    } else {
      setOverColumnId(null)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveTask(null)
    setOverColumnId(null)

    if (!over) return

    const taskId = active.id as string
    const task = startup?.tasks.find(t => t.id === taskId)
    if (!task) return

    // Check if dropped on a column
    const newStatus = over.id as string
    if (!COLUMNS.some(c => c.id === newStatus)) return

    if (newStatus !== task.status) {
      // Optimistic update
      setStartup(prev => prev ? {
        ...prev,
        tasks: prev.tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t)
      } : null)

      // API call
      try {
        await fetch(`/api/startups/${params.id}/tasks`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskId, status: newStatus })
        })
      } catch (error) {
        console.error('Move task error:', error)
        // Revert on error
        setStartup(prev => prev ? {
          ...prev,
          tasks: prev.tasks.map(t => t.id === taskId ? { ...t, status: task.status } : t)
        } : null)
      }
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Удалить задачу?')) return
    try {
      const res = await fetch(`/api/startups/${params.id}/tasks`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId })
      })
      if (res.ok) {
        setStartup(prev => prev ? {
          ...prev,
          tasks: prev.tasks.filter(t => t.id !== taskId)
        } : null)
      }
    } catch {}
  }

  const getTasksByStatus = (status: string) => {
    return startup?.tasks.filter(t => t.status === status) || []
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar startupId={startup?.id} startupName={startup?.name} />
      <main className="flex-1 overflow-hidden flex flex-col">
        <div className="p-6 bg-white border-b">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Задачи</h1>
              <p className="text-sm text-slate-500 mt-1">Перетаскивайте карточки между колонками</p>
            </div>
            <Button onClick={() => openAddModal('todo')} className="gap-2">
              <PlusIcon className="h-4 w-4" />
              Новая задача
            </Button>
          </div>
        </div>
        
        {/* Kanban Board */}
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex-1 overflow-x-auto p-6">
            <div className="flex gap-5 h-full min-w-max">
              {COLUMNS.map(column => (
                <DroppableColumn
                  key={column.id}
                  column={column}
                  tasks={getTasksByStatus(column.id)}
                  onAddTask={openAddModal}
                  onEditTask={openEditModal}
                  onDeleteTask={handleDeleteTask}
                  isOver={overColumnId === column.id}
                />
              ))}
            </div>
          </div>

          <DragOverlay>
            {activeTask && (
              <TaskOverlay task={activeTask} />
            )}
          </DragOverlay>
        </DndContext>
      </main>

      {/* Task Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Редактировать задачу' : 'Новая задача'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Название *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Что нужно сделать?"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label>Описание</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Подробности задачи..."
                className="min-h-[100px] resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label>Ответственные</Label>
              <div className="border rounded-lg p-2 max-h-[150px] overflow-y-auto space-y-1">
                {startup?.teamMembers && startup.teamMembers.length > 0 ? (
                  startup.teamMembers.map(member => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => toggleAssignee(member.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                        formData.assigneeIds.includes(member.id)
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-all ${
                        formData.assigneeIds.includes(member.id)
                          ? 'bg-primary border-primary'
                          : 'border-slate-300'
                      }`}>
                        {formData.assigneeIds.includes(member.id) && (
                          <CheckIcon className="h-3 w-3 text-white" />
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <span className="font-medium">{member.name}</span>
                        <span className="text-slate-400 ml-2 text-xs">{member.role}</span>
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-slate-400 text-center py-4">
                    Нет участников команды
                  </p>
                )}
              </div>
              {formData.assigneeIds.length > 0 && (
                <p className="text-xs text-slate-500">
                  Выбрано: {formData.assigneeIds.length}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Приоритет</Label>
              <div className="flex gap-2">
                {Object.entries(priorityConfig).map(([id, config]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setFormData({ ...formData, priority: id })}
                    className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all border-2 ${
                      formData.priority === id 
                        ? `${config.bg} ${config.color} border-current` 
                        : 'bg-slate-50 text-slate-500 border-transparent hover:bg-slate-100'
                    }`}
                  >
                    {config.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Отмена</Button>
            <Button onClick={handleSubmit} disabled={isSaving || !formData.title}>
              {isSaving && <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />}
              {editingTask ? 'Сохранить' : 'Создать'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
