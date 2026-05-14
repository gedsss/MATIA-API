import type { FastifyRequest, FastifyReply } from 'fastify';
import { ProfileService } from '..//services/ProfileService.js';
import type { CreateUserDTO, UpdateUserDTO } from '..//dtos/UserDTO.js';

export class ProfileController {

  /**
   * 👤 OBTER PERFIL LOGADO (Ajustado)
   * Agora chama o Service enviando apenas o ID do Token JWT.
   */
  static async getSelf(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.user as { id: string };

    // Simplificado: Service agora só requer o ID para buscar o próprio perfil
    const perfil = await ProfileService.obterMeuPerfil(id);

    return reply.status(200).send(perfil);
  }

  /**
   * 📝 ATUALIZAR PERFIL LOGADO
   */
  static async atualizarSelf(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id, role, empresa_id } = request.user as { id: string; role: string; empresa_id: string | null };
      const data = request.body as UpdateUserDTO;

      // Mantemos role e empresa_id aqui para validar a permissão de escrita no banco
      const atualizado = await ProfileService.atualizar(id, role, empresa_id, data);

      return reply.send({
        success: true,
        message: 'Seu perfil foi atualizado com sucesso.',
        data: atualizado
      });
    } catch (error: any) {
      return reply.status(400).send({
        success: false,
        message: error.message || 'Erro ao atualizar perfil.'
      });
    }
  }

  /**
   * 🔍 LISTAR USUÁRIOS (Visão Admin/Super-Admin)
   */
  static async listar(request: FastifyRequest, reply: FastifyReply) {
    const user = request.user as { role: string; empresa_id: string | null };

    // Forçamos a empresa como null se for Super para garantir que o Repository não filtre
    const empresaBusca = user.role === 'SUPER-ADMIN' ? null : user.empresa_id;

    const usuarios = await ProfileService.listarPorEmpresa(user.role, empresaBusca);

    return reply.send({
      success: true,
      data: usuarios
    });
  }

  /**
   * ➕ CRIAR USUÁRIO
   */
  static async criar(request: FastifyRequest, reply: FastifyReply) {
    const { empresa_id } = request.user as { empresa_id: string | null };
    const data = request.body as CreateUserDTO;

    const novoUsuario = await ProfileService.cadastrar(data, empresa_id);

    return reply.status(201).send({
      success: true,
      message: 'Usuário cadastrado com sucesso!',
      data: novoUsuario
    });
  }

  /**
   * 🔍 BUSCAR POR ID (Específico)
   */
  static async buscar(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const { role, empresa_id } = request.user as { role: string; empresa_id: string | null };

    const usuario = await ProfileService.buscarPorId(id, role, empresa_id);

    return reply.send({
      success: true,
      data: usuario
    });
  }

  /**
   * 📝 ATUALIZAR USUÁRIO (Admin)
   */
  static async atualizar(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const { role, empresa_id } = request.user as { role: string; empresa_id: string | null };
    const data = request.body as UpdateUserDTO;

    const atualizado = await ProfileService.atualizar(id, role, empresa_id, data);

    return reply.send({
      success: true,
      message: 'Perfil atualizado com sucesso.',
      data: atualizado
    });
  }

  /**
   * 🗑️ EXCLUIR
   */
  static async excluir(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const { role, empresa_id } = request.user as { role: string; empresa_id: string | null };

    await ProfileService.excluir(id, role, empresa_id);

    return reply.status(204).send();
  }
}