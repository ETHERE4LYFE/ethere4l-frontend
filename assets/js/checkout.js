// ==========================================
// CHECKOUT.JS - Lógica del formulario y pago
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // 1. CARGAR RESUMEN DEL CARRITO
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

        // A. Validaciones
        const emailInput = document.getElementById('email');
        const emailValue = emailInput.value.trim();

        if (!emailValue || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
            alert("⚠️ Por favor ingresa un correo electrónico válido.");
            emailInput.focus();
            return;
        }

        const cart = typeof getCart === 'function' ? getCart() : [];
        if (!cart || cart.length === 0) {
            alert("Tu bolsa está vacía.");
            return;
        }

        // B. Captura de Datos (Dirección desglosada)
        const calle = document.getElementById('calle').value.trim();
        const colonia = document.getElementById('colonia').value.trim();
        const cp = document.getElementById('cp').value.trim();
        const ciudad = document.getElementById('ciudad').value.trim();
        const estado = document.getElementById('estado').value.trim();
        const direccionCompleta = `${calle}, Col. ${colonia}, CP ${cp}, ${ciudad}, ${estado}`;

        // C. Preparar objeto cliente
        const clienteData = {
            nombre: document.getElementById('nombre').value.trim(),
            email: emailValue,
            telefono: document.getElementById('telefono').value.trim(),
            direccion: {
                calle: calle,
                colonia: colonia,
                cp: cp,
                ciudad: ciudad,
                estado: estado,
                completa: direccionCompleta
            },
            notas: document.getElementById('notas').value.trim()
        };

        // D. Guardar en SessionStorage para cart.js
        sessionStorage.setItem('checkout_cliente', JSON.stringify(clienteData));

        // E. UI Loading
        btnSubmit.disabled = true;
        btnSubmit.innerText = "REDIRIGIENDO A STRIPE...";
        btnSubmit.style.opacity = "0.7";

        try {
            // F. Delegar transacción a cart.js
            if (typeof window.iniciarCheckoutSeguro === 'function') {
                // Pasamos el ID del botón para manejo de errores visuales
                await window.iniciarCheckoutSeguro('btn-comprar');
                // Stripe redirige automáticamente, no se requiere acción posterior
            } else {
                throw new Error("La función de pago no está cargada (check cart.js).");
            }

        } catch (err) {
            console.error("Error en checkout:", err);
            alert("No se pudo iniciar el pago. Por favor intenta nuevamente.");
            
            // Restaurar botón
            btnSubmit.disabled = false;
            btnSubmit.innerText = originalText;
            btnSubmit.style.opacity = "1";
        }
    });
});