export interface DatasetItem {
  text: string;
  label: string;
}

export interface TokenizerConfig {
  vocabSize: number;
  maxLength: number;
  oovToken: string;
}

export interface ModelConfig {
  embeddingDim: number;
  hiddenUnits: number;
  learningRate: number;
  batchSize: number;
  epochs: number;
  validationSplit: number;
}

export interface TrainingData {
  sequences: number[][];
  labels: number[];
  labelMap: { [key: string]: number };
  reverseLabelMap: { [key: number]: string };
}

export interface TrainingMetrics {
  epoch: number;
  loss: number;
  accuracy: number;
  valLoss?: number;
  valAccuracy?: number;
}

export interface PredictionResult {
  label: string;
  confidence: number;
  probabilities: { [key: string]: number };
}

export interface TokenizerState {
  wordIndex: { [key: string]: number };
  indexWord: { [key: number]: string };
  vocabSize: number;
  maxLength: number;
  oovToken: string;
}