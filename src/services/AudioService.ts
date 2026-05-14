import { GoogleGenAI } from '@google/genai';
import { ChatRepository } from "../repositories/ChatRepository.js";

export class AudioService {

    static async processarAudio(
        audioBuffer: Buffer,
        mimeType: string,
        userId: string,
        companyId: string | null,
        conversationId?: string | null
    ) {
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
            const base64Audio = audioBuffer.toString('base64');

            // A. Transcrição via Gemini
            const response = await ai.models.generateContent({
                model: 'gemini-1.5-flash',
                contents: [{
                    role: 'user',
                    parts: [
                        { text: 'Transcreva este áudio juridico com precisão. Retorne apenas o texto falado.' },
                        { inlineData: { data: base64Audio, mimeType: mimeType || 'audio/webm' } }
                    ]
                }]
            });

            const texto = response.text?.trim() || '';
            if (!texto) throw new Error('Falha na transcrição.');

            // B. Persistência no Banco (Histórico/Favoritos)
            const saveResult = await ChatRepository.salvarMensagemTexto(
                userId,
                companyId,
                texto,
                conversationId
            );

            // C. Retorno completo para o Angular
            return {
                text: saveResult.conversationId,
                conversationId: saveResult.conversationId
            };

        } catch (error) {
            console.error('[AudioService] Erro:', error);
            throw error;
        }
    }
}