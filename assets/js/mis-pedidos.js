/**
 * assets/js/mis-pedidos.js
 * Passwordless Orders – versión estable (HOTFIX FASE 4)
 */

const API_BASE = 'https://ethereal-backend-production-6060.up.railway.app';

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('token');
    const tokenFromSession = sessionStorage.getItem('magic_token');

    const token = tokenFromUrl || tokenFromSession;

    if (tokenFromUrl) {
        sessionStorage.setItem('magic_token', tokenFromUrl);
    }

    if (token) {
        initOrdersView(token);
    } else {
        initLoginView();
    }
});

// =====================
// LOGIN VIEW
// =====================
function initLoginView() {
    document.getElementById('login-view').style.display = 'block';
    document.getElementById('orders-view').style.display = 'none';

    const form = document.getElementById('magic-form');
    const btn = document.getElementById('btn-send');
    const loader = document.getElementById('loader');
    const msg = document.getElementById('msg-success');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email-input').value.trim();

        btn.disabled = true;
        loader.style.display = 'block';
        msg.style.display = 'none';

        try {
            gtag?.('event', 'magic_link_requested');

            await fetch(`${API_BASE}/api/magic-link`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            loader.style.display = 'none';
            msg.style.display = 'block';
            btn.disabled = false;
            form.reset();

        } catch {
            loader.style.display = 'none';
            btn.disabled = false;
            alert('Error de conexión. Intenta más tarde.');
        }
    });
}

// =====================
// ORDERS VIEW
// =====================
async function initOrdersView(token) {
    document.getElementById('login-view').style.display = 'none';
    document.getElementById('orders-view').style.display = 'block';

    const list = document.getElementById('orders-list');
    list.innerHTML = '<p>Cargando pedidos...</p>';

    try {
        gtag?.('event', 'magic_link_opened');

        const res = await fetch(`${API_BASE}/api/my-orders`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('expired');

        // FIX: Variable 'res' usada correctamente
        const data = await res.json();

        if (!data.orders || data.orders.length === 0) {
            list.innerHTML = '<p>No tienes pedidos registrados.</p>';
            return;
        }

        renderOrders(data.orders);
        gtag?.('event', 'my_orders_viewed', { count: data.orders.length });

    } catch (e) {
        console.error(e);
        sessionStorage.removeItem('magic_token');
        document.getElementById('orders-view').innerHTML = `
            <div style="text-align:center;padding:40px">
                <h3>🔒 Acceso expirado</h3>
                <p>Por seguridad, solicita un nuevo enlace.</p>
                <a href="mis-pedidos.html" class="btn-black">Solicitar enlace</a>
            </div>
        `;
    }
}

function renderOrders(orders) {
    const list = document.getElementById('orders-list');
    const token = sessionStorage.getItem('magic_token');

    const BRAND_IMAGE = "https://placehold.co/150x150/000000/FFFFFF/png?text=ETHERE4L";

    list.innerHTML = orders.map(o => {
        const link = `pedido-ver.html?id=${o.id}&token=${token}`;

        return `
        <div class="order-card">
            <img src="${BRAND_IMAGE}" class="thumb-img">
            <h3>Pedido #${o.id.slice(0,8)}</h3>
            <p>$${o.total.toLocaleString('es-MX')}</p>
            <a class="btn-view" href="${link}">Ver pedido</a>
        </div>
        `;
    }).join('');
}

window.logout = () => {
    sessionStorage.removeItem('magic_token');
    location.href = 'mis-pedidos.html';
};