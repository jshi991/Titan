// Simple test script to validate core functionality
import * as tf from '@tensorflow/tfjs';

// Test 1: TensorFlow.js loading
console.log('🧪 Testing TensorFlow.js...');
console.log('TF version:', tf.version.tfjs);
console.log('Backend:', tf.getBackend());

// Test 2: Tokenizer functionality
console.log('\n🔤 Testing Tokenizer...');

class TextTokenizer {
  constructor(vocabSize = 1000, maxLength = 50, oovToken = '<OOV>') {
    this.vocabSize = vocabSize;
    this.maxLength = maxLength;
    this.oovToken = oovToken;
    this.wordIndex = {};
    this.indexWord = {};
    this.nextIndex = 2;
    
    this.wordIndex['<PAD>'] = 0;
    this.wordIndex[oovToken] = 1;
    this.indexWord[0] = '<PAD>';
    this.indexWord[1] = oovToken;
  }

  preprocessText(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 0);
  }

  fitOnTexts(texts) {
    const wordCounts = {};
    
    for (const text of texts) {
      const words = this.preprocessText(text);
      for (const word of words) {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      }
    }

    const sortedWords = Object.entries(wordCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, this.vocabSize - 2)
      .map(([word]) => word);

    for (const word of sortedWords) {
      if (!this.wordIndex[word]) {
        this.wordIndex[word] = this.nextIndex;
        this.indexWord[this.nextIndex] = word;
        this.nextIndex++;
      }
    }
  }

  textsToSequences(texts) {
    return texts.map(text => {
      const words = this.preprocessText(text);
      return words.map(word => this.wordIndex[word] || this.wordIndex[this.oovToken]);
    });
  }

  padSequences(sequences) {
    return sequences.map(seq => {
      if (seq.length >= this.maxLength) {
        return seq.slice(0, this.maxLength);
      } else {
        return [...seq, ...new Array(this.maxLength - seq.length).fill(0)];
      }
    });
  }
}

// Test sample data
const testTexts = [
  "Hello, how are you?",
  "What's the weather like?",
  "Thank you for your help!",
  "I need assistance with my account"
];

const testLabels = ["greeting", "weather", "gratitude", "support"];

const tokenizer = new TextTokenizer(100, 10);
tokenizer.fitOnTexts(testTexts);

console.log('Vocabulary size:', Object.keys(tokenizer.wordIndex).length);
console.log('Sample vocabulary:', Object.entries(tokenizer.wordIndex).slice(0, 10));

const sequences = tokenizer.textsToSequences(testTexts);
const paddedSequences = tokenizer.padSequences(sequences);

console.log('Original:', testTexts[0]);
console.log('Sequence:', sequences[0]);
console.log('Padded:', paddedSequences[0]);

// Test 3: Model creation
console.log('\n🧠 Testing Model Creation...');

try {
  const model = tf.sequential({
    layers: [
      tf.layers.embedding({
        inputDim: 100,
        outputDim: 16,
        inputLength: 10
      }),
      tf.layers.globalAveragePooling1d(),
      tf.layers.dense({
        units: 32,
        activation: 'relu'
      }),
      tf.layers.dropout({ rate: 0.3 }),
      tf.layers.dense({
        units: 4,
        activation: 'softmax'
      })
    ]
  });

  model.compile({
    optimizer: tf.train.adam(0.001),
    loss: 'sparseCategoricalCrossentropy',
    metrics: ['accuracy']
  });

  console.log('✅ Model created successfully');
  console.log('Parameters:', model.countParams());
  
  // Test tensor operations
  const testInput = tf.tensor2d(paddedSequences);
  const prediction = model.predict(testInput);
  console.log('✅ Model prediction successful');
  console.log('Prediction shape:', prediction.shape);
  
  // Cleanup
  testInput.dispose();
  prediction.dispose();
  model.dispose();
  
} catch (error) {
  console.error('❌ Model test failed:', error);
}

// Test 4: Memory management
console.log('\n🧹 Testing Memory Management...');
console.log('Memory before:', tf.memory());

// Create and dispose tensors
for (let i = 0; i < 10; i++) {
  const tensor = tf.randomNormal([100, 50]);
  tensor.dispose();
}

console.log('Memory after cleanup:', tf.memory());

console.log('\n✅ All tests completed!');