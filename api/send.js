export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
        const { matricula, nombre, telefono, trabajos, pdfBase64 } = req.body;

        // Configuración directa y segura sin librerías externas
        const apiKeyResend = "re_Sqrbgowq_3YSScdKZD34ZpwNKHzsU1ooE";
        const emailDestino = "jsghomejsg@gmail.com";

        const respuestaResend = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKeyResend}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'RecepcionPro <onboarding@resend.dev>',
                to: [emailDestino],
                subject: `🚨 NUEVA RECEPCIÓN: ${matricula.toUpperCase()}`,
                html: `
                    <h2>Nueva Orden de Trabajo Registrada</h2>
                    <p><strong>Cliente:</strong> ${nombre}</p>
                    <p><strong>Teléfono:</strong> ${telefono}</p>
                    <p><strong>Matrícula:</strong> ${matricula.toUpperCase()}</p>
                    <p>El PDF oficial firmado se adjunta en este correo de forma segura.</p>
                `,
                attachments: [{
                    filename: `ORDEN_${matricula.toUpperCase()}.pdf`,
                    content: pdfBase64
                }]
            })
        });

        if (respuestaResend.ok) {
            return res.status(200).json({ success: true });
        } else {
            const errorData = await respuestaResend.json();
            return res.status(500).json({ success: false, error: errorData.message });
        }

    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
