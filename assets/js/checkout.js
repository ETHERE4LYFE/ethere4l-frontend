// ==========================================
// CHECKOUT.JS - UX Avanzada & Gestión
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // Use centralized config
    var configScript = document.createElement('script');
    configScript.src = 'assets/js/ethere4l-config.js';
    configScript.onload = function() {
        var API_URL = window.ETHERE4L_CONFIG ? window.ETHERE4L_CONFIG.API_BASE : 'https://ethereal-backend-production-6060.up.railway.app';
        window._CHECKOUT_API_URL = API_URL;

        var params = new URLSearchParams(window.location.search);
        var orderId = params.get('order');
        var token = params.get('token');

        if (orderId && token) {
            initTrackingMode(orderId, token);
        } else {
            initCheckout();
        }
    };
    // Fallback if config already loaded
    if (window.ETHERE4L_CONFIG) {
        configScript.onload();
    } else {
        document.head.appendChild(configScript);
    }
});

function getApiUrl() {
    if (window.ETHERE4L_CONFIG) return window.ETHERE4L_CONFIG.API_BASE;
    if (window._CHECKOUT_API_URL) return window._CHECKOUT_API_URL;
    return 'https://ethereal-backend-production-6060.up.railway.app';
}

function initCheckout() {
    if (typeof getCart === 'function') {
        renderResumenInteractivo();
        renderUpsells();
    }

    const form = document.getElementById('form-pedido');
    if (form) {
        form.addEventListener('submit', handleCheckoutSubmit);
    }
}

function renderResumenInteractivo() {
    const cart = getCart();
    const container = document.getElementById('checkout-cart-items');
    const totalElem = document.getElementById('checkout-total');
    const tipElem = document.getElementById('shipping-tip');

    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = '<p class="empty-msg">Tu bolsa está vacía.</p>';
        if(totalElem) totalElem.innerText = "0.00";
        return;
    }

    let total = 0;
    let totalItems = 0;

    container.innerHTML = cart.map(item => {
        const subtotal = item.precio * item.cantidad;
        total += subtotal;
        totalItems += item.cantidad;

        const sizes = ['S', 'M', 'L', 'XL'];
        const options = sizes.map(s =>
            `<option value="${s}" ${item.talla === s ? 'selected' : ''}>${s}</option>`
        ).join('');

        const itemAlt = item.nombre || 'Producto ETHEREAL';

        return `
        <div class="cart-item-interactive" data-id="${item.id}" data-talla="${item.talla}">
            <img src="${item.imagen}" alt="${itemAlt}" width="600" height="800" loading="lazy" decoding="async" onerror="this.style.display='none'">
            <div class="item-details">
                <h4>${item.nombre}</h4>
                <div class="controls-row">
                    <select class="size-select" onchange="changeSize('${item.id}', '${item.talla}', this.value)">
                        ${options}
                    </select>
                    <div class="qty-controls">
                        <button type="button" onclick="updateQty('${item.id}', '${item.talla}', -1)">−</button>
                        <span>${item.cantidad}</span>
                        <button type="button" onclick="updateQty('${item.id}', '${item.talla}', 1)">+</button>
                    </div>
                </div>
                <p class="price">$${subtotal.toLocaleString('es-MX')}</p>
            </div>
            <button class="btn-remove" onclick="removeItem('${item.id}', '${item.talla}')">×</button>
        </div>`;
    }).join('');

    if (totalElem) totalElem.innerText = total.toLocaleString('es-MX', {minimumFractionDigits: 2});
    updateShippingMessage(totalItems, tipElem);
}

function updateShippingMessage(count, element) {
    if (!element) return;
    if (count === 1) {
        element.innerHTML = `💡 <strong>Tip:</strong> Agrega 1 pieza más y ahorra en el envío.`;
        element.className = "shipping-tip active";
    } else if (count >= 2) {
        element.innerHTML = `✅ <strong>¡Excelente!</strong> Estás aprovechando el envío optimizado.`;
        element.className = "shipping-tip success";
    } else {
        element.innerHTML = "";
    }
}

