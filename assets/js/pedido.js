document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('id');
    const urlToken = params.get('token');

    // Hydration
    if (urlToken) {
        sessionStorage.setItem('order_token', urlToken);
    }

    const token = sessionStorage.getItem('order_token');

    // Limpieza de URL
    if (orderId && urlToken) {
        const cleanUrl = `${window.location.pathname}?id=${orderId}`;
        window.history.replaceState({}, document.title, cleanUrl);
    }

    if (!orderId || !token) {
        document.body.innerHTML = `
            <div style="padding:50px;text-align:center">
                <h3>⚠️ Sesión expirada</h3>
                <a href="mis-pedidos.html" class="btn-black">Volver</a>
            </div>
        `;
        return;
    }

    try {
        const res = await fetch(
            `https://ethereal-backend-production-6060.up.railway.app/api/orders/track/${orderId}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (!res.ok) throw new Error('401');

        const order = await res.json();

        renderOrderDetails(order);

    } catch (err) {
        console.error(err);
        document.body.innerHTML = `
            <div style="padding:40px;text-align:center;color:red">
                <h3>❌ No se pudo cargar el pedido</h3>
                <a href="mis-pedidos.html" class="btn-black">Volver</a>
            </div>
        `;
    }
});

function renderOrderDetails(order) {
    let meta = {};
    if (typeof order.data === 'string') {
        try { meta = JSON.parse(order.data); } catch {}
    }

    const items = meta.pedido?.items || [];
    const shipping = order.shipping_cost || 0;
    const total = meta.pedido?.total || order.total;

    document.getElementById('order-id').innerText =
        `Pedido #${order.id.slice(0, 8)}`;

    document.getElementById('order-status').innerText =
        `Estado: ${order.status}`;

    document.getElementById('items-list').innerHTML = items.length
        ? items.map(i => `
            <div class="invoice-item">
                <div class="item-left">
                    <img src="${i.imagen || 'https://placehold.co/80x80'}">
                    <div>
                        <h4>${i.nombre}</h4>
                        <p>${i.cantidad} x $${i.precio}</p>
                    </div>
                </div>
                <strong>$${(i.cantidad * i.precio).toLocaleString()}</strong>
            </div>
        `).join('')
        : `<p style="text-align:center;color:#666">Detalle enviado por correo</p>`;

    document.getElementById('order-total').innerText =
        `Total: $${(total + shipping).toLocaleString()}`;
}
