import { useState } from 'react';
import type { DatasetItem, TokenizerState } from '../types';

interface TokenizerProps {
  dataset: DatasetItem[];
  onTokenizerReady: (data: {
    tokenizer: TokenizerState,
    sequences: number[][],
    labels: number[],
    labelMap: { [key: string]: number }
  }) => void;
  onNext: () => void;
  onPrev: () => void;
}

/**
 * Custom Tokenizer Implementation
 * 
 * This tokenizer converts text into sequences of integers for neural network processing.
 * It works by:
 * 1. Building a vocabulary from all unique words in the dataset
 * 2. Assigning each word a unique integer ID
 * 3. Converting text into sequences of these integers
 * 4. Padding sequences to a uniform length
 */
class TextTokenizer {
  public wordIndex: { [key: string]: number } = {};
  public indexWord: { [key: number]: string } = {};
  public vocabSize: number;
  public maxLength: number;
  public oovToken: string;
  private nextIndex: number = 2; // Start at 2 (0=padding, 1=OOV)

  constructor(vocabSize: number = 1000, maxLength: number = 50, oovToken: string = '<OOV>') {
    this.vocabSize = vocabSize;
    this.maxLength = maxLength;
    this.oovToken = oovToken;
    
    // Reserve indices for special tokens
    this.wordIndex['<PAD>'] = 0;  // Padding token
    this.wordIndex[oovToken] = 1; // Out-of-vocabulary token
    this.indexWord[0] = '<PAD>';
    this.indexWord[1] = oovToken;
  }

  // Preprocess text: lowercase, remove punctuation, split into words
  private preprocessText(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .split(/\s+/)           // Split on whitespace
      .filter(word => word.length > 0);
  }

  // Build vocabulary from dataset
  fitOnTexts(texts: string[]): void {
    console.log('🔤 Building vocabulary from', texts.length, 'texts...');
    
    // Count word frequencies
    const wordCounts: { [key: string]: number } = {};
    
    for (const text of texts) {
      const words = this.preprocessText(text);
      for (const word of words) {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      }
    }

    // Sort words by frequency and take top vocab_size - 2 (excluding special tokens)
    const sortedWords = Object.entries(wordCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, this.vocabSize - 2)
      .map(([word]) => word);

    // Build word-to-index mapping
    for (const word of sortedWords) {
      if (!this.wordIndex[word]) {
        this.wordIndex[word] = this.nextIndex;
        this.indexWord[this.nextIndex] = word;
        this.nextIndex++;
      }
    }

    console.log('📚 Vocabulary built:', {
      vocabularySize: Object.keys(this.wordIndex).length,
      mostCommonWords: sortedWords.slice(0, 10),
      sampleWordIndices: Object.entries(this.wordIndex).slice(0, 5)
    });
  }

  // Convert texts to sequences of integers
  textsToSequences(texts: string[]): number[][] {
    return texts.map(text => {
      const words = this.preprocessText(text);
      return words.map(word => this.wordIndex[word] || this.wordIndex[this.oovToken]);
    });
  }

  // Pad sequences to uniform length
  padSequences(sequences: number[][]): number[][] {
    return sequences.map(seq => {
      if (seq.length >= this.maxLength) {
        // Truncate if too long
        return seq.slice(0, this.maxLength);
      } else {
        // Pad with zeros if too short
        return [...seq, ...new Array(this.maxLength - seq.length).fill(0)];
      }
    });
  }

  // Get tokenizer state for serialization
  getState(): TokenizerState {
    return {
      wordIndex: this.wordIndex,
      indexWord: this.indexWord,
      vocabSize: this.vocabSize,
      maxLength: this.maxLength,
      oovToken: this.oovToken
    };
  }

  // Create tokenizer from saved state
  static fromState(state: TokenizerState): TextTokenizer {
    const tokenizer = new TextTokenizer(state.vocabSize, state.maxLength, state.oovToken);
    tokenizer.wordIndex = state.wordIndex;
    tokenizer.indexWord = state.indexWord;
    tokenizer.nextIndex = Math.max(...Object.values(state.wordIndex)) + 1;
    return tokenizer;
  }
}

