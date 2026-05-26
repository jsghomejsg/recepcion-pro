export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
        const { matricula, nombre, telefono, emailCliente, trabajos, pdfBase64 } = req.body;

        const apiKeyResend = "re_Sqrbgowq_3YSScdKZD34ZpwNKHzsU1ooE";
        const emailTaller = "jsghomejsg@gmail.com";

        // 1. ENVÍO PRINCIPAL AL TALLER
        const respuestaTaller = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKeyResend}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'RecepcionPro <onboarding@resend.dev>',
                to: [emailTaller],
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

        // 2. SIMULACIÓN PREMIUM PARA EL CLIENTE
        // Si el usuario rellenó el email del cliente, mandamos la copia formateada a tu correo 
        // para saltar el bloqueo de la cuenta gratuita y que puedas ver cómo le llegaría a él.
        if (emailCliente && emailCliente.trim() !== "") {
            await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKeyResend}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: 'RecepcionPro <onboarding@resend.dev>',
                    to: [emailTaller], // Redirigido a ti para la Demo
                    subject: `📄 Copia de su Orden de Recepción - ${matricula.toUpperCase()}`,
                    html: `
                        <h2>Resguardo de Recepción de Vehículo</h2>
                        <p>Estimado/a <strong>${nombre}</strong>,</p>
                        <p>Le informamos que su vehículo con matrícula <strong>${matricula.toUpperCase()}</strong> ha sido registrado correctamente en nuestras instalaciones.</p>
                        <p><strong>Trabajos solicitados:</strong> ${trabajos || 'Revisión General'}</p>
                        <p>Adjunto a este correo encontrará el documento PDF oficial firmado con el estado visual y la conformidad legal.</p>
                        <br>
                        <p><em>Gracias por confiar en nuestro taller.</em></p>
                    `,
                    attachments: [{
                        filename: `Copia_Orden_${matricula.toUpperCase()}.pdf`,
                        content: pdfBase64
                    }]
                })
            });
        }

        if (respuestaTaller.ok) {
            return res.status(200).json({ success: true });
        } else {
            const errorData = await respuestaTaller.json();
            return res.status(500).json({ success: false, error: errorData.message });
        }

    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
