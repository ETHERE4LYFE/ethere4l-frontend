/**
 * assets/js/mis-pedidos.js
 * Gestión de autenticación passwordless y renderizado de historial
 */

const API_BASE = 'https://ethereal-backend-production-6060.up.railway.app'; // Ajustar si es necesario

document.addEventListener('DOMContentLoaded', () => {
    // Detectar si venimos del correo (Token en URL)
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
        // MODO LECTURA: Tenemos token, cargar pedidos
        initOrdersView(token);
    } else {
        // MODO LOGIN: Mostrar formulario
        initLoginView();
    }
});

// --- VISTA: LOGIN / SOLICITAR ---
function initLoginView() {
    const form = document.getElementById('magic-form');
    const btn = document.getElementById('btn-send');
    const msg = document.getElementById('msg-success');
    const loader = document.getElementById('loader');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email-input').value;

        // UI Loading
        btn.style.display = 'none';
        loader.style.display = 'block';
        msg.style.display = 'none';

        try {
            // Analytics
            gtag('event', 'magic_link_requested');

            const res = await fetch(`${API_BASE}/api/magic-link`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            
            // Siempre mostramos éxito (Seguridad Anti-Enumeración)
            loader.style.display = 'none';
            msg.style.display = 'block';
            form.reset();
            
        } catch (err) {
            console.error(err);
            loader.style.display = 'none';
            btn.style.display = 'block';
            alert("Hubo un error de conexión. Intenta de nuevo.");
        }
    });
}

// --- VISTA: LISTA DE PEDIDOS ---
async function initOrdersView(token) {
    // Switch de vistas
    document.getElementById('login-view').style.display = 'none';
    const container = document.getElementById('orders-view');
    const list = document.getElementById('orders-list');
    
    // UI Loading inicial
    container.style.display = 'block';
    list.innerHTML = '<div class="loader" style="display:block"></div>';

    try {
        // Analytics
        gtag('event', 'magic_link_opened');

        const res = await fetch(`${API_BASE}/api/my-orders`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.status === 401 || res.status === 403) {
            throw new Error("El enlace ha expirado o es inválido.");
        }

        const data = await res.json();
        
        if (data.orders && data.orders.length > 0) {
            renderOrders(data.orders);
            gtag('event', 'my_orders_viewed', { count: data.orders.length });
        } else {
            document.getElementById('empty-state').style.display = 'block';
            list.innerHTML = '';
        }

        // Limpiar URL para limpieza visual (Opcional, pero recomendado)
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Guardar token temporalmente en memoria (sessionStorage) si quieres persistencia al recargar
        // sessionStorage.setItem('magic_token', token);

    } catch (err) {
        container.innerHTML = `
            <div style="text-align:center; padding: 40px;">
                <h3>⛔ Acceso Denegado</h3>
                <p>${err.message}</p>
                <a href="mis-pedidos.html" class="btn-black" style="margin-top:20px; display:inline-block">Solicitar nuevo enlace</a>
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
        
        // Status Class
        const statusClass = `status-${order.status.toLowerCase()}`;
        
        return `
        <div class="order-card">
            <div class="order-info">
                <h3>Pedido #${order.id.slice(-6).toUpperCase()}</h3>
                <div class="order-meta">${date} • ${order.item_count} artículos</div>
                <span class="order-status ${statusClass}">${order.status}</span>
                <div style="font-size:0.85em; color:#888; margin-top:5px; max-width: 300px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${order.items_summary}
                </div>
            </div>
            <div style="text-align:right">
                <div style="font-weight:bold; font-size:1.1rem; margin-bottom:10px">
                    $${order.total.toLocaleString('es-MX')}
                </div>
                <a href="pedido.html?order=${order.id}&token=${order.access_token}" 
                   class="btn-black" 
                   style="padding: 8px 15px; font-size: 0.8rem;"
                   onclick="gtag('event', 'order_opened_from_list')">
                   VER PEDIDO
                </a>
            </div>
        </div>
        `;
    }).join('');
}

window.logout = function() {
    // Simplemente recargar limpia la vista porque no guardamos cookies
    window.location.href = 'mis-pedidos.html';
};