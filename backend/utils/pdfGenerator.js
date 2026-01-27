const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');

/**
 * ETHERE4L – Luxury Invoice Generator (Railway Safe)
 * PDF Profesional Nivel High Fashion
 */
async function buildPDF(cliente, pedido, jobId) {
    return new Promise(async (resolve, reject) => {
        try {
            // =========================================================
            // 1. RUTAS ABSOLUTAS (RAILWAY / LINUX SAFE)
            // =========================================================
            const ROOT = path.resolve(__dirname, '..'); // /app/backend
            const LOGO_PATH = path.join(ROOT, 'assets', 'branding', 'logo.png');
            const FONT_DIR = path.join(ROOT, 'fonts', 'static');

            const FONTS = {
                REGULAR: path.join(FONT_DIR, 'Cinzel-Regular.ttf'),
                BOLD: path.join(FONT_DIR, 'Cinzel-Bold.ttf'),
                BLACK: path.join(FONT_DIR, 'Cinzel-Black.ttf')
            };

            console.log('[PDF] Logo path:', LOGO_PATH);
            console.log('[PDF] Font dir:', FONT_DIR);

            // =========================================================
            // 2. DOCUMENTO
            // =========================================================
            const doc = new PDFDocument({
                size: 'A4',
                margin: 50,
                bufferPages: true
            });

            const buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            // =========================================================
            // 3. REGISTRO DE FUENTES (SAFE MODE)
            // =========================================================
            if (fs.existsSync(FONTS.REGULAR)) doc.registerFont('Cinzel-Regular', FONTS.REGULAR);
            if (fs.existsSync(FONTS.BOLD)) doc.registerFont('Cinzel-Bold', FONTS.BOLD);
            if (fs.existsSync(FONTS.BLACK)) doc.registerFont('Cinzel-Black', FONTS.BLACK);

            const FONT_TITLE = fs.existsSync(FONTS.BLACK) ? 'Cinzel-Black' : 'Times-Bold';
            const FONT_BOLD = fs.existsSync(FONTS.BOLD) ? 'Cinzel-Bold' : 'Helvetica-Bold';
            const FONT_TEXT = fs.existsSync(FONTS.REGULAR) ? 'Cinzel-Regular' : 'Helvetica';

            // =========================================================
            // 4. COLORES DE MARCA
            // =========================================================
            const BLACK = '#111111';
            const GRAY = '#666666';
            const LIGHT_GRAY = '#F4F4F4';

            // =========================================================
            // 5. QR DINÁMICO BBVA
            // =========================================================
            const qrPayload = `ETHERE4L | ${jobId} | TOTAL $${pedido.total} MXN | BBVA`;
            const qrBase64 = await QRCode.toDataURL(qrPayload);

            // =========================================================
            // 6. WATERMARK (FONDO)
            // =========================================================
            if (fs.existsSync(LOGO_PATH)) {
                doc.save();
                doc.opacity(0.04);
                doc.image(
                    LOGO_PATH,
                    (doc.page.width - 420) / 2,
                    (doc.page.height - 420) / 2,
                    { width: 420 }
                );
                doc.restore();
            }

            // =========================================================
            // 7. HEADER
            // =========================================================
            doc.rect(0, 0, doc.page.width, 120).fill(BLACK);

            if (fs.existsSync(LOGO_PATH)) {
                doc.image(LOGO_PATH, (doc.page.width - 130) / 2, 30, { width: 130 });
            } else {
                doc.font(FONT_TITLE).fontSize(28).fillColor('white')
                    .text('ETHERE4L', 0, 45, { align: 'center' });
            }

            doc.font(FONT_TEXT)
                .fontSize(8)
                .fillColor('white')
                .text('STREETWEAR & HIGH FASHION', 0, 95, {
                    align: 'center',
                    characterSpacing: 3
                });

            // =========================================================
            // 8. DATOS ORDEN
            // =========================================================
            doc.fillColor(BLACK);
            doc.font(FONT_BOLD).fontSize(9);
            doc.text('ORDEN DE COMPRA', 400, 140, { align: 'right' });
            doc.font(FONT_TEXT).fillColor(GRAY);
            doc.text(`ID: ${jobId}`, 400, 155, { align: 'right' });
            doc.text(`FECHA: ${new Date().toLocaleDateString('es-MX')}`, 400, 168, { align: 'right' });

            // =========================================================
            // 9. CLIENTE
            // =========================================================
            doc.font(FONT_BOLD).fillColor(BLACK);
            doc.text('CLIENTE', 50, 140);
            doc.moveTo(50, 155).lineTo(110, 155).lineWidth(2).stroke(BLACK);

            doc.font(FONT_TEXT).fillColor(GRAY);
            doc.text(`Nombre: ${cliente.nombre}`, 50, 170);
            doc.text(`Email: ${cliente.email}`, 50, 185);
            doc.text(`Tel: ${cliente.telefono || ''}`, 300, 170);
            doc.text(`Dirección: ${cliente.direccion}`, 50, 200, { width: 400 });

            // =========================================================
            // 10. TABLA PRODUCTOS
            // =========================================================
            let y = 245;

            doc.font(FONT_BOLD).fillColor(BLACK).fontSize(9);
            doc.text('PRODUCTO', 50, y);
            doc.text('TALLA', 300, y);
            doc.text('CANT.', 350, y);
            doc.text('PRECIO', 420, y, { align: 'right' });

            y += 15;
            doc.moveTo(50, y).lineTo(545, y).stroke();

            doc.font(FONT_TEXT).fillColor(GRAY);

            pedido.items.forEach(item => {
                y += 18;

                if (y > 700) {
                    doc.addPage();
                    y = 100;
                }

                doc.text(item.nombre, 50, y, { width: 230 });
                doc.text(item.talla, 300, y);
                doc.text(item.cantidad, 350, y);
                doc.text(`$${item.precio.toLocaleString()}`, 420, y, { align: 'right' });
            });

            // =========================================================
            // 11. TOTAL
            // =========================================================
            y += 40;
            doc.font(FONT_BOLD).fillColor(BLACK);
            doc.text('TOTAL A PAGAR', 350, y, { align: 'right' });
            doc.fontSize(18).text(`$${pedido.total.toLocaleString()}`, 545, y - 5, {
                align: 'right'
            });

            // =========================================================
            // 12. MÉTODO DE PAGO + QR
            // =========================================================
            y += 40;
            doc.rect(50, y, 495, 100).fill(LIGHT_GRAY);

            doc.image(qrBase64, 65, y + 15, { width: 70 });

            doc.font(FONT_BOLD).fillColor(BLACK).fontSize(10);
            doc.text('TRANSFERENCIA BANCARIA', 160, y + 20);

            doc.font(FONT_TEXT).fillColor(GRAY).fontSize(9);
            doc.text('BANCO: BBVA', 160, y + 40);
            doc.text('CLABE: 0123 4567 8901 2345 67', 160, y + 55);
            doc.text(`CONCEPTO: ${jobId}`, 160, y + 70);

            // =========================================================
            // 13. FOOTER LEGAL
            // =========================================================
            doc.fontSize(7).fillColor('#999');
            doc.text(
                'ETHERE4L © 2026 | Ciudad Juárez, México | All Sales Final',
                50,
                doc.page.height - 40,
                { align: 'center', width: 495 }
            );

            doc.end();

        } catch (err) {
            console.error('[PDF ERROR]', err);
            reject(err);
        }
    });
}

module.exports = { buildPDF };
