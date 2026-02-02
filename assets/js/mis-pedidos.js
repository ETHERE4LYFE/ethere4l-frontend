/**
 * assets/js/mis-pedidos.js
 * Passwordless Orders – versión estable
 */

const API_BASE = 'https://ethereal-backend-production-6060.up.railway.app';

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('token');
    const tokenFromSession = sessionStorage.getItem('magic_token');

    const token = tokenFromUrl || tokenFromSession;

    if (!token) token = sessionStorage.getItem('magic_token');


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

        const data = await response.json();


        if (!data.orders || data.orders.length === 0) {
            list.innerHTML = '<p>No tienes pedidos registrados.</p>';
            return;
        }

        renderOrders(data.orders);
        gtag?.('event', 'my_orders_viewed', { count: data.orders.length });

    } catch {
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

    list.innerHTML = orders.map(o => {
        const date = new Date(o.date).toLocaleDateString('es-MX');

        // 🔒 Defensive parsing
        const firstItemImage =
            o.items_summary && o.items_summary.length
                ? o.items_summary.split(',')[0]
                : null;

                let imageUrl = 'https://via.placeholder.com/80/f3f4f6/9ca3af?text=ETHERE4L';
                if (o.items_summary && o.items_summary.includes('http')) {
                    imageUrl = o.items_summary.split(',')[0];
                }


        const badgeClass =
            o.status === 'PAGADO'
                ? 'bg-paid'
                : o.tracking_number
                ? 'bg-transit'
                : 'bg-pending';

        return `
        <div class="order-card">
            <div class="card-header">
                <span class="badge ${badgeClass}">${o.status}</span>
                <span style="font-size:.8rem;color:#666">${date}</span>
            </div>

            <div class="card-body">
                <img src="${imageUrl}" class="thumb-img"
                     onerror="this.src='https://via.placeholder.com/80?text=ETHERE4L'">
                <div>
                    <h3 style="margin:0">Pedido #${o.id.slice(-6)}</h3>
                    <p style="margin:.2rem 0;color:#666">${o.item_count} artículo(s)</p>
                </div>
            </div>

            <div class="card-footer">
                <strong>$${o.total.toLocaleString('es-MX')}</strong>
                <a class="btn-view"href="pedido-ver.html?order=${o.id}">
                Ver pedido
                </a>

            </div>
        </div>
        `;
    }).join('');
}



window.logout = () => {
    sessionStorage.removeItem('magic_token');
    location.href = 'mis-pedidos.html';
};
