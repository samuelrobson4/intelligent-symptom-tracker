import { useState } from 'react';
import { ChatInterface } from './ChatInterface';
import { SymptomTable } from './components/SymptomTable';
import { IssueTable } from './components/IssueTable';

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Callback to refresh tables when chat creates new entries
  const handleDataChange = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Clean and minimal */}
      <header className="px-24 pt-12 pb-6">
        <h1 className="text-2xl font-semibold text-blue-400">
          Intelligent Symptom Tracking
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          a conversational metadata extraction tool
        </p>
      </header>

      {/* Main Content */}
      <main className="px-24 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Left Column: Chat Interface */}
          <div>
            <ChatInterface onDataChange={handleDataChange} />
          </div>

          {/* Right Column: Data Tables */}
          <div className="space-y-8">
            <SymptomTable refreshTrigger={refreshTrigger} />
            <IssueTable refreshTrigger={refreshTrigger} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
