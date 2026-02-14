async function cargarProductos() {
    const grid = document.getElementById('grid-productos');
    const titulo = document.getElementById('titulo-seccion');
    
    if (!grid) return;

    try {
        const res = await fetch('data/productos.json');
        const productos = await res.json();

        const params = new URLSearchParams(window.location.search);
        const marcaFiltro = params.get('marca');

        let productosAMostrar;

        if (marcaFiltro) {
            productosAMostrar = productos.filter(p => p.marca.toLowerCase() === marcaFiltro.toLowerCase());
            if (titulo) titulo.innerText = marcaFiltro.replace(/-/g, ' ').toUpperCase();
        } else {
            productosAMostrar = productos.filter(p => p.destacado === true);
            if (titulo) titulo.innerText = "PRODUCTOS DESTACADOS";
        }

        if (productosAMostrar.length === 0) {
            grid.innerHTML = `<p style="grid-column: 1/-1; text-align:center; padding: 50px;">Próximamente más productos de esta colección.</p>`;
            return;
        }

        grid.innerHTML = ""; 
        productosAMostrar.forEach((p, index) => {
            const foto2 = p.fotos[1] ? p.fotos[1] : p.fotos[0];
            const isFirstImage = index === 0;
            
            if (index === 0) {
                const preload = document.getElementById('lcp-preload');
                if (preload) {
                    preload.href = p.fotos[0];
                }
            }
            
            grid.innerHTML += `
                <a href="producto.html?id=${p.id}" class="producto-card">
                    <div class="img-container">
                        <img 
                            src="${p.fotos[0]}" 
                            class="img-primary" 
                            alt="${p.nombre}" 
                            width="600" 
                            height="800" 
                            decoding="async"
                            ${isFirstImage ? 'fetchpriority="high"' : 'loading="lazy"'}>
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
                </a>
            `;
        });

    } catch (error) {
        console.error("Error al cargar productos:", error);
        grid.innerHTML = "<p>Error al conectar con la base de datos.</p>";
    }
}

function revealOnScroll() {
    if (window.innerWidth > 768) return; 
    const cards = document.querySelectorAll('.producto-card');
    const triggerBottom = window.innerHeight * 0.5; 

    cards.forEach(card => {
        const cardTop = card.getBoundingClientRect().top;
        const cardBottom = card.getBoundingClientRect().bottom;
        if (cardTop < triggerBottom && cardBottom > triggerBottom) {
            card.classList.add('reveal-back');
        } else {
            card.classList.remove('reveal-back');
        }
    });
}

document.addEventListener('DOMContentLoaded', cargarProductos);
window.addEventListener('scroll', revealOnScroll);