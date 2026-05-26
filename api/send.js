export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    // 🎛️ TU PANEL DE CONTROL REAL (Aquí tienes la llave de paso de tus clientes)
    const TALLERES_AUTORIZADOS = {
        "julio": { 
            nombre: "TALLERES JULIO", 
            email: "juliosangu3@gmail.com", // 🎯 El correo de tu primer cliente real
            activo: true                    // 🟢 TRUE significa que paga y está activo. Si pones FALSE, se le corta el grifo
        }
    };

    try {
        const { matricula, nombre, telefono, emailCliente, trabajos, pdfBase64, idTaller } = req.body;

        // Buscamos si el taller que usa la app está dado de alta en tu lista anterior
        const taller = TALLERES_AUTORIZADOS[idTaller || "julio"];
        
        // Si no existe o has puesto "activo: false", la aplicación se bloquea sola
        if (!taller || !taller.activo) {
            return res.status(403).json({ success: false, error: "Licencia caducada. Contacte con el administrador." });
        }

        const apiKeyResend = "re_Sqrbgowq_3YSScdKZD34ZpwNKHzsU1ooE";

        // 1. CORREO DE AVISO PARA EL TALLER (Le llega a juliosangu3@gmail.com)
        await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKeyResend}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                from: 'RecepcionPro <onboarding@resend.dev>',
                to: [taller.email],
                subject: `🚨 [${taller.nombre}] NUEVA RECEPCIÓN: ${matricula.toUpperCase()}`,
                html: `
                    <h2>Nueva Orden de Trabajo Registrada</h2>
                    <p><strong>Taller:</strong> ${taller.nombre}</p>
                    <p><strong>Cliente:</strong> ${nombre}</p>
                    <p><strong>Teléfono:</strong> ${telefono}</p>
                    <p><strong>Matrícula:</strong> ${matricula.toUpperCase()}</p>
                    <br>
                    <p>El PDF oficial firmado por el cliente se encuentra adjunto.</p>
                `,
                attachments: [{ filename: `ORDEN_${matricula.toUpperCase()}.pdf`, content: pdfBase64 }]
            })
        });

        // 2. CORREO REAL PARA EL CLIENTE DEL TALLER (El correo que apunte el mecánico en la pantalla)
        if (emailCliente && emailCliente.trim() !== "") {
            await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${apiKeyResend}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    from: 'RecepcionPro <onboarding@resend.dev>',
                    to: [emailCliente.trim()], // Viaja directo a la bandeja del cliente final
                    subject: `📄 Copia de su Orden de Recepción - ${taller.nombre}`,
                    html: `
                        <h2>Resguardo de Recepción de Vehículo</h2>
                        <p>Estimado/a <strong>${nombre}</strong>,</p>
                        <p>Le informamos que su vehículo con matrícula <strong>${matricula.toUpperCase()}</strong> ha sido registrado correctamente en las instalaciones de <strong>${taller.nombre}</strong>.</p>
                        <p>Adjunto a este correo encontrará el documento PDF oficial firmado con el estado visual y la conformidad legal.</p>
                        <br>
                        <p><em>Gracias por confiar en nuestro taller.</em></p>
                    `,
                    attachments: [{ filename: `Copia_Orden_${matricula.toUpperCase()}.pdf`, content: pdfBase64 }]
                })
            });
        }

        return res.status(200).json({ success: true });

    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
