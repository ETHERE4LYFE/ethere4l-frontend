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
                document.getElementById('tracking-info').innerHTML =
                `Guía: <strong>${data.tracking_number}</strong>`;

    // Timeline logic
        document.getElementById('step-packed')?.classList.add('active');
        document.getElementById('step-transit')?.classList.add('active');
}
if (data.status === 'ENTREGADO') {
    document.getElementById('step-delivered')?.classList.add('active');
}


  
        document.getElementById('items-list').innerHTML =
    data.items.map(i => {
        const img = i.imagen && i.imagen.length > 5
            ? i.imagen
            : 'https://via.placeholder.com/60?text=ETHERE4L';

        return `
        <div class="invoice-item">
            <div class="item-left">
                <img src="${img}"
                     onerror="this.src='https://via.placeholder.com/60?text=ETHERE4L'">
                <div class="item-meta">
                    <h4>${i.nombre}</h4>
                    <p>Cantidad: ${i.cantidad} × $${i.precio}</p>
                </div>
            </div>
            <strong>$${(i.precio * i.cantidad).toLocaleString('es-MX')}</strong>
        </div>
        `;
    }).join('');


        document.getElementById('order-total').innerText =
            `Total: $${data.total.toLocaleString('es-MX')}`;

    } catch {
        document.body.innerHTML =
            '<p style="padding:40px">No se pudo cargar el pedido</p>';
    }
});
