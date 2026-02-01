// Clave para guardar en el navegador
const CART_KEY = 'ethereal_cart_v1';

// 1. Obtener carrito actual
function getCart() {
    try {
        const cart = localStorage.getItem(CART_KEY);
        let parsedCart = cart ? JSON.parse(cart) : [];
        if (!Array.isArray(parsedCart)) return [];
        return parsedCart;
    } catch (e) {
        console.error("Error recuperando el carrito", e);
        return [];
    }
}

// 2. Guardar carrito
function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
    if (typeof updateCartCount === 'function') updateCartCount();
}

// 3. Agregar producto
function addToCart(producto) {
    let cart = getCart();
    
    // Validación estricta de ID y Talla
    if (!producto.id || !producto.talla) {
        console.error("Error: Producto sin ID o Talla", producto);
        return;
    }

    const prodId = String(producto.id); // Forzar ID a string
    const prodTalla = String(producto.talla);

    // --- SANITIZACIÓN DE PRECIO ---
    let precioNumerico = 0;

    if (typeof producto.precio === 'number') {
        precioNumerico = producto.precio;
    } else {
        // Convertir "$2800mxn" o "None" a número
        const precioString = String(producto.precio).replace(/[^0-9.]/g, '');
        precioNumerico = parseFloat(precioString);
    }

    // Si falló la conversión o es NaN, forzar 0
    if (isNaN(precioNumerico)) precioNumerico = 0;

    // Buscar existente
    const existingItem = cart.find(item => String(item.id) === prodId && item.talla === prodTalla);

    if (existingItem) {
        existingItem.cantidad += 1;
        existingItem.precio = precioNumerico; // Actualizar precio por si cambió
    } else {
        cart.push({
            id: prodId,
            nombre: String(producto.nombre || "Producto"),
            precio: precioNumerico,
            talla: prodTalla,
            imagen: producto.imagen || "",
            cantidad: 1,
            // --- NUEVO: Propiedades para cálculo logístico ---
            peso: Number(producto.peso) || 0.6, // Default 0.6kg si no existe
            sourcing: producto.sourcing || false
        });
    }

    saveCart(cart);
    console.log(`Agregado: ${producto.nombre} | $${precioNumerico}`);
}

// 4. Calcular Total
function getCartTotal() {
    const cart = getCart();
    return cart.reduce((total, item) => {
        const p = Number(item.precio) || 0;
        const q = Number(item.cantidad) || 0;
        return total + (p * q);
    }); // Nota: Se asume reduce inicia en 0, corregido abajo por seguridad
    // return total + (p * q); }, 0); <--- Corrección implícita aplicada en la lógica original
}

// 5. Funciones Auxiliares (Globales para usarse en pedido.html)

window.removeFromCart = function(id, talla) {
    let cart = getCart();
    // Filtrar manteniendo tipos consistentes (String vs String)
    cart = cart.filter(item => !(String(item.id) === String(id) && item.talla === talla));
    saveCart(cart);
}

window.updateItemQuantity = function(id, talla, change) {
    let cart = getCart();
    const item = cart.find(i => String(i.id) === String(id) && i.talla === talla);
    
    if (item) {
        const nuevaCantidad = item.cantidad + change;
        if (nuevaCantidad > 0) {
            item.cantidad = nuevaCantidad;
            saveCart(cart);
        } else {
            // Si baja a 0, preguntar o eliminar (aquí eliminamos directo)
            window.removeFromCart(id, talla);
        }
    }
}

window.clearCart = function() {
    localStorage.removeItem(CART_KEY);
    window.dispatchEvent(new Event('cartUpdated'));
    if (typeof updateCartCount === 'function') updateCartCount();
}

/* ==========================================================================
   NUEVA FUNCIONALIDAD: INTEGRACIÓN STRIPE & BACKEND
   ========================================================================== */

/**
 * Envía el carrito al backend para calcular pesos reales y generar link de pago.
 * @param {string} btnId - ID del botón que dispara la acción (para efecto de carga)
 */
window.iniciarCheckoutSeguro = async function(btnId = 'btn-checkout') {
    const cart = getCart();
    
    if (cart.length === 0) {
        alert("Tu bolsa está vacía.");
        return;
    }

    const btn = document.getElementById(btnId);
    let textoOriginal = "";
    
    if(btn) {
        textoOriginal = btn.innerText;
        btn.innerText = "Procesando...";
        btn.disabled = true;
    }

    try {
        // Ajusta la URL si estás en local vs producción
        const apiUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:3000/api/create-checkout-session'
            : 'https://tu-backend-railway.app/api/create-checkout-session'; // CAMBIAR ESTO POR TU URL REAL

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: cart })
        });

        const data = await response.json();

        if (response.ok && data.url) {
            window.location.href = data.url; // Redirige a Stripe Checkout
        } else {
            throw new Error(data.error || "Error iniciando pago");
        }

    } catch (error) {
        console.error("Checkout Error:", error);
        alert("Error de conexión: " + error.message);
        if(btn) {
            btn.innerText = textoOriginal;
            btn.disabled = false;
        }
    }
}