document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    const orderId = params.get('id');

    // 🔐 HIDRATACIÓN DEL TOKEN (CRÍTICO)
    if (urlToken) {
        sessionStorage.setItem('magic_token', urlToken);

        // Limpiar URL (seguridad + UX)
        const cleanUrl =
            window.location.pathname + `?id=${orderId}`;
        window.history.replaceState({}, '', cleanUrl);
    }

    const token = sessionStorage.getItem('magic_token');

    // Gatekeeper
    if (!orderId || !token) {
        document.body.innerHTML = `
            <div style="padding:40px; text-align:center;">
                <h3>🔒 Sesión expirada</h3>
                <p>Vuelve a Mis Pedidos para autenticarte.</p>
                <a href="mis-pedidos.html" class="btn-black">Ir a Mis Pedidos</a>
            </div>`;
        return;
    }

    try {
        const res = await fetch(
            `https://ethereal-backend-production-6060.up.railway.app/api/orders/track/${orderId}`,
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );

        if (!res.ok) throw new Error('Unauthorized');

        const order = await res.json();

        // HEADER
        document.getElementById('order-id').innerText =
            `Pedido #${order.id.slice(0, 8)}`;
        document.getElementById('order-status').innerText =
            `Estado: ${order.status}`;

        // TIMELINE
        document.getElementById('step-confirmed').classList.add('active');

        if (order.status === 'PAGADO' || order.tracking_number) {
            document.getElementById('step-packed').classList.add('active');
        }

        if (order.tracking_number) {
            document.getElementById('step-transit').classList.add('active');
            document.getElementById('tracking-info').innerHTML =
                `Número de guía: <strong>${order.tracking_number}</strong>`;
        }

        if (order.status === 'ENTREGADO') {
            document.getElementById('step-delivered').classList.add('active');
        }

        // MENSAJE DE ITEMS (porque el backend aún no los guarda)
        document.getElementById('items-list').innerHTML = `
            <div style="text-align:center; padding:40px; color:#666">
                <img src="https://placehold.co/80x80/000/FFF?text=ETHERE4L" style="opacity:.7" />
                <p style="margin-top:15px">
                    El detalle de productos fue enviado a tu correo de confirmación.
                </p>
            </div>
        `;

        // TOTAL
        document.getElementById('order-total').innerText =
            `Total: $${order.total.toLocaleString('es-MX')}`;

    } catch (err) {
        console.error(err);
        sessionStorage.removeItem('magic_token');
        document.body.innerHTML = `
            <div style="padding:40px; text-align:center; color:red">
                <h3>❌ No se pudo cargar el pedido</h3>
                <p>Vuelve a autenticarte.</p>
            </div>`;
    }
});
