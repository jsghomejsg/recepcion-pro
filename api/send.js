export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    // 🎛️ TU PANEL DE CONTROL: Aquí controlas quién está activo (true) o cortado (false)
    const TALLERES_AUTORIZADOS = {
        "demo": { nombre: "RECEPCIÓN PREMIUM (DEMO)", activo: true },
        "julio": { nombre: "TALLERES JULIO", activo: true },
        "pepe": { nombre: "TALLERES PEPE", activo: true }
    };

    try {
        const { matricula, nombre, telefono, emailCliente, trabajos, pdfBase64, idTaller } = req.body;

        // Comprobamos si el taller existe y paga
        const taller = TALLERES_AUTORIZADOS[idTaller || "demo"];
        
        if (!taller || !taller.activo) {
            return res.status(403).json({ success: false, error: "Licencia caducada o no activa. Contacte con el administrador." });
        }

        const apiKeyResend = "re_Sqrbgowq_3YSScdKZD34ZpwNKHzsU1ooE";

        // 🚀 ENVÍO DIRECTO: Se envía el PDF ÚNICAMENTE a la dirección que se escriba en la casilla de la app
        const correoDestino = (emailCliente && emailCliente.trim() !== "") ? emailCliente.trim() : "jsghomejsg@gmail.com";

        const respuestaResend = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKeyResend}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'RecepcionPro <onboarding@resend.dev>',
                to: [correoDestino], // 🎯 Va directo al correo que rellene el comercial en la pantalla
                subject: `🚨 [${taller.nombre}] NUEVA RECEPCIÓN: ${matricula.toUpperCase()}`,
                html: `
                    <h2>Resguardo de Recepción de Vehículo - ${taller.nombre}</h2>
                    <p>Estimado/a,</p>
                    <p>Le informamos que el vehículo con matrícula <strong>${matricula.toUpperCase()}</strong> ha sido registrado correctamente en <strong>${taller.nombre}</strong>.</p>
                    <p><strong>Cliente:</strong> ${nombre}</p>
                    <p><strong>Teléfono:</strong> ${telefono}</p>
                    <p><strong>Trabajos:</strong> ${trabajos || 'Revisión General'}</p>
                    <br>
                    <p>Adjunto encontrará el documento PDF oficial firmado con la conformidad legal.</p>
                    <br>
                    <p><em>Gracias por su confianza.</em></p>
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
