# 🤖 Browser ML Text Classifier

A complete web application for training text classification models entirely in the browser using TensorFlow.js. No server required - everything runs client-side!

## ✨ Features

- **🔄 Complete ML Pipeline**: Upload dataset → Preprocess → Build model → Train → Test → Export
- **🌐 Browser-Only Training**: All training happens in your browser using TensorFlow.js
- **📊 Real-time Visualization**: Live training progress with loss/accuracy charts
- **🔤 Custom Tokenizer**: Built-in text tokenization and preprocessing
- **🧠 Neural Network**: Configurable embedding + dense layers architecture
- **💾 Model Export**: Download trained models for use in other applications
- **📱 Responsive Design**: Works on desktop and mobile devices

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Modern browser with JavaScript enabled

### Installation

1. **Clone and install dependencies:**
```bash
cd frontend
npm install
```

2. **Start the development server:**
```bash
npm run dev
```

3. **Open your browser:**
Navigate to `http://localhost:5173`

## 📋 Usage Guide

### Step 1: Upload Dataset
- Supports CSV and JSON formats
- Required columns: `text` and `label`
- Example CSV:
```csv
text,label
"Hello, how are you?",greeting
"What's the weather like?",weather
"Thank you!",gratitude
```

### Step 2: Text Preprocessing & Tokenization
The tokenizer converts text to numerical sequences:

1. **Text Preprocessing**: Converts to lowercase, removes punctuation
2. **Vocabulary Building**: Creates word-to-number mappings
3. **Sequence Creation**: Converts text to integer sequences  
4. **Padding**: Ensures uniform sequence length

**Key Parameters:**
- **Vocabulary Size**: Number of unique words to keep (1000-10000)
- **Max Sequence Length**: Padding/truncation length (10-200)

### Step 3: Model Architecture
Neural network with:
- **Embedding Layer**: Converts word indices to dense vectors
- **Global Average Pooling**: Averages embeddings across sequence
- **Dense Layer**: Hidden layer with ReLU activation
- **Dropout**: 30% dropout for regularization  
- **Output Layer**: Softmax for multi-class classification

**Hyperparameters:**
- **Embedding Dimensions**: Size of word vectors (8-128)
- **Hidden Units**: Dense layer neurons (16-256)
- **Learning Rate**: How fast the model learns (0.0001-0.01)

### Step 4: Training
- **Batch Size**: Samples processed together (8-128)
- **Epochs**: Complete passes through dataset (1-100)
- **Validation Split**: Fraction for validation (0.1-0.4)

Real-time monitoring of:
- Training/validation loss
- Training/validation accuracy
- Training time

### Step 5: Testing & Prediction
- Test model on custom text inputs
- View prediction confidence scores
- See probability distribution across all classes

### Step 6: Model Export
Download:
- **Complete Package**: Model + tokenizer + training history
- **Model Only**: TensorFlow.js format (.json + .bin files)
- **Tokenizer Config**: For text preprocessing
- **Training History**: Performance metrics

## 🔧 Technical Details

### Tokenizer Implementation
Custom JavaScript tokenizer that:
- Builds vocabulary from training data
- Maps words to integer indices
- Handles out-of-vocabulary words
- Pads sequences to uniform length

```javascript
// Example tokenizer usage
const tokenizer = new TextTokenizer(vocabSize=1000, maxLength=50);
tokenizer.fitOnTexts(texts);
const sequences = tokenizer.textsToSequences(texts);
const padded = tokenizer.padSequences(sequences);
```

### Neural Network Architecture
```
Input (text sequences) → Embedding → Global Avg Pool → Dense → Dropout → Softmax → Predictions
```

**Memory Usage**: ~1-10MB depending on vocabulary size and model complexity

### Browser Compatibility
- **Chrome**: Full support
- **Firefox**: Full support  
- **Safari**: Full support
- **Edge**: Full support
- **Mobile**: Supported but may be slower

## 📊 Performance Considerations

### Dataset Size Guidelines
- **Small (< 100 samples)**: Use smaller embedding dimensions (8-16)
- **Medium (100-1000 samples)**: Default settings work well
- **Large (1000+ samples)**: Can use larger models (32+ dimensions)

### Memory Management
- Models automatically dispose tensors to prevent memory leaks
- Larger vocabularies use more memory
- Training is done in batches to manage memory usage

### Training Speed
- **Batch Size**: Larger batches = faster training but more memory
- **Model Complexity**: More parameters = slower training
- **Dataset Size**: More samples = longer training time

Typical training times:
- 100 samples, 20 epochs: ~30 seconds
- 1000 samples, 20 epochs: ~2-5 minutes
- 10000 samples, 20 epochs: ~10-30 minutes

## 🔍 Best Practices

### Dataset Quality
- **Balanced Classes**: Try to have similar numbers of examples per class
- **Clean Text**: Remove excessive punctuation, normalize text
- **Sufficient Data**: Aim for 50+ examples per class minimum

### Model Configuration
- **Start Small**: Begin with default parameters and adjust based on performance
- **Monitor Overfitting**: Watch for validation accuracy plateau
- **Experiment**: Try different embedding dimensions and hidden units

### Tokenization
- **Vocabulary Size**: Balance between coverage and memory usage
- **Sequence Length**: Set based on your typical text length
- **Out-of-Vocab**: Monitor OOV tokens - high numbers may indicate need for larger vocabulary

## 🚀 Deployment

### Static Hosting
Deploy to any static hosting service:
```bash
npm run build
# Upload dist/ folder to your hosting provider
```

### Integration
Use exported models in other applications:
```javascript
// Load trained model
const model = await tf.loadLayersModel('/path/to/model.json');

// Load tokenizer config
const tokenizer = await fetch('/path/to/tokenizer.json').then(r => r.json());

// Make predictions
const prediction = await model.predict(preprocessedText);
```

## 🛠️ Development

### Project Structure
```
frontend/
├── src/
│   ├── components/          # React components
│   │   ├── DatasetUpload.tsx
│   │   ├── Tokenizer.tsx    # Core tokenization logic
│   │   ├── ModelBuilder.tsx # TensorFlow.js model creation
│   │   ├── Training.tsx     # Training loop and visualization
│   │   ├── Prediction.tsx   # Model inference
│   │   └── ModelExport.tsx  # Export functionality
│   ├── types.ts            # TypeScript interfaces
│   ├── App.tsx             # Main application
│   └── App.css             # Styling
├── package.json
└── vite.config.ts
```

### Key Technologies
- **Frontend**: React 18 + TypeScript + Vite
- **ML**: TensorFlow.js
- **Visualization**: Recharts
- **File Handling**: react-dropzone
- **Styling**: Custom CSS with modern design

## 📈 Example Use Cases

- **Customer Support**: Classify support tickets by category
- **Content Moderation**: Detect spam or inappropriate content
- **Sentiment Analysis**: Classify text sentiment (positive/negative/neutral)
- **Intent Recognition**: Understand user intentions in chatbots
- **Document Classification**: Categorize documents by type or topic

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- TensorFlow.js team for making ML in the browser possible
- React team for the excellent framework
- The open-source community for inspiration and tools