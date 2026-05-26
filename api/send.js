export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
        const { matricula, nombre, telefono, emailCliente, trabajos, pdfBase64 } = req.body;

        const apiKeyResend = "re_Sqrbgowq_3YSScdKZD34ZpwNKHzsU1ooE";
        const emailTaller = "jsghomejsg@gmail.com";

        // Preparamos la lista de destinatarios. El taller va SIEMPRE.
        const listaDestinatarios = [emailTaller];

        // Si el cliente tiene un email válido rellenado, lo sumamos a la lista
        if (emailCliente && emailCliente.trim() !== "") {
            listaDestinatarios.push(emailCliente.trim());
        }

        const respuestaResend = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKeyResend}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'RecepcionPro <onboarding@resend.dev>',
                to: listaDestinatarios,
                subject: `🚨 ORDEN DE RECEPCIÓN: ${matricula.toUpperCase()}`,
                html: `
                    <h2>Resguardo de Recepción de Vehículo</h2>
                    <p>Hola <strong>${nombre}</strong>,</p>
                    <p>Se ha registrado correctamente la entrada de su vehículo con matrícula <strong>${matricula.toUpperCase()}</strong> en nuestras instalaciones.</p>
                    <p><strong>Teléfono de contacto:</strong> ${telefono}</p>
                    <p><strong>Trabajos solicitados:</strong> ${trabajos || 'Revisión General'}</p>
                    <p>Adjunto a este correo encontrará el documento PDF firmado con el estado de recepción de su vehículo.</p>
                    <br>
                    <p><em>Gracias por confiar en nuestro taller.</em></p>
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
