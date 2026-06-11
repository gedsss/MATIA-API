import axios from 'axios'
import Documents from '../models/documents.js'
import { InternalServerError } from '../errors/errors.js'

export interface UploadDocumentResult {
  id: string
  rag_document_id: string
  original_name: string
  file_type: string
  file_size: number
  status: string
  chunks_created: number
}

export async function uploadAndIngest(
  userId: string,
  companyId: string,
  file: { filename: string; mimetype: string; data: Buffer }
): Promise<UploadDocumentResult> {
  const doc = await Documents.create({
    user_id: userId,
    original_name: file.filename,
    storage_path: `rag/${companyId}/${Date.now()}_${file.filename}`,
    file_type: file.mimetype,
    file_size: file.data.byteLength,
    status: 'enviando',
  })

  try {
    const form = new FormData()
    form.append('file', new Blob([file.data], { type: file.mimetype }), file.filename)
    form.append('company_id', companyId)
    form.append('user_id', userId)

    const ragUrl = process.env.RAG_API_URL ?? 'http://localhost:8001'
    const response = await axios.post(`${ragUrl}/documents/upload`, form, {
      headers: { 'X-API-Key': process.env.MATIA_RAG_API_KEY },
    })

    const { document_id, chunks_created } = response.data as { document_id: string; chunks_created: number }

    await Documents.update(
      { rag_document_id: document_id, status: 'completo', processed_at: new Date() },
      { where: { id: doc.id } }
    )

    return {
      id: doc.id,
      rag_document_id: document_id,
      original_name: file.filename,
      file_type: file.mimetype,
      file_size: file.data.byteLength,
      status: 'completo',
      chunks_created,
    }
  } catch (error: unknown) {
    await Documents.update({ status: 'erro' }, { where: { id: doc.id } })
    const message = error instanceof Error ? error.message : String(error)
    throw new InternalServerError('Falha ao processar o documento no RAG.', { originalError: message })
  }
}
