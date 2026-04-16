import bcrypt from 'bcryptjs';
import Profile from "./src/models/profile.js";
import sequelize from "./src/db.js";

async function seedSuperAdmin() {
    try {
        // 1. Garante que a conexão com o banco está ativa
        await sequelize.authenticate();
        console.log('✅ Conexão com o banco estabelecida.');

        const emailSuperAdmin = 'francisco.naifa@sou.ufmt.br';

        // 2. Verifica se o SUPER-ADMIN já existe para não duplicar
        const existe = await Profile.unscoped().findOne({ where: { email: emailSuperAdmin } });

        if (existe) {
            console.log('⚠️ SUPER-ADMIN já existe no banco. Cancelando a criação.');
            process.exit(0);
        }

        // 3. Criptografa a senha fortíssima (O salt '10' é o padrão de mercado)
        const senhaTextoPlano = '800210101';
        const senhaHash = await bcrypt.hash(senhaTextoPlano, 10);

        // 4. Injeta o usuário no banco
        await Profile.create({
            nome: 'Kvicha Super',
            email: emailSuperAdmin,
            cpf: '75484210594', // Coloque um CPF válido ou uma máscara se o banco exigir
            telefone: '00000000000',
            data_nascimento: new Date('2000-01-02'), // Data genérica
            profile_password: senhaHash,
            role: 'SUPER-ADMIN',
            empresa_id: null, // O segredo da onipresença!
            status: 'ativo',
            area_juridica: 'Todas',
        });

        console.log('🚀 SUPER-ADMIN criado com sucesso! O MATIA tem um novo mestre.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Erro ao criar o SUPER-ADMIN:', error);
        process.exit(1);
    }
}

seedSuperAdmin();