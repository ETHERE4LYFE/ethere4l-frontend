/**
 * assets/js/mis-pedidos.js
 * Passwordless Orders History – ETHERE4L
 */

const API_BASE = 'https://ethereal-backend-production-6060.up.railway.app';

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('token');
    const tokenFromSession = sessionStorage.getItem('magic_token');

    const token = tokenFromUrl || tokenFromSession;

    if (token) {
        initOrdersView(token);
    } else {
        initLoginView();
    }
});

/* ===============================
   LOGIN / MAGIC LINK REQUEST
================================ */
function initLoginView() {
    const form = document.getElementById('magic-form');
    const btn = document.getElementById('btn-send');
    const msg = document.getElementById('msg-success');
    const loader = document.getElementById('loader');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email-input').value.trim();

        btn.style.display = 'none';
        loader.style.display = 'block';
        msg.style.display = 'none';

        try {
            gtag('event', 'magic_link_requested');

            await fetch(`${API_BASE}/api/magic-link`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            loader.style.display = 'none';
            msg.style.display = 'block';
            form.reset();

        } catch (err) {
            console.error(err);
            loader.style.display = 'none';
            btn.style.display = 'block';
            alert('Error de conexión. Intenta de nuevo.');
        }
    });
}

/* ===============================
   ORDERS VIEW
================================ */
async function initOrdersView(token) {
    document.getElementById('login-view').style.display = 'none';

    const container = document.getElementById('orders-view');
    const list = document.getElementById('orders-list');

    container.style.display = 'block';
    list.innerHTML = '<div class="loader" style="display:block"></div>';

    try {
        gtag('event', 'magic_link_opened');

        const res = await fetch(`${API_BASE}/api/my-orders`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!res.ok) throw new Error('TOKEN_INVALID');

        const data = await res.json();

        sessionStorage.setItem('magic_token', token);
        window.history.replaceState({}, document.title, window.location.pathname);

        if (!data.orders || data.orders.length === 0) {
            document.getElementById('empty-state').style.display = 'block';
            list.innerHTML = '';
            return;
        }

        gtag('event', 'my_orders_viewed', { count: data.orders.length });
        renderOrders(data.orders);

    } catch (err) {
        container.innerHTML = `
            <div style="text-align:center;padding:40px;">
                <h3>🔒 Acceso expirado</h3>
                <p>Tu enlace ya no es válido por seguridad.</p>
                <a href="mis-pedidos.html" class="btn-black" style="margin-top:20px;display:inline-block">
                    Solicitar nuevo enlace
                </a>
            </div>
        `;
    }
}

function renderOrders(orders) {
    const list = document.getElementById('orders-list');

    list.innerHTML = orders.map(order => {
        const date = new Date(order.date).toLocaleDateString('es-MX', {
            year: 'numeric', month: 'long', day: 'numeric'
        });

        const statusClass = `status-${order.status.toLowerCase()}`;

        return `
        <div class="order-card">
            <div class="order-info">
                <h3>Pedido #${order.id.slice(-6).toUpperCase()}</h3>
                <div class="order-meta">${date} • ${order.item_count} artículos</div>
                <span class="order-status ${statusClass}">${order.status}</span>
                <div style="font-size:.85em;color:#888;margin-top:5px;">
                    ${order.items_summary}
                </div>
            </div>
            <div style="text-align:right">
                <div style="font-weight:bold;font-size:1.1rem;margin-bottom:10px">
                    $${order.total.toLocaleString('es-MX')}
                </div>
                <a href="pedido.html?order=${order.id}&token=${order.access_token}"
                   class="btn-black"
                   onclick="gtag('event','order_opened_from_list')">
                   Ver pedido
                </a>
            </div>
        </div>
        `;
    }).join('');
}

window.logout = () => {
    sessionStorage.removeItem('magic_token');
    window.location.href = 'mis-pedidos.html';
};
