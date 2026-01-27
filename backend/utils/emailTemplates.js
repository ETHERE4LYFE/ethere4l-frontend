// =========================================================
// EMAIL TEMPLATES - ETHERE4L (CLEAN BRANDING VERSION)
// =========================================================

const LOGO_URL = "https://ethereal-frontend.netlify.app/assets/icons/header-logo.png";

const styles = {
    container: "margin: 0; padding: 0; width: 100%; background-color: #f8f8f8; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;",
    wrapper: "max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #eeeeee;",
    header: "background-color: #000000; padding: 40px 20px; text-align: center;",
    logo: "width: 180px; height: auto; display: block; margin: 0 auto;",
    content: "padding: 40px 30px; color: #333333; line-height: 1.6;",
    h1: "font-size: 22px; font-weight: bold; margin: 0 0 20px 0; color: #000000; text-align: center;",
    p: "font-size: 15px; margin-bottom: 15px; color: #555555;",
    summaryBox: "background-color: #f9f9f9; padding: 20px; border-radius: 6px; margin: 25px 0; border: 1px solid #efefef;",
    itemText: "font-size: 14px; margin: 5px 0; color: #333333;",
    ctaContainer: "text-align: center; margin-top: 30px;",
    button: "display: inline-block; background-color: #000000; color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 4px; font-size: 14px; font-weight: bold;",
    footer: "padding: 20px; text-align: center; font-size: 12px; color: #999999; background-color: #ffffff;"
};

function getEmailTemplate(cliente, pedido, jobId, isAdmin) {
    const totalFormatted = new Intl.NumberFormat('es-MX', {
        style: 'currency', currency: 'MXN'
    }).format(pedido.total);

    const titulo = isAdmin 
        ? `NUEVA ORDEN: ${jobId}`
        : `Confirmación de Orden: ${jobId}`;

    const mensaje = isAdmin
        ? `Se ha registrado un nuevo pedido de <b>${cliente.nombre}</b>.`
        : `Hola ${cliente.nombre}, hemos recibido tu pedido. Adjunto encontrarás el PDF con los detalles para finalizar tu compra.`;

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

                <div style="${styles.summaryBox}">
                    <p style="${styles.itemText}"><strong>ID de Pedido:</strong> ${jobId}</p>
                    <p style="${styles.itemText}"><strong>Total:</strong> ${totalFormatted}</p>
                    <p style="${styles.itemText}"><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-MX')}</p>
                </div>

                <p style="${styles.p}">
                    ${isAdmin ? 'Revisa el PDF adjunto para los detalles de envío e inventario.' : 'Recuerda que tu pedido se procesará una vez confirmado el pago vía transferencia bancaria.'}
                </p>

                <div style="${styles.ctaContainer}">
                    <a href="https://ethereal-frontend.netlify.app" style="${styles.button}">VOLVER A LA TIENDA</a>
                </div>
            </div>

            <div style="${styles.footer}">
                <p style="margin: 0;">ETHERE4L STREETWEAR | Ciudad Juárez, Chih.</p>
                <p style="margin: 5px 0;">Este es un correo automático, por favor no lo respondas.</p>
            </div>
        </div>
    </body>
    </html>
    `;
}

module.exports = { getEmailTemplate };