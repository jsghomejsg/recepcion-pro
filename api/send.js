export default async function handler(req, res) {
    // 1. Filtro de seguridad: Solo aceptamos peticiones POST desde tu app
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
        const { matricula, kilometros, nombre, telefono, email, trabajos, notas, pdfBase64 } = req.body;

        // ==========================================
        // 🔑 CONFIGURACIÓN DE TU PRIMER TALLER
        // ==========================================
        const RESEND_API_KEY = "re_TuLlaveSecretaDeResendAquí"; // Reemplaza esto por tu clave de Resend.com
        const EMAIL_TALLER = "correo-del-dueño-del-taller@gmail.com"; // El correo donde el mecánico recibe las copias
        // ==========================================

        // Preparamos la lista de destinatarios (Al taller siempre, al cliente solo si tiene email)
        const destinatarios = [EMAIL_TALLER];
        if (email && email.trim() !== "") {
            destinatarios.push(email.trim());
        }

        // 2. Disparar el correo con el PDF usando la API de Resend
        const respuestaResend = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'Recepcion Digital <onboarding@resend.dev>', // Cuando compres dominio, aquí irá tu web
                to: destinatarios,
                subject: `📋 ORDEN DE REPARACIÓN - ${matricula.toUpperCase()}`,
                html: `
                    <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 12px; background-color: #ffffff;">
                        <h2 style="color: #1e3a8a; text-align: center; margin-bottom: 20px;">RECEPCIÓN DIGITAL</h2>
                        <p>Hola,</p>
                        <p>Se ha generado correctamente una nueva orden de servicio para el vehículo con matrícula <strong style="font-size: 16px; color: #1e3a8a;">${matricula.toUpperCase()}</strong>.</p>
                        
                        <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
                            <h3 style="margin-top: 0; color: #334155; font-size: 14px;">RESUMEN DEL REGISTRO:</h3>
                            <p style="margin: 5px 0;"><strong>Cliente:</strong> ${nombre}</p>
                            <p style="margin: 5px 0;"><strong>Teléfono:</strong> ${telefono}</p>
                            <p style="margin: 5px 0;"><strong>Kilómetros:</strong> ${kilometros || 'No indicados'} km</p>
                            <p style="margin: 5px 0;"><strong>Trabajos:</strong> ${trabajos || 'Revisión general'}</p>
                        </div>
                        
                        <p>Adjunto a este correo encontrarás el **documento PDF oficial firmado** con el estado visual del coche en el momento de la entrega y la autorización de los trabajos.</p>
                        <p style="color: #64748b; font-size: 12px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center;">Este es un justificante legal automatizado.</p>
                    </div>
                `,
                attachments: [
                    {
                        filename: `Orden_${matricula.toUpperCase()}.pdf`,
                        content: pdfBase64 // Aquí va el PDF triturado en texto que generó el móvil
                    }
                ]
            })
        });

        const resultado = await respuestaResend.json();

        if (respuestaResend.ok) {
            return res.status(200).json({ success: true, message: 'Registro enviado con éxito' });
        } else {
            return res.status(500).json({ error: resultado.message || 'Error en el proveedor de correo' });
        }

    } catch (error) {
        return res.status(500).json({ error: 'Error interno en el búnker: ' + error.message });
    }
}