import * as tf from "@tensorflow/tfjs";

tf.setBackend("cpu");

const vehicleLabels = ["van", "truck", "bike"];
const priorityLabels = ["balanced", "urgent", "eco"];

function encodeFeatures(distance, stopCount, vehicle, priority) {
  const vehicleIndex = vehicleLabels.indexOf(vehicle);
  const priorityIndex = priorityLabels.indexOf(priority);

  return [
    distance / 100,
    stopCount / 10,
    vehicleIndex === 1 ? 1 : 0,
    vehicleIndex === 2 ? 1 : 0,
    priorityIndex === 1 ? 1 : 0,
    priorityIndex === 2 ? 1 : 0,
  ];
}

function createSample(distance, stopCount, vehicle, priority) {
  const speed = 30;
  const baseTime = (distance / speed) * 60 + stopCount * 5;
  const mileage = vehicle === "truck" ? 8 : vehicle === "bike" ? 45 : 15;
  const fuel = distance / mileage;
  const priorityModifier = priority === "urgent" ? 1.18 : priority === "eco" ? 0.88 : 1;
  const routeCost = (50 + distance * 5 + stopCount * 20) * priorityModifier + fuel * 103;
  const score = Math.min(100, Math.max(50, 80 + stopCount * 2 + (priority === "eco" ? 8 : priority === "urgent" ? 2 : 4) - distance * 0.03));

  return {
    time: baseTime * (1 + (Math.random() - 0.5) * 0.08),
    fuel: fuel * (1 + (Math.random() - 0.5) * 0.05),
    cost: routeCost * (1 + (Math.random() - 0.5) * 0.04),
    score,
  };
}

function buildTrainingData() {
  const samples = [];
  for (let distance = 5; distance <= 140; distance += 5) {
    for (let stops = 1; stops <= 8; stops += 1) {
      for (const vehicle of vehicleLabels) {
        for (const priority of priorityLabels) {
          samples.push({
            features: encodeFeatures(distance, stops, vehicle, priority),
            labels: (() => {
              const sample = createSample(distance, stops, vehicle, priority);
              return [sample.time, sample.fuel, sample.cost, sample.score];
            })(),
          });
        }
      }
    }
  }
  return samples;
}

const model = tf.sequential();
model.add(tf.layers.dense({ inputShape: [6], units: 16, activation: "relu" }));
model.add(tf.layers.dense({ units: 16, activation: "relu" }));
model.add(tf.layers.dense({ units: 4, activation: "linear" }));
model.compile({ optimizer: tf.train.adam(0.01), loss: "meanSquaredError" });

let modelReady = null;

async function initModel() {
  if (modelReady) return modelReady;

  const samples = buildTrainingData();
  const xs = tf.tensor2d(samples.map((sample) => sample.features));
  const ys = tf.tensor2d(samples.map((sample) => sample.labels));

  modelReady = model.fit(xs, ys, {
    epochs: 80,
    batchSize: 32,
    shuffle: true,
    verbose: 0,
  }).then(() => {
    xs.dispose();
    ys.dispose();
  });

  return modelReady;
}

export async function predictRouteMetrics(distance, stopCount, vehicle, priority) {
  await initModel();
  const input = tf.tensor2d([encodeFeatures(distance, stopCount, vehicle, priority)]);
  const result = model.predict(input);
  const raw = await result.array();
  input.dispose();
  if (Array.isArray(raw) && raw.length > 0) {
    const [time, fuel, cost, score] = raw[0];
    return {
      predictedTime: Number(Math.max(5, time).toFixed(0)),
      predictedFuel: Number(Math.max(0, fuel).toFixed(1)),
      predictedCost: Number(Math.max(0, cost).toFixed(2)),
      predictedScore: Number(Math.min(100, Math.max(0, score)).toFixed(0)),
    };
  }

  return {
    predictedTime: 0,
    predictedFuel: 0,
    predictedCost: 0,
    predictedScore: 0,
  };
}
