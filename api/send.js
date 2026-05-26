export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    // 🎛️ TU PANEL DE CONTROL TOTAL:
    // Aquí controlas quién paga. Si un taller te debe dinero, cambias su 'activo' a false y la app se le bloquea.
    const TALLERES_AUTORIZADOS = {
        "demo": { 
            nombre: "RECEPCIÓN PREMIUM (DEMO)", 
            emailAvisoTaller: "jsghomejsg@gmail.com", 
            activo: true 
        },
        "julio": { 
            nombre: "TALLERES JULIO", 
            emailAvisoTaller: "juliosangu3@gmail.com", // Al taller le llega su copia aquí
            activo: true                               // 🟢 ACTIVO. Si pones false, se apaga su app.
        },
        "pepe": { 
            nombre: "TALLERES PEPE", 
            emailAvisoTaller: "jsghomejsg@gmail.com", 
            activo: true 
        }
    };

    try {
        const { matricula, nombre, telefono, emailCliente, trabajos, pdfBase64, idTaller } = req.body;

        // Validamos si el taller que está usando la app existe y paga
        const taller = TALLERES_AUTORIZADOS[idTaller || "demo"];
        
        if (!taller || !taller.activo) {
            return res.status(403).json({ success: false, error: "Licencia caducada o no activa. Contacte con el administrador." });
        }

        const apiKeyResend = "re_Sqrbgowq_3YSScdKZD34ZpwNKHzsU1ooE";

        // 1. CORREO PARA EL TALLER (Aviso interno con el PDF firmado)
        await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKeyResend}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                from: 'RecepcionPro <onboarding@resend.dev>',
                to: [taller.emailAvisoTaller],
                subject: `🚨 [${taller.nombre}] NUEVA RECEPCIÓN: ${matricula.toUpperCase()}`,
                html: `
                    <h2>Nueva Orden de Trabajo Registrada - ${taller.nombre}</h2>
                    <p><strong>Cliente:</strong> ${nombre}</p>
                    <p><strong>Teléfono:</strong> ${telefono}</p>
                    <p><strong>Matrícula:</strong> ${matricula.toUpperCase()}</p>
                    <p><strong>Trabajos:</strong> ${trabajos || 'Revisión General'}</p>
                    <br>
                    <p>El PDF oficial firmado se adjunta en este correo de forma segura.</p>
                `,
                attachments: [{ filename: `ORDEN_${matricula.toUpperCase()}.pdf`, content: pdfBase64 }]
            })
        });

        // 2. CORREO REAL DE CARA AL CLIENTE (El que meta el comercial/mecánico en la pantalla)
        // Usamos el remitente autorizado de Resend para saltarnos el candado, pero el cliente verá el nombre del taller
        if (emailCliente && emailCliente.trim() !== "") {
            await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${apiKeyResend}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    from: `${taller.nombre} <onboarding@resend.dev>`, // 🎯 Aquí se personaliza el nombre que ve el cliente
                    to: [emailCliente.trim()], // 🚀 Viaja directo a la bandeja de entrada real del cliente
                    subject: `📄 Su Resguardo de Recepción - ${taller.nombre}`,
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
