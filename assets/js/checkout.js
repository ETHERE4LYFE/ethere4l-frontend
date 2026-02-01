// ==========================================
// CHECKOUT.JS - Lógica del formulario y pago
// ==========================================

const API_URL = 'https://ethereal-backend-production-6060.up.railway.app/api/crear-pedido'; // Mantenido por referencia
const TIMEOUT_DURATION = 45000;

document.addEventListener('DOMContentLoaded', () => {
    // 1. CARGAR RESUMEN DEL CARRITO (Lógica Visual Original)
    if (typeof getCart === 'function') {
        const cart = getCart();
        const container = document.getElementById('checkout-cart-items');
        const totalElem = document.getElementById('checkout-total');
        
        if (container && cart.length > 0) {
            let total = 0;
            container.innerHTML = cart.map(item => {
                const subtotal = item.precio * item.cantidad;
                total += subtotal;
                return `
                <div class="cart-item">
                    <img src="${item.imagen}" alt="${item.nombre}">
                    <div class="item-details">
                        <h4>${item.nombre}</h4>
                        <p>Talla: ${item.talla} | Cant: ${item.cantidad}</p>
                        <p>$${item.precio}</p>
                    </div>
                </div>`;
            }).join('');
            if(totalElem) totalElem.innerText = total.toFixed(2);
        }
    }

    // 2. LÓGICA DE ENVÍO
    const form = document.getElementById('form-pedido');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const btnSubmit = document.getElementById('btn-comprar');
        const originalText = btnSubmit.innerText;

        const emailInput = document.getElementById('email');
        const emailValue = emailInput.value.trim();

        // VALIDACIÓN (Lógica Original)
        if (!emailValue || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
            alert("⚠️ Por favor ingresa un correo electrónico válido.");
            emailInput.focus();
            return;
        }

        const cart = getCart();
        if (!cart.length) {
            alert("Tu bolsa está vacía.");
            return;
        }

        // CAPTURA DE DIRECCIÓN DESGLOSADA (Lógica Original Preservada)
        const calle = document.getElementById('calle').value.trim();
        const colonia = document.getElementById('colonia').value.trim();
        const cp = document.getElementById('cp').value.trim();
        const ciudad = document.getElementById('ciudad').value.trim();
        const estado = document.getElementById('estado').value.trim();
        const nombre = document.getElementById('nombre').value.trim();
        const telefono = document.getElementById('telefono').value.trim();
        const notas = document.getElementById('notas').value.trim();
        
        // UNIR DIRECCIÓN PARA VISUALIZACIÓN/LEGACY
        const direccionCompleta = `${calle}, Col. ${colonia}, CP ${cp}, ${ciudad}, ${estado}`;

        // UI LOADING (Lógica Original)
        btnSubmit.disabled = true;
        btnSubmit.innerText = "REDIRIGIENDO A STRIPE..."; // Texto actualizado para claridad
        btnSubmit.style.opacity = "0.7";

        // NOTA: El AbortController ya no es necesario aquí porque Stripe maneja su propio timeout,
        // pero lo mantenemos para no romper la estructura try/catch existente si decidieras usarlo.
        const controller = new AbortController(); 
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_DURATION);

        try {
            // ============================================================
            // NUEVA INTEGRACIÓN: STRIPE CHECKOUT
            // ============================================================

            // 1. Guardar datos del cliente en SessionStorage
            // Esto permite que cart.js recupere la info para enviarla a Stripe
            const clienteData = {
                nombre: nombre,
                email: emailValue,
                telefono: telefono,
                direccion: {
                    calle: calle,
                    colonia: colonia,
                    cp: cp,
                    ciudad: ciudad,
                    estado: estado,
                    completa: direccionCompleta // Enviamos también la versión formateada
                },
                notas: notas
            };

            sessionStorage.setItem('checkout_cliente', JSON.stringify(clienteData));

            // 2. Invocar la función segura de Stripe (definida en cart.js)
            // Esta función llama a /api/create-checkout-session
            if (typeof window.iniciarCheckoutSeguro === 'function') {
                console.log("🔄 Iniciando pasarela de pago Stripe...");
                
                // Pasamos el ID del botón para que cart.js maneje el estado de carga si es necesario
                window.iniciarCheckoutSeguro('btn-comprar');
                return;

                
                // NOTA: No hacemos redirect manual ni clearCart() aquí.
                // Stripe redirige automáticamente a su página de pago.
            } else {
                throw new Error("Error crítico: La función 'iniciarCheckoutSeguro' no está disponible. Verifica que cart.js cargó correctamente.");
            }

        } catch (err) {
            console.error(err);
            alert("Error al iniciar pago: " + (err.message || "Intenta nuevamente."));
            
            // Restaurar estado del botón en caso de error
            btnSubmit.disabled = false;
            btnSubmit.innerText = originalText;
            btnSubmit.style.opacity = "1";
        } finally {
            clearTimeout(timeoutId);
        }
    });
});