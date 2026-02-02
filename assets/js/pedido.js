document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('order');
    let token = params.get('token');
    if (!token) token = sessionStorage.getItem('magic_token');
    if (!orderId || !token) {
        document.body.innerHTML = '<p style="padding:40px">Acceso inválido</p>';
        return;
}


    try {
        const response = await fetch(
  `https://ethereal-backend-production-6060.up.railway.app/api/orders/track/${orderId}?token=${token}`
);
        if (!response.ok) throw new Error();


        // 🔒 Defensive parsing
        let orderMeta = data.data;
        if (typeof orderMeta === 'string') {
            try {
                orderMeta = JSON.parse(orderMeta);
            } catch {
                orderMeta = {};
            }
        }

const items = orderMeta?.pedido?.items || [];
const total = orderMeta?.pedido?.total || 0;


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
        items.map(i => {

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
    `Total: $${total.toLocaleString('es-MX')}`;


    } catch {
        document.body.innerHTML =
            '<p style="padding:40px">No se pudo cargar el pedido</p>';
    }
});

