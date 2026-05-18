import nodemailer from 'nodemailer';

export class MailService {
    // Configuração do transportador lendo SMTP_* do seu .env
    private static transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: true,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        tls: {
            rejectUnauthorized: false
        }
    });


     // Envia o e-mail com o link de recuperação
    static async sendPasswordResetEmail(to: string, token: string) {
        // Link que o usuário clicará no Angular
        const baseUrl = process.env.FRONTEND_URL;
        const resetLink = `${baseUrl}/reset-password?token=${token}`;

        const mailOptions = {
            // Usa o MAIL_FROM que você declarou no .env
            from: process.env.MAIL_FROM,
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