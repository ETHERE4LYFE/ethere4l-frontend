// utils/emailTemplates.js
const getEmailTemplate = (cliente, pedido, jobId, isAdmin) => {
    const title = isAdmin ? '🚨 ALERTA: NUEVO PEDIDO' : 'CONFIRMACIÓN DE ORDEN';
    const color = isAdmin ? '#ff4444' : '#ffffff';
    
    // Generar lista de items HTML
    const itemsHtml = pedido.items.map(item => `
        <div style="border-bottom: 1px solid #333; padding: 10px 0; display: flex; justify-content: space-between;">
            <span style="color: #ccc;">${item.nombre} (x${item.cantidad}) [${item.talla || 'U'}]</span>
            <span style="color: #fff;">$${item.precio}</span>
        </div>
    `).join('');

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Courier+Prime&display=swap');
        </style>
    </head>
    <body style="background-color: #000000; color: #ffffff; font-family: 'Courier New', Courier, monospace; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 0 auto; border: 1px solid #333; padding: 40px 20px;">
            
            <div style="text-align: center; margin-bottom: 40px;">
                <h1 style="letter-spacing: 8px; font-size: 24px; margin: 0; border-bottom: 2px solid #fff; display: inline-block; padding-bottom: 10px;">ETHERE4L</h1>
                <p style="color: ${color}; font-size: 12px; margin-top: 10px; letter-spacing: 2px;">${title}</p>
            </div>

            <div style="background-color: #111; padding: 20px; margin-bottom: 30px; border-left: 2px solid #fff;">
                <p style="margin: 5px 0; font-size: 12px; color: #888;">ORDER ID</p>
                <p style="margin: 0 0 15px 0; font-size: 16px;">${jobId}</p>
                
                <p style="margin: 5px 0; font-size: 12px; color: #888;">CLIENTE</p>
                <p style="margin: 0; font-size: 14px;">${cliente.nombre}</p>
                <p style="margin: 0; font-size: 14px; color: #aaa;">${cliente.email}</p>
            </div>

            <div style="margin-bottom: 30px;">
                <p style="border-bottom: 1px solid #fff; padding-bottom: 5px; font-size: 12px; letter-spacing: 2px;">ITEMS COMPRADOS</p>
                ${itemsHtml}
            </div>

            <div style="text-align: right; margin-top: 20px;">
                <span style="font-size: 12px; color: #888; margin-right: 10px;">TOTAL A PAGAR</span>
                <span style="font-size: 24px; font-weight: bold;">$${pedido.total}</span>
            </div>

            <div style="margin-top: 60px; text-align: center; font-size: 10px; color: #444; border-top: 1px solid #222; padding-top: 20px;">
                <p>ETHERE4L WORLDWIDE SHIPPING</p>
                <p>NO REPLY TO THIS AUTOMATED SYSTEM</p>
            </div>
        </div>
    </body>
    </html>
    `;
};

module.exports = { getEmailTemplate };