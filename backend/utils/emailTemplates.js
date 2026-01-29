// =========================================================
// EMAIL TEMPLATES - ETHERE4L (PURE HTML)
// =========================================================

// URL Pública de Netlify para asegurar renderizado en Gmail/iOS
const LOGO_URL = "https://ethereal-frontend.netlify.app/images/ui/header-logo.png";

const styles = {
    container: "margin: 0; padding: 0; width: 100%; background-color: #f8f8f8; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;",
    wrapper: "max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #eeeeee;",
    header: "background-color: #000000; padding: 30px 20px; text-align: center;",
    logo: "width: 150px; height: auto; display: block; margin: 0 auto;",
    content: "padding: 40px 30px; color: #333333; line-height: 1.6;",
    h1: "font-size: 20px; font-weight: bold; margin: 0 0 20px 0; color: #000000; text-align: center; text-transform: uppercase;",
    p: "font-size: 15px; margin-bottom: 15px; color: #555555;",
    box: "background-color: #f9f9f9; padding: 15px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #000000;",
    button: "display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; padding: 12px 25px; border-radius: 4px; font-size: 14px; font-weight: bold; margin-top: 20px;",
    footer: "padding: 20px; text-align: center; font-size: 11px; color: #999999; background-color: #ffffff; border-top: 1px solid #eee;"
};

function getEmailTemplate(cliente, pedido, jobId, isAdmin) {
    // Formatear moneda para visualización
    const totalFormatted = new Intl.NumberFormat('es-MX', {
        style: 'currency', currency: 'MXN'
    }).format(pedido.total);

    // Lógica Admin vs Cliente
    const titulo = isAdmin 
        ? `NUEVA VENTA: ${jobId}`
        : `ORDEN RECIBIDA: ${jobId}`;

    const mensaje = isAdmin
        ? `Se ha generado una nueva orden de dropshipping. Revisa el PDF adjunto (Purchase Order) para procesar el envío.`
        : `Hola <b>${cliente.nombre}</b>, hemos recibido tu pedido correctamente.`;

    const detalleCaja = isAdmin
        ? `<strong>Cliente:</strong> ${cliente.nombre}<br><strong>Items:</strong> ${pedido.items.length}`
        : `<strong>ID:</strong> ${jobId}<br><strong>Total:</strong> ${totalFormatted}<br><strong>Estado:</strong> Pendiente de Pago`;

    const callToAction = isAdmin 
        ? '' 
        : `<p style="${styles.p}">Adjunto encontrarás un PDF con los detalles de tu compra y las instrucciones para realizar el pago (QR y CLABE).</p>
           <div style="text-align: center;">
             <a href="https://ethereal-frontend.netlify.app" style="${styles.button}">VOLVER A LA TIENDA</a>
           </div>`;

    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ETHERE4L</title>
    </head>
    <body style="${styles.container}">
        <div style="${styles.wrapper}">
            
            <div style="${styles.header}">
                <img src="${LOGO_URL}" alt="ETHERE4L" style="${styles.logo}">
            </div>

            <div style="${styles.content}">
                <h1 style="${styles.h1}">${titulo}</h1>
                <p style="${styles.p}">${mensaje}</p>

                <div style="${styles.box}">
                    <p style="margin: 0; line-height: 1.5; font-size: 14px;">
                        ${detalleCaja}
                    </p>
                </div>

                ${callToAction}
            </div>

            <div style="${styles.footer}">
                <p style="margin: 0;">ETHERE4L STREETWEAR & HIGH FASHION</p>
                <p style="margin: 5px 0;">Ciudad Juárez, Chihuahua, MX.</p>
            </div>
        </div>
    </body>
    </html>
    `;
}






function getPaymentConfirmedEmail(cliente, pedido, jobId) {
    const totalFormatted = new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    }).format(pedido.total);



    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="utf-8">
        <title>Pago Confirmado - ETHERE4L</title>
    </head>
    <body style="margin:0;padding:0;background:#f8f8f8;font-family:Helvetica,Arial,sans-serif;">
        <div style="max-width:600px;margin:30px auto;background:#ffffff;border-radius:8px;overflow:hidden;">
            
            <div style="background:#000;padding:30px;text-align:center;">
                <img src="https://ethereal-frontend.netlify.app/images/ui/header-logo.png"
                     alt="ETHERE4L"
                     style="width:160px;display:block;margin:0 auto;">
            </div>

            <div style="padding:35px;color:#333;">
                <h2 style="margin-top:0;text-align:center;">
                    Pago confirmado
                </h2>

                <p>Hola <b>${cliente.nombre}</b>,</p>

                <p>
                    Hemos confirmado correctamente tu pago.  
                    Tu pedido ya está en proceso.
                </p>

                <div style="background:#f5f5f5;padding:20px;border-radius:6px;margin:25px 0;">
                    <p><b>ID de pedido:</b> ${jobId}</p>
                    <p><b>Total pagado:</b> ${totalFormatted}</p>
                    <p><b>Estado:</b> PAGADO</p>
                </div>

                <p>
                    En breve recibirás actualizaciones sobre el envío.
                </p>

                <p style="margin-top:30px;">
                    — ETHERE4L
                </p>
            </div>

            <div style="text-align:center;font-size:12px;color:#999;padding:20px;">
                ETHERE4L • Ciudad Juárez, MX
            </div>

        </div>
    </body>
    </html>
    `;
}
    module.exports = {
    getEmailTemplate,
    getPaymentConfirmedEmail
};
