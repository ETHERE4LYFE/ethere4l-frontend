// =========================================================
// SERVER.JS - ETHERE4L BACKEND (GOLD VERSION)
// =========================================================

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const { Resend } = require('resend');
const { buildPDF } = require('./utils/pdfGenerator');
const { getEmailTemplate, getPaymentConfirmedEmail } = require('./utils/emailTemplates');

// ===============================
// DATABASE SETUP
// ===============================
const RAILWAY_VOLUME = '/app/data';
const isRailway = fs.existsSync(RAILWAY_VOLUME);
const DATA_DIR = isRailway ? RAILWAY_VOLUME : path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'orders.db');

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

let db;
let dbPersistent = false;

try {
    db = new Database(DB_PATH, { verbose: console.log });
    db.pragma('journal_mode = WAL');

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

    dbPersistent = true;
    console.log('✅ DB conectada con persistencia');
} catch (err) {
    console.error('❌ DB ERROR → SAFE MODE', err);
    db = {
        prepare: () => ({ run: () => {}, get: () => null, all: () => [] }),
        exec: () => {}
    };
}

// ===============================
// APP CONFIG
// ===============================
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

// ⚠️ USA UN EMAIL REAL QUE EXISTA
const SENDER_EMAIL = 'ethere4lyfe@gmail.com';

const resend = new Resend(RESEND_API_KEY);

// ===============================
// HEALTH
// ===============================
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        service: 'ETHERE4L Backend',
        persistence: dbPersistent ? 'ACTIVE' : 'SAFE_MODE'
    });
});

// ===============================
// CREAR PEDIDO
// ===============================
app.post('/api/crear-pedido', (req, res) => {
    const { cliente, pedido } = req.body;

    if (!cliente || !pedido || !cliente.email) {
        return res.status(400).json({ error: 'Datos incompletos' });
    }

    const jobId = `ORD-${Date.now().toString().slice(-6)}`;

    res.json({ ok: true, jobId });

    setImmediate(() => {
        processBackgroundOrder(jobId, cliente, pedido)
            .catch(err => console.error(`❌ [${jobId}]`, err));
    });
});

// ===============================
// CONFIRMAR PAGO
// ===============================
app.post('/api/confirmar-pago', (req, res) => {
    const { jobId, paymentRef, confirmedBy } = req.body;
    if (!jobId) return res.status(400).json({ error: 'jobId requerido' });

    res.json({ ok: true, message: 'Procesando confirmación' });

    setImmediate(async () => {
        try {
            if (!dbPersistent) return;

            const info = db.prepare(`
                UPDATE pedidos
                SET status='PAGADO',
                    paid_at=datetime('now'),
                    payment_ref=?,
                    confirmed_by=?
                WHERE id=?
            `).run(paymentRef || 'MANUAL', confirmedBy || 'system', jobId);

            if (!info.changes) return;

            const row = db.prepare(`SELECT * FROM pedidos WHERE id=?`).get(jobId);
            const { cliente, pedido } = JSON.parse(row.data);

            const emailResult = await resend.emails.send({
                from: `ETHERE4L <${SENDER_EMAIL}>`,
                to: [cliente.email],
                subject: `Pago confirmado – ${jobId}`,
                html: getPaymentConfirmedEmail(cliente, pedido, jobId)
            });

            console.log('📨 Resend pago cliente:', emailResult);

            if (ADMIN_EMAIL) {
                const adminResult = await resend.emails.send({
                    from: `ETHERE4L <${SENDER_EMAIL}>`,
                    to: [ADMIN_EMAIL],
                    subject: `💰 Pago confirmado ${jobId}`,
                    html: `<p>Pedido ${jobId} pagado. Ref: ${paymentRef}</p>`
                });

                console.log('📨 Resend pago admin:', adminResult);
            }

        } catch (err) {
            console.error('❌ Error confirmando pago:', err);
        }
    });
});

// ===============================
// BACKGROUND WORKER
// ===============================
async function processBackgroundOrder(jobId, cliente, pedido) {
    console.log(`⚙️ Procesando pedido ${jobId}`);

    if (dbPersistent) {
        db.prepare(`
            INSERT INTO pedidos (id, email, data, status)
            VALUES (?, ?, ?, 'PENDIENTE')
        `).run(jobId, cliente.email, JSON.stringify({ cliente, pedido }));
    }

    const pdfCliente = await buildPDF(cliente, pedido, jobId, 'CLIENTE');
    const pdfProveedor = await buildPDF(cliente, pedido, jobId, 'PROVEEDOR');

    // 📧 EMAIL CLIENTE
    const emailCliente = await resend.emails.send({
        from: `ETHERE4L <${SENDER_EMAIL}>`,
        to: [cliente.email],
        subject: `Confirmación de Orden ${jobId}`,
        html: getEmailTemplate(cliente, pedido, jobId, false),
        attachments: [{ filename: `Orden_${jobId}.pdf`, content: pdfCliente }]
    });

    console.log('📨 Resend cliente:', emailCliente);

    // 📧 EMAIL ADMIN / PROVEEDOR
    if (ADMIN_EMAIL) {
        const emailAdmin = await resend.emails.send({
            from: `ETHERE4L <${SENDER_EMAIL}>`,
            to: [ADMIN_EMAIL],
            subject: `📦 NUEVA ORDEN ${jobId}`,
            html: getEmailTemplate(cliente, pedido, jobId, true),
            attachments: [{ filename: `PO_${jobId}.pdf`, content: pdfProveedor }]
        });

        console.log('📨 Resend admin:', emailAdmin);
    }
}

// ===============================
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Backend activo en puerto ${PORT}`);
});
