export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    // 🎛️ TU PANEL DE CONTROL: Aquí das de alta o de baja los talleres (true = activo, false = cortado)
    const TALLERES_AUTORIZADOS = {
        "demo": { 
            nombre: "RECEPCIÓN PREMIUM (DEMO)", 
            email: "jsghomejsg@gmail.com", 
            activo: true 
        },
        "pepe": { 
            nombre: "TALLERES PEPE", 
            email: "tallerespepe@gmail.com", 
            activo: true 
        },
        "cordoba": { 
            nombre: "AUTOMOCIÓN CÓRDOBA", 
            email: "cordoba@gmail.com", 
            activo: false // 🛑 Si este taller no te paga, pones false y se le corta el grifo al instante
        }
    };

    try {
        const { matricula, nombre, telefono, emailCliente, trabajos, pdfBase64, idTaller } = req.body;

        // Comprobamos si el taller existe y está activo en tu lista
        const taller = TALLERES_AUTORIZADOS[idTaller || "demo"];
        
        if (!taller || !taller.activo) {
            return res.status(403).json({ success: false, error: "Licencia no activa. Contacte con el administrador." });
        }

        const apiKeyResend = "re_Sqrbgowq_3YSScdKZD34ZpwNKHzsU1ooE";

        // 1. CORREO PARA EL TALLER (Le llega al dueño del taller configurado)
        await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKeyResend}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                from: 'RecepcionPro <onboarding@resend.dev>',
                to: [taller.email],
                subject: `🚨 [${taller.nombre}] NUEVA RECEPCIÓN: ${matricula.toUpperCase()}`,
                html: `
                    <h2>Nueva Orden de Trabajo Registrada - ${taller.nombre}</h2>
                    <p><strong>Cliente:</strong> ${nombre}</p>
                    <p><strong>Teléfono:</strong> ${telefono}</p>
                    <p><strong>Matrícula:</strong> ${matricula.toUpperCase()}</p>
                    <p>El PDF oficial firmado se adjunta en este correo de forma segura.</p>
                `,
                attachments: [{ filename: `ORDEN_${matricula.toUpperCase()}.pdf`, content: pdfBase64 }]
            })
        });

        // 2. CORREO REAL PARA EL CLIENTE (El que meta el mecánico en la pantalla)
        if (emailCliente && emailCliente.trim() !== "") {
            await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${apiKeyResend}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    from: 'RecepcionPro <onboarding@resend.dev>',
                    to: [emailCliente.trim()],
                    subject: `📄 Copia de su Orden de Recepción - ${taller.nombre}`,
                    html: `
                        <h2>Resguardo de Recepción de Vehículo</h2>
                        <p>Estimado/a <strong>${nombre}</strong>,</p>
                        <p>Le informamos que su vehículo con matrícula <strong>${matricula.toUpperCase()}</strong> ha sido registrado correctamente en <strong>${taller.nombre}</strong>.</p>
                        <p>Adjunto encontrará el documento PDF oficial firmado con el estado de recepción y la conformidad legal.</p>
                        <br>
                        <p><em>Gracias por su confianza.</em></p>
                    `,
                    attachments: [{ filename: `Copia_Orden_${matricula.toUpperCase()}.pdf`, content: pdfBase65 = pdfBase64 }]
                })
            });
        }

        return res.status(200).json({ success: true });

    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
