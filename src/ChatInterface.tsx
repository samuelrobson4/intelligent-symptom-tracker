/**
 * Chat-based interface for conversational symptom logging
 */

import { useState, useRef, useEffect } from 'react';
import {
  processChatMessage,
  ConversationMessage,
} from './claudeService';
import { SymptomMetadata, AdditionalInsights } from './types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedMetadata, setExtractedMetadata] = useState<SymptomMetadata | null>(null);
  const [additionalInsights, setAdditionalInsights] = useState<AdditionalInsights>({});
  const [conversationComplete, setConversationComplete] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setError(null);

    // Add user message to chat
    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setLoading(true);

    try {
      // Process the message with conversation context
      const result = await processChatMessage(
        newMessages.slice(0, -1) as ConversationMessage[], // Exclude the message we just added
        userMessage
      );

      // Update metadata
      setExtractedMetadata(result.extractedData.metadata);
      setAdditionalInsights(result.additionalInsights);
      setConversationComplete(result.extractedData.conversationComplete || false);

      // Add AI response to chat
      if (result.extractedData.aiMessage) {
        setMessages([...newMessages, { role: 'assistant', content: result.extractedData.aiMessage }]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      // Remove the user message that caused the error
      setMessages(messages);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([]);
    setInput('');
    setError(null);
    setExtractedMetadata(null);
    setAdditionalInsights({});
    setConversationComplete(false);
  };

  const handleQuickTest = (testMessage: string) => {
    setInput(testMessage);
  };

  const testCases = [
    'I have a bad headache',
    'severe chest pain for the past week',
    'my stomach has been hurting',
    'sharp pain in my leg since yesterday',
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <h1 className="text-2xl font-bold text-gray-900">Symptom Logger</h1>
        <p className="text-sm text-gray-600">Describe your symptoms in your own words</p>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col max-w-4xl w-full mx-auto">
        {/* Quick test cases - only show when no messages */}
        {messages.length === 0 && (
          <div className="p-4 bg-blue-50 border-b border-blue-100">
            <p className="text-sm font-medium text-blue-900 mb-2">Try these examples:</p>
            <div className="flex flex-wrap gap-2">
              {testCases.map((test) => (
                <button
                  key={test}
                  onClick={() => handleQuickTest(test)}
                  className="px-3 py-1 text-sm bg-white text-blue-700 rounded-md hover:bg-blue-100 transition-colors border border-blue-200"
                >
                  "{test}"
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-8">
              <p className="text-lg">Start a conversation to log your symptom</p>
              <p className="text-sm mt-2">I'll ask you questions to gather all the necessary details</p>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-900'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg px-4 py-2 text-gray-600">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Error display */}
        {error && (
          <div className="mx-4 mb-2 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Completion status */}
        {conversationComplete && (
          <div className="mx-4 mb-2 bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-green-800 text-sm font-medium">
              ✓ All information collected! You can review below or start a new entry.
            </p>
          </div>
        )}

        {/* Input area */}
        <div className="border-t border-gray-200 bg-white p-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Send
            </button>
          </form>
        </div>
      </div>

      {/* Extracted data panel (dev view) */}
      {extractedMetadata && (
        <div className="max-w-4xl w-full mx-auto p-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Extracted Data</h3>
              <button
                onClick={handleReset}
                className="px-4 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                New Entry
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <span className="text-sm text-gray-600">Location:</span>
                <p className="font-medium text-gray-900">{extractedMetadata.location || 'Not yet provided'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Onset:</span>
                <p className="font-medium text-gray-900">{extractedMetadata.onset || 'Not yet provided'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Severity:</span>
                <p className="font-medium text-gray-900">
                  {extractedMetadata.severity !== null && extractedMetadata.severity !== undefined
                    ? `${extractedMetadata.severity}/10`
                    : 'Not yet provided'}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Description:</span>
                <p className="font-medium text-gray-900">{extractedMetadata.description || 'Not yet provided'}</p>
              </div>
            </div>

            {Object.keys(additionalInsights).length > 0 && (
              <>
                <h4 className="text-sm font-semibold text-gray-700 mb-2 mt-4">Additional Insights</h4>
                <div className="space-y-2">
                  {Object.entries(additionalInsights).map(([key, value]) =>
                    value ? (
                      <div key={key}>
                        <span className="text-sm font-medium text-gray-600">
                          {key.charAt(0).toUpperCase() + key.slice(1)}:
                        </span>
                        <p className="text-gray-900 text-sm">{value}</p>
                      </div>
                    ) : null
                  )}
                </div>
              </>
            )}

            <details className="mt-4">
              <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-900">
                View JSON
              </summary>
              <pre className="mt-2 bg-gray-900 text-green-400 p-3 rounded text-xs overflow-x-auto">
                {JSON.stringify({ metadata: extractedMetadata, additionalInsights }, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      )}
    </div>
  );
}
