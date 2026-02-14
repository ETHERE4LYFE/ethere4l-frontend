async function cargarProductos() {
    const grid = document.getElementById('grid-productos');
    const heroSection = document.getElementById('lcp-hero');
    const titulo = document.getElementById('titulo-seccion');
    if (!grid) return;
    try {
        const res = await fetch('data/productos.json');
        const productos = await res.json();
        const params = new URLSearchParams(window.location.search);
        const marcaFiltro = params.get('marca');
        let productosAMostrar = marcaFiltro
            ? productos.filter(p => p.marca.toLowerCase() === marcaFiltro.toLowerCase())
            : productos.filter(p => p.destacado === true);
        if (titulo) {
            titulo.innerText = marcaFiltro
                ? marcaFiltro.replace(/-/g, ' ').toUpperCase()
                : "PRODUCTOS DESTACADOS";
        }
        if (!productosAMostrar.length) {
            grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;padding:50px;">Próximamente más productos de esta colección.</p>`;
            if (heroSection) heroSection.style.display = 'none';
            return;
        }
        // Si hay filtro de marca, ocultar el hero estático (solo aplica a destacados)
        if (marcaFiltro && heroSection) {
            heroSection.style.display = 'none';
        }
        grid.innerHTML = "";
        // Saltar el primer producto (ya está en el hero estático) solo cuando NO hay filtro de marca
        const productosParaGrid = marcaFiltro
            ? productosAMostrar
            : productosAMostrar.slice(1);
        const CHUNK_SIZE = 12;
        let index = 0;
        function renderChunk() {
            const fragment = document.createDocumentFragment();
            for (let i = 0; i < CHUNK_SIZE && index < productosParaGrid.length; i++, index++) {
                const p = productosParaGrid[index];
                const foto2 = p.fotos[1] || p.fotos[0];
                const card = document.createElement('a');
                card.href = `producto.html?id=${p.id}`;
                card.className = 'producto-card';
                card.innerHTML = `
                    <div class="img-container">
                        <img 
                            src="${p.fotos[0]}" 
                            class="img-primary" 
                            alt="${p.nombre}" 
                            width="600" 
                            height="800"
                            decoding="async"
                            loading="lazy">
                        <img 
                            src="${foto2}" 
                            class="img-secondary" 
                            alt="${p.nombre}" 
                            width="600" 
                            height="800"
                            loading="lazy"
                            decoding="async">
                    </div>
                    <div class="producto-info">
                        <p class="marca-tag">${p.marca}</p>
                        <h3>${p.nombre}</h3>
                        <p class="precio">${p.precio}</p>
                    </div>
                `;
                fragment.appendChild(card);
            }
            grid.appendChild(fragment);
            if (index < productosParaGrid.length) {
                requestIdleCallback
                    ? requestIdleCallback(renderChunk)
                    : setTimeout(renderChunk, 50);
            }
        }
        renderChunk();
    } catch (error) {
        console.error("Error al cargar productos:", error);
        grid.innerHTML = "<p>Error al conectar con la base de datos.</p>";
    }
}
/* ========================= */
/* SCROLL OPTIMIZADO (TBT FIX) */
/* ========================= */
let ticking = false;
function revealOnScroll() {
    if (window.innerWidth > 768) return;
    if (!ticking) {
        requestAnimationFrame(() => {
            const cards = document.querySelectorAll('.producto-card');
            const trigger = window.innerHeight * 0.5;
            cards.forEach(card => {
                const rect = card.getBoundingClientRect();
                if (rect.top < trigger && rect.bottom > trigger) {
                    card.classList.add('reveal-back');
                }
            });
            ticking = false;
        });
        ticking = true;
    }
}
/* ========================= */
/* EVENT LISTENERS */
/* ========================= */
document.addEventListener('DOMContentLoaded', cargarProductos);
window.addEventListener('scroll', revealOnScroll);