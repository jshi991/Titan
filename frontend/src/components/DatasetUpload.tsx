import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import type { DatasetItem } from '../types';

interface DatasetUploadProps {
  onDatasetLoad: (dataset: DatasetItem[]) => void;
  onNext: () => void;
}

export default function DatasetUpload({ onDatasetLoad, onNext }: DatasetUploadProps) {
  const [dataset, setDataset] = useState<DatasetItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const parseCSV = (csvText: string): DatasetItem[] => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV must have at least a header and one data row');
    }

    const header = lines[0].split(',').map(col => col.trim().replace(/"/g, ''));
    const textCol = header.findIndex(col => col.toLowerCase() === 'text');
    const labelCol = header.findIndex(col => col.toLowerCase() === 'label');

    if (textCol === -1 || labelCol === -1) {
      throw new Error('CSV must have "text" and "label" columns');
    }

    return lines.slice(1).map(line => {
      const cols = line.split(',').map(col => col.trim().replace(/"/g, ''));
      return {
        text: cols[textCol] || '',
        label: cols[labelCol] || ''
      };
    }).filter(item => item.text && item.label);
  };

  const parseJSON = (jsonText: string): DatasetItem[] => {
    const data = JSON.parse(jsonText);
    if (!Array.isArray(data)) {
      throw new Error('JSON must be an array of objects');
    }

    return data.map((item, index) => {
      if (!item.text || !item.label) {
        throw new Error(`Item at index ${index} must have "text" and "label" properties`);
      }
      return {
        text: String(item.text),
        label: String(item.label)
      };
    });
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setLoading(true);
    setError('');

    try {
      const text = await file.text();
      let parsedData: DatasetItem[];

      if (file.name.endsWith('.csv')) {
        parsedData = parseCSV(text);
      } else if (file.name.endsWith('.json')) {
        parsedData = parseJSON(text);
      } else {
        throw new Error('File must be .csv or .json format');
      }

      if (parsedData.length === 0) {
        throw new Error('No valid data found in file');
      }

      setDataset(parsedData);
      onDatasetLoad(parsedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file');
    } finally {
      setLoading(false);
    }
  }, [onDatasetLoad]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/json': ['.json']
    },
    maxFiles: 1
  });

  const getDatasetStats = () => {
    if (dataset.length === 0) return null;

    const labelCounts = dataset.reduce((acc, item) => {
      acc[item.label] = (acc[item.label] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalSamples: dataset.length,
      uniqueLabels: Object.keys(labelCounts).length,
      labelDistribution: labelCounts
    };
  };

  const stats = getDatasetStats();

  return (
    <div className="dataset-upload">
      <h2>📁 Upload Your Dataset</h2>
      <p>Upload a CSV or JSON file containing text samples and their corresponding labels.</p>

      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? 'active' : ''} ${loading ? 'loading' : ''}`}
      >
        <input {...getInputProps()} />
        {loading ? (
          <div>
            <div className="spinner"></div>
            <p>Processing file...</p>
          </div>
        ) : (
          <div>
            <div className="upload-icon">📤</div>
            {isDragActive ? (
              <p>Drop the file here...</p>
            ) : (
              <>
                <p>Drag & drop a dataset file here, or click to select</p>
                <p className="file-types">Supported: .csv, .json</p>
              </>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="error-message">
          <span>❌ {error}</span>
        </div>
      )}

      {stats && (
        <div className="dataset-stats">
          <h3>Dataset Statistics</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Total Samples:</span>
              <span className="stat-value">{stats.totalSamples}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Unique Labels:</span>
              <span className="stat-value">{stats.uniqueLabels}</span>
            </div>
          </div>

          <div className="label-distribution">
            <h4>Label Distribution:</h4>
            {Object.entries(stats.labelDistribution).map(([label, count]) => (
              <div key={label} className="label-count">
                <span className="label">{label}:</span>
                <span className="count">{count} samples</span>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${(count / stats.totalSamples) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div className="format-preview">
            <h4>Sample Data:</h4>
            <div className="sample-items">
              {dataset.slice(0, 3).map((item, index) => (
                <div key={index} className="sample-item">
                  <div className="sample-text">"{item.text}"</div>
                  <div className="sample-label">→ {item.label}</div>
                </div>
              ))}
              {dataset.length > 3 && <div className="more-indicator">... and {dataset.length - 3} more</div>}
            </div>
          </div>

          <button 
            className="next-button"
            onClick={onNext}
            disabled={dataset.length === 0}
          >
            Continue to Preview →
          </button>
        </div>
      )}

      <div className="format-help">
        <details>
          <summary>Expected File Formats</summary>
          <div className="format-examples">
            <div className="format-example">
              <h4>CSV Format:</h4>
              <pre>{`text,label
"Hello, how are you?",greeting
"What's the weather like?",weather
"Thank you so much!",gratitude`}</pre>
            </div>
            <div className="format-example">
              <h4>JSON Format:</h4>
              <pre>{`[
  {"text": "Hello, how are you?", "label": "greeting"},
  {"text": "What's the weather like?", "label": "weather"},
  {"text": "Thank you so much!", "label": "gratitude"}
]`}</pre>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}