import { FastifyRequest, FastifyReply } from 'fastify';
import '@fastify/multipart';
import { AudioService } from "../services/AudioService.js";

export class AudioController {

    static async transcrever(request: FastifyRequest, reply: FastifyReply) {
        try {
            // 1. Pega os dados do usuário logado (injetados pelo seu preHandler: [fastify.authenticate])
            const user = request.user as any;
            const userId = user.id;
            const companyId = user.empresa_id || null;

            // 2. Recebe o arquivo e os campos adicionais
            const data = await request.file();
            if (!data) return reply.status(400).send({ error: 'Áudio não enviado.' });

            // 3. Verifica se veio um ID de conversa (opcional para chats novos)
            const convField = data.fields.conversations_id;
            const conversations_id = convField && 'value' in convField ? String(convField.value) : null;

            const audioBuffer = await data.toBuffer();
            const mimeType = data.mimetype;

            // 4. Passa tudo para o Service
            const result = await AudioService.processarAudio(
                audioBuffer,
                mimeType,
                userId,
                companyId,
                conversations_id
            );

            // 5. Retorna o texto e o ID da conversa (importante se for uma conversa nova!)
            return reply.send(result);

        } catch (error) {
            console.error('[AudioController] Erro:', error);
            return reply.status(500).send({ error: 'Falha ao processar áudio no servidor.' });
        }
    }
}