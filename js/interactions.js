import { nodeSelections, activationsAccessor, weights2, normsToggleAccessor, normsMaxAccessor, normsMinAccessor, decodingsAccessor, loadInstance, getInstance, updatePredictions, getModelPredictions, manualAggregateAccessor, salienciesAccessor, maxSimAccessor, bias2 } from "./init.js";
import { generateAggregateImage, drawInputImage, drawInstancesGroup } from "./draw_weights.js";
import { generateImage, getMaxSimilarity as findMaxSimilarity, computeAggregateInstance } from "./generate_images.js";
import { runMNISTInference } from "./run_model.js";

/*
-------------------------------------------------------------------------------
    FEATURE INSPECTIONS
-------------------------------------------------------------------------------
*/

document.querySelector('#reset-manual').addEventListener('click', resetSelections);

document.querySelector('#weighting-toggle').addEventListener('change', function() {
    applyEncodingFeatureStyles();
});

export function tooltipEventListener(elements) {
    console.log('Applying event listeners to encoding images');
    elements.forEach(wrapper => {
        const img = wrapper.querySelector("img");
        const num = extractFeatureNumber(img);

        img.addEventListener('mouseenter', function (e) {
            showEncodingTooltip(e, num, img, wrapper);
        });

        img.addEventListener('touchstart', function (e) {
            // For touch devices, show tooltip on touch
            showEncodingTooltip(e, num, img, wrapper);
        });

        img.addEventListener('mousemove', function (e) {
            // Move tooltip with mouse
            showEncodingTooltip(e, null, img, wrapper);
        });

        img.addEventListener('mouseleave', function () {
            const tooltip = document.getElementById('encoding-tooltip');
            tooltip.style.display = 'none';
        });
    });
}

export function encodeClickEventListener(elements) {
    elements.forEach(wrapper => {
        const img = wrapper.querySelector("img");
        const num = extractFeatureNumber(img).number;
        img.addEventListener('click', function () {
            selectEncodingFeature(wrapper, img, num);
        });
    });
}

function extractFeatureNumber(img) {
    // Extract feature number from src
    const match = img.id.match(/feature_(\d+)/);
    const num = match ? match[1] : '?';
    // Prepare feature object for tooltip
    const feature = {
        name: `Feature encoding #${num}`,
        number: parseInt(num, 10) || 0 // Ensure it's a number
    };
    return feature;
};

