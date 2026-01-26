/* Lógica de Checkout para ETHERE4L
   Conecta el formulario con el Backend en Railway
   Versión: Performance & Cold Start Optimized (45s Timeout)
*/

const API_URL = 'https://ethereal-backend-production-6060.up.railway.app/api/crear-pedido'; 

// Configuración de Tiempos
const TIMEOUT_DURATION = 45000; // 45 segundos

document.getElementById('form-pedido').addEventListener('submit', async function (e) {
    e.preventDefault();

    const form = e.target;
    const btnSubmit = document.getElementById('btn-comprar');
    const originalText = btnSubmit.innerText;

    // 🔒 VALIDACIÓN NATIVA DEL FORM (OBLIGATORIA)
    if (!form.reportValidity()) {
        return;
    }

    // 🔍 VALIDAR EXISTENCIA DEL INPUT EMAIL
    const emailInput = document.getElementById('email');
    if (!emailInput) {
        alert("Error del sistema: el campo de correo no está disponible. Recarga la página.");
        return;
    }

    const emailValue = emailInput.value.trim();
    if (!emailValue || !emailValue.includes('@')) {
        alert("Por favor ingresa un correo electrónico válido.");
        emailInput.focus();
        return;
    }

    // 1. Validar Dependencias y Carrito
    if (typeof getCart !== 'function' || typeof clearCart !== 'function') {
        alert("Error de sistema: Funciones del carrito no disponibles.");
        return;
    }

    const rawCartItems = getCart();
    if (rawCartItems.length === 0) {
        alert("Tu bolsa está vacía.");
        return;
    }

    // 2. Bloquear UI
    btnSubmit.disabled = true;
    btnSubmit.innerText = "PROCESANDO... (NO CIERRES)";
    btnSubmit.style.opacity = "0.7";
    btnSubmit.style.cursor = "wait";

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_DURATION);

    try {
        // 3. Preparar Items
        const safeItems = rawCartItems.map(item => {
            const precio = Number(item.precio);
            const cantidad = Number(item.cantidad);

            return {
                nombre: String(item.nombre || "Producto"),
                talla: String(item.talla || "Unitalla"),
                cantidad: (isNaN(cantidad) || cantidad < 1) ? 1 : cantidad,
                precio: isNaN(precio) ? 0 : precio,
                imagen: item.imagen
            };
        });

        const totalPedido = safeItems.reduce(
            (sum, item) => sum + (item.precio * item.cantidad),
            0
        );

        const payload = {
            cliente: {
                nombre: document.getElementById('nombre').value.trim(),
                email: emailValue,
                telefono: document.getElementById('telefono').value.trim(),
                direccion: document.getElementById('direccion').value.trim(),
                notas: (document.getElementById('notas').value || "").trim()
            },
            pedido: {
                items: safeItems,
                total: Number(totalPedido)
            }
        };

        console.log("🚀 Enviando pedido:", payload);

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        const data = await response.json();

        if (response.ok && data.success === true) {
            alert("Pedido recibido. Revisa tu correo 📧");
            clearCart();
            window.location.href = 'gracias.html';
            return;
        }

        throw new Error(data.message || "El servidor no pudo procesar el pedido.");

    } catch (error) {
        console.error("🔥 Error checkout:", error);

        let message = "Hubo un problema al procesar tu pedido.";

        if (error.name === 'AbortError') {
            message = "El servidor tardó demasiado. Contáctanos por Instagram antes de intentar de nuevo.";
        } else if (error.message) {
            message = error.message;
        }

        alert(message);

        btnSubmit.disabled = false;
        btnSubmit.innerText = originalText;
        btnSubmit.style.opacity = "1";
        btnSubmit.style.cursor = "pointer";

    } finally {
        clearTimeout(timeoutId);
    }
});
