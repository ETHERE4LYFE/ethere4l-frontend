   const formatCurrency = (amount) =>
    new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    }).format(amount);
document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('id');
    const urlToken = params.get('token');
 


    // Hydration segura
    if (urlToken) {
        sessionStorage.setItem('magic_token', urlToken);
        history.replaceState({}, '', `pedido-ver.html?id=${orderId}`);
    }

    const token = sessionStorage.getItem('magic_token');

    if (!orderId || !token) {
        document.body.innerHTML = '<h3>Sesión expirada</h3>';
        return;
    }

    try {
        const res = await fetch(
            `https://ethereal-backend-production-6060.up.railway.app/api/orders/track/${orderId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );

        if (!res.ok) throw new Error('Unauthorized');

        const order = await res.json();

        renderOrder(order);

    } catch (e) {
        console.error(e);
        document.body.innerHTML = '<h3>Error cargando pedido</h3>';
    }
});

function renderOrder(order) {
    // --- HEADER ---
    document.getElementById('order-id').innerText =
        `Pedido #${order.id.slice(0,8)}`;

    const orderDate = order.date
        ? new Date(order.date).toLocaleDateString('es-MX', {
            day: 'numeric', month: 'long', year: 'numeric'
        })
        : 'Fecha no disponible';

    document.getElementById('order-status').innerHTML =
        `<strong>${order.status}</strong><br>${orderDate}`;

    // --- TIMELINE ---
    if (order.status === 'PAGADO') {
        document.getElementById('step-packed')?.classList.add('active');
    }
    if (order.tracking_number) {
        document.getElementById('step-packed')?.classList.add('active');
        document.getElementById('step-transit')?.classList.add('active');
        document.getElementById('tracking-info').innerHTML =
            `Guía: <strong>${order.tracking_number}</strong>`;
    }
    if (order.status === 'ENTREGADO') {
        document.getElementById('step-delivered')?.classList.add('active');
    }

/* ============================= */
/* HYDRATION LAYER (PRO) */
/* ============================= */

let items = [];
let shippingCost = order.shipping_cost || 0;

// Parse defensivo de order.data
try {
    if (order.data) {
        const parsed = JSON.parse(order.data);
        items = parsed?.pedido?.items || [];
    }
} catch (e) {
    console.warn('No se pudo parsear order.data', e);
}

/* --- TRUST MESSAGE --- */
if (order.status !== 'ENTREGADO') {
    const trustBox = document.getElementById('trust-message-container');
    if (trustBox) trustBox.style.display = 'block';
}

/* --- RENDER ITEMS --- */
const itemsList = document.getElementById('items-list');
itemsList.innerHTML = '';

if (items.length > 0) {
    items.forEach(item => {
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
                    ${formatCurrency(item.precio * item.cantidad)}
                </div>
            </div>
        `;
    });
} else {
    itemsList.innerHTML = `
        <div style="padding:20px;color:#666;text-align:center">
            El detalle de productos fue enviado por correo.
        </div>
    `;
}

/* --- FINANCIAL SUMMARY --- */
const subtotal = items.reduce(
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
            <span>${shippingCost > 0 ? formatCurrency(shippingCost) : 'Gratis'}</span>
        </div>
        <div class="eth-summary-row eth-summary-total">
            <span>Total</span>
            <span>${formatCurrency(order.total)}</span>
        </div>
    </div>
`;

}
