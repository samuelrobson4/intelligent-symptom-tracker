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
      {/* Header - Clean and minimal with responsive padding */}
      <header className="px-4 sm:px-8 md:px-12 lg:px-24 pt-6 sm:pt-8 md:pt-12 pb-4 sm:pb-6">
        <h1 className="text-xl sm:text-2xl font-semibold text-blue-400">
          Intelligent Symptom Tracking
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">
          a conversational metadata extraction tool
        </p>
      </header>

      {/* Main Content with responsive padding and gap */}
      <main className="px-4 sm:px-8 md:px-12 lg:px-24 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8 lg:gap-10">
          {/* Left Column: Chat Interface */}
          <div className="w-full">
            <ChatInterface onDataChange={handleDataChange} />
          </div>

          {/* Right Column: Data Tables */}
          <div className="space-y-4 sm:space-y-6 md:space-y-8 w-full">
            <SymptomTable refreshTrigger={refreshTrigger} />
            <IssueTable refreshTrigger={refreshTrigger} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
