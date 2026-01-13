'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { RichTextEditor } from '@/components/RichTextEditor'
import { useStore } from '@/store/useStore'
import { 
  PlusIcon, 
  TrashIcon, 
  PencilIcon, 
  PhotoIcon,
  XMarkIcon,
  ArrowLeftIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline'
import { ArrowPathIcon } from '@heroicons/react/24/solid'

interface Article {
  id: string
  title: string
  excerpt?: string
  content: string
  image?: string
  createdAt: string
}

interface Startup {
  id: string
  name: string
}

function FormattedDate({ date }: { date: string }) {
  const [formatted, setFormatted] = useState('')
  
  useEffect(() => {
    setFormatted(new Date(date).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }))
  }, [date])
  
  return <>{formatted}</>
}

export default function ArticlesPage() {
  const params = useParams()
  const router = useRouter()
  const { setUser } = useStore()
  const [startup, setStartup] = useState<Startup | null>(null)
  const [articles, setArticles] = useState<Article[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [editingArticle, setEditingArticle] = useState<Article | null>(null)
  const [viewingArticle, setViewingArticle] = useState<Article | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    image: ''
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

        const articlesRes = await fetch(`/api/startups/${params.id}/articles`)
        if (articlesRes.ok) {
          const articlesData = await articlesRes.json()
          setArticles(articlesData.articles || [])
        }
      } catch {
        router.push('/dashboard')
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [params.id, router, setUser])

  const openAddModal = () => {
    setEditingArticle(null)
    setFormData({ title: '', excerpt: '', content: '', image: '' })
    setIsModalOpen(true)
  }

  const openEditModal = (article: Article) => {
    setEditingArticle(article)
    setFormData({
      title: article.title,
      excerpt: article.excerpt || '',
      content: article.content,
      image: article.image || ''
    })
    setIsModalOpen(true)
  }

  const handleImageUpload = async (file: File) => {
    setIsUploading(true)
    try {
      const formDataUpload = new FormData()
      formDataUpload.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      })

      if (res.ok) {
        const { url } = await res.json()
        setFormData(prev => ({ ...prev, image: url }))
      }
    } catch (error) {
      console.error('Upload error:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleImageUpload(file)
    }
    e.target.value = ''
  }

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.content.trim()) return
    setIsSaving(true)
    
    try {
      if (editingArticle) {
        const res = await fetch(`/api/startups/${params.id}/articles`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            articleId: editingArticle.id,
            ...formData
          })
        })
        if (res.ok) {
          const data = await res.json()
          setArticles(prev => prev.map(a => a.id === editingArticle.id ? data.article : a))
          if (viewingArticle?.id === editingArticle.id) {
            setViewingArticle(data.article)
          }
        }
      } else {
        const res = await fetch(`/api/startups/${params.id}/articles`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })
        if (res.ok) {
          const data = await res.json()
          setArticles(prev => [data.article, ...prev])
        }
      }
      setIsModalOpen(false)
      setFormData({ title: '', excerpt: '', content: '', image: '' })
    } catch (error) {
      console.error('Article error:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (articleId: string) => {
    if (!confirm('Удалить статью?')) return
    try {
      const res = await fetch(`/api/startups/${params.id}/articles`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId })
      })
      if (res.ok) {
        setArticles(prev => prev.filter(a => a.id !== articleId))
        if (viewingArticle?.id === articleId) {
          setViewingArticle(null)
        }
      }
    } catch {}
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Article View
  if (viewingArticle) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar startupId={startup?.id} startupName={startup?.name} />
        <main className="flex-1 overflow-auto lg:ml-0">
          <div className="max-w-3xl mx-auto p-4 sm:p-6">
            {/* Back Button */}
            <Button 
              variant="ghost" 
              className="mb-6 gap-2"
              onClick={() => setViewingArticle(null)}
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Назад к статьям
            </Button>

            {/* Article Header */}
            {viewingArticle.image && (
              <div className="relative aspect-video rounded-2xl overflow-hidden mb-6">
                <img 
                  src={viewingArticle.image} 
                  alt={viewingArticle.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="mb-6">
              <p className="text-sm text-muted-foreground mb-2">
                <FormattedDate date={viewingArticle.createdAt} />
              </p>
              <h1 className="text-3xl font-bold mb-4">{viewingArticle.title}</h1>
              {viewingArticle.excerpt && (
                <p className="text-lg text-muted-foreground">{viewingArticle.excerpt}</p>
              )}
            </div>

            {/* Article Content */}
            <div 
              className="prose prose-slate max-w-none"
              dangerouslySetInnerHTML={{ __html: viewingArticle.content }}
            />

            {/* Actions */}
            <div className="flex gap-2 mt-8 pt-6 border-t">
              <Button variant="outline" onClick={() => openEditModal(viewingArticle)}>
                <PencilIcon className="h-4 w-4 mr-2" />
                Редактировать
              </Button>
              <Button variant="outline" className="text-destructive" onClick={() => handleDelete(viewingArticle.id)}>
                <TrashIcon className="h-4 w-4 mr-2" />
                Удалить
              </Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Articles List
  return (
    <div className="flex h-screen bg-background">
      <Sidebar startupId={startup?.id} startupName={startup?.name} />
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold">Статьи</h1>
              <p className="text-sm text-muted-foreground mt-1">Блог вашего стартапа</p>
            </div>
            <Button onClick={openAddModal} className="gap-2">
              <PlusIcon className="h-4 w-4" />
              Новая статья
            </Button>
          </div>

          {articles.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed rounded-2xl">
              <PhotoIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">Нет статей</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Создайте первую статью для блога
              </p>
              <Button onClick={openAddModal}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Создать статью
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map(article => (
                <div 
                  key={article.id}
                  className="group bg-white rounded-2xl border overflow-hidden hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => setViewingArticle(article)}
                >
                  {/* Image */}
                  <div className="aspect-video bg-slate-100 relative overflow-hidden">
                    {article.image ? (
                      <img 
                        src={article.image} 
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <PhotoIcon className="h-12 w-12 text-slate-300" />
                      </div>
                    )}
                    {/* Actions */}
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 bg-white/90 hover:bg-white"
                        onClick={(e) => { e.stopPropagation(); openEditModal(article) }}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 bg-white/90 hover:bg-white"
                        onClick={(e) => { e.stopPropagation(); handleDelete(article.id) }}
                      >
                        <TrashIcon className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <p className="text-xs text-muted-foreground mb-2">
                      <FormattedDate date={article.createdAt} />
                    </p>
                    <h3 className="font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {article.title}
                    </h3>
                    {article.excerpt && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {article.excerpt}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingArticle ? 'Редактировать статью' : 'Новая статья'}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4 py-4">
            <div className="space-y-2">
              <Label>Заголовок *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Название статьи"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label>Краткое описание</Label>
              <Textarea
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                placeholder="Короткое описание для превью..."
                className="min-h-[60px] resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label>Обложка</Label>
              <div className="flex gap-2">
                <Input
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="URL картинки или загрузите файл"
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  ) : (
                    <CloudArrowUpIcon className="h-4 w-4" />
                  )}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>
              {formData.image && (
                <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-100 mt-2">
                  <img 
                    src={formData.image} 
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={() => setFormData({ ...formData, image: '' })}
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Содержание *</Label>
              <RichTextEditor
                content={formData.content}
                onChange={(content) => setFormData({ ...formData, content })}
                placeholder="Текст статьи..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Отмена</Button>
            <Button onClick={handleSubmit} disabled={isSaving || !formData.title || !formData.content}>
              {isSaving && <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />}
              {editingArticle ? 'Сохранить' : 'Опубликовать'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
