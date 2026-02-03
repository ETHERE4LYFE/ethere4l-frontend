document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('id');
    const urlToken = params.get('token');

    if (urlToken) {
        sessionStorage.setItem('magic_token', urlToken);
        history.replaceState({}, '', `pedido-ver.html?id=${orderId}`);
    }

    const token = sessionStorage.getItem('magic_token');

    if (!orderId || !token) {
        document.body.innerHTML = '<h3>Sesión expirada</h3>';
        return;
    }

    const res = await fetch(
        `https://ethereal-backend-production-6060.up.railway.app/api/orders/track/${orderId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );

    const order = await res.json();

    document.getElementById('order-id').innerText = `Pedido #${order.id.slice(0,8)}`;
    document.getElementById('order-status').innerText = order.status;
    document.getElementById('order-total').innerText = `$${order.total.toLocaleString()}`;
});
