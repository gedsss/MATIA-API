import nodemailer from 'nodemailer';

export class MailService {
    // Configuração do transportador usando as variáveis do .env
    private static transporter = nodemailer.createTransport({
        host: process.env.MAIL_HOST,
        port: Number(process.env.MAIL_PORT),
        secure: false, // false para porta 587 (TLS)
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS,
        },
    });

    /**
     * Envia o e-mail com o link de recuperação
     */
    static async sendPasswordResetEmail(to: string, token: string) {
        // Link que o usuário clicará no Angular (ajuste a URL da sua VPS depois)
        const resetLink = `http://localhost:4200/reset-password?token=${token}`;

        const mailOptions = {
            from: `"Equipe MATIA" <${process.env.MAIL_USER}>`,
            to,
            subject: 'Recuperação de Senha - MATIA',
            html: `
                <div style="font-family: sans-serif; max-width: 600px;">
                    <h2>Olá!</h2>
                    <p>Você solicitou a recuperação de senha para sua conta no sistema MATIA.</p>
                    <p>Clique no botão abaixo para escolher uma nova senha. <b>Este link é válido por apenas 1 hora.</b></p>
                    <a href="${resetLink}" 
                       style="background-color: #4CAF50; color: white; padding: 14px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
                       Redefinir Minha Senha
                    </a>
                    <p>Se você não solicitou isso, ignore este e-mail.</p>
                    <hr>
                    <small>Este é um e-mail automático, por favor não responda.</small>
                </div>
            `,
        };

        return await this.transporter.sendMail(mailOptions);
    }
}