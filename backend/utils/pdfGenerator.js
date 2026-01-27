const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

function buildPDF(cliente, pedido, jobId) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({
            margin: 40,
            size: 'A4'
        });

        const buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // --- PATH CONFIGURATION ---
        const logoPath = path.join(__dirname, '..', 'images', 'header-logo.png');

        // --- COLORS ---
        const BLACK = '#000000';
        const WHITE = '#FFFFFF';
        const SOFT_GRAY = '#F2F2F2';
        const TEXT_GRAY = '#444444';

        // --- HEADER ---
        doc.rect(0, 0, 595.28, 150).fill(BLACK);

        const logoWidth = 200;
        const centerX = (595.28 - logoWidth) / 2;

        // 👉 VALIDACIÓN REAL DEL LOGO
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, centerX, 35, { width: logoWidth });
        } else {
            doc.fillColor(WHITE)
               .fontSize(26)
               .font('Times-Bold')
               .text('ETHERE4L', 0, 55, { align: 'center', characterSpacing: 4 });
        }

        doc.fillColor(WHITE)
           .fontSize(8)
           .font('Helvetica')
           .text('STREETWEAR & HIGH FASHION', 0, 105, {
               align: 'center',
               characterSpacing: 3
           });

        // Order info (right)
        doc.fillColor(WHITE)
           .fontSize(10)
           .font('Helvetica-Bold')
           .text('ORDEN DE COMPRA', 400, 50, { align: 'right' });

        doc.font('Helvetica')
           .fontSize(9)
           .text(`ID: ${jobId}`, 400, 65, { align: 'right' })
           .text(`FECHA: ${new Date().toLocaleDateString('es-MX')}`, 400, 78, { align: 'right' });

        // --- CLIENT INFO ---
        let y = 180;
        const x = 50;

        doc.fillColor(BLACK).font('Helvetica-Bold').fontSize(11).text('CLIENTE', x, y);
        doc.moveTo(x, y + 14).lineTo(x + 50, y + 14).lineWidth(2).stroke(BLACK);

        doc.fillColor(TEXT_GRAY).font('Helvetica').fontSize(10);
        y += 25;
        doc.text(`Nombre: ${cliente.nombre}`, x, y);
        doc.text(`Tel: ${cliente.telefono}`, 300, y);
        y += 15;
        doc.text(`Email: ${cliente.email}`, x, y);
        y += 15;
        doc.text(`Dirección: ${cliente.direccion}`, x, y, { width: 450 });

        // --- ITEMS TABLE ---
        y += 50;

        doc.fillColor(BLACK).font('Helvetica-Bold').fontSize(9);
        doc.text('PRODUCTO', x, y);
        doc.text('TALLA', 320, y);
        doc.text('CANT.', 380, y);
        doc.text('PRECIO', 440, y, { width: 100, align: 'right' });

        y += 15;
        doc.moveTo(x, y).lineTo(545, y).stroke(BLACK);
        y += 15;

        doc.font('Helvetica').fontSize(10);

        pedido.items.forEach(item => {
            doc.fillColor(BLACK).font('Helvetica-Bold').text(item.nombre, x, y);
            doc.fillColor(TEXT_GRAY).font('Helvetica').text(item.talla, 320, y);
            doc.text(item.cantidad, 380, y);
            doc.text(`$${item.precio.toLocaleString()}`, 440, y, { width: 100, align: 'right' });
            y += 25;
            doc.moveTo(x, y - 10).lineTo(545, y - 10).stroke('#EEEEEE');
        });

        // --- PAYMENT ---
        y += 20;

        doc.rect(x, y, 250, 90).fill(SOFT_GRAY);
        doc.fillColor(BLACK).font('Helvetica-Bold').fontSize(9)
           .text('MÉTODO DE PAGO: TRANSFERENCIA', x + 15, y + 15);

        doc.font('Helvetica').fontSize(8).fillColor(TEXT_GRAY);
        doc.text('BANCO: BBVA', x + 15, y + 35);
        doc.text('CLABE: 0123 4567 8901 2345 67', x + 15, y + 48);
        doc.text(`CONCEPTO: ID ${jobId}`, x + 15, y + 61);

        doc.fillColor(BLACK).font('Helvetica-Bold').fontSize(12);
        doc.text('TOTAL A PAGAR', 350, y + 30, { width: 100, align: 'right' });
        doc.fontSize(18).text(`$${pedido.total.toLocaleString()}`, 450, y + 28, { width: 100, align: 'right' });

        // --- FOOTER ---
        const footerY = 750;
        doc.moveTo(x, footerY).lineTo(545, footerY).stroke(BLACK);
        doc.fontSize(8).fillColor(TEXT_GRAY)
           .text('ETHERE4L © 2026 — Ciudad Juárez, Chih.', x, footerY + 15, { align: 'center' });

        doc.end();
    });
}

module.exports = { buildPDF };
