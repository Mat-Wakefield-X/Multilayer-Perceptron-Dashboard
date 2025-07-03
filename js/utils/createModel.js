// Load weights (assuming they're available as binary .npy buffers or JSON arrays)
const layer0Weights = await fetch('/data/model_weights/layer_0.json').then(res => res.json());
const layer1Biases = await fetch('/data/model_weights/layer_1.json').then(res => res.json());
const layer2Weights = await fetch('/data/model_weights/layer_2.json').then(res => res.json());
const layer3Biases = await fetch('/data/model_weights/layer_3.json').then(res => res.json());

console.log(layer0Weights, layer1Biases, layer2Weights, layer3Biases);

// Convert to tensors
const W0 = tf.tensor2d(layer0Weights);   // shape: [784, 800]
const b0 = tf.tensor1d(layer1Biases);    // shape: [800]
const W1 = tf.tensor2d(layer2Weights);   // shape: [800, 10]
const b1 = tf.tensor1d(layer3Biases);    // shape: [10]

// Build the model
const model = tf.sequential();
model.add(tf.layers.dense({ units: 800, inputShape: [784], activation: 'relu' }));
model.add(tf.layers.dense({ units: 10, activation: 'softmax' }));

// Inject weights
model.layers[0].setWeights([W0, b0]);
model.layers[1].setWeights([W1, b1]);

await model.save('downloads://model');

console.log(model.summary());