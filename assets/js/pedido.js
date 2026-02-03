document.addEventListener('DOMContentLoaded', async () => {
    // FIX: Estandarizado a 'id' (Fase 4)
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('id') || params.get('order'); // Soporte retrocompatible
// ⚠️ EL TOKEN SOLO VIENE DE sessionStorage (regla Fase 4)
    const token = sessionStorage.getItem('magic_token');

    if (!orderId || !token) {
    document.body.innerHTML = `
        <div style="padding:40px; text-align:center;">
            <h3>⚠️ Sesión expirada</h3>
            <p>Vuelve a Mis Pedidos para autenticarte nuevamente.</p>
            <a href="mis-pedidos.html" class="btn-black">Ir a Mis Pedidos</a>
        </div>
    `;
    return;
}


    try {
        // Fetch Defensivo
        const response = await fetch(
            `https://ethereal-backend-production-6060.up.railway.app/api/orders/track/${orderId}`,
            {
                headers: { 'Authorization': `Bearer ${token}` }
            }
        );

        if (!response.ok) throw new Error('Error de red o permisos');

        // FIX: Declaración correcta de 'data' antes de usarla
        const data = await response.json();

        // ❗ ESTE ENDPOINT NO DEVUELVE ITEMS
        const items = [];
        const total = data.total || 0;
        const shipping = data.shipping_cost || 0;


        // --- Render Header ---
        document.getElementById('order-id').innerText = `Pedido #${data.id.slice(0, 8)}`;
        document.getElementById('order-status').innerText = `Estado: ${data.status}`;

        // --- Render Timeline Logic ---
        // Paso 1 (Confirmado) siempre activo por HTML
        
        if (data.status === 'PAGADO' || data.tracking_number || data.status === 'ENTREGADO') {
            document.getElementById('step-packed')?.classList.add('active');
        }
        
        if (data.tracking_number) {
            document.getElementById('step-packed')?.classList.add('active');
            document.getElementById('step-transit')?.classList.add('active');
            
            document.getElementById('tracking-info').innerHTML = 
                `Número de guía: <strong style="color:#000">${data.tracking_number}</strong>`;
        }
        
        if (data.status === 'ENTREGADO') {
            document.getElementById('step-packed')?.classList.add('active');
            document.getElementById('step-transit')?.classList.add('active');
            document.getElementById('step-delivered')?.classList.add('active');
        }

        // --- Render Items ---
        document.getElementById('items-list').innerHTML = items.map(i => {
            const img = (i.imagen && i.imagen.length > 5) 
                ? i.imagen 
                : 'https://placehold.co/60x60/eee/999?text=IMG';

            return `
            <div class="invoice-item">
                <div class="item-left">
                    <img src="${img}" 
                         onerror="this.onerror=null;this.src='https://placehold.co/60?text=Error'">
                    <div class="item-meta">
                        <h4 style="margin:0 0 5px 0">${i.nombre}</h4>
                        <p style="margin:0; color:#666; font-size:0.9rem">Cant: ${i.cantidad} × $${i.precio}</p>
                    </div>
                </div>
                <strong>$${(i.precio * i.cantidad).toLocaleString('es-MX')}</strong>
            </div>
            `;
        }).join('');
        
        // --- Render Total ---
        const totalFinal = total + shipping;
        document.getElementById('order-total').innerText = 
            `Total: $${totalFinal.toLocaleString('es-MX')}`;

    } catch (error) {
        console.error(error);
        document.body.innerHTML = 
            '<div style="padding:40px; text-align:center; color:red"><h3>❌ No se pudo cargar el pedido</h3><p>Verifica tu conexión o intenta loguearte nuevamente.</p></div>';
    }
});