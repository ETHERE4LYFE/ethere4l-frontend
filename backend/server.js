// =========================================================
// SERVER.JS - ETHERE4L BACKEND (RAILWAY PRODUCTION READY)
// =========================================================

require('dotenv').config();

// 1. IMPORTACIONES CRÍTICAS (Faltaban fs y path)
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3'); // Importar aquí, no dentro del try
const { Resend } = require('resend');
const { buildPDF } = require('./utils/pdfGenerator');
const { getEmailTemplate, getPaymentConfirmedEmail } = require('./utils/emailTemplates');

// ===============================
// DATABASE SETUP (SINGLE SOURCE OF TRUTH)
// ===============================

// Detección automática del Volumen de Railway
const RAILWAY_VOLUME = '/app/data';
const isRailway = fs.existsSync(RAILWAY_VOLUME);

// Si estamos en Railway, usamos el volumen. Si es local, usamos ./data
const DATA_DIR = isRailway ? RAILWAY_VOLUME : path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'orders.db');

console.log(`📂 Directorio de datos: ${DATA_DIR}`);
console.log(`🔌 Conectando DB en: ${DB_PATH}`);

// Asegurar que el directorio existe antes de conectar
if (!fs.existsSync(DATA_DIR)) {
    console.log('creating directory...');
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

let db;
let dbPersistent = false; // Flag global para saber si guardamos datos

try {
    // Intentar conexión
    db = new Database(DB_PATH, { verbose: console.log });
    
    // OPTIMIZACIÓN: Write-Ahead Logging para concurrencia
    db.pragma('journal_mode = WAL'); 
    
    // Crear tabla
    db.exec(`
        CREATE TABLE IF NOT EXISTS pedidos (
            id TEXT PRIMARY KEY,
            email TEXT,
            data TEXT,
            status TEXT DEFAULT 'PENDIENTE',
            payment_ref TEXT,
            confirmed_by TEXT,
            paid_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    console.log('✅ DB Conectada exitosamente y tablas verificadas.');
    dbPersistent = true;

} catch (error) {
    console.error('❌ FATAL: Error iniciando DB. Activando SAFE MODE (Mock).', error);
    
    // MOCK DB: Para que el servidor no se caiga, pero no guarda nada
    db = {
        prepare: () => ({ run: () => {}, get: () => null, all: () => [] }),
        exec: () => {}
    };
    dbPersistent = false;
}

// ===============================
// APP CONFIG & ENV
// ===============================
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL; // Si no hay admin, no enviamos copia
const SENDER_EMAIL = 'onboarding@resend.dev'; // CAMBIAR cuando verifiques dominio

const resend = new Resend(RESEND_API_KEY);

// ===============================
// ENDPOINTS
// ===============================

// HEALTH CHECK
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        service: 'ETHERE4L Backend',
        persistence: dbPersistent ? 'ACTIVE (Volume Mounted)' : 'SAFE MODE (No Persistence)',
        path: DB_PATH
    });
});

// CREAR PEDIDO
app.post('/api/crear-pedido', (req, res) => {
    const { cliente, pedido } = req.body;

    if (!cliente || !pedido || !cliente.email) {
        return res.status(400).json({ success: false, message: 'Datos incompletos' });
    }

    const jobId = `ORD-${Date.now().toString().slice(-6)}`;

    // Respuesta rápida al frontend
    res.json({ success: true, jobId, message: 'Procesando pedido' });

    // Procesamiento en Background
    setImmediate(() => {
        processBackgroundOrder(jobId, cliente, pedido)
            .catch(err => console.error(`❌ [JOB ${jobId}] Error:`, err));
    });
});

// CONFIRMAR PAGO
app.post("/api/confirmar-pago", (req, res) => {
    const { jobId, paymentRef, confirmedBy } = req.body;

    // Validación básica
    if (!jobId) return res.status(400).json({ error: "Falta jobId" });

    // Respuesta inmediata
    res.json({ ok: true, message: "Procesando confirmación" });

    // Proceso asíncrono
    setImmediate(async () => {
        try {
            if (!dbPersistent) {
                console.warn(`⚠️ [${jobId}] DB en Safe Mode. No se guardará el pago.`);
                return;
            }

            console.log(`💳 Confirmando pago para ${jobId}...`);

            // 1. Actualizar DB
            const info = db.prepare(`
                UPDATE pedidos
                SET status = 'PAGADO',
                    paid_at = datetime('now'),
                    payment_ref = ?,
                    confirmed_by = ?
                WHERE id = ?
            `).run(paymentRef || 'MANUAL', confirmedBy || 'system', jobId);

            if (info.changes === 0) {
                console.error(`❌ Pedido ${jobId} no encontrado en DB.`);
                return;
            }

            // 2. Obtener datos actualizados para el email
            const row = db.prepare("SELECT * FROM pedidos WHERE id = ?").get(jobId);
            const { cliente, pedido } = JSON.parse(row.data);

            // 3. Enviar Email al Cliente
            await resend.emails.send({
                from: `ETHERE4L <${SENDER_EMAIL}>`,
                to: [cliente.email],
                subject: `PAGO CONFIRMADO – Orden ${jobId}`,
                html: getPaymentConfirmedEmail(cliente, pedido, jobId)
            });
            console.log(`📧 Email pago enviado a ${cliente.email}`);

            // 4. Aviso al Admin (Opcional)
            if (ADMIN_EMAIL) {
                await resend.emails.send({
                    from: `ETHERE4L System <${SENDER_EMAIL}>`,
                    to: [ADMIN_EMAIL],
                    subject: `💰 PAGO RECIBIDO: ${jobId}`,
                    html: `<p>El pedido <strong>${jobId}</strong> ha sido pagado. Ref: ${paymentRef}</p>`
                });
            }

        } catch (err) {
            console.error(`❌ Error en confirmación de pago [${jobId}]:`, err);
        }
    });
});

// ===============================
// BACKGROUND WORKER
// ===============================
async function processBackgroundOrder(jobId, cliente, pedido) {
    console.log(`⚙️ Worker: Creando pedido ${jobId}`);

    // 1. Guardar en DB
    if (dbPersistent) {
        try {
            db.prepare(`
                INSERT INTO pedidos (id, email, data, status)
                VALUES (?, ?, ?, 'PENDIENTE')
            `).run(jobId, cliente.email, JSON.stringify({ cliente, pedido }));
            console.log(`💾 Pedido ${jobId} guardado en SQLite.`);
        } catch (err) {
            console.error('⚠️ Error SQL INSERT:', err.message);
        }
    } else {
        console.warn('⚠️ SAFE MODE: El pedido NO se guardó en disco.');
    }

    // 2. Generar PDFs
    try {
        const pdfCliente = await buildPDF(cliente, pedido, jobId, 'CLIENTE');
        const pdfProveedor = await buildPDF(cliente, pedido, jobId, 'PROVEEDOR');

        // 3. Enviar Emails Iniciales
        if (RESEND_API_KEY) {
            // Cliente
            await resend.emails.send({
                from: `ETHERE4L <${SENDER_EMAIL}>`,
                to: [cliente.email],
                subject: `Confirmación de Orden ${jobId}`,
                html: getEmailTemplate(cliente, pedido, jobId, false),
                attachments: [{ filename: `Orden_${jobId}.pdf`, content: pdfCliente }]
            });

            // Proveedor / Admin
            if (ADMIN_EMAIL) {
                await resend.emails.send({
                    from: `ETHERE4L System <${SENDER_EMAIL}>`,
                    to: [ADMIN_EMAIL],
                    subject: `📦 NUEVA ORDEN ${jobId} (DROPSHIPPING)`,
                    html: getEmailTemplate(cliente, pedido, jobId, true),
                    attachments: [{ filename: `PO_${jobId}.pdf`, content: pdfProveedor }]
                });
            }
            console.log(`✉️ Correos de orden enviados para ${jobId}`);
        }
    } catch (err) {
        console.error('❌ Error generando PDFs o enviando emails:', err);
    }
}

// START
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server listo en puerto ${PORT}`);
    console.log(`💾 Persistencia: ${dbPersistent ? 'ACTIVADA ✅' : 'DESACTIVADA ⚠️'}`);
});