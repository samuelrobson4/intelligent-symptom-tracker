import { Link } from 'react-router-dom';
import Waves from '@/components/Waves';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 sm:px-6 lg:px-8 relative">
      <Waves lineColor="#FAFAFA" backgroundColor="transparent" xGap={20} yGap={64} />
      <div className="w-full max-w-4xl relative z-10">
        {/* Logo + Title */}
        <div className="flex items-center gap-2 mb-6 sm:mb-8">
          <img 
            src="/symtracklogo.jpg" 
            alt="SymTrack" 
            className="flex-shrink-0 object-contain" 
            style={{ width: '24px', height: '24px', objectFit: 'contain' }}
          />
          <h1 
            className="text-[15.3px] sm:text-[18.9px] md:text-[19.8px] lg:text-[23.4px] font-semibold leading-[1.2] whitespace-nowrap sm:whitespace-normal" 
            style={{ fontFamily: 'Inter, sans-serif', color: '#62B8FF' }}
          >
            SymTrack: An Intelligent Symptom Tracking Tool
          </h1>
        </div>

        {/* Description */}
        <p 
          className="mb-8 sm:mb-10 leading-[1.6] text-[11px] sm:text-[13px] md:text-[14px] lg:text-[15px] font-light" 
          style={{ 
            fontFamily: 'Inter, sans-serif', 
            color: '#A6A6A6', 
            fontWeight: 300,
            maxWidth: '873.6px'
          }}
        >
          A conversational interface that extracts structured metadata from messy natural dialogue. Having managed a chronic illness my whole life, I chose symptom logging because existing tools fail exactly when users need them most—when they're already dealing with pain, fatigue, or caregiving stress
        </p>

        {/* Buttons */}
        <div className="flex gap-4 flex-wrap">
          <Link to="/app">
            <button
              className="rounded-md hover:opacity-90 transition-opacity text-[11px] font-medium"
              style={{
                backgroundColor: '#62B8FF',
                color: 'white',
                fontFamily: 'Inter, sans-serif',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                textAlign: 'left',
                border: 'none',
                cursor: 'pointer',
                minWidth: '108px',
                paddingTop: '5.76px',
                paddingBottom: '5.76px',
                paddingLeft: '14.4px',
                paddingRight: '14.4px'
              }}
            >
              <span style={{ textAlign: 'left' }}>Try it out</span>
              <svg 
                width="8" 
                height="8" 
                viewBox="0 0 8 8" 
                fill="currentColor" 
                xmlns="http://www.w3.org/2000/svg"
                style={{ marginLeft: '6px' }}
              >
                <path d="M2 0 L8 4 L2 8 Z" />
              </svg>
            </button>
          </Link>
          <a href="/paper.pdf" target="_blank" rel="noopener noreferrer">
            <button
              className="rounded-md hover:bg-gray-50 transition-colors text-[11px] font-medium shadow-sm"
              style={{
                backgroundColor: 'white',
                color: '#62B8FF',
                borderColor: '#62B8FF',
                fontFamily: 'Inter, sans-serif',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                textAlign: 'left',
                border: '1px solid #62B8FF',
                cursor: 'pointer',
                minWidth: '108px',
                paddingTop: '5.76px',
                paddingBottom: '5.76px',
                paddingLeft: '14.4px',
                paddingRight: '14.4px'
              }}
            >
              <span style={{ textAlign: 'left' }}>Read the paper</span>
            </button>
          </a>
        </div>
      </div>
    </div>
  );
}
