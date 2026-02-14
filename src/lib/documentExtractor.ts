import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// Max characters per document to avoid exceeding token limits
const MAX_CHARS_PER_DOC = 5000
// Max total characters for all documents combined
const MAX_TOTAL_CHARS = 20000

interface DocumentInfo {
  id: string
  name: string
  fileName: string
  fileUrl: string
  fileSize: number
  fileType: string
}

interface ExtractedDocument {
  name: string
  content: string
  fileType: string
}

/**
 * Extract text content from a document file based on its type
 */
async function extractTextFromFile(filePath: string, fileType: string): Promise<string> {
  if (!existsSync(filePath)) {
    return ''
  }

  try {
    // Plain text files
    if (
      fileType.includes('text/plain') ||
      fileType.includes('text/csv') ||
      fileType.includes('text/markdown') ||
      fileType.includes('application/json') ||
      fileType.includes('text/html') ||
      fileType.includes('text/xml')
    ) {
      const buffer = await readFile(filePath)
      return buffer.toString('utf-8')
    }

    // PDF files
    if (fileType.includes('application/pdf')) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pdfParse = require('pdf-parse') as (buffer: Buffer) => Promise<{ text: string }>
        const buffer = await readFile(filePath)
        const data = await pdfParse(buffer)
        return data.text || ''
      } catch (err) {
        console.error('Error parsing PDF:', err)
        return ''
      }
    }

    // DOCX files
    if (
      fileType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml') ||
      fileType.includes('application/msword')
    ) {
      try {
        const mammoth = await import('mammoth')
        const buffer = await readFile(filePath)
        const result = await mammoth.extractRawText({ buffer })
        return result.value || ''
      } catch (err) {
        console.error('Error parsing DOCX:', err)
        return ''
      }
    }

    // XLSX/XLS files — extract as best-effort text
    if (
      fileType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml') ||
      fileType.includes('application/vnd.ms-excel')
    ) {
      // Skip spreadsheets for now — would need xlsx library
      return '[Таблица — содержимое недоступно для текстового анализа]'
    }

    // PPTX/PPT files
    if (
      fileType.includes('application/vnd.openxmlformats-officedocument.presentationml') ||
      fileType.includes('application/vnd.ms-powerpoint')
    ) {
      return '[Презентация — содержимое недоступно для текстового анализа]'
    }

    return ''
  } catch (error) {
    console.error(`Error extracting text from ${filePath}:`, error)
    return ''
  }
}

/**
 * Extract text from all startup documents and return as context for AI
 */
export async function extractDocumentsContext(
  documents: DocumentInfo[]
): Promise<string> {
  if (!documents || documents.length === 0) {
    return ''
  }

  const extractedDocs: ExtractedDocument[] = []
  let totalChars = 0

  for (const doc of documents) {
    if (totalChars >= MAX_TOTAL_CHARS) break

    const filePath = join(process.cwd(), 'public', doc.fileUrl)
    const content = await extractTextFromFile(filePath, doc.fileType)

    if (content && content.length > 0) {
      const truncatedContent = content.length > MAX_CHARS_PER_DOC
        ? content.substring(0, MAX_CHARS_PER_DOC) + '\n... [документ обрезан]'
        : content

      extractedDocs.push({
        name: doc.name,
        content: truncatedContent,
        fileType: doc.fileType,
      })

      totalChars += truncatedContent.length
    }
  }

  if (extractedDocs.length === 0) {
    return ''
  }

  const contextParts = extractedDocs.map(
    (doc, i) =>
      `--- Документ ${i + 1}: "${doc.name}" ---\n${doc.content}`
  )

  return `\n\nДокументы стартапа (${extractedDocs.length} из ${documents.length}):\n\n${contextParts.join('\n\n')}`
}
