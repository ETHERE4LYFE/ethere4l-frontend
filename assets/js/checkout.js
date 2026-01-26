/* Lógica de Checkout para ETHERE4L
   Conecta el formulario con el Backend en Railway
   Versión: Performance & Cold Start Optimized (45s Timeout)
*/

const API_URL = 'https://ethereal-backend-production-6060.up.railway.app/api/crear-pedido'; 

// Configuración de Tiempos
const TIMEOUT_DURATION = 45000; // 45 segundos (Suficiente para despertar Railway)

document.getElementById('form-pedido').addEventListener('submit', async function(e) {
    e.preventDefault();

    const btnSubmit = document.getElementById('btn-comprar');
    const originalText = btnSubmit.innerText;

    // 1. Validar Dependencias y Carrito
    if (typeof getCart !== 'function' || typeof clearCart !== 'function') {
        alert("Error de sistema: Funciones del carrito no disponibles. Recarga la página.");
        return;
    }

    const rawCartItems = getCart();
    if (rawCartItems.length === 0) {
        alert("Tu bolsa está vacía.");
        return;
    }

    // 2. Bloquear UI con Feedback Claro
    btnSubmit.disabled = true;
    btnSubmit.innerText = "PROCESANDO... (NO CIERRES)";
    btnSubmit.style.opacity = "0.7";
    btnSubmit.style.cursor = "wait";

    // Controlador para abortar si excede el tiempo límite
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_DURATION);

    try {
        // 3. Preparar Payload Estricto
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

        const totalPedido = safeItems.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

        const payload = {
            cliente: {
                nombre: String(document.getElementById('nombre').value).trim(),
                email: document.getElementById('email').value.trim(),
                telefono: String(document.getElementById('telefono').value).trim(),
                direccion: String(document.getElementById('direccion').value).trim(),
                notas: String(document.getElementById('notas').value || "").trim()
            },
            pedido: {
                items: safeItems,
                total: Number(totalPedido)
            }
        };


        console.log("🚀 Iniciando petición (Timeout: 45s)...", payload);

        if (!payload.cliente.email || !payload.cliente.email.includes('@')) {
    alert("Por favor ingresa un correo electrónico válido.");
    btnSubmit.disabled = false;
    btnSubmit.innerText = originalText;
    btnSubmit.style.opacity = "1";
    btnSubmit.style.cursor = "pointer";
    return;
}


        // 4. Fetch al Backend con Timeout Extendido
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal
        });
        
        // ¡Importante! Limpiamos el timeout apenas responde el servidor
        clearTimeout(timeoutId);

        // 5. Manejo de Respuesta (Lógica Fail-Safe)
        const data = await response.json();

        // REGLA DE ORO: Si success es true, ignoramos cualquier advertencia secundaria
        if (response.ok && data.success === true) {
            alert("Pedido recibido. Revisa tu correo 📧");
            console.log("✅ Pedido Confirmado:", data);
            clearCart(); 
            window.location.href = 'gracias.html';
            return;
        }

        // Si llegamos aquí, es un error lógico real del backend (ej: validación)
        console.error("❌ Rechazo del servidor:", data);
        throw new Error(data.message || 'El servidor no pudo generar la orden.');

    } catch (error) {
        console.error("🔥 Error en checkout:", error);

        let userMessage = "Hubo un problema al procesar tu pedido.";
        let isRecoverable = true;
        
        // Diferenciamos Timeout de Error de Red
        if (error.name === 'AbortError') {
            userMessage = "El servidor tardó demasiado en responder. Es posible que tu pedido se haya procesado. Por favor, contáctanos por Instagram antes de intentar de nuevo para evitar duplicados.";
            isRecoverable = false; // Sugerimos no reintentar inmediatamente a ciegas
        } else if (error.message) {
            userMessage = error.message;
        }

        alert(`${userMessage}`);
        
        // Restaurar botón
        btnSubmit.disabled = false;
        btnSubmit.innerText = originalText;
        btnSubmit.style.opacity = "1";
        btnSubmit.style.cursor = "pointer";
    } finally {
        // Aseguramos limpieza del timer pase lo que pase
        clearTimeout(timeoutId);
    }
});