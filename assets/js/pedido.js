document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('id');
    const tokenFromUrl = params.get('token');

    if (!orderId || !tokenFromUrl) {
        document.body.innerHTML = `
            <div style="padding:40px;text-align:center">
                <h3>❌ No se pudo cargar el pedido</h3>
                <p>El enlace no es válido o expiró.</p>
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
                    Authorization: `Bearer ${tokenFromUrl}`
                }
            }
        );

        if (!res.ok) throw new Error('401');

        const data = await res.json();

        document.getElementById('order-id').innerText =
            `Pedido #${data.id.slice(0, 8)}`;

        document.getElementById('order-status').innerText =
            `Estado: ${data.status}`;

        if (data.tracking_number) {
            document.getElementById('tracking-info').innerHTML =
                `Guía: <strong>${data.tracking_number}</strong>`;
            document.getElementById('step-packed')?.classList.add('active');
            document.getElementById('step-transit')?.classList.add('active');
        }

        if (data.status === 'ENTREGADO') {
            document.getElementById('step-delivered')?.classList.add('active');
        }

        document.getElementById('items-list').innerHTML = `
            <div style="text-align:center;padding:40px;color:#666">
                <img src="https://placehold.co/80x80/000000/FFFFFF?text=ETHERE4L" />
                <p>El detalle del producto fue enviado por correo.</p>
            </div>
        `;

        document.getElementById('order-total').innerText =
            `Total: $${data.total.toLocaleString('es-MX')}`;

    } catch (e) {
        document.body.innerHTML = `
            <div style="padding:40px;text-align:center;color:red">
                <h3>❌ No se pudo cargar el pedido</h3>
                <p>El acceso expiró.</p>
                <a href="mis-pedidos.html" class="btn-black">Volver</a>
            </div>
        `;
    }
});