function renderUpsells() {
    const container = document.getElementById('upsell-container');
    if (!container) return;

    const recommended = [
        { id: "ACC-001", nombre: "ETHEREAL Socks", precio: 450, imagen: "https://via.placeholder.com/100/000000/FFFFFF?text=Socks" },
        { id: "ACC-002", nombre: "Signature Cap", precio: 800, imagen: "https://via.placeholder.com/100/000000/FFFFFF?text=Cap" }
    ];

    container.innerHTML = `
        <h3>Complementa tu Flow</h3>
        <div class="upsell-grid">
            ${recommended.map(prod => `
                <div class="upsell-card">
                    <img src="${prod.imagen}" alt="${prod.nombre}" width="600" height="800" loading="lazy" decoding="async">
                    <div>
                        <p>${prod.nombre}</p>
                        <span>$${prod.precio}</span>
                        <button type="button" onclick="addUpsell('${prod.id}', '${prod.nombre}', ${prod.precio}, '${prod.imagen}')">Agregar</button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

window.updateQty = function(id, talla, delta) {
    if (typeof updateItemQuantity === 'function') {
        updateItemQuantity(id, talla, delta);
        renderResumenInteractivo();
    }
};

window.removeItem = function(id, talla) {
    if (typeof removeFromCart === 'function') {
        removeFromCart(id, talla);
        renderResumenInteractivo();
    }
};

window.changeSize = function(id, oldSize, newSize) {
    const cart = getCart();
    const item = cart.find(i => String(i.id) === String(id) && i.talla === oldSize);
    if (item) {
        removeFromCart(id, oldSize);
        addToCart({ ...item, talla: newSize });
        renderResumenInteractivo();
    }
};

window.addUpsell = function(id, nombre, precio, imagen) {
    addToCart({ id, nombre, precio, imagen, talla: 'Unitalla', cantidad: 1 });
    renderResumenInteractivo();
};

async function handleCheckoutSubmit(e) {
    e.preventDefault();

    const btn = document.getElementById('btn-comprar');
    const originalText = btn.innerText;

    const email = document.getElementById('email').value.trim();
    if (!email.includes('@')) return alert("Email inválido.");
    const cart = getCart();
    if (cart.length === 0) return alert("Tu bolsa está vacía.");

    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span> PROCESANDO...`;
    btn.style.cursor = 'not-allowed';

    const clienteData = {
        nombre: document.getElementById('nombre').value.trim(),
        email: email,
        telefono: document.getElementById('telefono').value.trim(),
        direccion: {
            calle: document.getElementById('calle').value.trim(),
            colonia: document.getElementById('colonia').value.trim(),
            cp: document.getElementById('cp').value.trim(),
            ciudad: document.getElementById('ciudad').value.trim(),
            estado: document.getElementById('estado').value.trim(),
            completa: `${document.getElementById('calle').value}, ${document.getElementById('colonia').value}`
        },
        notas: document.getElementById('notas').value.trim()
    };
    sessionStorage.setItem('checkout_cliente', JSON.stringify(clienteData));

    try {
        if (typeof window.iniciarCheckoutSeguro === 'function') {
            await window.iniciarCheckoutSeguro('btn-comprar');
        } else {
            throw new Error("Sistema de pago no inicializado.");
        }
    } catch (err) {
        console.error(err);
        alert("Hubo un problema de conexión. Intenta de nuevo.");
        btn.disabled = false;
        btn.innerText = originalText;
        btn.style.cursor = 'pointer';
    }
}

async function initTrackingMode(orderId, token) {
    var API_URL = getApiUrl();
    const container = document.querySelector('.checkout-container');
    if (!container) return;

    container.innerHTML = `
        <div class="tracking-loader-container">
            <div class="spinner"></div>
            <h3 id="loader-status">Verificando pedido...</h3>
            <p>Estamos confirmando tu pago.</p>
        </div>
    `;

    try {
        const data = await waitForOrderAvailability(orderId, token, API_URL);

        if (window.Analytics) {
            Analytics.trackTrackingView(data.id, data.status);
            const key = `tracked_${data.id}`;
            if (!sessionStorage.getItem(key)) {
                Analytics.trackPurchase(data);
                sessionStorage.setItem(key, '1');
            }
        }

        renderTrackingResult(data);

    } catch (err) {
        container.innerHTML = `
            <p>⛔ ${err.message}</p>
            <a href="index.html" class="btn-black">Volver al inicio</a>
        `;
    }
}

async function waitForOrderAvailability(orderId, token, API_URL) {
    const MAX_RETRIES = 6;
    let attempt = 0;
    let delay = 1000;
    const statusMsg = document.getElementById('loader-status');

    while (attempt < MAX_RETRIES) {
        const res = await fetch(
            `${API_URL}/api/orders/track/${orderId}`,
            { headers: { 'Authorization': `Bearer ${token}` } }
        );

        if (res.ok) return await res.json();

        if (res.status === 401 || res.status === 403) {
            const err = await res.json();
            throw new Error(err.error || 'Acceso inválido');
        }

        if (res.status === 404) {
            attempt++;
            if (statusMsg) {
                statusMsg.innerText = attempt < 3 ? 'Sincronizando pedido...' : 'Finalizando registro...';
            }
            if (attempt >= MAX_RETRIES) throw new Error('El pedido aún no aparece. Intenta recargar.');
            await new Promise(r => setTimeout(r, delay));
            delay = Math.min(delay * 1.5, 4000);
            continue;
        }

        throw new Error('Error de conexión con el servidor.');
    }
}

function renderTrackingResult(data) {
    const container = document.querySelector('.checkout-container');
    if (!container) return;

    container.innerHTML = `
        <h2>Pedido #${data.id.slice(-6)}</h2>
        <p><strong>Estado:</strong> ${data.status}</p>
        ${data.tracking_number ? `<p><strong>Guía:</strong> ${data.tracking_number}</p>` : ''}
        <hr>
        ${data.items.map(i => `<p>${i.cantidad}x ${i.nombre}</p>`).join('')}
        <h3>Total: $${data.total}</h3>
        <a href="catalogo.html" class="btn-black">Seguir comprando</a>
    `;
}