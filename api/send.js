import nodemailer from 'nodemailer';

export default async function handler(req, res) {
    // Habilitar CORS para que la app web pueda hablar con la API sin bloqueos
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

        // Configuración directa de Gmail
        const transcriptor = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'noreply.recepcionpro@gmail.com',
                pass: 'fhihqoebcalsrqfr'
            }
        });

        const correoDestino = (emailCliente && emailCliente.trim() !== "") ? emailCliente.trim() : "jsghomejsg@gmail.com";

        const opcionesCorreo = {
            from: `"Resguardo ${taller.nombre}" <noreply.recepcionpro@gmail.com>`,
            to: correoDestino,
            subject: `📄 Su Resguardo de Recepción - ${taller.nombre} (Matrícula: ${matricula.toUpperCase()})`,
            html: `
                <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2>${taller.nombre}</h2>
                    <p>Estimado/a cliente, le adjuntamos el resguardo de depósito de su vehículo.</p>
                    <p><strong>🚗 Matrícula:</strong> ${matricula.toUpperCase()}</p>
                    <p><strong>👤 Cliente:</strong> ${nombre}</p>
                    <p><strong>🛠️ Trabajos:</strong> ${trabajos || 'Revisión General'}</p>
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
        return res.status(500).json({ success: false, error: error.message });
    }
}
