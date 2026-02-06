   const formatCurrency = (amount) =>
    new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    }).format(amount);
document.addEventListener('DOMContentLoaded', async () => {


    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('id');
    const tokenFromUrl = params.get('token');
    const tokenFromSession = sessionStorage.getItem('magic_token');

const token =
    localStorage.getItem('ethereal_customer_token') ||
    tokenFromUrl ||
    tokenFromSession;


if (tokenFromUrl) {
    sessionStorage.setItem('magic_token', tokenFromUrl);
}


    // Guard Clauses
    if (!orderId) {
        document.body.innerHTML = '<h3>Error: Pedido no identificado</h3>';
        return;
    }

    if (!token) {
        console.warn('⛔ No hay sesión activa');
        sessionStorage.removeItem('magic_token');
        window.location.href = 'mis-pedidos.html';

        return;
    }

    try {
        const res = await fetch(
            `https://ethereal-backend-production-6060.up.railway.app/api/orders/track/${orderId}`,
            { headers: { Authorization: `Bearer ${token}` } }
        );

        if (res.status === 401) {
            showSessionExpired();
            return;
        }

        if (!res.ok) throw new Error('Error API');

        const order = await res.json();
        renderOrder(order);

    } catch (err) {
        console.error(err);
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

if (!order.tracking_number) {
    trackingBox.innerHTML = `
        <div class="eth-trust-message">
            📦 Tu pedido está siendo preparado.<br>
            Te avisaremos por correo cuando sea enviado.
        </div>
    `;
    return;
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

