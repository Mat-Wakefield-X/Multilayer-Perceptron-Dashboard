import { generateEncodingImages } from './draw_weights.js';
import { saveEncodingImages } from './draw_weights.js';

document.querySelector('#generate-features-btn').addEventListener('click', async () => {
    const svg = document.getElementById('features_svg');
    const spinner = document.getElementById('feature-spinner');
    svg.innerHTML = ''; // Clear previous content
    spinner.style.display = 'inline-block';
    console.log('Generating feature images...');
    await new Promise(resolve => {
        setTimeout(() => {
            // generateEncodingImages();
            saveEncodingImages();
            resolve();
        }, 10); // Allow spinner to render
    });
    spinner.style.display = 'none';
    console.log('Feature images generated.');
});

