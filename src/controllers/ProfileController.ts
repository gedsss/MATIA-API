import type { FastifyRequest, FastifyReply } from 'fastify';
import { ProfileService } from '../services/ProfileService.js';
import type { CreateUserDTO, UpdateUserDTO } from '../dtos/UserDTO.js';

export class ProfileController {

  /**
   * 🔍 LISTAR USUÁRIOS
   * Retorna apenas os usuários que pertencem à mesma empresa do usuário logado.
   */
  static async listar(request: FastifyRequest, reply: FastifyReply) {
    const { empresa_id } = request.user as { empresa_id: string };

    const usuarios = await ProfileService.listarPorEmpresa(empresa_id);

    return reply.send({
      success: true,
      data: usuarios
    });
  }

  /**
   * ➕ CRIAR USUÁRIO
   * Vincula o novo usuário automaticamente à empresa do administrador que está criando.
   */
  static async criar(request: FastifyRequest, reply: FastifyReply) {
    const { empresa_id } = request.user as { empresa_id: string };
    const data = request.body as CreateUserDTO;

    const novoUsuario = await ProfileService.cadastrar(data, empresa_id);

    return reply.status(201).send({
      success: true,
      message: 'Usuário cadastrado com sucesso!',
      data: novoUsuario
    });
  }

  /**
   * 🔍 BUSCAR POR ID
   * Verifica se o usuário solicitado pertence à empresa do requisitante.
   */
  static async buscar(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const { empresa_id } = request.user as { empresa_id: string };

    const usuario = await ProfileService.buscarPorId(id, empresa_id);

    return reply.send({
      success: true,
      data: usuario
    });
  }
 //Pega usuário logado
  static async getSelf(request: FastifyRequest, reply: FastifyReply) {
    const { id, empresa_id } = (request as any).user;
    const perfil = await ProfileService.obterMeuPerfil(id, empresa_id);
    return reply.status(200).send(perfil);
  }

  static async atualizarSelf(request: FastifyRequest, reply: FastifyReply) {
    try {
      // 1. Pegamos o ID e Empresa diretamente do Token decodificado pelo Fastify
      const { id, empresa_id } = request.user as { id: string; empresa_id: string };
      const data = request.body as UpdateUserDTO;

      // 2. Chamamos o mesmo Service de atualização, mas com os dados do Token
      const atualizado = await ProfileService.atualizar(id, empresa_id, data);

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
    const { empresa_id } = request.user as { empresa_id: string };
    const data = request.body as UpdateUserDTO;

    const atualizado = await ProfileService.atualizar(id, empresa_id, data);

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
    const { empresa_id } = request.user as { empresa_id: string };

    await ProfileService.excluir(id, empresa_id);

    return reply.status(204).send(); // Sucesso sem conteúdo
  }
}