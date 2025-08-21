// DatasetPreview component
import type { DatasetItem } from '../types';

interface DatasetPreviewProps {
  dataset: DatasetItem[];
  onNext: () => void;
  onPrev: () => void;
}

export default function DatasetPreview({ dataset, onNext, onPrev }: DatasetPreviewProps) {
  if (dataset.length === 0) {
    return (
      <div className="dataset-preview">
        <h2>📊 Dataset Preview</h2>
        <p>No dataset loaded. Please go back and upload a dataset.</p>
        <button className="prev-button" onClick={onPrev}>
          ← Back to Upload
        </button>
      </div>
    );
  }

  const labelCounts = dataset.reduce((acc, item) => {
    acc[item.label] = (acc[item.label] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="dataset-preview">
      <h2>📊 Dataset Preview</h2>
      <p>Review your dataset before proceeding to tokenization.</p>

      <div className="dataset-stats">
        <div className="stats-summary">
          <div className="stat-item">
            <span className="stat-value">{dataset.length}</span>
            <span className="stat-label">Total Samples</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{Object.keys(labelCounts).length}</span>
            <span className="stat-label">Unique Labels</span>
          </div>
        </div>

        <div className="label-distribution">
          <h3>Label Distribution:</h3>
          <div className="label-bars">
            {Object.entries(labelCounts)
              .sort(([,a], [,b]) => b - a)
              .map(([label, count]) => (
                <div key={label} className="label-bar">
                  <div className="label-info">
                    <span className="label-name">{label}</span>
                    <span className="label-count">{count} ({Math.round(count / dataset.length * 100)}%)</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${(count / Math.max(...Object.values(labelCounts))) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="data-sample">
        <h3>Sample Data ({Math.min(10, dataset.length)} of {dataset.length}):</h3>
        <div className="sample-table">
          <div className="table-header">
            <div className="col-text">Text</div>
            <div className="col-label">Label</div>
          </div>
          {dataset.slice(0, 10).map((item, index) => (
            <div key={index} className="table-row">
              <div className="col-text">
                <span className="text-content">{item.text}</span>
              </div>
              <div className="col-label">
                <span className="label-badge">{item.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="navigation-buttons">
        <button className="prev-button" onClick={onPrev}>
          ← Back to Upload
        </button>
        <button className="next-button" onClick={onNext}>
          Continue to Tokenization →
        </button>
      </div>
    </div>
  );
}