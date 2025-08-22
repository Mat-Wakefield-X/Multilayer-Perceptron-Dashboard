# Multilayer Perceptron Dashboard

This project is a browser based dashboard for exploring how Multilayer Perceptron encodes data. The dashboard includes a fully trained Multilayer Perceptron for the MNIST digits benchmark dataset.

## Dataset

The MNIST digits dataset is a classic benchmark dataset for machine learning. It involves handwritten digits (0-9) written by US postal workers and highschool students.

The MNIST digits dataset is publicly available at:

https://yann.lecun.org/exdb/mnist/index.html

The dataset is included in this repo for ease of installation.

## Model

The model included in the dashboard was trained using Keras in Python. The python script used is as follows:

```python
from keras import Sequential
from keras.src.datasets import mnist
from keras.src.layers import Dense, Input
from keras.src.utils import to_categorical


# Load the MNIST dataset
(x_train, y_train), (x_test, y_test) = mnist.load_data()

# Preprocess the data
x_train = x_train.reshape((x_train.shape[0], -1)).astype('float32')  / 255
x_test = x_test.reshape((x_test.shape[0], -1)).astype('float32') / 255
y_train = to_categorical(y_train, 10)
y_test = to_categorical(y_test, 10)

# Build the MLP model
model = Sequential()
model.add(Input(shape=(784,)))
model.add(Dense(800, activation='relu'))  # Hidden layer with 800 units
model.add(Dense(10, activation='softmax'))  # Output layer with 10 units

# Compile the model
model.compile(loss='categorical_crossentropy', optimizer='adam', metrics=['accuracy'])

# Train the model
model.fit(x_train, y_train, epochs=45, batch_size=128, validation_data=(x_test, y_test))

# Save
model.save('trained_800ReLU-10sm_ce_adam.keras')

# Evaluate the model
loss, accuracy = model.evaluate(x_test, y_test)
print(f'\n\nTest Accuracy: {accuracy * 100:.2f}%')
print(f'Test Error: {(1.0 - accuracy) * 100:.2f}%')
```

The trained model has a test-set error of 1.37%.

## Getting Started

### Clone the Repository

To run the dashboard download or clone the repo to your device.

```bash
git clone https://github.com/your-username/dissertation-publication-dashboard.git
```

### Run the Dashboard Locally

To run the dashboard you must use a local host.

For example, open the project directory in VSCode. Install the 'Live Server' VSCode extension by Ritwick Dey. Then right-click on the 'index.html' file and select 'Open with Live Server'.