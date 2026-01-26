const API_URL = 'https://ethereal-backend-production-6060.up.railway.app/api/crear-pedido';
const TIMEOUT_DURATION = 45000;

document.addEventListener('DOMContentLoaded', () => {
    // 1. CARGAR RESUMEN DEL CARRITO (Lógica Visual)
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

        // VALIDACIÓN
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

        // CAPTURA DE DIRECCIÓN DESGLOSADA
        const calle = document.getElementById('calle').value.trim();
        const colonia = document.getElementById('colonia').value.trim();
        const cp = document.getElementById('cp').value.trim();
        const ciudad = document.getElementById('ciudad').value.trim();
        const estado = document.getElementById('estado').value.trim();
        
        // UNIR DIRECCIÓN PARA BACKEND
        const direccionCompleta = `${calle}, Col. ${colonia}, CP ${cp}, ${ciudad}, ${estado}`;

        // UI LOADING
        btnSubmit.disabled = true;
        btnSubmit.innerText = "PROCESANDO... (NO CIERRES)";
        btnSubmit.style.opacity = "0.7";

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_DURATION);

        try {
            const items = cart.map(item => ({
                nombre: item.nombre,
                talla: item.talla,
                cantidad: Number(item.cantidad) || 1,
                precio: Number(item.precio) || 0,
                imagen: item.imagen
            }));

            const total = items.reduce((sum, i) => sum + i.precio * i.cantidad, 0);

            const payload = {
                cliente: {
                    nombre: document.getElementById('nombre').value.trim(),
                    email: emailValue,
                    telefono: document.getElementById('telefono').value.trim(),
                    direccion: direccionCompleta, // Dirección unida
                    notas: document.getElementById('notas').value.trim()
                },
                pedido: { items, total }
            };

            const res = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            const data = await res.json();

            if (res.ok && data.success) {
                alert("✅ Pedido exitoso. Revisa tu correo.");
                clearCart();
                window.location.href = 'gracias.html';
                return;
            }
            throw new Error(data.message || 'Error del servidor');

        } catch (err) {
            console.error(err);
            alert("Error: " + (err.message || "Problema de conexión"));
            btnSubmit.disabled = false;
            btnSubmit.innerText = originalText;
            btnSubmit.style.opacity = "1";
        } finally {
            clearTimeout(timeoutId);
        }
    });
});