export default function Tokenizer({ dataset, onTokenizerReady, onNext, onPrev }: TokenizerProps) {
  const [vocabSize, setVocabSize] = useState(1000);
  const [maxLength, setMaxLength] = useState(50);
  const [tokenizer, setTokenizer] = useState<TextTokenizer | null>(null);
  const [sequences, setSequences] = useState<number[][]>([]);
  const [, setLabels] = useState<number[]>([]);
  const [labelMap, setLabelMap] = useState<{ [key: string]: number }>({});
  const [processing, setProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');

  const buildTokenizer = async () => {
    if (dataset.length === 0) return;

    setProcessing(true);
    
    try {
      setProcessingStep('Extracting text samples...');
      const texts = dataset.map(item => item.text);
      
      setProcessingStep('Building vocabulary...');
      const newTokenizer = new TextTokenizer(vocabSize, maxLength);
      
      // Add small delay to show progress
      await new Promise(resolve => setTimeout(resolve, 100));
      
      newTokenizer.fitOnTexts(texts);
      
      setProcessingStep('Converting text to sequences...');
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const rawSequences = newTokenizer.textsToSequences(texts);
      const paddedSequences = newTokenizer.padSequences(rawSequences);
      
      setProcessingStep('Processing labels...');
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Create label mapping
      const uniqueLabels = [...new Set(dataset.map(item => item.label))];
      const newLabelMap = uniqueLabels.reduce((acc, label, index) => {
        acc[label] = index;
        return acc;
      }, {} as { [key: string]: number });
      
      const numericLabels = dataset.map(item => newLabelMap[item.label]);
      
      setTokenizer(newTokenizer);
      setSequences(paddedSequences);
      setLabels(numericLabels);
      setLabelMap(newLabelMap);
      
      onTokenizerReady({
        tokenizer: newTokenizer.getState(),
        sequences: paddedSequences,
        labels: numericLabels,
        labelMap: newLabelMap
      });

    } catch (error) {
      console.error('Error building tokenizer:', error);
    } finally {
      setProcessing(false);
      setProcessingStep('');
    }
  };

  const getTokenizationStats = () => {
    if (!tokenizer || sequences.length === 0) return null;

    const sequenceLengths = sequences.map(seq => seq.filter(token => token !== 0).length);
    const avgLength = sequenceLengths.reduce((a, b) => a + b, 0) / sequenceLengths.length;
    const maxOriginalLength = Math.max(...sequenceLengths);
    const minOriginalLength = Math.min(...sequenceLengths);
    
    return {
      vocabularySize: Object.keys(tokenizer.wordIndex).length,
      averageSequenceLength: Math.round(avgLength * 100) / 100,
      maxOriginalLength,
      minOriginalLength,
      paddedLength: maxLength,
      oovCount: sequences.flat().filter(token => token === 1).length
    };
  };

  const stats = getTokenizationStats();

  return (
    <div className="tokenizer">
      <h2>🔤 Text Tokenization</h2>
      <p>
        The tokenizer converts your text data into numerical sequences that the neural network can process.
        This involves building a vocabulary of unique words and mapping each word to a number.
      </p>

      <div className="tokenizer-config">
        <div className="config-group">
          <label htmlFor="vocab-size">
            Vocabulary Size:
            <span className="help-text">Maximum number of unique words to keep</span>
          </label>
          <input
            type="number"
            id="vocab-size"
            value={vocabSize}
            onChange={(e) => setVocabSize(parseInt(e.target.value))}
            min="100"
            max="10000"
            step="100"
            disabled={processing}
          />
        </div>

        <div className="config-group">
          <label htmlFor="max-length">
            Max Sequence Length:
            <span className="help-text">All sequences will be padded/truncated to this length</span>
          </label>
          <input
            type="number"
            id="max-length"
            value={maxLength}
            onChange={(e) => setMaxLength(parseInt(e.target.value))}
            min="10"
            max="200"
            step="5"
            disabled={processing}
          />
        </div>

        <button 
          className="process-button"
          onClick={buildTokenizer}
          disabled={processing || dataset.length === 0}
        >
          {processing ? '⏳ Processing...' : '🔨 Build Tokenizer'}
        </button>
      </div>

      {processing && (
        <div className="processing-status">
          <div className="spinner"></div>
          <p>{processingStep}</p>
        </div>
      )}

      {stats && (
        <div className="tokenization-results">
          <h3>Tokenization Results</h3>
          
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">{stats.vocabularySize}</div>
              <div className="stat-label">Vocabulary Size</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.averageSequenceLength}</div>
              <div className="stat-label">Avg Sequence Length</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.paddedLength}</div>
              <div className="stat-label">Padded Length</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.oovCount}</div>
              <div className="stat-label">Out-of-Vocab Tokens</div>
            </div>
          </div>

          <div className="tokenization-examples">
            <h4>Tokenization Examples:</h4>
            {dataset.slice(0, 3).map((item, index) => (
              <div key={index} className="example">
                <div className="original-text">
                  <strong>Original:</strong> "{item.text}"
                </div>
                <div className="tokenized">
                  <strong>Tokens:</strong> [{sequences[index]?.slice(0, 10).join(', ')}{sequences[index]?.length > 10 ? '...' : ''}]
                </div>
                <div className="label-info">
                  <strong>Label:</strong> {item.label} → {labelMap[item.label]}
                </div>
              </div>
            ))}
          </div>

          <div className="vocab-preview">
            <h4>Vocabulary Sample:</h4>
            <div className="vocab-items">
              {tokenizer && Object.entries(tokenizer.wordIndex).slice(0, 20).map(([word, index]) => (
                <span key={word} className="vocab-item">
                  {word}:{index}
                </span>
              ))}
              {tokenizer && Object.keys(tokenizer.wordIndex).length > 20 && (
                <span className="more-vocab">... +{Object.keys(tokenizer.wordIndex).length - 20} more</span>
              )}
            </div>
          </div>

          <div className="explanation">
            <h4>How the Tokenizer Works:</h4>
            <ol>
              <li><strong>Text Preprocessing:</strong> Converts to lowercase, removes punctuation, splits into words</li>
              <li><strong>Vocabulary Building:</strong> Finds the most frequent {vocabSize} words in your dataset</li>
              <li><strong>Word-to-Number Mapping:</strong> Assigns each word a unique integer ID (0=padding, 1=unknown)</li>
              <li><strong>Sequence Creation:</strong> Converts each text into a sequence of word IDs</li>
              <li><strong>Padding:</strong> Ensures all sequences are exactly {maxLength} tokens long</li>
            </ol>
          </div>

          <div className="navigation-buttons">
            <button className="prev-button" onClick={onPrev}>
              ← Back to Preview
            </button>
            <button className="next-button" onClick={onNext}>
              Continue to Model Setup →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}