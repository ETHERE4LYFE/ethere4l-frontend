const PDFDocument = require('pdfkit');

function buildPDF(cliente, pedido, jobId) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const buffers = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            const pdfData = Buffer.concat(buffers);
            resolve(pdfData);
        });

        doc.on('error', (err) => {
            reject(err);
        });

        // --- COLORES Y ESTILOS ---
        const colorNegro = '#000000';
        const colorGris = '#444444';
        const colorGrisClaro = '#E0E0E0';

        // --- 1. ENCABEZADO (BRANDING) ---
        // Franja negra superior
        doc.rect(0, 0, 595.28, 120).fill(colorNegro);
        
        // Texto Marca (Simulación de Logo en Blanco)
        doc.fillColor('#FFFFFF')
           .fontSize(30)
           .font('Times-Roman') // Usamos fuente serif estándar elegante
           .text('ETHERE4L', 50, 45, { characterSpacing: 2 });
           
        doc.fontSize(10)
           .font('Helvetica')
           .text('STREETWEAR & HIGH FASHION', 50, 80, { characterSpacing: 3 });

        // Título del Documento (Lado Derecho)
        doc.fillColor('#FFFFFF')
           .fontSize(12)
           .font('Helvetica-Bold')
           .text('ORDEN DE COMPRA', 400, 50, { align: 'right' });

        doc.fontSize(10)
           .font('Helvetica')
           .text(`#${jobId}`, 400, 65, { align: 'right' });
           
        doc.text(new Date().toLocaleDateString('es-MX'), 400, 80, { align: 'right' });

        // --- 2. INFORMACIÓN DEL CLIENTE ---
        let y = 160;
        doc.fillColor(colorNegro).fontSize(10).font('Helvetica-Bold');
        doc.text('DATOS DEL CLIENTE:', 50, y);
        
        doc.font('Helvetica').fontSize(10).fillColor(colorGris);
        y += 15;
        doc.text(`Nombre: ${cliente.nombre}`, 50, y);
        y += 15;
        doc.text(`Email: ${cliente.email}`, 50, y);
        y += 15;
        doc.text(`Teléfono: ${cliente.telefono}`, 50, y);
        
        // Dirección con ajuste de línea
        y += 15;
        doc.text(`Dirección: ${cliente.direccion}`, 50, y, { width: 300 });

        // --- 3. TABLA DE PRODUCTOS ---
        y += 60; // Espacio antes de la tabla

        // Encabezados de tabla
        doc.rect(50, y, 495, 25).fill(colorGrisClaro); // Fondo gris encabezado
        doc.fillColor(colorNegro).font('Helvetica-Bold').fontSize(9);
        
        doc.text('PRODUCTO', 60, y + 8);
        doc.text('TALLA', 300, y + 8);
        doc.text('CANT.', 360, y + 8);
        doc.text('PRECIO', 420, y + 8, { width: 60, align: 'right' });
        doc.text('TOTAL', 490, y + 8, { width: 45, align: 'right' });

        y += 30; // Mover cursor para los items

        // Listado de Items
        doc.font('Helvetica').fontSize(9).fillColor(colorNegro);

        pedido.items.forEach((item, index) => {
            const subtotalItem = item.precio * item.cantidad;
            
            // Línea divisoria tenue
            if(index > 0) {
                doc.moveTo(50, y - 5).lineTo(545, y - 5).strokeColor('#eeeeee').stroke();
            }

            doc.text(item.nombre.substring(0, 40), 60, y);
            doc.text(item.talla, 300, y);
            doc.text(item.cantidad, 370, y);
            
            // Precios formateados
            doc.text(`$${item.precio}`, 420, y, { width: 60, align: 'right' });
            doc.text(`$${subtotalItem}`, 490, y, { width: 45, align: 'right' });
            
            y += 20;
        });

        // Línea final tabla
        doc.moveTo(50, y).lineTo(545, y).strokeColor(colorNegro).lineWidth(1).stroke();
        y += 15;

        // --- 4. TOTALES ---
        doc.font('Helvetica-Bold').fontSize(12);
        doc.text('TOTAL A PAGAR:', 350, y, { width: 100, align: 'right' });
        doc.text(`$${pedido.total}`, 460, y, { width: 75, align: 'right' });

        // --- 5. INSTRUCCIONES DE PAGO ---
        y += 50;
        doc.rect(50, y, 495, 80).strokeColor(colorNegro).lineWidth(1).stroke(); // Recuadro
        
        doc.font('Helvetica-Bold').fontSize(10).text('INSTRUCCIONES DE PAGO', 65, y + 15);
        
        doc.font('Helvetica').fontSize(9).text('Realiza tu transferencia a la siguiente cuenta:', 65, y + 35);
        doc.font('Helvetica-Bold').text('Banco: BBVA', 65, y + 50);
        doc.text('CLABE: 1234 5678 9012 3456', 200, y + 50);
        doc.text('Concepto: Tu Nombre o ID de Pedido', 65, y + 65);

        // --- 6. PIE DE PÁGINA ---
        const bottom = 780;
        doc.fontSize(8).fillColor(colorGris).text('ETHERE4L - Ciudad Juárez, Chihuahua.', 50, bottom, { align: 'center' });
        doc.text('Gracias por tu preferencia.', 50, bottom + 12, { align: 'center' });

        doc.end();
    });
}

module.exports = { buildPDF };