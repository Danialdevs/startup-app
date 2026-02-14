'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useStore } from '@/store/useStore'
import {
  PlusIcon,
  TrashIcon,
  PencilIcon,
  DocumentIcon,
  DocumentTextIcon,
  TableCellsIcon,
  PresentationChartBarIcon,
  PhotoIcon,
  ArrowDownTrayIcon,
  CloudArrowUpIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'
import { ArrowPathIcon } from '@heroicons/react/24/solid'

interface Document {
  id: string
  name: string
  fileName: string
  fileUrl: string
  fileSize: number
  fileType: string
  createdAt: string
}

interface Startup {
  id: string
  name: string
}

function getFileIcon(fileType: string) {
  if (fileType.includes('pdf')) return <DocumentTextIcon className="h-8 w-8 text-red-500" />
  if (fileType.includes('word') || fileType.includes('document')) return <DocumentTextIcon className="h-8 w-8 text-blue-500" />
  if (fileType.includes('sheet') || fileType.includes('excel') || fileType.includes('csv')) return <TableCellsIcon className="h-8 w-8 text-green-500" />
  if (fileType.includes('presentation') || fileType.includes('powerpoint')) return <PresentationChartBarIcon className="h-8 w-8 text-orange-500" />
  if (fileType.includes('image')) return <PhotoIcon className="h-8 w-8 text-purple-500" />
  return <DocumentIcon className="h-8 w-8 text-gray-500" />
}

function getFileExtension(fileName: string) {
  return fileName.split('.').pop()?.toUpperCase() || ''
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + ' Б'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' КБ'
  return (bytes / (1024 * 1024)).toFixed(1) + ' МБ'
}

function FormattedDate({ date }: { date: string }) {
  const [formatted, setFormatted] = useState('')

  useEffect(() => {
    setFormatted(new Date(date).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }))
  }, [date])

  return <>{formatted}</>
}

export default function DocumentsPage() {
  const params = useParams()
  const router = useRouter()
  const { setUser } = useStore()
  const [startup, setStartup] = useState<Startup | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isRenameOpen, setIsRenameOpen] = useState(false)
  const [renamingDoc, setRenamingDoc] = useState<Document | null>(null)
  const [newName, setNewName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

        const docsRes = await fetch(`/api/startups/${params.id}/documents`)
        if (docsRes.ok) {
          const docsData = await docsRes.json()
          setDocuments(docsData.documents || [])
        }
      } catch {
        router.push('/dashboard')
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [params.id, router, setUser])

  const uploadFiles = async (files: FileList | File[]) => {
    setIsUploading(true)
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('name', file.name)

        const res = await fetch(`/api/startups/${params.id}/documents`, {
          method: 'POST',
          body: formData
        })

        if (res.ok) {
          const data = await res.json()
          setDocuments(prev => [data.document, ...prev])
        } else {
          const errData = await res.json()
          alert(errData.error || 'Ошибка загрузки файла')
        }
      }
    } catch (error) {
      console.error('Upload error:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      uploadFiles(files)
    }
    e.target.value = ''
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files)
    }
  }

  const handleRename = async () => {
    if (!renamingDoc || !newName.trim()) return
    setIsSaving(true)
    try {
      const res = await fetch(`/api/startups/${params.id}/documents`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: renamingDoc.id, name: newName.trim() })
      })
      if (res.ok) {
        const data = await res.json()
        setDocuments(prev => prev.map(d => d.id === renamingDoc.id ? data.document : d))
        setIsRenameOpen(false)
        setRenamingDoc(null)
      }
    } catch (error) {
      console.error('Rename error:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (docId: string) => {
    if (!confirm('Удалить документ?')) return
    try {
      const res = await fetch(`/api/startups/${params.id}/documents`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: docId })
      })
      if (res.ok) {
        setDocuments(prev => prev.filter(d => d.id !== docId))
      }
    } catch {}
  }

  const openRenameDialog = (doc: Document) => {
    setRenamingDoc(doc)
    setNewName(doc.name)
    setIsRenameOpen(true)
  }

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
      <main className="flex-1 overflow-auto lg:ml-0">
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold">Документы</h1>
            </div>
            <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="gap-2">
              {isUploading ? (
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
              ) : (
                <PlusIcon className="h-4 w-4" />
              )}
              Загрузить
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          {/* Search */}
          {documents.length > 0 && (
            <div className="relative mb-6">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск документов..."
                className="pl-9"
              />
            </div>
          )}

          {/* Drop Zone / Empty State */}
          {documents.length === 0 ? (
            <div
              className={`text-center py-16 border-2 border-dashed rounded-2xl transition-colors ${
                dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <CloudArrowUpIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">Нет документов</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Перетащите файлы сюда или нажмите кнопку загрузки
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, CSV, изображения — до 20МБ
              </p>
              <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                <CloudArrowUpIcon className="h-4 w-4 mr-2" />
                Выбрать файлы
              </Button>
            </div>
          ) : (
            <>
              {/* Drop overlay when dragging over document list */}
              <div
                className={`relative ${dragActive ? '' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                {dragActive && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-primary/5 border-2 border-dashed border-primary rounded-2xl">
                    <div className="text-center">
                      <CloudArrowUpIcon className="h-10 w-10 mx-auto text-primary mb-2" />
                      <p className="text-primary font-medium">Отпустите файлы для загрузки</p>
                    </div>
                  </div>
                )}

                {/* Uploading indicator */}
                {isUploading && (
                  <div className="flex items-center gap-3 mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <ArrowPathIcon className="h-5 w-5 animate-spin text-primary" />
                    <span className="text-sm text-primary font-medium">Загрузка файлов...</span>
                  </div>
                )}

                {/* Documents Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredDocuments.map(doc => (
                    <div
                      key={doc.id}
                      className="group bg-white rounded-xl border p-4 hover:shadow-md transition-all"
                    >
                      {/* File Icon & Extension */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {getFileIcon(doc.fileType)}
                          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
                            {getFileExtension(doc.fileName)}
                          </span>
                        </div>
                        {/* Actions */}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => openRenameDialog(doc)}
                          >
                            <PencilIcon className="h-3.5 w-3.5" />
                          </Button>
                          <a href={doc.fileUrl} download={doc.fileName}>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                            </Button>
                          </a>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(doc.id)}
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* File Name */}
                      <h3 className="text-sm font-medium truncate mb-1" title={doc.name}>
                        {doc.name}
                      </h3>

                      {/* Meta */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatFileSize(doc.fileSize)}</span>
                        <span>·</span>
                        <span><FormattedDate date={doc.createdAt} /></span>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredDocuments.length === 0 && searchQuery && (
                  <div className="text-center py-12">
                    <MagnifyingGlassIcon className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">Ничего не найдено по запросу &laquo;{searchQuery}&raquo;</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Rename Dialog */}
      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Переименовать документ</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Название документа"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameOpen(false)}>Отмена</Button>
            <Button onClick={handleRename} disabled={isSaving || !newName.trim()}>
              {isSaving && <ArrowPathIcon className="mr-2 h-4 w-4 animate-spin" />}
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
