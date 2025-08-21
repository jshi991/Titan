import { useState } from 'react'
import './App.css'
import DatasetUpload from './components/DatasetUpload'
import DatasetPreview from './components/DatasetPreview'
import Tokenizer from './components/Tokenizer'
import ModelBuilder from './components/ModelBuilder'
import Training from './components/Training'
import Prediction from './components/Prediction'
import ModelExport from './components/ModelExport'
import type { DatasetItem } from './types'

function App() {
  const [currentStep, setCurrentStep] = useState(0)
  const [dataset, setDataset] = useState<DatasetItem[]>([])
  const [tokenizerData, setTokenizerData] = useState<{
    tokenizer: any,
    sequences: number[][],
    labels: number[],
    labelMap: { [key: string]: number }
  } | null>(null)
  const [model, setModel] = useState<any>(null)
  const [isTraining, setIsTraining] = useState(false)
  const [trainingHistory, setTrainingHistory] = useState<any[]>([])

  const steps = [
    'Upload Dataset',
    'Preview Data', 
    'Tokenization',
    'Model Setup',
    'Training',
    'Prediction',
    'Export Model'
  ]

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🤖 Browser ML Text Classifier</h1>
        <p>Train a neural network classifier entirely in your browser using TensorFlow.js!</p>
        
        {/* Step indicators */}
        <div className="step-indicators">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className={`step ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
            >
              <span className="step-number">{index + 1}</span>
              <span className="step-title">{step}</span>
            </div>
          ))}
        </div>
      </header>

      <main className="app-main">
        {currentStep === 0 && (
          <DatasetUpload 
            onDatasetLoad={setDataset} 
            onNext={nextStep}
          />
        )}
        
        {currentStep === 1 && (
          <DatasetPreview 
            dataset={dataset}
            onNext={nextStep}
            onPrev={prevStep}
          />
        )}
        
        {currentStep === 2 && (
          <Tokenizer 
            dataset={dataset}
            onTokenizerReady={setTokenizerData}
            onNext={nextStep}
            onPrev={prevStep}
          />
        )}
        
        {currentStep === 3 && (
          <ModelBuilder 
            tokenizerData={tokenizerData}
            onModelReady={setModel}
            onNext={nextStep}
            onPrev={prevStep}
          />
        )}
        
        {currentStep === 4 && (
          <Training 
            model={model}
            tokenizerData={tokenizerData}
            isTraining={isTraining}
            setIsTraining={setIsTraining}
            trainingHistory={trainingHistory}
            setTrainingHistory={setTrainingHistory}
            onNext={nextStep}
            onPrev={prevStep}
          />
        )}
        
        {currentStep === 5 && (
          <Prediction 
            model={model}
            tokenizerData={tokenizerData}
            onNext={nextStep}
            onPrev={prevStep}
          />
        )}
        
        {currentStep === 6 && (
          <ModelExport 
            model={model}
            tokenizerData={tokenizerData}
            trainingHistory={trainingHistory}
            onPrev={prevStep}
          />
        )}
      </main>
    </div>
  )
}

export default App
