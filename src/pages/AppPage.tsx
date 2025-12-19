import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChatInterface } from '../ChatInterface';
import { SymptomTable } from '../components/SymptomTable';
import { IssueTable } from '../components/IssueTable';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { ChevronDown, User } from 'lucide-react';

export default function AppPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Callback to refresh tables when chat creates new entries
  const handleDataChange = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Logo on left, user profile on right - Sticky at top */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 sm:px-8 md:px-12 lg:px-24 py-4">
        <div className="flex items-center justify-between">
          {/* Left side: Logo + SymTrack */}
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img
              src="/symtracklogo.jpg"
              alt="SymTrack"
              className="flex-shrink-0 object-contain"
              style={{ width: '24px', height: '24px', objectFit: 'contain' }}
            />
            <h1
              className="text-lg sm:text-xl font-semibold"
              style={{ fontFamily: 'Inter, sans-serif', color: '#62B8FF' }}
            >
              SymTrack
            </h1>
          </Link>

          {/* Right side: User profile avatar with dropdown */}
          <div className="flex items-center gap-2 cursor-pointer">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-gray-200">
                <User className="h-4 w-4 text-gray-600" />
              </AvatarFallback>
            </Avatar>
            <ChevronDown className="h-4 w-4 text-gray-600" />
          </div>
        </div>
      </header>

      {/* Main Content with responsive padding and gap */}
      <main className="px-4 sm:px-8 md:px-12 lg:px-24 pt-6 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8 lg:gap-10">
          {/* Left Column: Chat Interface */}
          <div className="w-full">
            <ChatInterface onDataChange={handleDataChange} />
          </div>

          {/* Right Column: Data Tables */}
          <div className="flex flex-col gap-4 sm:gap-6 md:gap-8 w-full h-[500px] sm:h-[600px] lg:h-[calc(100vh-120px)]">
            <div className="flex-1 min-h-0">
              <SymptomTable refreshTrigger={refreshTrigger} />
            </div>
            <div className="flex-1 min-h-0">
              <IssueTable refreshTrigger={refreshTrigger} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
