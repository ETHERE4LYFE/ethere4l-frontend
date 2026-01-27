// =========================================================
// PDF GENERATOR - ETHERE4L (DUAL MODE: CLIENT & VENDOR)
// =========================================================
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');

/**
 * Genera PDF. Type puede ser 'CLIENTE' (Recibo) o 'PROVEEDOR' (Purchase Order)
 */
async function buildPDF(cliente, pedido, jobId, type = 'CLIENTE') {
    return new Promise(async (resolve, reject) => {
        try {
            // 1. Configuración de Rutas Seguras (Railway/Linux)
            const ROOT = path.resolve(__dirname, '..');
            const LOGO_PATH = path.join(ROOT, 'assets', 'branding', 'logo.png');
            const FONT_PATH = path.join(ROOT, 'fonts', 'static', 'Cinzel-Bold.ttf');

            // 2. Inicializar Documento
            const doc = new PDFDocument({ size: 'A4', margin: 40 });
            const buffers = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', (err) => reject(err));

            // 3. Configurar Fuente (SAFE)
            let mainFont = 'Times-Roman';
            if (fs.existsSync(FONT_PATH)) {
                doc.registerFont('Cinzel', FONT_PATH);
                mainFont = 'Cinzel';
            }

            // Colores
            const BLACK = '#000000';
            const GRAY = '#555555';

            // --- HEADER ---
            // Logo Centrado
            if (fs.existsSync(LOGO_PATH)) {
                doc.image(LOGO_PATH, (doc.page.width - 120) / 2, 30, { width: 120 });
            } else {
                doc.font(mainFont).fontSize(24).text('ETHERE4L', { align: 'center' });
            }
            doc.moveDown(3);

            // Título Dinámico
            const docTitle = type === 'PROVEEDOR' ? 'PURCHASE ORDER (DROPSHIPPING)' : 'CONFIRMACIÓN DE ORDEN';
            doc.font('Helvetica-Bold').fontSize(12).text(docTitle, { align: 'center' });
            doc.font('Helvetica').fontSize(10).text(`ID: ${jobId}`, { align: 'center' });
            doc.text(`Fecha: ${new Date().toLocaleDateString('es-MX')}`, { align: 'center' });
            doc.moveDown(2);

            // --- INFO CLIENTE / ENVÍO ---
            const startY = doc.y;
            
            // Columna Izquierda (Datos Cliente)
            doc.fontSize(10).font('Helvetica-Bold').text('DATOS DE ENVÍO:', 50, startY);
            doc.font('Helvetica').fontSize(9).fillColor(GRAY);
            doc.moveDown(0.5);
            doc.text(`Nombre: ${cliente.nombre}`);
            doc.text(`Email: ${cliente.email}`);
            doc.text(`Tel: ${cliente.telefono}`);
            
            // Dirección estructurada
            doc.moveDown(0.5);
            doc.text(cliente.direccion, { width: 250 });

            // Columna Derecha (Resumen o Proveedor Info)
            if (type === 'PROVEEDOR') {
                doc.font('Helvetica-Bold').fillColor(BLACK).text('INSTRUCCIONES PROVEEDOR:', 300, startY);
                doc.font('Helvetica').fillColor(GRAY);
                doc.text('1. No incluir factura con precios.', 300, startY + 15);
                doc.text('2. Verificar calidad antes de envío.', 300, startY + 30);
                doc.text('3. Usar packaging estándar.', 300, startY + 45);
            }

            doc.moveDown(4);
            const tableTop = doc.y;

            // --- TABLA DE PRODUCTOS ---
            // Definir columnas
            const colProduct = 50;
            const colTalla = 250;
            const colQty = 320;
            const colPrice = 400; // Solo cliente
            const colTotal = 480; // Solo cliente

            // Encabezados
            doc.font('Helvetica-Bold').fontSize(9).fillColor(BLACK);
            doc.text('PRODUCTO', colProduct, tableTop);
            doc.text('TALLA', colTalla, tableTop);
            doc.text('CANT', colQty, tableTop);
            
            if (type === 'CLIENTE') {
                doc.text('PRECIO', colPrice, tableTop);
                doc.text('TOTAL', colTotal, tableTop);
            }

            // Línea separadora
            doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

            // Items
            let currentY = tableTop + 25;
            doc.font('Helvetica').fontSize(9).fillColor(GRAY);

            pedido.items.forEach(item => {
                // 🖼️ Imagen del producto (si existe)
                if (item.image) {
                    try {
                        // Intentamos cargar la imagen, si falla no rompe el PDF
                        doc.image(item.image, colProduct, currentY, { width: 40 });
                    } catch (e) {
                        console.warn('[PDF] No se pudo cargar imagen:', item.image);
                    }
                }

                // Texto del producto
                doc.text(item.nombre, colProduct + 50, currentY, { width: 180 });
                doc.text(item.talla, colTalla, currentY);
                doc.text(item.cantidad, colQty, currentY);

                if (type === 'CLIENTE') {
                    doc.text(`$${item.precio}`, colPrice, currentY);
                    doc.text(`$${item.precio * item.cantidad}`, colTotal, currentY);
                }

                currentY += 60; // más espacio por la imagen
            });

            // Línea final
            doc.moveTo(50, currentY).lineTo(550, currentY).stroke();
            currentY += 20;

            // --- TOTALES Y PAGO (SOLO CLIENTE) ---
            if (type === 'CLIENTE') {
                // Total
                doc.font('Helvetica-Bold').fontSize(14).fillColor(BLACK);
                doc.text(`TOTAL A PAGAR: $${pedido.total.toLocaleString('es-MX')} MXN`, { align: 'right' });

                // Bloque de Pago con QR
                doc.moveDown(2);
                const paymentY = doc.y;
                
                // Fondo gris
                doc.rect(50, paymentY, 500, 100).fill('#F4F4F4');
                
                // Generar QR
                try {
                    // Datos para QR (Concepto + Monto)
                    const qrData = `ETHERE4L|${jobId}|MXN|${pedido.total}`;
                    const qrBase64 = await QRCode.toDataURL(qrData);
                    doc.image(qrBase64, 60, paymentY + 10, { width: 80 });
                } catch (e) { console.error("Error generando QR", e); }

                // Textos Pago
                doc.fillColor(BLACK).font('Helvetica-Bold').fontSize(10);
                doc.text('DATOS PARA TRANSFERENCIA', 160, paymentY + 20);
                
                doc.font('Helvetica').fontSize(9).fillColor(GRAY);
                doc.text('BANCO: BBVA', 160, paymentY + 40);
                doc.text('CLABE: 0123 4567 8901 2345 67', 160, paymentY + 55);
                doc.text(`CONCEPTO: ${jobId}`, 160, paymentY + 70);
            }

            // --- FOOTER ---
            const footerY = 750;
            doc.fontSize(8).fillColor(GRAY).text('ETHERE4L - Streetwear & High Fashion', 50, footerY, { align: 'center' });
            if (type === 'CLIENTE') {
                doc.text('Gracias por tu compra. Envíanos tu comprobante por Instagram.', { align: 'center' });
            }

            doc.end();

        } catch (error) {
            console.error("Error crítico en PDF Generator:", error);
            reject(error);
        }
    });
}

module.exports = { buildPDF };