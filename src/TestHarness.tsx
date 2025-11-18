/**
 * Test harness for symptom metadata extraction
 * Simple UI to test the extraction functionality
 */

import { useState } from 'react';
import { extractMetadata } from './claudeService';
import { ExtractionResponse } from './types';

export function TestHarness() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExtractionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await extractMetadata(input);
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const testCases = [
    'bad headache',
    'stomach ache',
    'chest pain for days',
    'my back has been hurting for weeks',
    'sharp pain in my leg',
  ];

  const handleTestCase = (testCase: string) => {
    setInput(testCase);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Symptom Extraction Test Harness
        </h1>
        <p className="text-gray-600 mb-8">
          Test the conversational symptom metadata extraction
        </p>

        {/* Quick Test Cases */}
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

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <label htmlFor="symptom-input" className="block text-sm font-medium text-gray-700 mb-2">
              Describe your symptom:
            </label>
            <textarea
              id="symptom-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g., bad headache behind my eyes"
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

        {/* Results Display */}
        {result && (
          <div className="space-y-4">
            {/* Extracted Metadata */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Extracted Metadata</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Location:</span>
                  <p className="font-medium text-gray-900">{result.metadata.location}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Duration:</span>
                  <p className="font-medium text-gray-900">{result.metadata.duration || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Severity:</span>
                  <p className="font-medium text-gray-900">
                    {result.metadata.severity !== undefined ? `${result.metadata.severity}/10` : 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Description:</span>
                  <p className="font-medium text-gray-900">{result.metadata.description || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Follow-up Question */}
            {result.needsMoreInfo && result.followUpQuestion && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="text-yellow-900 font-semibold mb-1">Follow-up Needed</h3>
                <p className="text-yellow-800">{result.followUpQuestion}</p>
              </div>
            )}

            {/* Raw JSON Output */}
            <div className="bg-gray-900 rounded-lg p-4">
              <h3 className="text-gray-100 font-semibold mb-2">Raw JSON Response</h3>
              <pre className="text-green-400 text-sm overflow-x-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
