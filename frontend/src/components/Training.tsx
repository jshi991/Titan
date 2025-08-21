import React, { useState, useRef } from 'react';
import * as tf from '@tensorflow/tfjs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { TokenizerState } from '../types';

interface TrainingProps {
  model: tf.LayersModel | null;
  tokenizerData: {
    tokenizer: TokenizerState,
    sequences: number[][],
    labels: number[],
    labelMap: { [key: string]: number }
  } | null;
  isTraining: boolean;
  setIsTraining: (training: boolean) => void;
  trainingHistory: any[];
  setTrainingHistory: React.Dispatch<React.SetStateAction<any[]>>;
  onNext: () => void;
  onPrev: () => void;
}

interface TrainingMetrics {
  epoch: number;
  loss: number;
  accuracy: number;
  valLoss?: number;
  valAccuracy?: number;
}

export default function Training({ 
  model, 
  tokenizerData, 
  isTraining, 
  setIsTraining,
  trainingHistory,
  setTrainingHistory,
  onNext, 
  onPrev 
}: TrainingProps) {
  const [epochs, setEpochs] = useState(20);
  const [batchSize, setBatchSize] = useState(32);
  const [validationSplit, setValidationSplit] = useState(0.2);
  const [currentEpoch, setCurrentEpoch] = useState(0);
  const [currentMetrics, setCurrentMetrics] = useState<TrainingMetrics | null>(null);
  const [trainingTime, setTrainingTime] = useState(0);
  const stopTraining = useRef(false);

  if (!model || !tokenizerData) {
    return (
      <div className="training">
        <h2>🏋️ Model Training</h2>
        <p>Please complete the model setup first.</p>
        <button className="prev-button" onClick={onPrev}>
          ← Back to Model Setup
        </button>
      </div>
    );
  }

  const { sequences, labels } = tokenizerData;

  const prepareTrainingData = () => {
    // Convert sequences and labels to tensors
    const xs = tf.tensor2d(sequences);
    const ys = tf.tensor1d(labels, 'int32');
    
    return { xs, ys };
  };

  const startTraining = async () => {
    setIsTraining(true);
    setTrainingHistory([]);
    setCurrentEpoch(0);
    stopTraining.current = false;
    
    const startTime = Date.now();
    const { xs, ys } = prepareTrainingData();
    
    try {
      console.log('🚀 Starting training...', {
        samples: sequences.length,
        epochs,
        batchSize,
        validationSplit
      });

      await model.fit(xs, ys, {
        epochs,
        batchSize,
        validationSplit,
        shuffle: true,
        verbose: 0, // We'll handle progress ourselves
        callbacks: {
          onEpochBegin: async (epoch) => {
            if (stopTraining.current) {
              model.stopTraining = true;
              return;
            }
            setCurrentEpoch(epoch + 1);
          },
          onEpochEnd: async (epoch, logs) => {
            if (stopTraining.current) return;
            
            const metrics: TrainingMetrics = {
              epoch: epoch + 1,
              loss: logs?.loss || 0,
              accuracy: logs?.acc || 0,
              valLoss: logs?.val_loss,
              valAccuracy: logs?.val_acc
            };
            
            setCurrentMetrics(metrics);
            setTrainingHistory((prev: any[]) => [...prev, metrics]);
            
            // Update training time
            setTrainingTime(Date.now() - startTime);
            
            console.log(`Epoch ${epoch + 1}/${epochs}:`, metrics);
          },
          onTrainEnd: () => {
            console.log('✅ Training completed!');
          }
        }
      });

    } catch (error) {
      console.error('❌ Training failed:', error);
    } finally {
      xs.dispose();
      ys.dispose();
      setIsTraining(false);
      setTrainingTime(Date.now() - startTime);
    }
  };

  const stopTrainingHandler = () => {
    stopTraining.current = true;
    setIsTraining(false);
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const getBestMetrics = () => {
    if (trainingHistory.length === 0) return null;
    
    const bestAccuracy = Math.max(...trainingHistory.map(h => h.accuracy));
    const bestValAccuracy = trainingHistory.some(h => h.valAccuracy !== undefined) 
      ? Math.max(...trainingHistory.map(h => h.valAccuracy || 0))
      : null;
    const finalLoss = trainingHistory[trainingHistory.length - 1]?.loss || 0;
    
    return { bestAccuracy, bestValAccuracy, finalLoss };
  };

  const bestMetrics = getBestMetrics();

  return (
    <div className="training">
      <h2>🏋️ Model Training</h2>
      <p>
        Train your neural network on the preprocessed dataset. The model will learn to map
        text sequences to their corresponding labels through backpropagation.
      </p>

      <div className="training-config">
        <div className="config-row">
          <div className="config-group">
            <label htmlFor="epochs">
              Epochs:
              <span className="help-text">Number of complete passes through the dataset</span>
            </label>
            <input
              type="number"
              id="epochs"
              value={epochs}
              onChange={(e) => setEpochs(parseInt(e.target.value))}
              min="1"
              max="100"
              disabled={isTraining}
            />
          </div>

          <div className="config-group">
            <label htmlFor="batch-size">
              Batch Size:
              <span className="help-text">Number of samples processed together</span>
            </label>
            <input
              type="number"
              id="batch-size"
              value={batchSize}
              onChange={(e) => setBatchSize(parseInt(e.target.value))}
              min="8"
              max="128"
              step="8"
              disabled={isTraining}
            />
          </div>

          <div className="config-group">
            <label htmlFor="validation-split">
              Validation Split:
              <span className="help-text">Fraction of data used for validation</span>
            </label>
            <input
              type="number"
              id="validation-split"
              value={validationSplit}
              onChange={(e) => setValidationSplit(parseFloat(e.target.value))}
              min="0.1"
              max="0.4"
              step="0.1"
              disabled={isTraining}
            />
          </div>
        </div>

        <div className="training-controls">
          <button 
            className="start-button"
            onClick={startTraining}
            disabled={isTraining}
          >
            {isTraining ? '🔄 Training...' : '🚀 Start Training'}
          </button>
          
          {isTraining && (
            <button 
              className="stop-button"
              onClick={stopTrainingHandler}
            >
              ⏹️ Stop Training
            </button>
          )}
        </div>
      </div>

      {isTraining && (
        <div className="training-progress">
          <div className="progress-header">
            <h3>Training Progress</h3>
            <div className="time-elapsed">⏱️ {formatTime(trainingTime)}</div>
          </div>
          
          <div className="epoch-progress">
            <div className="epoch-info">
              Epoch {currentEpoch} of {epochs}
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${(currentEpoch / epochs) * 100}%` }}
              ></div>
            </div>
          </div>

          {currentMetrics && (
            <div className="current-metrics">
              <div className="metric">
                <span className="metric-label">Loss:</span>
                <span className="metric-value">{currentMetrics.loss.toFixed(4)}</span>
              </div>
              <div className="metric">
                <span className="metric-label">Accuracy:</span>
                <span className="metric-value">{(currentMetrics.accuracy * 100).toFixed(2)}%</span>
              </div>
              {currentMetrics.valLoss !== undefined && (
                <div className="metric">
                  <span className="metric-label">Val Loss:</span>
                  <span className="metric-value">{currentMetrics.valLoss.toFixed(4)}</span>
                </div>
              )}
              {currentMetrics.valAccuracy !== undefined && (
                <div className="metric">
                  <span className="metric-label">Val Accuracy:</span>
                  <span className="metric-value">{(currentMetrics.valAccuracy * 100).toFixed(2)}%</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {trainingHistory.length > 0 && (
        <div className="training-results">
          <h3>Training Results</h3>
          
          {bestMetrics && (
            <div className="final-metrics">
              <div className="metric-card">
                <div className="metric-number">{(bestMetrics.bestAccuracy * 100).toFixed(2)}%</div>
                <div className="metric-label">Best Training Accuracy</div>
              </div>
              {bestMetrics.bestValAccuracy !== null && (
                <div className="metric-card">
                  <div className="metric-number">{(bestMetrics.bestValAccuracy * 100).toFixed(2)}%</div>
                  <div className="metric-label">Best Validation Accuracy</div>
                </div>
              )}
              <div className="metric-card">
                <div className="metric-number">{bestMetrics.finalLoss.toFixed(4)}</div>
                <div className="metric-label">Final Loss</div>
              </div>
              <div className="metric-card">
                <div className="metric-number">{formatTime(trainingTime)}</div>
                <div className="metric-label">Training Time</div>
              </div>
            </div>
          )}

          <div className="charts">
            <div className="chart-section">
              <h4>Training Loss</h4>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trainingHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="epoch" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="loss" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    name="Training Loss"
                  />
                  {trainingHistory.some(h => h.valLoss !== undefined) && (
                    <Line 
                      type="monotone" 
                      dataKey="valLoss" 
                      stroke="#f97316" 
                      strokeWidth={2}
                      name="Validation Loss"
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-section">
              <h4>Training Accuracy</h4>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trainingHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="epoch" />
                  <YAxis domain={[0, 1]} />
                  <Tooltip formatter={(value: any) => `${(value * 100).toFixed(2)}%`} />
                  <Line 
                    type="monotone" 
                    dataKey="accuracy" 
                    stroke="#22c55e" 
                    strokeWidth={2}
                    name="Training Accuracy"
                  />
                  {trainingHistory.some(h => h.valAccuracy !== undefined) && (
                    <Line 
                      type="monotone" 
                      dataKey="valAccuracy" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      name="Validation Accuracy"
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="training-insights">
            <h4>Training Insights:</h4>
            <ul>
              <li>
                <strong>Loss:</strong> Lower is better. The loss should generally decrease over time.
              </li>
              <li>
                <strong>Accuracy:</strong> Higher is better. Shows the percentage of correct predictions.
              </li>
              {validationSplit > 0 && (
                <li>
                  <strong>Validation metrics:</strong> Help detect overfitting. If validation metrics are much worse than training metrics, your model might be overfitting.
                </li>
              )}
              <li>
                <strong>Training time:</strong> Faster training allows for more experimentation. Consider adjusting batch size for efficiency.
              </li>
            </ul>
          </div>

          <div className="navigation-buttons">
            <button className="prev-button" onClick={onPrev}>
              ← Back to Model Setup
            </button>
            <button 
              className="next-button" 
              onClick={onNext}
              disabled={trainingHistory.length === 0}
            >
              Continue to Prediction →
            </button>
          </div>
        </div>
      )}

      {!isTraining && trainingHistory.length === 0 && (
        <div className="navigation-buttons">
          <button className="prev-button" onClick={onPrev}>
            ← Back to Model Setup
          </button>
        </div>
      )}
    </div>
  );
}