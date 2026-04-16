import type { FastifyRequest, FastifyReply } from 'fastify';
import { CompanyService } from '../services/CompanyService.js';
import type {CreateCompanyDTO, UpdateCompanyDTO} from '../dtos/CompanyDTO.js';
import type { CreateUserDTO } from '../dtos/UserDTO.js';

export class CompanyController {

   // 🚀 REGISTRO COMPLETO (Empresa + Admin)
    //Este é o endpoint que o seu formulário de "Cadastro de Sistema" vai chamar.
  static async registrar(request: FastifyRequest, reply: FastifyReply) {
    // Esperamos um corpo que contenha os dados da empresa e do admin separadamente
    const { company, admin } = request.body as {
      company: CreateCompanyDTO,
      admin: CreateUserDTO
    };

    // Chamamos o Service que já cuida da Transação (Atomicidade)
    const result = await CompanyService.registrarNovaEmpresa(company, admin);

    return reply.status(201).send({
      success: true,
      message: 'Empresa e Administrador registrados com sucesso!',
      data: result
    });
  }


   // 🔍 LISTAR TODAS
  static async listar(request: FastifyRequest, reply: FastifyReply) {
    const empresas = await CompanyService.listarTodas();
    return reply.send({ success: true, data: empresas });
  }


   // 🔍 BUSCAR POR ID
  static async buscar(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const empresa = await CompanyService.buscarPorId(id);
    return reply.send({ success: true, data: empresa });
  }


    //📝 ATUALIZAR
  static async atualizar(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };
    const data = request.body as UpdateCompanyDTO;

    const atualizada = await CompanyService.atualizar(id, data);
    return reply.send({
      success: true,
      message: 'Dados da empresa atualizados.',
      data: atualizada
    });
  }


   //🗑️ EXCLUIR (Com Cascade)
  static async excluir(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as { id: string };

    await CompanyService.excluir(id);

    return reply.status(204).send();
  }
}