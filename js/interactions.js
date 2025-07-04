function applyEventListener(elements) {
    console.log('Applying event listeners to encoding images');
    console.log(elements);
    elements.forEach(img => {
        img.addEventListener('mouseenter', function (e) {
            // Extract feature number from src
            const match = img.id.match(/feature_(\d+)/);
            const num = match ? match[1] : '?';
            // Prepare feature object for tooltip
            const feature = {
                name: `Feature encoding #${num}`,
                description: ''
            };
            showEncodingTooltip(e, feature, img);
        });

        img.addEventListener('mousemove', function (e) {
            // Move tooltip with mouse
            showEncodingTooltip(e, null, img);
        });

        img.addEventListener('mouseleave', function () {
            const tooltip = document.getElementById('encoding-tooltip');
            tooltip.style.display = 'none';
        });
    });
}

function showEncodingTooltip(event, feature, img) {
    const scale = 4; // Scale factor for tooltip image size
    const tooltip = document.getElementById('encoding-tooltip');
    // If feature is provided, set content; otherwise, just reposition
    if (feature) {
        tooltip.innerHTML = `
            <div style="font-weight:bold; margin-bottom:6px;">${feature.name}</div>
            <img src="${img.src}" style="width:${img.width * scale}px;height:${img.height * scale}px;display:block;margin:auto;" />
        `;
    }
    tooltip.style.display = 'block';

    // Position tooltip near mouse, but keep on screen
    const tooltipRect = tooltip.getBoundingClientRect();
    let x = event.clientX + 16;
    let y = event.clientY + 16;
    if (x + tooltipRect.width > window.innerWidth) {
        x = window.innerWidth - tooltipRect.width - 8;
    }
    if (y + tooltipRect.height > window.innerHeight) {
        y = window.innerHeight - tooltipRect.height - 8;
    }
    tooltip.style.left = x + 'px';
    tooltip.style.top = y + 'px';
}