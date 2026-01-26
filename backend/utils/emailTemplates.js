// =========================================================
// EMAIL TEMPLATES - ETHERE4L (FIXED SYNTAX)
// =========================================================

// 👇 AQUÍ ESTÁ LA URL DEL LOGO. (Si necesitas cambiarla, hazlo solo dentro de las comillas)
const LOGO_URL = "https://ethereal-frontend.netlify.app/assets/icons/header-logo.png";

const styles = {
    container: "font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f4; padding: 40px 20px; color: #333;",
    card: "max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1);",
    header: "background-color: #000000; padding: 30px; text-align: center;",
    logo: "max-width: 200px; height: auto; display: block; margin: 0 auto;",
    body: "padding: 40px 30px;",
    h1: "font-size: 24px; font-weight: bold; margin-bottom: 10px; color: #000;",
    p: "font-size: 16px; line-height: 1.6; color: #555; margin-bottom: 20px;",
    highlight: "font-weight: bold; color: #000;",
    footer: "background-color: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee;"
};

function getEmailTemplate(cliente, pedido, jobId, isAdmin) {
    // Formato de moneda
    const totalFormatted = new Intl.NumberFormat('es-MX', {
        style: 'currency', currency: 'MXN'
    }).format(pedido.total);

    // Contenido dinámico según destinatario
    const titulo = isAdmin 
        ? `🚨 Nueva Venta Detectada: ${jobId}`
        : `¡Gracias por tu compra, ${cliente.nombre}!`;

    const mensajePrincipal = isAdmin
        ? `<p style="${styles.p}">El cliente <span style="${styles.highlight}">${cliente.nombre}</span> ha realizado un pedido.</p>`
        : `<p style="${styles.p}">Hemos recibido tu orden correctamente. A continuación encontrarás el recibo adjunto (PDF) con los detalles de pago.</p>`;

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f4;">
        <div style="${styles.container}">
            <div style="${styles.card}">
                
                <div style="${styles.header}">
                    <img src="${LOGO_URL}" alt="ETHERE4L" style="${styles.logo}" border="0">
                </div>

                <div style="${styles.body}">
                    <h1 style="${styles.h1}">${titulo}</h1>
                    ${mensajePrincipal}
                    
                    <div style="background: #f8f8f8; padding: 15px; border-radius: 4px; margin: 20px 0;">
                        <p style="margin: 5px 0; font-size: 14px;"><strong>ID de Pedido:</strong> ${jobId}</p>
                        <p style="margin: 5px 0; font-size: 14px;"><strong>Total:</strong> ${totalFormatted}</p>
                        ${!isAdmin ? `<p style="margin: 5px 0; font-size: 14px; color: #d9534f;"><strong>Estado:</strong> Pendiente de Pago</p>` : ''}
                    </div>

                    <p style="${styles.p}">
                        ${isAdmin ? 'Revisa el PDF adjunto para ver los items y dirección de envío.' : 'Descarga el PDF adjunto para ver las instrucciones de transferencia bancaria.'}
                    </p>

                    <a href="https://ethereal-frontend.netlify.app/" style="display: inline-block; background: #000; color: #fff; text-decoration: none; padding: 12px 25px; border-radius: 4px; font-weight: bold; font-size: 14px; margin-top: 10px;">
                        Volver a la Tienda
                    </a>
                </div>

                <div style="${styles.footer}">
                    <p style="margin: 0;">&copy; ${new Date().getFullYear()} ETHERE4L. Todos los derechos reservados.</p>
                    <p style="margin: 5px 0;">Ciudad Juárez, Chihuahua.</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
}

module.exports = { getEmailTemplate };