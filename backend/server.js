// ===============================
// ETHERE4L BACKEND – RAILWAY SAFE (FINAL VERSION)
// ===============================

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const express = require('express');
const cors = require('cors');
// Importamos módulos nuevos
const { Resend } = require('resend');
const Database = require('better-sqlite3');
// Importamos tus utilidades creadas
const { buildPDF } = require('./utils/pdfGenerator');
const { getEmailTemplate } = require('./utils/emailTemplates');

// --- DB ---
const db = new Database('orders.db');

db.prepare(`
CREATE TABLE IF NOT EXISTS pedidos (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    data TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
`).run();

// --- APP ---
const app = express();
let portToUse = process.env.PORT || 3000;

// --- RESEND CONFIG ---
let resend = null;
if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim() !== '') {
    resend = new Resend(process.env.RESEND_API_KEY.trim());
    console.log('✅ Resend activo');
} else {
    console.warn('⚠️ RESEND_API_KEY no configurado');
}

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.json({ status: 'ok', service: 'ETHERE4L backend' }));

// --- API: CREAR PEDIDO ---
app.post('/api/crear-pedido', (req, res) => {
    const { cliente, pedido } = req.body;

    // Validación estricta antes de procesar
    if (!cliente || !cliente.email || !pedido) {
        return res.status(400).json({ success: false, message: 'Faltan datos o email' });
    }

    const jobId = `JOB-${Date.now()}`;

    // Responder rápido al frontend
    res.json({ success: true, jobId });

    // Procesar en segundo plano
    setImmediate(() => {
        runBackgroundTask(jobId, cliente, pedido)
            .catch(err => console.error(`❌ Error en Job ${jobId}:`, err));
    });
});

// --- FUNCIÓN DE REINTENTO ---
async function sendEmailWithRetry(payload, retries = 3) {
    try {
        if (!resend) throw new Error("Resend no inicializado");
        return await resend.emails.send(payload);
    } catch (error) {
        if (retries > 0) {
            console.log(`⚠️ Reintentando email... intentos restantes: ${retries}`);
            await new Promise(r => setTimeout(r, 1500));
            return sendEmailWithRetry(payload, retries - 1);
        }
        throw error;
    }
}

// --- WORKER DE FONDO ---
async function runBackgroundTask(jobId, cliente, pedido) {
    console.log(`⚙️ Procesando pedido ${jobId} para ${cliente.email}`);
    
    // 1. Generar PDF (Usando tu nuevo módulo utils)
    const pdfBuffer = await buildPDF(cliente, pedido, jobId);

    // 2. Guardar en DB
    db.prepare('INSERT INTO pedidos (id, email, data) VALUES (?, ?, ?)')
      .run(jobId, cliente.email, JSON.stringify({ cliente, pedido }));

    // 3. Enviar Emails
    const from = 'ETHERE4L <orders@ethere4l.com>';

    if (resend) {
        // Al Cliente
        await sendEmailWithRetry({
            from,
            to: [cliente.email],
            subject: '🛍️ Confirmación de Orden - ETHERE4L',
            html: getEmailTemplate(cliente, pedido, jobId, false),
            attachments: [{ filename: `Orden_${jobId}.pdf`, content: pdfBuffer }]
        });

        // Al Admin (si existe)
        if (process.env.ADMIN_EMAIL) {
            await sendEmailWithRetry({
                from,
                to: [process.env.ADMIN_EMAIL],
                subject: `🚨 Nueva Venta ${jobId}`,
                html: getEmailTemplate(cliente, pedido, jobId, true),
                attachments: [{ filename: `Orden_${jobId}.pdf`, content: pdfBuffer }]
            });
        }
        console.log(`✅ Emails enviados correctamente para ${jobId}`);
    }
}

app.listen(portToUse, '0.0.0.0', () => console.log(`🟢 Server en puerto ${portToUse}`));