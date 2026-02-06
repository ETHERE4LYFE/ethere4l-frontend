document.addEventListener('DOMContentLoaded', async () => {

    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('id');
    const tokenFromUrl = params.get('token');
    const tokenFromSession = sessionStorage.getItem('magic_token');

    const token = tokenFromUrl || tokenFromSession;
    const isEmailAccess = Boolean(tokenFromUrl);

    if (!orderId || !token) {
        showSessionExpired();
        return;
    }

    try {
        const res = await fetch(
            `https://ethereal-backend-production-6060.up.railway.app/api/orders/track/${orderId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );

        if (res.status === 401 || res.status === 403) {
            showSessionExpired();
            return;
        }

        if (!res.ok) throw new Error('Error API');

        const order = await res.json();

        // 👇 pasamos isEmailAccess correctamente
        renderOrder(order, isEmailAccess);

    } catch (err) {
        console.error(err);
        document.body.innerHTML = '<h3>Error cargando pedido</h3>';
    }
});


function renderOrder(order, isEmailAccess) {
    // --- HEADER ---
    document.getElementById('order-id').innerText =
        `Pedido #${order.id.slice(0,8)}`;
                const orderDate = order.date
                ? new Date(order.date + 'Z').toLocaleDateString('es-MX', {
                    timeZone: 'America/Mexico_City',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                })
                : 'Fecha no disponible';

    document.getElementById('order-status').innerHTML =
        `<strong>${order.status}</strong><br>${orderDate}`;

    // --- TIMELINE ---
    if (['PAGADO', 'paid', 'confirmed'].includes(order.status)) {
        document.getElementById('step-packed')?.classList.add('active');
    }
    if (order.tracking_number) {
        document.getElementById('step-packed')?.classList.add('active');
        document.getElementById('step-transit')?.classList.add('active');
    }
    if (order.status === 'ENTREGADO') {
        document.getElementById('step-delivered')?.classList.add('active');
    }
    const trackingBox = document.getElementById('tracking-info');
    const itemsList = document.getElementById('items-list');
itemsList.innerHTML = ''; // limpiar primero

if (!order.items || !order.items.length) {
    itemsList.innerHTML = `
        <div style="padding:20px;color:#666;text-align:center">
            No hay productos disponibles para mostrar.
        </div>
    `;
} else {
    order.items.forEach(item => {
        const img = item.imagen || 'assets/img/logo-ethereal.png';

        itemsList.innerHTML += `
            <div class="eth-item-row">
                <img src="${img}" class="eth-item-img"
                     onerror="this.src='assets/img/logo-ethereal.png'">

                <div class="eth-item-info">
                    <div class="eth-item-title">${item.nombre}</div>
                    <div class="eth-item-meta">
                        Talla: ${item.talla || 'N/A'} · Cant: ${item.cantidad}
                    </div>
                </div>

                <div class="eth-item-price">
                    ${formatCurrency(item.subtotal || (item.precio * item.cantidad))}
                </div>
            </div>
        `;
    });
}
    
    itemsList.innerHTML = ''; // 🔥 LIMPIA “Cargando productos…”
   if (!order.items || !order.items.length) {
        itemsList.innerHTML = `
        <div style="padding:20px;color:#666;text-align:center">
        No hay productos disponibles para mostrar.
        </div>
        `;
        return;
}

if (!order.tracking_number) {
    trackingBox.innerHTML = `
        <div class="eth-trust-message">
            📦 Tu pedido está siendo preparado.<br>
            Te avisaremos por correo cuando sea enviado.
        </div>
    `;
}

trackingBox.innerHTML = `
    <p><strong>Carrier:</strong> ${order.carrier || 'Paquetería'}</p>
    <p><strong>Guía:</strong> ${order.tracking_number}</p>
`;

if (order.tracking_history?.length) {
    trackingBox.innerHTML += `
        <ul class="timeline">
            ${order.tracking_history.map((e, i) => `
                <li class="timeline-item ${i === 0 ? 'active' : ''}">
                    <div class="timeline-marker"></div>
                    <div class="timeline-content">
                        <strong>${e.status}</strong><br>
                        <small>${e.location || ''}</small><br>
                        <small>${new Date(e.timestamp).toLocaleString('es-MX')}</small>
                    </div>
                </li>
            `).join('')}
        </ul>
    `;
}
 const actions = document.getElementById('pedido-actions');

    if (isEmailAccess) {
        actions.innerHTML = `
            <a href="index.html" class="btn-black">
                Volver al inicio
            </a>
        `;
    } else {
        actions.innerHTML = `
            <a href="mis-pedidos.html" class="btn-black">
                Volver a mis pedidos
            </a>
        `;
    }

    const subtotal = order.items.reduce(
    (sum, i) => sum + (i.precio * i.cantidad), 0
);

document.getElementById('financial-summary').innerHTML = `
    <div class="eth-summary-box">
        <div class="eth-summary-row">
            <span>Subtotal</span>
            <span>${formatCurrency(subtotal)}</span>
        </div>
        <div class="eth-summary-row">
            <span>Envío</span>
            <span>${order.shipping_cost > 0 ? formatCurrency(order.shipping_cost) : 'Gratis'}</span>
        </div>
        <div class="eth-summary-row eth-summary-total">
            <span>Total</span>
            <span>${formatCurrency(order.total || subtotal)}</span>
        </div>
    </div>
`;

if (order.status !== 'ENTREGADO') {
    const trustBox = document.getElementById('trust-message-container');
    if (trustBox) trustBox.style.display = 'block';
}

}







function showSessionExpired() {
    document.body.innerHTML = `
        <div style="max-width:500px;margin:80px auto;text-align:center">
            <h2>Sesión expirada</h2>
            <p>Por seguridad, tu enlace de acceso ya no es válido.</p>
            <a href="mis-pedidos.html" class="btn-black">
                Solicitar nuevo acceso
            </a>
        </div>
    `;
}
