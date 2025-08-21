import { useState, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import type { TokenizerState } from '../types';

interface ModelBuilderProps {
  tokenizerData: {
    tokenizer: TokenizerState,
    sequences: number[][],
    labels: number[],
    labelMap: { [key: string]: number }
  } | null;
  onModelReady: (model: tf.LayersModel) => void;
  onNext: () => void;
  onPrev: () => void;
}

export default function ModelBuilder({ tokenizerData, onModelReady, onNext, onPrev }: ModelBuilderProps) {
  const [embeddingDim, setEmbeddingDim] = useState(16);
  const [hiddenUnits, setHiddenUnits] = useState(32);
  const [learningRate, setLearningRate] = useState(0.001);
  const [model, setModel] = useState<tf.LayersModel | null>(null);
  const [building, setBuilding] = useState(false);
  const [modelSummary, setModelSummary] = useState<string>('');

  if (!tokenizerData) {
    return (
      <div className="model-builder">
        <h2>⚙️ Model Configuration</h2>
        <p>Please complete the tokenization step first.</p>
        <button className="prev-button" onClick={onPrev}>
          ← Back to Tokenization
        </button>
      </div>
    );
  }

  const { tokenizer, labelMap } = tokenizerData;
  const numClasses = Object.keys(labelMap).length;
  const vocabSize = tokenizer.vocabSize;
  const maxLength = tokenizer.maxLength;

  const buildModel = async () => {
    setBuilding(true);
    
    try {
      console.log('🏗️ Building neural network model...');
      
      /**
       * Neural Network Architecture:
       * 1. Embedding Layer: Converts word indices to dense vectors
       * 2. Global Average Pooling: Averages embeddings across sequence length
       * 3. Dense Layer: Hidden layer with ReLU activation
       * 4. Dropout: Prevents overfitting
       * 5. Output Layer: Softmax for multi-class classification
       */
      const newModel = tf.sequential({
        layers: [
          // Embedding layer: maps word indices to dense vectors
          tf.layers.embedding({
            inputDim: vocabSize,      // Size of vocabulary
            outputDim: embeddingDim,  // Dimension of embedding vectors
            inputLength: maxLength,   // Length of input sequences
            name: 'embedding'
          }),
          
          // Global average pooling: reduces sequence dimension
          tf.layers.globalAveragePooling1d({
            name: 'global_avg_pool'
          }),
          
          // Hidden dense layer with ReLU activation
          tf.layers.dense({
            units: hiddenUnits,
            activation: 'relu',
            name: 'hidden_dense'
          }),
          
          // Dropout for regularization
          tf.layers.dropout({
            rate: 0.3,
            name: 'dropout'
          }),
          
          // Output layer with softmax for classification
          tf.layers.dense({
            units: numClasses,
            activation: 'softmax',
            name: 'output'
          })
        ]
      });

      // Compile the model
      newModel.compile({
        optimizer: tf.train.adam(learningRate),
        loss: 'sparseCategoricalCrossentropy',
        metrics: ['accuracy']
      });

      // Generate model summary
      const summary: string[] = [];
      newModel.summary(undefined, undefined, (line: string) => summary.push(line));
      setModelSummary(summary.join('\n'));

      console.log('✅ Model built successfully:', {
        inputShape: [maxLength],
        embeddingDim,
        hiddenUnits,
        outputClasses: numClasses,
        totalParams: newModel.countParams()
      });

      setModel(newModel);
      onModelReady(newModel);
      
    } catch (error) {
      console.error('Error building model:', error);
    } finally {
      setBuilding(false);
    }
  };

  // Auto-adjust parameters based on dataset size
  useEffect(() => {
    if (tokenizerData) {
      const datasetSize = tokenizerData.sequences.length;
      
      // Adjust model complexity based on dataset size
      if (datasetSize < 100) {
        setEmbeddingDim(8);
        setHiddenUnits(16);
      } else if (datasetSize < 1000) {
        setEmbeddingDim(16);
        setHiddenUnits(32);
      } else {
        setEmbeddingDim(32);
        setHiddenUnits(64);
      }
    }
  }, [tokenizerData]);

  const getModelInfo = () => {
    if (!model) return null;
    
    const totalParams = model.countParams();
    const trainableParams = totalParams; // All params are trainable in this simple model
    
    return {
      totalParams,
      trainableParams,
      memoryEstimate: Math.round(totalParams * 4 / 1024 / 1024 * 100) / 100 // MB (float32)
    };
  };

  const modelInfo = getModelInfo();

  return (
    <div className="model-builder">
      <h2>🧠 Neural Network Model</h2>
      <p>
        Configure and build a neural network for text classification. The model uses an embedding layer
        to learn word representations, followed by dense layers for classification.
      </p>

      <div className="dataset-info">
        <h3>Dataset Information:</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="label">Vocabulary Size:</span>
            <span className="value">{vocabSize.toLocaleString()}</span>
          </div>
          <div className="info-item">
            <span className="label">Sequence Length:</span>
            <span className="value">{maxLength}</span>
          </div>
          <div className="info-item">
            <span className="label">Number of Classes:</span>
            <span className="value">{numClasses}</span>
          </div>
          <div className="info-item">
            <span className="label">Training Samples:</span>
            <span className="value">{tokenizerData.sequences.length}</span>
          </div>
        </div>
      </div>

      <div className="model-config">
        <h3>Model Architecture:</h3>
        
        <div className="config-group">
          <label htmlFor="embedding-dim">
            Embedding Dimensions:
            <span className="help-text">Size of word embedding vectors</span>
          </label>
          <input
            type="number"
            id="embedding-dim"
            value={embeddingDim}
            onChange={(e) => setEmbeddingDim(parseInt(e.target.value))}
            min="4"
            max="128"
            step="4"
            disabled={building}
          />
        </div>

        <div className="config-group">
          <label htmlFor="hidden-units">
            Hidden Layer Units:
            <span className="help-text">Number of neurons in the dense layer</span>
          </label>
          <input
            type="number"
            id="hidden-units"
            value={hiddenUnits}
            onChange={(e) => setHiddenUnits(parseInt(e.target.value))}
            min="8"
            max="256"
            step="8"
            disabled={building}
          />
        </div>

        <div className="config-group">
          <label htmlFor="learning-rate">
            Learning Rate:
            <span className="help-text">How fast the model learns (0.0001 - 0.01)</span>
          </label>
          <input
            type="number"
            id="learning-rate"
            value={learningRate}
            onChange={(e) => setLearningRate(parseFloat(e.target.value))}
            min="0.0001"
            max="0.01"
            step="0.0001"
            disabled={building}
          />
        </div>

        <button 
          className="build-button"
          onClick={buildModel}
          disabled={building}
        >
          {building ? '⏳ Building Model...' : '🏗️ Build Model'}
        </button>
      </div>

      {building && (
        <div className="building-status">
          <div className="spinner"></div>
          <p>Creating neural network architecture...</p>
        </div>
      )}

      {model && (
        <div className="model-results">
          <h3>Model Architecture:</h3>
          
          <div className="architecture-diagram">
            <div className="layer">
              <div className="layer-name">Input Layer</div>
              <div className="layer-shape">[{maxLength}]</div>
              <div className="layer-desc">Text sequences (word indices)</div>
            </div>
            <div className="arrow">↓</div>
            <div className="layer">
              <div className="layer-name">Embedding Layer</div>
              <div className="layer-shape">[{maxLength}, {embeddingDim}]</div>
              <div className="layer-desc">Word → Dense vectors</div>
            </div>
            <div className="arrow">↓</div>
            <div className="layer">
              <div className="layer-name">Global Avg Pool</div>
              <div className="layer-shape">[{embeddingDim}]</div>
              <div className="layer-desc">Average across sequence</div>
            </div>
            <div className="arrow">↓</div>
            <div className="layer">
              <div className="layer-name">Dense Layer</div>
              <div className="layer-shape">[{hiddenUnits}]</div>
              <div className="layer-desc">Hidden layer (ReLU)</div>
            </div>
            <div className="arrow">↓</div>
            <div className="layer">
              <div className="layer-name">Dropout</div>
              <div className="layer-shape">[{hiddenUnits}]</div>
              <div className="layer-desc">Regularization (30%)</div>
            </div>
            <div className="arrow">↓</div>
            <div className="layer">
              <div className="layer-name">Output Layer</div>
              <div className="layer-shape">[{numClasses}]</div>
              <div className="layer-desc">Classification (Softmax)</div>
            </div>
          </div>

          {modelInfo && (
            <div className="model-stats">
              <div className="stat-card">
                <div className="stat-number">{modelInfo.totalParams.toLocaleString()}</div>
                <div className="stat-label">Total Parameters</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{modelInfo.memoryEstimate} MB</div>
                <div className="stat-label">Memory Usage</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{learningRate}</div>
                <div className="stat-label">Learning Rate</div>
              </div>
            </div>
          )}

          <div className="model-explanation">
            <h4>Architecture Explanation:</h4>
            <ul>
              <li><strong>Embedding Layer:</strong> Converts word indices to {embeddingDim}-dimensional dense vectors</li>
              <li><strong>Global Average Pooling:</strong> Averages embeddings across the sequence length</li>
              <li><strong>Dense Layer:</strong> {hiddenUnits} neurons with ReLU activation for feature learning</li>
              <li><strong>Dropout:</strong> Randomly sets 30% of inputs to 0 during training to prevent overfitting</li>
              <li><strong>Output Layer:</strong> {numClasses} neurons with softmax activation for classification probabilities</li>
            </ul>
          </div>

          {modelSummary && (
            <details className="model-summary">
              <summary>Technical Model Summary</summary>
              <pre>{modelSummary}</pre>
            </details>
          )}

          <div className="navigation-buttons">
            <button className="prev-button" onClick={onPrev}>
              ← Back to Tokenization
            </button>
            <button className="next-button" onClick={onNext}>
              Continue to Training →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}