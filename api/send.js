import { Resend } from 'resend';

// CONFIGURACIÓN INICIAL
const RESEND_API_KEY = "re_Sqrbgowq_3YSScdKZD34ZpwNKHzsU1ooE";
const EMAIL_TALLER = "jsghomejsg@gmail.com"; 

const resend = new Resend(RESEND_API_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
        const { matricula, kilometros, nombre, telefono, email, trabajos, notas, pdfBase64 } = req.body;

        // 1. CORREO PARA EL TALLER (Notificación interna)
        const correoTaller = await resend.emails.send({
            from: 'RecepcionPro <onboarding@resend.dev>',
            to: [EMAIL_TALLER],
            subject: `🚨 NUEVA RECEPCIÓN: ${matricula.toUpperCase()}`,
            html: `
                <h2>Nueva Orden de Trabajo Registrada</h2>
                <p><strong>Cliente:</strong> ${nombre}</p>
                <p><strong>Teléfono:</strong> ${telefono}</p>
                <p><strong>Matrícula:</strong> ${matricula.toUpperCase()}</p>
                <p><strong>Kilómetros:</strong> ${kilometros || 'No indicados'} km</p>
                <p><strong>Trabajos:</strong> ${trabajos || 'Ninguno seleccionado'}</p>
                <p><strong>Notas:</strong> ${notas || 'Sin notas adicionales'}</p>
                <br>
                <p>El PDF oficial firmado por el cliente se adjunta en este correo.</p>
            `,
            attachments: [
                {
                    filename: `ORDEN_${matricula.toUpperCase()}.pdf`,
                    content: pdfBase64,
                },
            ],
        });

        // 2. CORREO PARA EL CLIENTE (Redirigido a ti para la demo)
        const correoCliente = await resend.emails.send({
            from: 'RecepcionPro <onboarding@resend.dev>',
            to: [EMAIL_TALLER],
            subject: `📄 Copia de su Orden de Recepción - Matrícula ${matricula.toUpperCase()}`,
            html: `
                <p>Estimado/a <strong>${nombre}</strong>,</p>
                <p>Le informamos que su vehículo con matrícula <strong>${matricula.toUpperCase()}</strong> ha sido recepcionado correctamente en nuestras instalaciones.</p>
                <p>Adjunto a este correo encontrará el documento PDF con la copia de los trabajos solicitados, el estado visual del vehículo y la cláusula legal firmada de conformidad.</p>
                <br>
                <p>Gracias por confiar en nosotros.</p>
            `,
            attachments: [
                {
                    filename: `Copia_Orden_${matricula.toUpperCase()}.pdf`,
                    content: pdfBase64,
                },
            ],
        });

        return res.status(200).json({ success: true, info: { taller: correoTaller, cliente: correoCliente } });

    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
