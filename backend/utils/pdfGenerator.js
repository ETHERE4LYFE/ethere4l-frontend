const PDFDocument = require('pdfkit');
const path = require('path');

function buildPDF(cliente, pedido, jobId) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 0, size: 'A4' });
        const buffers = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', (err) => reject(err));

        // RUTA LOCAL (RAILWAY SAFE)
        const logoPath = path.join(__dirname, '..', 'images', 'header-logo.png');

        // COLORES
        const BLACK = '#000000';
        const WHITE = '#FFFFFF';
        const SOFT_GRAY = '#F2F2F2';
        const TEXT_GRAY = '#444444';

        // HEADER
        doc.rect(0, 0, 595.28, 150).fill(BLACK);
        
        // LOGO LOCAL (OBLIGATORIO)
        try {
    doc.image(logoPath, (595.28 - 200) / 2, 35, { width: 200 });
} catch (err) {
    doc.fillColor(WHITE)
       .fontSize(24)
       .font('Helvetica-Bold')
       .text('ETHERE4L', 0, 70, { align: 'center', characterSpacing: 4 });
}


        doc.fillColor(WHITE).fontSize(8).font('Helvetica')
           .text('STREETWEAR & HIGH FASHION', 0, 105, { align: 'center', characterSpacing: 3 });

        // DETALLES ORDEN
        doc.fillColor(WHITE).fontSize(10).font('Helvetica-Bold')
           .text('ORDEN DE COMPRA', 400, 50, { align: 'right' });
        doc.font('Helvetica').fontSize(9)
           .text(`ID: ${jobId}`, 400, 65, { align: 'right' })
           .text(`FECHA: ${new Date().toLocaleDateString('es-MX')}`, 400, 78, { align: 'right' });

        // --- RESTO DEL PDF (SIN CAMBIOS) ---
        let currentY = 180;
        const marginX = 50;

        doc.fillColor(BLACK).font('Helvetica-Bold').fontSize(11).text('CLIENTE', marginX, currentY);
        doc.moveTo(marginX, currentY + 14).lineTo(marginX + 50, currentY + 14).lineWidth(2).stroke(BLACK);
        
        doc.fillColor(TEXT_GRAY).font('Helvetica').fontSize(10);
        currentY += 25;
        doc.text(`Nombre: ${cliente.nombre}`, marginX, currentY);
        doc.text(`Tel: ${cliente.telefono}`, 300, currentY);
        currentY += 15;
        doc.text(`Email: ${cliente.email}`, marginX, currentY);
        currentY += 15;
        doc.text(`Dirección: ${cliente.direccion}`, marginX, currentY, { width: 450 });

        currentY += 50;
        doc.fillColor(BLACK).font('Helvetica-Bold').fontSize(9);
        doc.text('PRODUCTO', marginX, currentY);
        doc.text('TALLA', 320, currentY);
        doc.text('CANT.', 380, currentY);
        doc.text('PRECIO', 440, currentY, { width: 100, align: 'right' });

        currentY += 15;
        doc.moveTo(marginX, currentY).lineTo(545, currentY).lineWidth(1).stroke(BLACK);
        currentY += 15;

        doc.font('Helvetica').fontSize(10).fillColor(TEXT_GRAY);
        pedido.items.forEach((item) => {
            doc.fillColor(BLACK).font('Helvetica-Bold').text(item.nombre, marginX, currentY);
            doc.fillColor(TEXT_GRAY).font('Helvetica').text(item.talla, 320, currentY);
            doc.text(item.cantidad, 380, currentY);
            doc.text(`$${item.precio.toLocaleString()}`, 440, currentY, { width: 100, align: 'right' });
            currentY += 25;
            doc.moveTo(marginX, currentY - 10).lineTo(545, currentY - 10).lineWidth(0.5).stroke('#EEEEEE');
        });

        currentY += 20;
        doc.rect(marginX, currentY, 250, 90).fill(SOFT_GRAY);
        doc.fillColor(BLACK).font('Helvetica-Bold').fontSize(9).text('MÉTODO DE PAGO: TRANSFERENCIA', marginX + 15, currentY + 15);
        doc.font('Helvetica').fontSize(8).fillColor(TEXT_GRAY);
        doc.text('BANCO: BBVA', marginX + 15, currentY + 35);
        doc.text('CLABE: 0123 4567 8901 2345 67', marginX + 15, currentY + 48);
        doc.text('CONCEPTO: ID ' + jobId, marginX + 15, currentY + 61);

        doc.fillColor(BLACK).font('Helvetica-Bold').fontSize(12);
        doc.text('TOTAL A PAGAR', 350, currentY + 30, { width: 100, align: 'right' });
        doc.fontSize(18).text(`$${pedido.total.toLocaleString()}`, 450, currentY + 28, { width: 100, align: 'right' });

        const footerY = 750;
        doc.moveTo(marginX, footerY).lineTo(545, footerY).lineWidth(1).stroke(BLACK);
        doc.fontSize(8).fillColor(TEXT_GRAY).text('ETHERE4L | © 2026 Ciudad Juárez, Chih.', marginX, footerY + 15, { align: 'center' });
        doc.text('Para dudas sobre tu pedido, contáctanos vía Instagram o WhatsApp.', marginX, footerY + 28, { align: 'center' });

        doc.end();
    });
}

module.exports = { buildPDF };