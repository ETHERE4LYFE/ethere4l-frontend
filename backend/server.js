// =========================================================
// SERVER.JS - ETHERE4L BACKEND (RAILWAY PRODUCTION)
// =========================================================

require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const { Resend } = require('resend');
const { buildPDF } = require('./utils/pdfGenerator');
const { getEmailTemplate } = require('./utils/emailTemplates');

// --- CONFIGURACIÓN DE ENTORNO ---
const PORT = process.env.PORT || 3000;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'orders@ethere4l.com'; // Fallback
const SENDER_EMAIL = 'orders@ethere4l.com';

// --- INICIALIZACIÓN DE BASE DE DATOS (SAFE MODE) ---
// Esto evita que Railway crashee si falla la compilación nativa
let db;
try {
    const Database = require('better-sqlite3');
    db = new Database('orders.db');
    // Crear tabla si no existe
    db.prepare(`
        CREATE TABLE IF NOT EXISTS pedidos (
            id TEXT PRIMARY KEY,
            email TEXT,
            data TEXT,
            status TEXT DEFAULT 'PENDIENTE',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `).run();
    console.log("✅ [DB] Base de datos SQLite cargada correctamente.");
} catch (err) {
    console.error("⚠️ [DB] Error cargando better-sqlite3. Iniciando en SAFE MODE (Sin persistencia).", err.message);
    // Mock DB para evitar crash
    db = {
        prepare: () => ({ run: () => {}, get: () => null }),
        exec: () => {}
    };
}

const dbPersistent =
    typeof db.prepare === 'function' &&
    db.prepare.toString().includes('better-sqlite3');


// --- CONFIGURACIÓN APP ---
const app = express();
app.use(cors());
app.use(express.json());

const resend = new Resend(RESEND_API_KEY);

// --- ENDPOINTS ---

app.get('/', (req, res) => {
    res.json({ status: 'online', service: 'ETHERE4L Backend', db_mode: db.name ? 'persistent' : 'safe_mode' });
});

app.post('/api/crear-pedido', (req, res) => {
    const { cliente, pedido } = req.body;

    if (!cliente || !pedido) {
        return res.status(400).json({ success: false, message: 'Datos incompletos' });
    }

    // 1. Generar ID único
    const jobId = `ORD-${Date.now().toString().slice(-6)}`;

    // 2. Responder INMEDIATAMENTE al frontend (UX)
    res.status(200).json({ success: true, jobId, message: 'Procesando pedido' });

    // 3. Ejecutar tarea en segundo plano (Fire & Forget)
    processBackgroundOrder(jobId, cliente, pedido).catch(err => {
        console.error(`❌ [JOB-FAIL] Error procesando pedido ${jobId}:`, err);
    });
});

// --- WORKER / BACKGROUND TASK ---
async function processBackgroundOrder(jobId, cliente, pedido) {
    console.log(`⚙️ [JOB-${jobId}] Iniciando procesamiento...`);

    try {
        // A. Guardar en Base de Datos
        try {
            const stmt = db.prepare('INSERT INTO pedidos (id, email, data, status) VALUES (?, ?, ?, ?)');
            stmt.run(jobId, cliente.email, JSON.stringify({ cliente, pedido }), 'PENDIENTE');
        } catch (dbErr) {
            console.error(`⚠️ [DB] No se pudo guardar el pedido ${jobId}`, dbErr.message);
        }

        // B. Generar PDFs (Dual: Cliente y Proveedor)
        console.log(`📄 [JOB-${jobId}] Generando PDFs...`);
        
        // PDF 1: Versión Cliente (Con precios, QR, pago)
        const pdfBufferCliente = await buildPDF(cliente, pedido, jobId, 'CLIENTE');
        
        // PDF 2: Versión Proveedor (Sin precios, Purchase Order)
        const pdfBufferProveedor = await buildPDF(cliente, pedido, jobId, 'PROVEEDOR');

        // C. Enviar Emails vía Resend
        console.log(`📧 [JOB-${jobId}] Enviando correos...`);

        // Email 1: Al Cliente
        await resend.emails.send({
            from: `ETHERE4L <${SENDER_EMAIL}>`,
            to: [cliente.email],
            subject: `Confirmación de Orden #${jobId} - ETHERE4L`,
            html: getEmailTemplate(cliente, pedido, jobId, false),
            attachments: [{ filename: `Orden_${jobId}.pdf`, content: pdfBufferCliente }]
        });

        // Email 2: Al Admin / Proveedor
        if (ADMIN_EMAIL) {
            await resend.emails.send({
                from: `ETHERE4L System <${SENDER_EMAIL}>`,
                to: [ADMIN_EMAIL],
                subject: `🚨 NUEVA VENTA: #${jobId} (Dropshipping)`,
                html: getEmailTemplate(cliente, pedido, jobId, true),
                attachments: [{ filename: `PO_${jobId}_Proveedor.pdf`, content: pdfBufferProveedor }]
            });
        }

        console.log(`✅ [JOB-${jobId}] Completado exitosamente.`);

    } catch (error) {
        console.error(`🔥 [CRITICAL] Fallo total en job ${jobId}:`, error);
    }
}

// --- SERVER START ---
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server corriendo en puerto ${PORT}`);
});