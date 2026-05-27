import nodemailer from 'nodemailer';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    // 🎛️ TU PANEL DE CONTROL: Controla qué talleres están activos (true) o bloqueados (false)
    const TALLERES_AUTORIZADOS = {
        "demo": { nombre: "RECEPCIÓN PREMIUM (DEMO)", activo: true },
        "julio": { nombre: "TALLERES JULIO", activo: true },
        "pepe": { nombre: "TALLERES PEPE", activo: true }
    };

    try {
        const { matricula, nombre, telefono, emailCliente, trabajos, pdfBase64, idTaller } = req.body;

        // Validamos si el taller que usa la app está activo
        const taller = TALLERES_AUTORIZADOS[idTaller || "demo"];
        if (!taller || !taller.activo) {
            return res.status(403).json({ success: false, error: "Licencia caducada o no activa. Contacte con el administrador." });
        }

        // 🔐 CONFIGURACIÓN DEL MOTOR GMAIL (Tu centralita automatizada)
        const transcriptor = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'noreply.recepcionpro@gmail.com',
                pass: 'fhihqoebcalsrqfr' // 🔑 Tu llave maestra de 16 letras sin espacios
            }
        });

        // Averiguamos a dónde enviar: si la casilla está vacía, te manda una copia a ti por seguridad
        const correoDestino = (emailCliente && emailCliente.trim() !== "") ? emailCliente.trim() : "jsghomejsg@gmail.com";

        // 📄 Preparamos el correo con el PDF adjunto
        const opcionesCorreo = {
            from: `"Resguardo ${taller.nombre}" <noreply.recepcionpro@gmail.com>`, // El cliente verá el nombre del taller en grande
            to: correoDestino, // Viaja directo al email que metas en la pantalla
            subject: `📄 Su Resguardo de Recepción - ${taller.nombre} (Matrícula: ${matricula.toUpperCase()})`,
            html: `
                <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 12px;">
                    <h2 style="color: #1e3a8a; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; text-transform: uppercase;">${taller.nombre}</h2>
                    <p>Estimado/a cliente,</p>
                    <p>Le informamos que su vehículo ha sido registrado correctamente en nuestras instalaciones para proceder con los trabajos solicitados.</p>
                    
                    <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 5px 0;"><strong>🚗 Matrícula:</strong> ${matricula.toUpperCase()}</p>
                        <p style="margin: 5px 0;"><strong>👤 Cliente:</strong> ${nombre}</p>
                        <p style="margin: 5px 0;"><strong>📞 Teléfono:</strong> ${telefono}</p>
                        <p style="margin: 5px 0;"><strong>🛠️ Trabajos:</strong> ${trabajos || 'Revisión General'}</p>
                    </div>

                    <p>Adjunto a este mensaje encontrará el documento oficial en formato PDF firmado digitalmente con el estado de recepción y la conformidad legal.</p>
                    <br>
                    <p style="font-size: 12px; color: #666; font-style: italic;">Gracias por confiar en nuestro taller. Este es un correo automático, por favor no responda a este mensaje.</p>
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

        // 🚀 Disparamos el correo
        await transcriptor.sendMail(opcionesCorreo);

        return res.status(200).json({ success: true });

    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}
