const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputDir = './images'; // Ajusta si usas otra carpeta
const quality = 80;

function convertImages(directory) {
    fs.readdirSync(directory).forEach(file => {
        const fullPath = path.join(directory, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            convertImages(fullPath);
        } else if (/\.(jpg|jpeg|png)$/i.test(file)) {
            const outputPath = fullPath.replace(/\.(jpg|jpeg|png)$/i, '.webp');

            sharp(fullPath)
                .webp({ quality })
                .toFile(outputPath)
                .then(() => console.log(`✔ Converted: ${file}`))
                .catch(err => console.error(err));
        }
    });
}

convertImages(inputDir);