function showEncodingTooltip(event, feature, img, wrapper) {
    const visible = img.classList.contains('visible');
    const selected = wrapper.classList.contains('selected');
    if(visible || selected) {
        const scale = 4; // Scale factor for tooltip image size
        const tooltip = document.getElementById('encoding-tooltip');
        // If feature is provided, set content; otherwise, just reposition
        if (feature) {
            const activation = activationsAccessor()[0][feature.number].toFixed(4);
            const modulation = modulationsAccessor()[feature.number].toFixed(4);
            tooltip.innerHTML = `
                <div style="font-weight:bold; margin-bottom:6px;">${feature.name}</div>
                <img src="${img.src}" style="width:${img.width * scale}px;height:${img.height * scale}px;display:block;margin:auto;" />
                <div style="margin-top: 6px;"><strong>Activation:</strong> ${activation} <strong>Modulation:</strong> ${modulation}</div>
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
}

function selectEncodingFeature(wrapper, img, num) {
    const weightings = document.querySelector("#weighting-toggle").checked;
    const visible = !weightings || (weightings && img.classList.contains('visible'));
    const selected = wrapper.classList.contains('selected');
    if(visible || selected) {
        selectNodes(num, wrapper);
        const images = generateManualImages();

        highlightImage(wrapper); // Update image border based on selection

        const manualSVG = document.querySelector('#manual-svg');
        const saliencySVG = document.querySelector('#manual-saliency-svg');

        generateAggregateImage(5, manualSVG, 'manual-aggregate', images.aggregate); // Regenerate aggregate image
        generateAggregateImage(5, saliencySVG, 'manual-saliency', images.saliency);

        populateSaveImages(manualSVG);
        populateSaveImages(saliencySVG);
    }
}

function selectNodes(num, wrapper) {
    if(!nodeSelections.includes(num)) {
        nodeSelections.push(num);
        wrapper.classList.add('selected'); 
    } else {
        const filtered = nodeSelections.filter(item => item !== num);
        nodeSelections.length = 0; // Clear the array
        nodeSelections.push(...filtered);
        wrapper.classList.remove('selected');
    }
}

function generateManualImages() {
    const aggregate = generateImage(nodeSelections);
    const saliency = {
        image: computeInputSaliency(aggregate),
        min: aggregate.min,
        max: aggregate.max
    }
    manualAggregateAccessor(aggregate, saliency);
    return {
        aggregate: aggregate,
        saliency: saliency
    }
}

function highlightImage(img) {
    if(img.classList.contains('selected')) {
        img.style.border = '2px solid blue'; // Highlight selected image
    } else {
        img.style.border = '2px solid transparent'; // Reset border for unselected images
    }
}

function resetSelections() {
    nodeSelections.length = 0; // Clear the array
    generateAggregateImage(5, document.querySelector('#manual-saliency-svg'), 'manual-saliency');
    generateAggregateImage(5, document.querySelector('#manual-svg'), 'manual-aggregate'); // Regenerate aggregate image
    const highlighted = document.querySelectorAll('.selected');
    highlighted.forEach(img => {
        img.classList.remove('selected'); // Remove the class
        highlightImage(img); // Reset border for highlighted images
    });
}

export function applyEncodingFeatureStyles(){
    const wrappers = document.querySelectorAll('#encoding_features .wrapper');
    const style = document.querySelector("#weighting-toggle").checked;
    const activations = activationsAccessor()[0];

    if(activations != null)
    {
        const maxActivation = Math.max(...activations);
        wrappers.forEach((wrapper, i) => {
            const img = wrapper.querySelector("img");
            const tint = wrapper.querySelector(".tinted");
            if (style) {
                const values = computeOpacityStyles(activations[i], maxActivation);
            
                img.style.opacity = values.opacity;
                tint.style.backgroundColor = values.tint;

                if(values.opacity == 0) {
                    img.classList.remove('visible');
                } else {
                    img.classList.add('visible');
                }
            } else {
                img.style.opacity = "1";
                tint.style.backgroundColor = null;
                img.classList.add('visible');
            }
        });
    }
}

function computeOpacityStyles(value, maxActivation) {
    const normalised = Math.abs(value) / maxActivation;
    const scaled = 0.05 + (normalised * 0.95);
    const opacity = Math.min(scaled, 1).toFixed(3);

    const positive = value > 0;
    const colour = `rgba(${positive ? 0 : 125}, ${positive ? 125 : 0}, 0, ${opacity})`;

    return {
        opacity: (value == 0) ? 0 : opacity,
        tint : (value == 0) ? null : colour
    }
}

/*
-------------------------------------------------------------------------------
    DECODING
-------------------------------------------------------------------------------
*/

document.querySelector('#norms-toggle').addEventListener('change', function (e) {
    normsToggleAccessor(e.target.checked); // Update norms accessor based on toggle state
    drawDecodings();
    drawInputSaliency();
});

document.querySelector('#max-sim-toggle').addEventListener('change', function (e) {
    showHideMaxSim();
    if(e.target.checked) {
        const element = document.querySelector('.top-down-toggle:checked');
        const id = parseInt(element.id.slice(-1), 10);
        handleToggleChange(id, false);
    }
});

document.querySelector('#info-toggle').addEventListener('change', showHideInformation);

document.querySelector('#input-number').addEventListener('change', runPrediction);
document.querySelectorAll('.top-down-toggle').forEach(toggle => {
    const i = parseInt(toggle.id.slice(-1), 10);
    toggle.addEventListener('change',  e => {
        shiftToggles(i);
        handleToggleChange(i); 
    });
});

document.querySelector("#stash-add").addEventListener('click', () => openPopOver(true));
document.querySelector("#stash-expand").addEventListener('click', () => openPopOver(false));
document.querySelector('#save-exit').addEventListener('click', exitPopOver);
document.querySelector('#stash-exit').addEventListener('click', exitPopOver);
document.querySelector("#save-stash").addEventListener('click', stashImages);
document.querySelector('#clear-stash').addEventListener('click', clearStash);
document.querySelector('#remove-stash').addEventListener('click', removeFromStash);
document.querySelector('#save-disk').addEventListener('click', () => downloadItems(true));
document.querySelector('#save-disk-stash').addEventListener('click', () => downloadItems(false));

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function handleToggleChange(id, generate=true) {
    await sleep(300); // allow animation to kick in
    if(generate) {
        decodeRepresentations(id);

        await sleep(0);
        drawDecodings();

        await sleep(0);
        drawInputSaliency();

        // await sleep(0);
        // applyEncodingFeatureStyles();
    }

    const maxSim = document.querySelector('#max-sim-toggle').checked;
    if(maxSim) await drawMaxSimilarity();
}

function runPrediction(e) {
    let index = parseInt(e.target.value, 10);
    if (isNaN(index) || index < 1 || index > 10000) {
        index = Math.max(1, Math.min(10000, parseInt(e.target.value, 10) || 1));
        document.getElementById('input-number').value = index;
    }
    index -= 1; // Convert to 0-based index
    
    const label = loadInput(index);

    runMNISTInference(index).then(({ prediction, activations }) => {
        console.log("Activations", activations);
        activationsAccessor(activations); // Store activations globally
        updatePredictions(prediction, -1);
        updatePredictionDisplay(label);
        shiftToggles(prediction); // Update toggle states based on activations
        handleToggleChange(prediction);
    });
}

function loadInput(index) {
    loadInstance(index);
    const input = getInstance();

    const svg = document.querySelector('#input-svg');
    drawInputImage(input, 2, svg); // Regenerate input image

    populateSaveImages(svg);

    document.getElementById('input-number-label').innerText = input.label; // Update label display
    return input.label;
}

function updatePredictionDisplay(label) {
    const prediction = getModelPredictions().prediction;
    const activations = activationsAccessor();
    const predictionLabel = `${prediction} ${(prediction === label) ? '✅' : '❌'}`;
    document.querySelector('#output-prediction-label').innerText = predictionLabel; // Update prediction display
    for (const [i, value] of activations[1].entries()) {
        const cell = document.querySelector(`#output-${i}`);
        cell.innerText = value.toFixed(4); 
        const container = document.querySelector(`#output-${i}-cell`);
        container.style.backgroundColor = greenOpacityGradient(value); // Set background color based on value
    }
}

function shiftToggles(selected) {
    const toggles = document.querySelectorAll('.top-down-toggle');
    toggles.forEach((toggle, i) => {
        toggle.checked = selected == i; // Check if activation is above threshold
    });
}

function greenOpacityGradient(value) {
    // Clamp value between 0 and 1
    value = Math.max(0, Math.min(1, value));
    value = (value >= 0.0001) ? (value * 0.5) + 0.5 : 0; // Scale to 0.5 to 1 range for opacity
    // Return rgba for green with linear opacity
    return `rgba(85, 170, 85, ${value})`;
}

function decodeRepresentations(i) {
    const positiveSelections = getFeatures(i, true);
    const negativeSelections = getFeatures(i, false);
    const allSelections = getFeatures(i);

    console.log("Selctions", positiveSelections, negativeSelections, allSelections);

    const positiveData = generateImage(positiveSelections, i);
    const negativeData = generateImage(negativeSelections, i);
    const allData = generateImage(allSelections, i, false);

    const decodings = [positiveData, negativeData, allData];

    setGlobalNorms(decodings);
    decodingsAccessor(decodings);
}

function getFeatures(i, positive){
    let condition = null;
    switch (positive){
        case true:
            condition = (value) => value > 0;
            break;
        case false:
            condition = (value) => value < 0;
            break;
        default:
            condition = (value) => true;
    }
    return activationsAccessor()[0].map((value, idx) => value > 0 ? idx : -1)
                .filter(idx => idx !== -1)
                .filter(idx => condition(weights2[idx][i]));
}

function setGlobalNorms(images) {
    const max = Math.max(...images.map(img => img.max));
    const min = Math.min(...images.map(img => img.min));
    normsMaxAccessor(max);
    normsMinAccessor(min);
}

function drawDecodings() {
    const useGlobalNorms = normsToggleAccessor();
    const decodings = decodingsAccessor();

    const posSVG = document.querySelector('#decoded-positive-svg');
    const negSVG = document.querySelector('#decoded-negative-svg');
    const hyperSVG = document.querySelector('#decoded-hyperplane-svg');

    generateAggregateImage(5, posSVG, 'positive-aggregate', decodings[0], useGlobalNorms);
    generateAggregateImage(5, negSVG, 'negative-aggregate', decodings[1], useGlobalNorms);
    generateAggregateImage(5, hyperSVG, 'hyperplane-aggregate', decodings[2], useGlobalNorms);

    populateSaveImages(posSVG);
    populateSaveImages(negSVG);
    populateSaveImages(hyperSVG);
}

function drawInputSaliency() {
    const useGlobalNorms = normsToggleAccessor();
    const decodings = decodingsAccessor();
    const saliencies = decodings.map(decoding => ({
        image: computeInputSaliency(decoding),
        min: decoding.min,
        max: decoding.max
    }));
    salienciesAccessor(saliencies);

    const posSVG = document.querySelector('#saliency-positive-svg');
    const negSVG = document.querySelector('#saliency-negative-svg');
    const hyperSVG = document.querySelector('#saliency-hyperplane-svg');

    generateAggregateImage(5, posSVG, 'positive-saliency', saliencies[0], useGlobalNorms);
    generateAggregateImage(5, negSVG, 'negative-saliency', saliencies[1], useGlobalNorms);
    generateAggregateImage(5, hyperSVG, 'hyperplane-saliency', saliencies[2], useGlobalNorms);

    populateSaveImages(posSVG);
    populateSaveImages(negSVG);
    populateSaveImages(hyperSVG);
}

function computeInputSaliency(comparison) {
    const input = getInstance();
    const arrayMultiplication = input.image.map((val, idx) => val * comparison.image[idx]);
    const dotProduct = arrayMultiplication.reduce((sum, val) => sum + val, 0);
    console.log("Dot Product", dotProduct);
    return arrayMultiplication;
}

async function drawMaxSimilarity() {
    // Select and clear svgs
    const svgs = document.querySelectorAll('[id^="max-"][id$="-svg"]');
    svgs.forEach(svg => {
        svg.innerHTML = '';
        svg.style.display = 'none';
    });
    
    // Show loading spinners
    document.querySelectorAll(".spinner.max-sim").forEach(spinner => {
        spinner.style.display = "block";
    });

    await new Promise(resolve => setTimeout(() => {
        const data = computeMaxSims();
        maxSimAccessor(data);

        drawMaxSimImages(svgs, data);

        // Hide loading spinners
        document.querySelectorAll(".spinner.max-sim").forEach(spinner => {
            spinner.style.display = "none";
        });

        svgs.forEach(svg => {
            svg.style.display = 'block';
        });

        resolve();
    }, 1));
}

function computeMaxSims() {
    const decodings = decodingsAccessor();

    const positive = computeMaxSimData(decodings[0], 6)
    const negative = computeMaxSimData(decodings[1], 6);
    const hyperplane = computeMaxSimData(decodings[2], 6);

    return [positive, negative, hyperplane];
}

export function computeMaxSimData(decoding, k) {
    const images = findMaxSimilarity(decoding, k);
    const aggregate = computeAggregateInstance(images);
    return {
        instances: images,
        image: aggregate
    }
}

export function drawMaxSimImages(svgs, data) {
    drawInstancesGroup(data[0].instances, 2, svgs[0]);
    drawInstancesGroup(data[1].instances, 2, svgs[1]);
    drawInstancesGroup(data[2].instances, 2, svgs[2]);

    drawInputImage(data[0], 4, svgs[3]);
    drawInputImage(data[1], 4, svgs[4]);
    drawInputImage(data[2], 4, svgs[5]);

    svgs.forEach(svg => populateSaveImages(svg));
}

export function showHideInformation() {
    const info = document.querySelector('#info-toggle').checked;
    const informationElements = document.querySelectorAll('.information');
    informationElements.forEach(element => element.style.display = info ? "block" : "none");
}

export function showHideMaxSim(){
    const maxSim = document.querySelector('#max-sim-toggle').checked;
    document.querySelectorAll('.max-sim-message').forEach(message => {
        message.style.display = maxSim ? 'none' : 'block';
    });
    document.querySelectorAll('[id^="max-"][id$="-svg"]')
        .forEach(svg => {
            svg.style.display = 'none';
        });
    document.querySelectorAll('.spinner.max-sim')
        .forEach(spinner => {
            spinner.style.display = maxSim ? 'block' : "none";
        });
}

function populateSaveImages(svg, saveArea=true) {
    const container = document.querySelector(`#${saveArea ? 'save-area' : 'stash'} .image-container`);
    const svgs = container.querySelectorAll('svg');
    const cloned = svg.cloneNode(true);
    const saveImageElement = createSaveImageHTML(cloned);
    const existingSvg = Array.from(svgs).find(existingSvg => existingSvg.id === cloned.id);
    if (existingSvg) {
        // Replace the parent .save-image container
        const parent = existingSvg.closest('.save-image');
        if (parent) {
            container.replaceChild(saveImageElement, parent);
        }
    } else {
        container.appendChild(saveImageElement);
    }
}

function createSaveImageHTML(svg) {
    const container = document.createElement('div');
    container.classList.add('save-image');
    container.setAttribute('data-selected', 'false');
    container.setAttribute('input-num', getInstance().index);

    const text = document.createElement('span');
    text.textContent = svg.id.replace(/-/g, ' ').replace(/svg/i, '').trim();
    svg.id = svg.id.replace(/svg/i, 'save');

    svg.removeAttribute('class');
    svg.removeAttribute('style');

    container.appendChild(svg);
    container.appendChild(text);

    addEventListenerToSaveImage(container);

    return container;
}

function addEventListenerToSaveImage(image) {
    image.addEventListener('click', () => {
        const isSelected = image.classList.toggle('selected');
        image.setAttribute('data-selected', isSelected);
    });
}

function stashImages() {
    const selected = document.querySelectorAll('.save-image[data-selected="true"]');
    const stash1 = document.querySelector('#stash .image-container');
    const stash2 = document.querySelector('#stash-aside .image-container');
    
    if(selected.length > 0) {
        selected.forEach(image => {
            const clone = image.cloneNode(true);
            clone.removeAttribute('class');
            clone.classList.add('stash-image');
            stash1.appendChild(clone);
            addEventListenerToSaveImage(clone);
            
            const clone2 = clone.cloneNode(true);
            stash2.append(clone2);
        });
        exitPopOver();
    } else {
        showFeedback("#save-feedback", "Select items to stash...");
    }
}

function removeFromStash() {
    const stash = document.querySelector('#stash .image-container');
    
    const removed = stash.querySelectorAll('.stash-image[data-selected="true"]');
    console.log("To remove", removed.length);
    if(removed.length > 0) {
        removed.forEach(image => image.remove());
        
        const stash2 = document.querySelector('#stash-aside .image-container');
        stash2.innerHTML = '';

        const images = stash.querySelectorAll(".stash-image");
        images.forEach(image => {
            stash2.append(image.cloneNode(true));
        })
    } else {
        showFeedback("#stash-feedback", 'Select items to remove...');
    }
}

function downloadItems(save) {
    const id = `#${save ? 'save-area' : 'stash'}`;
    const images = `${save ? 'save' : 'stash'}-image`;
    const query = `${id} .image-container .${images}[data-selected="true"]`;
    const selected = document.querySelectorAll(query);
    console.log("Downloading:", query, selected);
    if(selected.length > 0)
    {
        processDownload(Array.from(selected));
        exitPopOver();
    } else {
        const id2 = `#${save ? 'save' : 'stash'}-feedback`;
        showFeedback(id2, "Select items to download...");
    }
}

async function processDownload(selected) {
    console.log("Processing download:", selected);

    const files = selected.map((data, index) => {
        const svg = data.querySelector('svg').cloneNode(true);
        svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");

        const serializer = new XMLSerializer();
        const file = serializer.serializeToString(svg);
        const name = data.querySelector('span').textContent.replace(' ', '_');
        const inputNum = data.getAttribute('input-num');
        const fileName = `${index}-${name}_[input#${inputNum}].svg`

        return {
            svg: file,
            name: fileName
        }
    });

    console.log("Files:", files);

    if(files.length > 1) {
        const zip = new JSZip(); // Use global JSZip
        files.forEach(file => zip.file(file.name, file.svg));
        const content = await zip.generateAsync({ type: "blob" });
        triggerDownload(content, 'images.zip');
    } else {
        const blob = new Blob([files[0].svg], { type: "image/svg+xml" });
        triggerDownload(blob, files[0].name);
    }
}

function triggerDownload(content, fileName) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(content);
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

async function showFeedback(id, message) {
    const box = document.querySelector(id);
    const text = box.querySelector('span');
    if(message) {
        text.textContent = message;
        box.classList.add('visible');

        setTimeout(() => {
            box.classList.remove('visible');
        }, 2000);
    } else {
        box.classList.remove('visible');
    }
}

function clearStash() {
    document.querySelector('#stash .image-container').innerHTML = '';
    document.querySelector('#stash-aside .image-container').innerHTML = '';
    exitPopOver();
}

function openPopOver(saveArea) {
    document.querySelector('#pop-over').classList.add('active');
    const id = `#${saveArea ? 'save-area' : 'stash'}`;
    document.querySelector(id).classList.add('visible');
    document.body.classList.add('no-scroll');
}

function exitPopOver() {
    const saveArea = document.querySelector('#save-area');
    const stashArea = document.querySelector('#stash');
    
    saveArea.querySelectorAll('.save-image')
        .forEach(image => {
            image.setAttribute('data-selected', false);
            image.classList.remove('selected');
        })

    stashArea.querySelectorAll('.stash-image')
        .forEach(image => {
            image.setAttribute('data-selected', false);
            image.classList.remove('selected');
        })

    document.querySelector('#pop-over').classList.remove('active');

    saveArea.classList.remove('visible');
    stashArea.classList.remove('visible');
    document.body.classList.remove('no-scroll');
}