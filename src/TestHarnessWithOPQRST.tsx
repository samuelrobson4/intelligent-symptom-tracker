/**
 * Enhanced test harness with OPQRST secondary questions support
 */

import { useState } from 'react';
import { processMessageWithRetry, collectOPQRSTResponse } from './claudeService';
import { ExtractionResponse, SymptomMetadata, OPQRSTResponses } from './types';
import {
  shouldTriggerSecondary,
  getOPQRSTQuestions,
  getSecondaryQuestionsRationale,
  formatOPQRSTResponses,
} from './opqrst';

type FlowState = 'initial' | 'opqrst' | 'complete';

export function TestHarnessWithOPQRST() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [flowState, setFlowState] = useState<FlowState>('initial');
  const [extractedMetadata, setExtractedMetadata] = useState<SymptomMetadata | null>(null);
  const [opqrstResponses, setOpqrstResponses] = useState<OPQRSTResponses>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExtractionResponse | null>(null);

  const opqrstQuestions = getOPQRSTQuestions();

  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await processMessageWithRetry(input);
      setResult(response);
      setExtractedMetadata(response.metadata);

      // Check if we should trigger OPQRST questions
      if (shouldTriggerSecondary(response.metadata)) {
        setFlowState('opqrst');
        setCurrentQuestionIndex(0);
      } else {
        setFlowState('complete');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setFlowState('initial');
    } finally {
      setLoading(false);
      setInput('');
    }
  };

  const handleOPQRSTSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const currentQuestion = opqrstQuestions[currentQuestionIndex];
      const answer = await collectOPQRSTResponse(currentQuestion.question, input);

      // Store the response
      setOpqrstResponses((prev) => ({
        ...prev,
        [currentQuestion.key]: answer,
      }));

      // Move to next question or complete
      if (currentQuestionIndex < opqrstQuestions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
        setInput('');
      } else {
        setFlowState('complete');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFlowState('initial');
    setExtractedMetadata(null);
    setOpqrstResponses({});
    setCurrentQuestionIndex(0);
    setInput('');
    setError(null);
    setResult(null);
  };

  const testCases = [
    'bad headache',
    'stomach ache',
    'severe chest pain for days',
    'my back has been hurting for weeks',
    'sharp pain in my leg',
  ];

  const handleTestCase = (testCase: string) => {
    if (flowState === 'initial') {
      setInput(testCase);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Symptom Extraction Test Harness (with OPQRST)
        </h1>
        <p className="text-gray-600 mb-8">
          Test the conversational symptom metadata extraction with secondary questions
        </p>

        {/* Progress Indicator */}
        <div className="mb-6 flex items-center gap-2">
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              flowState === 'initial'
                ? 'bg-blue-500 text-white'
                : 'bg-green-500 text-white'
            }`}
          >
            1. Primary Metadata
          </div>
          <div className="flex-1 h-1 bg-gray-300 rounded">
            <div
              className={`h-full bg-blue-500 rounded transition-all ${
                flowState !== 'initial' ? 'w-full' : 'w-0'
              }`}
            />
          </div>
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              flowState === 'opqrst'
                ? 'bg-blue-500 text-white'
                : flowState === 'complete'
                ? 'bg-green-500 text-white'
                : 'bg-gray-300 text-gray-600'
            }`}
          >
            2. OPQRST ({currentQuestionIndex + 1}/{opqrstQuestions.length})
          </div>
          <div className="flex-1 h-1 bg-gray-300 rounded">
            <div
              className={`h-full bg-blue-500 rounded transition-all ${
                flowState === 'complete' ? 'w-full' : 'w-0'
              }`}
            />
          </div>
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              flowState === 'complete' ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
            }`}
          >
            3. Complete
          </div>
        </div>

        {/* Quick Test Cases - Only show in initial state */}
        {flowState === 'initial' && (
          <div className="mb-6">
            <h2 className="text-sm font-medium text-gray-700 mb-2">Quick Test Cases:</h2>
            <div className="flex flex-wrap gap-2">
              {testCases.map((testCase) => (
                <button
                  key={testCase}
                  onClick={() => handleTestCase(testCase)}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                >
                  "{testCase}"
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Initial Input Form */}
        {flowState === 'initial' && (
          <form onSubmit={handleInitialSubmit} className="mb-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <label htmlFor="symptom-input" className="block text-sm font-medium text-gray-700 mb-2">
                Describe your symptom:
              </label>
              <textarea
                id="symptom-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g., severe chest pain for the past 3 days"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="mt-3 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading ? 'Extracting...' : 'Extract Metadata'}
              </button>
            </div>
          </form>
        )}

        {/* OPQRST Questions Flow */}
        {flowState === 'opqrst' && extractedMetadata && (
          <div className="mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="text-blue-900 font-semibold mb-2">Secondary Questions</h3>
              <p className="text-blue-800 text-sm">
                {getSecondaryQuestionsRationale(extractedMetadata)}
              </p>
            </div>

            <form onSubmit={handleOPQRSTSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question {currentQuestionIndex + 1} of {opqrstQuestions.length}:
              </label>
              <p className="text-gray-900 mb-3">{opqrstQuestions[currentQuestionIndex].question}</p>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Your answer..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={2}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="mt-3 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {loading
                  ? 'Processing...'
                  : currentQuestionIndex < opqrstQuestions.length - 1
                  ? 'Next Question'
                  : 'Complete'}
              </button>
            </form>

            {/* Progress on answered questions */}
            {currentQuestionIndex > 0 && (
              <div className="mt-4 bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Answered:</h4>
                <div className="space-y-1 text-sm">
                  {opqrstQuestions.slice(0, currentQuestionIndex).map((q) => (
                    <div key={q.key} className="text-gray-600">
                      ✓ {q.key.charAt(0).toUpperCase() + q.key.slice(1)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-red-800 font-semibold mb-1">Error</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Emergency Alert */}
        {result?.emergencyDetected && (
          <div className="mb-6 bg-red-100 border-2 border-red-500 rounded-lg p-4">
            <h3 className="text-red-900 font-bold mb-2">⚠️ EMERGENCY DETECTED</h3>
            <p className="text-red-800">{result.emergencyMessage}</p>
          </div>
        )}

        {/* Complete Results */}
        {flowState === 'complete' && extractedMetadata && (
          <div className="space-y-4">
            {/* Extracted Metadata */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Primary Metadata</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Location:</span>
                  <p className="font-medium text-gray-900">{extractedMetadata.location}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Duration:</span>
                  <p className="font-medium text-gray-900">{extractedMetadata.duration || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Severity:</span>
                  <p className="font-medium text-gray-900">
                    {extractedMetadata.severity !== undefined
                      ? `${extractedMetadata.severity}/10`
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Description:</span>
                  <p className="font-medium text-gray-900">{extractedMetadata.description || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* OPQRST Responses */}
            {Object.keys(opqrstResponses).length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">OPQRST Responses</h3>
                <div className="space-y-3">
                  {Object.entries(opqrstResponses).map(([key, value]) => (
                    <div key={key}>
                      <span className="text-sm font-medium text-gray-600">
                        {key.charAt(0).toUpperCase() + key.slice(1)}:
                      </span>
                      <p className="text-gray-900">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Raw JSON Output */}
            <div className="bg-gray-900 rounded-lg p-4">
              <h3 className="text-gray-100 font-semibold mb-2">Complete Data (JSON)</h3>
              <pre className="text-green-400 text-sm overflow-x-auto">
                {JSON.stringify(
                  {
                    metadata: extractedMetadata,
                    secondaryResponses: opqrstResponses,
                  },
                  null,
                  2
                )}
              </pre>
            </div>

            {/* Reset Button */}
            <button
              onClick={handleReset}
              className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors font-medium"
            >
              Log Another Symptom
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
