import { useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import type { TokenizerState } from '../types';

interface ModelExportProps {
  model: tf.LayersModel | null;
  tokenizerData: {
    tokenizer: TokenizerState,
    sequences: number[][],
    labels: number[],
    labelMap: { [key: string]: number }
  } | null;
  trainingHistory: any[];
  onPrev: () => void;
}

export default function ModelExport({ model, tokenizerData, trainingHistory, onPrev }: ModelExportProps) {
  const [exporting, setExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<string>('');

  if (!model || !tokenizerData) {
    return (
      <div className="model-export">
        <h2>📦 Export Model</h2>
        <p>Please complete the training step first.</p>
        <button className="prev-button" onClick={onPrev}>
          ← Back to Prediction
        </button>
      </div>
    );
  }

  const downloadModel = async () => {
    setExporting(true);
    setExportStatus('Preparing model for download...');
    
    try {
      // Save model to downloads
      await model.save('downloads://text-classifier-model');
      setExportStatus('✅ Model downloaded successfully!');
    } catch (error) {
      console.error('Error downloading model:', error);
      setExportStatus('❌ Failed to download model');
    } finally {
      setExporting(false);
    }
  };

  const downloadTokenizer = () => {
    const tokenizerConfig = {
      tokenizer: tokenizerData.tokenizer,
      labelMap: tokenizerData.labelMap,
      reverseLabelMap: Object.entries(tokenizerData.labelMap).reduce((acc, [label, index]) => {
        acc[index] = label;
        return acc;
      }, {} as { [key: number]: string }),
      metadata: {
        exportDate: new Date().toISOString(),
        totalSamples: tokenizerData.sequences.length,
        numClasses: Object.keys(tokenizerData.labelMap).length,
      }
    };

    const blob = new Blob([JSON.stringify(tokenizerConfig, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tokenizer-config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadTrainingHistory = () => {
    if (trainingHistory.length === 0) return;

    const historyData = {
      trainingHistory,
      metadata: {
        exportDate: new Date().toISOString(),
        totalEpochs: trainingHistory.length,
        bestAccuracy: Math.max(...trainingHistory.map(h => h.accuracy)),
        finalLoss: trainingHistory[trainingHistory.length - 1]?.loss || 0
      }
    };

    const blob = new Blob([JSON.stringify(historyData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'training-history.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadCompletePackage = async () => {
    setExporting(true);
    setExportStatus('Creating complete package...');
    
    try {
      // Create a comprehensive export package
      const exportPackage = {
        model: {
          format: 'TensorFlow.js LayersModel',
          note: 'Model files will be downloaded separately'
        },
        tokenizer: tokenizerData.tokenizer,
        labelMapping: tokenizerData.labelMap,
        trainingHistory,
        metadata: {
          exportDate: new Date().toISOString(),
          modelArchitecture: 'Embedding + Dense + Softmax',
          totalSamples: tokenizerData.sequences.length,
          vocabularySize: tokenizerData.tokenizer.vocabSize,
          sequenceLength: tokenizerData.tokenizer.maxLength,
          numClasses: Object.keys(tokenizerData.labelMap).length,
          bestAccuracy: trainingHistory.length > 0 ? Math.max(...trainingHistory.map(h => h.accuracy)) : null,
          modelParams: model.countParams(),
        },
        usage: {
          loadModel: "const model = await tf.loadLayersModel('path/to/model.json')",
          preprocessing: "Tokenize text using the provided tokenizer configuration",
          prediction: "Use model.predict() with preprocessed sequences"
        }
      };

      // Download the comprehensive package
      const blob = new Blob([JSON.stringify(exportPackage, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'complete-model-package.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Also download the model
      await model.save('downloads://text-classifier-model');
      
      setExportStatus('✅ Complete package downloaded successfully!');
    } catch (error) {
      console.error('Error creating package:', error);
      setExportStatus('❌ Failed to create package');
    } finally {
      setExporting(false);
    }
  };

  const copyModelCode = () => {
    const code = `// Load and use your trained text classifier
import * as tf from '@tensorflow/tfjs';

// Load the trained model
const model = await tf.loadLayersModel('path/to/your/model.json');

// Tokenizer configuration (from tokenizer-config.json)
const tokenizerConfig = ${JSON.stringify(tokenizerData.tokenizer, null, 2)};
const labelMap = ${JSON.stringify(tokenizerData.labelMap, null, 2)};

// Create reverse label mapping
const reverseLabelMap = {};
Object.entries(labelMap).forEach(([label, index]) => {
  reverseLabelMap[index] = label;
});

// Text preprocessing function
function preprocessText(text) {
  return text
    .toLowerCase()
    .replace(/[^\\w\\s]/g, '')
    .split(/\\s+/)
    .filter(word => word.length > 0);
}

// Convert text to sequence
function textToSequence(text, tokenizer) {
  const words = preprocessText(text);
  return words.map(word => tokenizer.wordIndex[word] || tokenizer.wordIndex[tokenizer.oovToken] || 1);
}

// Pad sequence
function padSequence(sequence, maxLength) {
  if (sequence.length >= maxLength) {
    return sequence.slice(0, maxLength);
  } else {
    return [...sequence, ...new Array(maxLength - sequence.length).fill(0)];
  }
}

// Make prediction
async function predict(text) {
  const sequence = textToSequence(text, tokenizerConfig);
  const paddedSequence = padSequence(sequence, tokenizerConfig.maxLength);
  
  const inputTensor = tf.tensor2d([paddedSequence]);
  const prediction = model.predict(inputTensor);
  const predictionData = await prediction.data();
  
  const predictedIndex = predictionData.indexOf(Math.max(...Array.from(predictionData)));
  const confidence = predictionData[predictedIndex];
  const label = reverseLabelMap[predictedIndex];
  
  inputTensor.dispose();
  prediction.dispose();
  
  return { label, confidence, probabilities: predictionData };
}

// Example usage
predict("Your text here").then(result => {
  console.log('Predicted label:', result.label);
  console.log('Confidence:', result.confidence);
});`;

    navigator.clipboard.writeText(code).then(() => {
      setExportStatus('✅ Code copied to clipboard!');
    }).catch(() => {
      setExportStatus('❌ Failed to copy code');
    });
  };

  const getModelStats = () => {
    const totalParams = model.countParams();
    const memoryEstimate = Math.round(totalParams * 4 / 1024 / 1024 * 100) / 100; // MB
    const bestAccuracy = trainingHistory.length > 0 
      ? Math.max(...trainingHistory.map(h => h.accuracy))
      : null;
    
    return {
      totalParams: totalParams.toLocaleString(),
      memoryEstimate,
      bestAccuracy: bestAccuracy ? (bestAccuracy * 100).toFixed(2) + '%' : 'N/A',
      vocabularySize: tokenizerData.tokenizer.vocabSize.toLocaleString(),
      classes: Object.keys(tokenizerData.labelMap).length
    };
  };

  const stats = getModelStats();

  return (
    <div className="model-export">
      <h2>📦 Export Your Model</h2>
      <p>
        Your model is ready to be exported! You can download the trained model, tokenizer configuration,
        and training history for use in other applications or for future reference.
      </p>

      <div className="export-summary">
        <h3>Model Summary</h3>
        <div className="summary-grid">
          <div className="summary-item">
            <span className="summary-label">Parameters:</span>
            <span className="summary-value">{stats.totalParams}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Memory Size:</span>
            <span className="summary-value">~{stats.memoryEstimate} MB</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Best Accuracy:</span>
            <span className="summary-value">{stats.bestAccuracy}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Vocabulary:</span>
            <span className="summary-value">{stats.vocabularySize} words</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Classes:</span>
            <span className="summary-value">{stats.classes}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Sequence Length:</span>
            <span className="summary-value">{tokenizerData.tokenizer.maxLength}</span>
          </div>
        </div>
      </div>

      <div className="export-options">
        <h3>Download Options</h3>
        
        <div className="export-buttons">
          <button 
            className="export-button primary"
            onClick={downloadCompletePackage}
            disabled={exporting}
          >
            📦 Download Complete Package
            <span className="button-description">Model + Tokenizer + History</span>
          </button>
          
          <button 
            className="export-button"
            onClick={downloadModel}
            disabled={exporting}
          >
            🧠 Download Model Only
            <span className="button-description">TensorFlow.js format (.json + .bin)</span>
          </button>
          
          <button 
            className="export-button"
            onClick={downloadTokenizer}
            disabled={exporting}
          >
            🔤 Download Tokenizer
            <span className="button-description">Tokenizer configuration (.json)</span>
          </button>
          
          {trainingHistory.length > 0 && (
            <button 
              className="export-button"
              onClick={downloadTrainingHistory}
              disabled={exporting}
            >
              📊 Download Training History
              <span className="button-description">Loss and accuracy metrics (.json)</span>
            </button>
          )}
        </div>
      </div>

      <div className="usage-code">
        <h3>Integration Code</h3>
        <p>Use this code to load and use your model in other applications:</p>
        
        <div className="code-section">
          <pre className="code-block">
{`// Load your trained model
const model = await tf.loadLayersModel('path/to/model.json');

// Make predictions
const result = await predict("Your text here");
console.log(result.label, result.confidence);`}
          </pre>
          <button 
            className="copy-code-button"
            onClick={copyModelCode}
          >
            📋 Copy Full Code
          </button>
        </div>
      </div>

      <div className="deployment-tips">
        <h3>Deployment Tips</h3>
        <ul>
          <li><strong>Web Apps:</strong> Host model files on your server and load with tf.loadLayersModel()</li>
          <li><strong>Mobile:</strong> Consider using TensorFlow Lite for smaller model sizes</li>
          <li><strong>Node.js:</strong> Use @tensorflow/tfjs-node for server-side inference</li>
          <li><strong>Performance:</strong> Model size is ~{stats.memoryEstimate}MB, suitable for browser deployment</li>
          <li><strong>Updates:</strong> Save training configurations to easily retrain with new data</li>
        </ul>
      </div>

      {exportStatus && (
        <div className={`export-status ${exportStatus.includes('✅') ? 'success' : exportStatus.includes('❌') ? 'error' : ''}`}>
          {exportStatus}
        </div>
      )}

      <div className="final-actions">
        <button className="prev-button" onClick={onPrev}>
          ← Back to Prediction
        </button>
        
        <div className="completion-message">
          <h4>🎉 Congratulations!</h4>
          <p>You've successfully trained a text classification model entirely in your browser!</p>
        </div>
      </div>
    </div>
  );
}