// ==========================================
// CART.JS - Lógica Global del Carrito
// ==========================================

// Clave para guardar en el navegador
const CART_KEY = 'ethereal_cart_v1';
// URL del Backend (Producción Railway)
const API_PRODUCTION = "https://api.ethere4l.com";


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

// 2. Guardar carrito y notificar eventos
function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    // Dispara evento para que otros scripts (header, checkout) se enteren
    window.dispatchEvent(new Event('cartUpdated'));
    // Si existe la función visual del contador, la ejecutamos
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

    // Buscar si ya existe este item (mismo ID y misma Talla)
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
            // --- Propiedades para cálculo logístico ---
            peso: Number(producto.peso) || 0.6, // Default 0.6kg
            sourcing: producto.sourcing || false
        });
    }

    saveCart(cart);
    console.log(`✅ Agregado: ${producto.nombre} | $${precioNumerico}`);
    alert("Producto agregado al carrito"); // Feedback visual simple
}

// 4. Calcular Total
function getCartTotal() {
    const cart = getCart();
    return cart.reduce((total, item) => {
        const p = Number(item.precio) || 0;
        const q = Number(item.cantidad) || 0;
        return total + (p * q);
    }, 0); // ✅ CORRECCIÓN: Se agregó el 0 inicial para evitar errores en arrays vacíos
}

// 5. Funciones Auxiliares Globales (Window)

window.removeFromCart = function(id, talla) {
    let cart = getCart();
    // Filtrar manteniendo tipos consistentes
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
            // Si baja a 0, eliminamos
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
   INTEGRACIÓN STRIPE & BACKEND (Checkout Seguro)
   ========================================================================== */

/**
 * Envía el carrito + datos del cliente al backend para iniciar sesión de Stripe.
 * @param {string} btnId - ID del botón que dispara la acción (para efecto de carga)
 */
window.iniciarCheckoutSeguro = async function(btnId = 'btn-checkout') {
    const cart = getCart();
    
    if (cart.length === 0) {
        alert("Tu bolsa está vacía.");
        return;
    }

    // UI Loading
    const btn = document.getElementById(btnId);
    let textoOriginal = "";
    if(btn) {
        textoOriginal = btn.innerText;
        btn.innerText = "Conectando con Stripe...";
        btn.disabled = true;
    }

    try {
        // 1. Intentar recuperar datos del cliente (Si vienen desde checkout.js)
        let clienteData = null;
        try {
            const storedData = sessionStorage.getItem('checkout_cliente');
            if (storedData) {
                clienteData = JSON.parse(storedData);
            }
        } catch (e) {
            console.warn("No se encontraron datos de cliente en sessionStorage");
        }

        // 2. Determinar URL de la API
        const apiUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
            ? 'http://localhost:3000/api/create-checkout-session'
            : PRODUCTION_API;

        console.log(`🔄 Iniciando Checkout hacia: ${apiUrl}`);

        // 3. Petición al Backend
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                items: cart,
                customer: clienteData // Enviamos los datos del formulario si existen
            })
        });

        const data = await response.json();

        // 4. Manejo de Respuesta
        if (response.ok && data.url) {
            console.log("✅ Sesión creada, redirigiendo...");
            window.location.href = data.url; // Redirige a Stripe
        } else {
            throw new Error(data.error || "Error desconocido del servidor");
        }

    } catch (error) {
        console.error("❌ Checkout Error:", error);
        alert("No se pudo iniciar el pago: " + error.message);
        
        // Restaurar botón
        if(btn) {
            btn.innerText = textoOriginal;
            btn.disabled = false;
        }
    }
}