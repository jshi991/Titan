import { useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import type { TokenizerState } from '../types';

interface PredictionProps {
  model: tf.LayersModel | null;
  tokenizerData: {
    tokenizer: TokenizerState,
    sequences: number[][],
    labels: number[],
    labelMap: { [key: string]: number }
  } | null;
  onNext: () => void;
  onPrev: () => void;
}

interface PredictionResult {
  label: string;
  confidence: number;
  probabilities: { [key: string]: number };
}

export default function Prediction({ model, tokenizerData, onNext, onPrev }: PredictionProps) {
  const [inputText, setInputText] = useState('');
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [predicting, setPredicting] = useState(false);
  const [predictionHistory, setPredictionHistory] = useState<Array<{text: string, result: PredictionResult}>>([]);

  if (!model || !tokenizerData) {
    return (
      <div className="prediction">
        <h2>🔮 Test Predictions</h2>
        <p>Please complete the training step first.</p>
        <button className="prev-button" onClick={onPrev}>
          ← Back to Training
        </button>
      </div>
    );
  }

  const { tokenizer, labelMap } = tokenizerData;
  
  // Create reverse label mapping
  const reverseLabelMap = Object.entries(labelMap).reduce((acc, [label, index]) => {
    acc[index] = label;
    return acc;
  }, {} as { [key: number]: string });

  // Recreate tokenizer functionality for prediction
  const preprocessText = (text: string): string[] => {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 0);
  };

  const textToSequence = (text: string): number[] => {
    const words = preprocessText(text);
    return words.map(word => tokenizer.wordIndex[word] || tokenizer.wordIndex[tokenizer.oovToken] || 1);
  };

  const padSequence = (sequence: number[]): number[] => {
    const maxLength = tokenizer.maxLength;
    if (sequence.length >= maxLength) {
      return sequence.slice(0, maxLength);
    } else {
      return [...sequence, ...new Array(maxLength - sequence.length).fill(0)];
    }
  };

  const makePrediction = async () => {
    if (!inputText.trim() || !model) return;

    setPredicting(true);
    setPrediction(null);

    try {
      // Preprocess the input text
      const sequence = textToSequence(inputText);
      const paddedSequence = padSequence(sequence);
      
      console.log('🔮 Making prediction for:', inputText);
      console.log('Tokenized sequence:', sequence);
      console.log('Padded sequence:', paddedSequence);

      // Convert to tensor and make prediction
      const inputTensor = tf.tensor2d([paddedSequence]);
      const predictions = model.predict(inputTensor) as tf.Tensor;
      const predictionData = await predictions.data();

      // Find the predicted class and confidence
      const predictedIndex = predictionData.indexOf(Math.max(...Array.from(predictionData)));
      const confidence = predictionData[predictedIndex];
      const predictedLabel = reverseLabelMap[predictedIndex];

      // Create probability distribution
      const probabilities = Object.entries(reverseLabelMap).reduce((acc, [index, label]) => {
        acc[label] = predictionData[parseInt(index)];
        return acc;
      }, {} as { [key: string]: number });

      const result: PredictionResult = {
        label: predictedLabel,
        confidence,
        probabilities
      };

      setPrediction(result);
      setPredictionHistory(prev => [{text: inputText, result}, ...prev.slice(0, 9)]); // Keep last 10

      // Cleanup tensors
      inputTensor.dispose();
      predictions.dispose();

      console.log('✅ Prediction result:', result);

    } catch (error) {
      console.error('❌ Prediction failed:', error);
    } finally {
      setPredicting(false);
    }
  };

  const clearInput = () => {
    setInputText('');
    setPrediction(null);
  };

  const useExample = (text: string) => {
    setInputText(text);
    setPrediction(null);
  };

  // Generate some example texts based on the training data
  const getExampleTexts = () => {
    const examples = [
      "Hello, how are you doing today?",
      "What's the weather like?",
      "Thank you for your help!",
      "I need assistance with my account",
      "Can you help me find information?"
    ];
    return examples;
  };

  return (
    <div className="prediction">
      <h2>🔮 Test Your Model</h2>
      <p>
        Enter any text to see how your trained model classifies it. The model will convert
        your text to numbers using the same tokenizer and make a prediction.
      </p>

      <div className="prediction-interface">
        <div className="input-section">
          <label htmlFor="test-input">Enter text to classify:</label>
          <textarea
            id="test-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your text here..."
            rows={3}
            disabled={predicting}
          />
          
          <div className="input-controls">
            <button 
              className="predict-button"
              onClick={makePrediction}
              disabled={!inputText.trim() || predicting}
            >
              {predicting ? '🔄 Predicting...' : '🔮 Predict'}
            </button>
            <button 
              className="clear-button"
              onClick={clearInput}
              disabled={predicting}
            >
              Clear
            </button>
          </div>

          <div className="examples">
            <h4>Try these examples:</h4>
            <div className="example-buttons">
              {getExampleTexts().map((example, index) => (
                <button
                  key={index}
                  className="example-button"
                  onClick={() => useExample(example)}
                  disabled={predicting}
                >
                  "{example}"
                </button>
              ))}
            </div>
          </div>
        </div>

        {prediction && (
          <div className="prediction-results">
            <h3>Prediction Results</h3>
            
            <div className="main-prediction">
              <div className="predicted-label">
                <span className="label-text">{prediction.label}</span>
                <span className="confidence">{(prediction.confidence * 100).toFixed(1)}% confidence</span>
              </div>
            </div>

            <div className="probability-distribution">
              <h4>All Class Probabilities:</h4>
              <div className="probability-bars">
                {Object.entries(prediction.probabilities)
                  .sort(([,a], [,b]) => b - a)
                  .map(([label, probability]) => (
                    <div key={label} className="probability-item">
                      <div className="probability-info">
                        <span className="probability-label">{label}</span>
                        <span className="probability-value">{(probability * 100).toFixed(2)}%</span>
                      </div>
                      <div className="probability-bar">
                        <div 
                          className="probability-fill"
                          style={{ 
                            width: `${probability * 100}%`,
                            backgroundColor: label === prediction.label ? '#22c55e' : '#e5e7eb'
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="preprocessing-info">
              <h4>Text Processing:</h4>
              <div className="processing-steps">
                <div className="step">
                  <strong>Original:</strong> "{inputText}"
                </div>
                <div className="step">
                  <strong>Tokenized:</strong> {textToSequence(inputText).slice(0, 10).join(', ')}
                  {textToSequence(inputText).length > 10 && '...'}
                </div>
                <div className="step">
                  <strong>Sequence Length:</strong> {textToSequence(inputText).length} → {tokenizer.maxLength} (padded)
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {predictionHistory.length > 0 && (
        <div className="prediction-history">
          <h3>Recent Predictions</h3>
          <div className="history-list">
            {predictionHistory.map((item, index) => (
              <div key={index} className="history-item">
                <div className="history-text">"{item.text}"</div>
                <div className="history-result">
                  <span className="history-label">{item.result.label}</span>
                  <span className="history-confidence">
                    {(item.result.confidence * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="model-info">
        <h4>Model Information:</h4>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Vocabulary Size:</span>
            <span className="info-value">{Object.keys(tokenizer.wordIndex).length}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Max Sequence Length:</span>
            <span className="info-value">{tokenizer.maxLength}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Classes:</span>
            <span className="info-value">{Object.keys(labelMap).join(', ')}</span>
          </div>
        </div>
      </div>

      <div className="navigation-buttons">
        <button className="prev-button" onClick={onPrev}>
          ← Back to Training
        </button>
        <button className="next-button" onClick={onNext}>
          Export Model →
        </button>
      </div>
    </div>
  );
}