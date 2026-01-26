const API_URL = 'https://ethereal-backend-production-6060.up.railway.app/api/crear-pedido';
const TIMEOUT_DURATION = 45000;

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form-pedido');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const btnSubmit = document.getElementById('btn-comprar');
        const originalText = btnSubmit.innerText;

        const emailInput = document.getElementById('email');
        const emailValue = emailInput.value.trim();

        // 🔒 VALIDACIÓN ABSOLUTA (NO SE PUEDE SALTAR)
        if (!emailValue || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
            alert("Por favor ingresa un correo electrónico válido.");
            emailInput.focus();
            return;
        }

        if (typeof getCart !== 'function' || typeof clearCart !== 'function') {
            alert("Error del sistema. Recarga la página.");
            return;
        }

        const cart = getCart();
        if (!cart.length) {
            alert("Tu bolsa está vacía.");
            return;
        }

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
                    direccion: document.getElementById('direccion').value.trim(),
                    notas: document.getElementById('notas').value.trim()
                },
                pedido: {
                    items,
                    total
                }
            };

            const res = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            const data = await res.json();

            if (res.ok && data.success) {
                alert("Pedido recibido. Revisa tu correo 📧");
                clearCart();
                window.location.href = 'gracias.html';
                return;
            }

            throw new Error(data.message || 'Error al procesar pedido');

        } catch (err) {
            alert(err.message || "Error inesperado");
            btnSubmit.disabled = false;
            btnSubmit.innerText = originalText;
            btnSubmit.style.opacity = "1";
        } finally {
            clearTimeout(timeoutId);
        }
    });
});
