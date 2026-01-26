// utils/pdfGenerator.js
const PDFDocument = require('pdfkit');

function buildPDF(cliente, pedido, jobId) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            const buffers = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', (err) => reject(err));

            // --- DISEÑO DEL PDF ---
            
            // 1. Header
            doc.font('Courier-Bold').fontSize(24).text('ETHERE4L', { align: 'center', characterSpacing: 5 });
            doc.fontSize(10).font('Courier').text('INVOICE / RECIBO DE COMPRA', { align: 'center' });
            doc.moveDown(2);

            // 2. Info Bloques
            const topY = 150;
            
            // Columna Izquierda (Empresa)
            doc.fontSize(9).font('Courier-Bold').text('EMISOR:', 50, topY);
            doc.font('Courier').text('ETHERE4L CLOTHING', 50, topY + 15);
            doc.text('orders@ethere4l.com', 50, topY + 30);
            doc.text('World Wide Web', 50, topY + 45);

            // Columna Derecha (Cliente)
            doc.font('Courier-Bold').text('CLIENTE:', 350, topY);
            doc.font('Courier').text(cliente.nombre, 350, topY + 15);
            doc.text(cliente.email, 350, topY + 30);
            doc.text(cliente.telefono || 'Sin teléfono', 350, topY + 45);
            doc.text(cliente.direccion || 'Dirección digital', 350, topY + 60);

            doc.moveDown(4);

            // 3. Detalles de Orden
            doc.fontSize(11).font('Courier-Bold').text(`ORDEN ID: ${jobId}`, 50, 250);
            doc.text(`FECHA: ${new Date().toLocaleDateString()}`, 350, 250);

            // 4. Tabla de Productos
            const tableTop = 300;
            doc.lineWidth(1).moveTo(50, tableTop).lineTo(550, tableTop).stroke(); // Línea superior

            doc.fontSize(10).font('Courier-Bold');
            doc.text('ITEM', 50, tableTop + 10);
            doc.text('TALLA', 250, tableTop + 10);
            doc.text('CANT', 350, tableTop + 10);
            doc.text('PRECIO', 450, tableTop + 10);

            doc.lineWidth(1).moveTo(50, tableTop + 25).lineTo(550, tableTop + 25).stroke(); // Línea inferior header

            let y = tableTop + 40;
            doc.font('Courier');

            pedido.items.forEach(item => {
                doc.text(item.nombre, 50, y);
                doc.text(item.talla || 'N/A', 250, y);
                doc.text(item.cantidad.toString(), 350, y);
                doc.text(`$${item.precio}`, 450, y);
                y += 20;
            });

            // Línea final tabla
            doc.lineWidth(1).moveTo(50, y + 10).lineTo(550, y + 10).stroke();

            // 5. Total
            doc.fontSize(14).font('Courier-Bold').text(`TOTAL: $${pedido.total}`, 400, y + 30);

            // 6. Footer
            doc.fontSize(8).font('Courier').text('Gracias por su compra. ETHERE4L no acepta devoluciones sin etiqueta.', 50, 700, { align: 'center' });

            doc.end();

        } catch (error) {
            reject(error);
        }
    });
}

module.exports = { buildPDF };