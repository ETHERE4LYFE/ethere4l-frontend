document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('order');
    const token = params.get('token');

    if (!orderId || !token) {
        document.body.innerHTML = '<p style="padding:40px">Acceso inválido</p>';
        return;
    }

    try {
        const res = await fetch(
            `https://ethereal-backend-production-6060.up.railway.app/api/orders/track/${orderId}?token=${token}`
        );

        if (!res.ok) throw new Error();

        const data = await res.json();

        document.getElementById('order-id').innerText =
            `Pedido #${data.id.slice(-6)}`;

        document.getElementById('order-status').innerText =
            `Estado: ${data.status}`;

        if (data.tracking_number) {
            document.getElementById('step-shipped').classList.add('active');
            document.getElementById('tracking-info').innerHTML =
                `Guía: <strong>${data.tracking_number}</strong>`;
        }

        document.getElementById('items-list').innerHTML =
            data.items.map(i => `
                <div style="margin-bottom:10px">
                    ${i.nombre} × ${i.cantidad}
                </div>
            `).join('');

        document.getElementById('order-total').innerText =
            `Total: $${data.total.toLocaleString('es-MX')}`;

    } catch {
        document.body.innerHTML =
            '<p style="padding:40px">No se pudo cargar el pedido</p>';
    }
});
