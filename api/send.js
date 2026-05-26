import { Resend } from 'resend';

const RESEND_API_KEY = "re_Sqrbgowq_3YSScdKZD34ZpwNKHzsU1ooE";
const EMAIL_TALLER = "jsghomejsg@gmail.com"; 

const resend = new Resend(RESEND_API_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
        const { matricula, nombre, telefono, trabajos, pdfBase64 } = req.body;

        const correoTaller = await resend.emails.send({
            from: 'RecepcionPro <onboarding@resend.dev>',
            to: [EMAIL_TALLER],
            subject: `🚨 NUEVA RECEPCIÓN: ${matricula.toUpperCase()}`,
            html: `
                <h2>Nueva Orden Registrada</h2>
                <p><strong>Cliente:</strong> ${nombre}</p>
                <p><strong>Matrícula:</strong> ${matricula.toUpperCase()}</p>
                <p>El PDF oficial firmado se adjunta en este correo.</p>
            `,
            attachments: [{
                filename: `ORDEN_${matricula.toUpperCase()}.pdf`,
                content: pdfBase64,
            }],
        });

        return res.status(200).json({ success: true, info: correoTaller });

    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
