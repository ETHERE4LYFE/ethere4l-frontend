/* Lógica de Checkout para ETHERE4L
   Conecta el formulario con el Backend en Railway
   Versión: Performance & Cold Start Optimized (45s Timeout)
*/

const API_URL = 'https://ethereal-backend-production-6060.up.railway.app/api/crear-pedido'; 
const TIMEOUT_DURATION = 45000;

document.getElementById('form-pedido').addEventListener('submit', async function(e) {
    e.preventDefault();

    const btnSubmit = document.getElementById('btn-comprar');
    const originalText = btnSubmit.innerText;

    // 🔒 VALIDACIÓN DURA ANTES DE TODO
    const emailInput = document.getElementById('email');
    const emailValue = emailInput ? emailInput.value.trim() : "";

    if (!emailValue || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
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
        const safeItems = rawCartItems.map(item => ({
            nombre: String(item.nombre || "Producto"),
            talla: String(item.talla || "Unitalla"),
            cantidad: Number(item.cantidad) || 1,
            precio: Number(item.precio) || 0,
            imagen: item.imagen
        }));

        const totalPedido = safeItems.reduce(
            (sum, item) => sum + (item.precio * item.cantidad), 0
        );

        const payload = {
            cliente: {
                nombre: document.getElementById('nombre').value.trim(),
                email: emailValue,
                telefono: document.getElementById('telefono').value.trim(),
                direccion: document.getElementById('direccion').value.trim(),
                notas: document.getElementById('notas').value.trim()
            },
            pedido: {
                items: safeItems,
                total: totalPedido
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

        throw new Error(data.message || 'Error al procesar pedido');

    } catch (error) {
        console.error("🔥 Error:", error);
        alert(error.message || "Error inesperado");

        btnSubmit.disabled = false;
        btnSubmit.innerText = originalText;
        btnSubmit.style.opacity = "1";
        btnSubmit.style.cursor = "pointer";
    } finally {
        clearTimeout(timeoutId);
    }
});
