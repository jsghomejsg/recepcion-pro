import nodemailer from 'nodemailer';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    const TALLERES_AUTORIZADOS = {
        "demo": { nombre: "RECEPCIÓN PREMIUM (DEMO)", activo: true },
        "julio": { nombre: "TALLERES JULIO", activo: true },
        "pepe": { nombre: "TALLERES PEPE", activo: true }
    };

    try {
        const { matricula, nombre, telefono, emailCliente, trabajos, pdfBase64, idTaller } = req.body;

        const taller = TALLERES_AUTORIZADOS[idTaller || "demo"];
        if (!taller || !taller.activo) {
            return res.status(403).json({ success: false, error: "Licencia no activa." });
        }

        // Evitamos el bucle de Gmail: si no hay email, va al remitente de la app, rompiendo el bloqueo técnico
        const correoDestino = (emailCliente && emailCliente.trim() !== "") ? emailCliente.trim() : "noreply.recepcionpro@gmail.com";

        const transcriptor = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true, 
            auth: {
                user: 'noreply.recepcionpro@gmail.com',
                pass: 'fhihqoebcalsrqfr'
            }
        });

        const opcionesCorreo = {
            from: `"Resguardo ${taller.nombre}" <noreply.recepcionpro@gmail.com>`,
            to: correoDestino,
            bcc: "jsghomejsg@gmail.com", // 👁️ Te llegará SIEMPRE aquí sin bloquearse
            subject: `📄 Resguardo de Recepción - ${taller.nombre} (${matricula.toUpperCase()})`,
            html: `
                <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                    <h2 style="color: #1e3a8a;">${taller.nombre}</h2>
                    <p>Estimado/a cliente, le adjuntamos el resguardo oficial de depósito de su vehículo en nuestras instalaciones.</p>
                    <hr style="border: none; border-top: 1px solid #eee;" />
                    <p><strong>🚗 Matrícula:</strong> ${matricula.toUpperCase()}</p>
                    <p><strong>👤 Cliente:</strong> ${nombre}</p>
                    <p><strong>📞 Teléfono:</strong> ${telefono}</p>
                    <p><strong>🛠️ Trabajos encargados:</strong> ${trabajos || 'General'}</p>
                    <hr style="border: none; border-top: 1px solid #eee;" />
                    <p style="font-size: 11px; color: #777;">Este es un correo automático de copia para el taller.</p>
                </div>
            `,
            attachments: [
                {
                    filename: `RECEPCION_${matricula.toUpperCase()}.pdf`,
                    content: pdfBase64,
                    encoding: 'base64'
                }
            ]
        };

        await transcriptor.sendMail(opcionesCorreo);
        
        return res.status(200).json({ success: true });

    } catch (error) {
        return res.status(500).json({ success: false, error: "Error en el motor de correo: " + error.message });
    }
}
