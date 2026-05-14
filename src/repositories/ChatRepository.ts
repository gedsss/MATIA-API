import Messages from "..models/messages.js";
import Conversation from "..models/conversation.js";

export class ChatRepository {

    // 1. Salvar a pergunta do Usuário (Texto)
    static async salvarMensagemTexto(
        userId: string,
        companyId: string | null,
        content: string,
        conversationId?: string | null
    ) {
        const transacao = await Messages.sequelize!.transaction();

        try {
            let activeConversationId = conversationId;

            if (!activeConversationId) {
                // 🔥 A CORREÇÃO FOI FEITA NESTE BLOCO 🔥
                const novaConversa = await Conversation.create({
                    user_id: userId,
                    company_id: companyId,
                    title: content.substring(0, 40) + '...', // O título da conversa é o comecinho da pergunta
                    is_favorite: false,
                    last_message_at: new Date()
                }, { transaction: transacao, returning: true }); // 👈 Adicionamos returning: true aqui

                // 🔍 Log de segurança para vermos exatamente o que o Sequelize retornou
                console.log('[DEBUG] Nova conversa criada:', novaConversa.toJSON());

                // 👈 Pegando o ID de forma mais segura para evitar o notNull Violation
                activeConversationId = novaConversa.getDataValue('id') || novaConversa.id;

                if (!activeConversationId) {
                    throw new Error("O Sequelize criou a conversa, mas não conseguiu capturar o ID gerado pelo banco.");
                }
                // 🔥 FIM DA CORREÇÃO 🔥
            } else {
                await Conversation.update(
                    { last_message_at: new Date() },
                    { where: { id: activeConversationId }, transaction: transacao }
                );
            }

            await Messages.create({
                conversations_id: activeConversationId,
                role: 'user',
                content: content,
                metadata: { origin: 'text' }
            }, { transaction: transacao });

            await transacao.commit();

            return { conversationId: activeConversationId };

        } catch (error) {
            await transacao.rollback();
            console.error('[ChatRepository] Erro ao salvar mensagem do usuário:', error);
            throw error;
        }
    }

    // 2. Salvar a resposta da IA
    static async salvarMensagemIA(
        conversationId: string,
        content: string,
        iaModel: string
    ) {
        return await Messages.create({
            conversations_id: conversationId,
            role: 'assistant',
            content: content,
            metadata: { model: iaModel } // Guardamos qual IA gerou essa resposta!
        });
    }
}