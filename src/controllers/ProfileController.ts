import type { FastifyRequest, FastifyReply } from 'fastify';
import { ProfileService } from '../services/ProfileService.js';
import type { CreateUserDTO, UpdateUserDTO } from '../dtos/UserDTO.js';

export class ProfileController {

  /**
   * 🔍 LISTAR USUÁRIOS
   * Agora usa a Role para decidir se mostra tudo ou apenas uma empresa.
   */
  static async listar(request: FastifyRequest, reply: FastifyReply) {
    const { role, empresa_id } = request.user as { role: string; empresa_id: string | null };

    // 🌟 Repassando a role para o Service decidir o alcance da busca
    const usuarios = await ProfileService.listarPorEmpresa(role, empresa_id);

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

    // Vincula à empresa do criador (ou null se for Super Admin criando outro global)
    const novoUsuario = await ProfileService.cadastrar(data, empresa_id);

    return reply.status(201).send({
      success: true,
      message: 'Usuário cadastrado com sucesso!',
      data: novoUsuario
    });
  }

  /**
   * 🔍 BUSCAR POR ID
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

  // Pega usuário logado
  static async getSelf(request: FastifyRequest, reply: FastifyReply) {
    const { id, role, empresa_id } = request.user as { id: string; role: string; empresa_id: string | null };
    const perfil = await ProfileService.obterMeuPerfil(id, role, empresa_id);
    return reply.status(200).send(perfil);
  }

  static async atualizarSelf(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id, role, empresa_id } = request.user as { id: string; role: string; empresa_id: string | null };
      const data = request.body as UpdateUserDTO;

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
   * 📝 ATUALIZAR
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