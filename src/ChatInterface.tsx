// Chat-based interface for conversational symptom logging
// Upgraded with shadcn/ui components

import { useState, useRef, useEffect, useCallback } from 'react';
import { processChatMessage, ConversationMessage } from '@/claudeService';
import { SymptomMetadata, AdditionalInsights, SuggestedIssue, SymptomEntry, Issue, IssueSelection, ChatMessage } from '@/types';
import { Message } from '@/components/Message';
import { ChatInput } from '@/components/ChatInput';
import { SymptomCard } from '@/components/SymptomCard';
import {
  getEnrichedIssues,
  EnrichedIssue,
  saveIssue,
  saveSymptom,
  getSymptom,
  linkSymptomToIssue,
  generateUUID,
  saveDraft,
  getDraft,
  clearDraft,
  isDraftExpired,
  ConversationDraft,
} from '@/localStorage';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface ChatInterfaceProps {
  onDataChange?: () => void;
}

export function ChatInterface({ onDataChange }: ChatInterfaceProps = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedMetadata, setExtractedMetadata] = useState<SymptomMetadata | null>(null);
  const [additionalInsights, setAdditionalInsights] = useState<AdditionalInsights>({});
  const [conversationComplete, setConversationComplete] = useState(false);

  // Multi-symptom queue state
  const [queuedSymptoms, setQueuedSymptoms] = useState<string[]>([]);

  // Draft/resume state
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<ConversationDraft | null>(null);

  // Issue tracking state
  const [issues, setIssues] = useState<EnrichedIssue[]>([]);
  const [issueSelection, setIssueSelection] = useState<IssueSelection | null>(null);
  const [suggestedIssue, setSuggestedIssue] = useState<SuggestedIssue | null>(null);

  // Success message state
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Greeting message state
  const [greetingShown, setGreetingShown] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load active issues on mount
  useEffect(() => {
    setIssues(getEnrichedIssues('active'));
  }, []);

  // Check for draft on mount
  useEffect(() => {
    const draft = getDraft();
    if (draft && !isDraftExpired(draft)) {
      setPendingDraft(draft);
      setShowResumeDialog(true);
    } else if (draft && isDraftExpired(draft)) {
      // Clear expired draft
      clearDraft();
    }
  }, []);

  // Show greeting message on initial load
  useEffect(() => {
    if (messages.length === 0 && !greetingShown) {
      const greetingMessage: ChatMessage = {
        role: 'assistant',
        content: 'Hi, what can I help you with today?',
        type: 'message'
      };
      setMessages([greetingMessage]);
      setGreetingShown(true);
    }
  }, []); // Empty dependency - only on mount

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Autosave draft as conversation progresses
  useEffect(() => {
    // Only autosave if there are messages and conversation is not complete
    if (messages.length > 0 && !conversationComplete) {
      const draft: ConversationDraft = {
        messages,
        extractedMetadata,
        additionalInsights,
        queuedSymptoms,
        suggestedIssue,
        issueSelection,
        conversationComplete,
        timestamp: new Date(),
      };
      saveDraft(draft);
    }
  }, [
    messages,
    extractedMetadata,
    additionalInsights,
    queuedSymptoms,
    suggestedIssue,
    issueSelection,
    conversationComplete,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setError(null);

    // Add user message to chat
    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setLoading(true);

    try {
      // Process the message with conversation context and active issues
      // Filter to only user/assistant messages for conversation history
      const conversationHistory = newMessages
        .slice(0, -1)
        .filter(msg => msg.role === 'user' || msg.role === 'assistant') as ConversationMessage[];

      const result = await processChatMessage(
        conversationHistory,
        userMessage,
        issues // Pass active issues for AI to suggest matches
      );

      // Update metadata
      setExtractedMetadata(result.extractedData.metadata);
      setAdditionalInsights(result.additionalInsights);
      setConversationComplete(result.extractedData.conversationComplete || false);

      // Handle multi-symptom queue
      if (result.extractedData.queuedSymptoms && result.extractedData.queuedSymptoms.length > 0) {
        setQueuedSymptoms(result.extractedData.queuedSymptoms);
      }

      // Handle AI's issue suggestion
      if (result.extractedData.suggestedIssue) {
        setSuggestedIssue(result.extractedData.suggestedIssue);
      }

      // Handle issue selection from conversation
      if (result.extractedData.issueSelection) {
        setIssueSelection(result.extractedData.issueSelection);
      }

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
    // Reset multi-symptom queue
    setQueuedSymptoms([]);
    // Reset issue state
    setSuggestedIssue(null);
    setIssueSelection(null);
    // Clear success message
    setSuccessMessage(null);
    // Reset greeting flag so it shows again
    setGreetingShown(false);
    // Clear draft
    clearDraft();
  };

  const handleResumeDraft = () => {
    if (!pendingDraft) return;

    // Restore state from draft
    setMessages(pendingDraft.messages);
    setExtractedMetadata(pendingDraft.extractedMetadata);
    setAdditionalInsights(pendingDraft.additionalInsights);
    setQueuedSymptoms(pendingDraft.queuedSymptoms);
    setSuggestedIssue(pendingDraft.suggestedIssue);
    setIssueSelection(pendingDraft.issueSelection);
    setConversationComplete(pendingDraft.conversationComplete);

    // Close dialog
    setShowResumeDialog(false);
    setPendingDraft(null);
  };

  const handleStartFresh = () => {
    // Clear draft and start fresh
    clearDraft();
    setShowResumeDialog(false);
    setPendingDraft(null);
  };

  // Handle symptom card updates
  const handleSymptomUpdate = useCallback((symptomId: string, updates: Partial<SymptomEntry>) => {
    // Get current symptom from localStorage
    const currentSymptom = getSymptom(symptomId);
    if (!currentSymptom) return;

    // Merge updates
    const updatedSymptom = {
      ...currentSymptom,
      ...updates,
      metadata: { ...currentSymptom.metadata, ...updates.metadata },
      additionalInsights: { ...currentSymptom.additionalInsights, ...updates.additionalInsights }
    };

    // Save to localStorage
    saveSymptom(updatedSymptom);

    // Trigger table refresh
    onDataChange?.();

    // Update message state to reflect changes
    setMessages(prevMessages =>
      prevMessages.map(msg =>
        msg.symptomId === symptomId && msg.symptomData
          ? {
              ...msg,
              symptomData: {
                ...msg.symptomData,
                metadata: updatedSymptom.metadata,
                additionalInsights: updatedSymptom.additionalInsights
              }
            }
          : msg
      )
    );
  }, [onDataChange]);

  // Auto-save when conversation is complete
  useEffect(() => {
    if (!conversationComplete || !extractedMetadata) return;

    const saveSymptomEntry = async () => {
      try {
        // Generate symptom ID
        const symptomId = generateUUID();
        let finalIssueId: string | undefined = undefined;

        // Handle issue selection from conversation
        if (issueSelection) {
          if (issueSelection.type === 'new') {
            // Create new issue
            if (!issueSelection.newIssueName || !issueSelection.newIssueStartDate) {
              setError('Missing issue details for new issue');
              return;
            }

            const newIssue: Issue = {
              id: generateUUID(),
              name: issueSelection.newIssueName,
              status: 'active',
              startDate: issueSelection.newIssueStartDate,
              createdAt: new Date(),
              symptomIds: [symptomId],
            };

            saveIssue(newIssue);
            finalIssueId = newIssue.id;

            // Refresh issues list
            setIssues(getEnrichedIssues('active'));
          } else if (issueSelection.type === 'existing' && issueSelection.existingIssueId) {
            // Map issue name to UUID (LLM uses names, code needs UUIDs)
            const issueIdOrName = issueSelection.existingIssueId;
            const matchedIssue = issues.find(i =>
              i.id === issueIdOrName || // Support UUID if LLM happens to return it
              i.name.toLowerCase() === issueIdOrName.toLowerCase() // Map name to UUID
            );

            if (matchedIssue) {
              finalIssueId = matchedIssue.id;
            } else {
              setError(`Could not find issue "${issueSelection.existingIssueId}"`);
              setConversationComplete(false); // Allow user to retry
              return;
            }
          }
          // type === 'none' means standalone symptom (no issue linkage)
        }

        // Save symptom with issue linkage
        const symptomEntry: SymptomEntry = {
          id: symptomId,
          timestamp: new Date(),
          metadata: extractedMetadata,
          additionalInsights,
          conversationHistory: messages.map(m => m.content),
          issueId: finalIssueId,
        };

        saveSymptom(symptomEntry);

        // Link to existing issue if selected
        if (finalIssueId && issueSelection?.type === 'existing') {
          linkSymptomToIssue(symptomId, finalIssueId);
        }

        // Clear draft after successful save
        clearDraft();

        // Notify parent component to refresh tables
        onDataChange?.();

        // Show success message
        const issueMessage = finalIssueId
          ? ` and linked to ${
              issueSelection?.type === 'new'
                ? issueSelection.newIssueName
                : issues.find(i => i.id === finalIssueId)?.name
            }`
          : '';

        // Check if there are queued symptoms
        if (queuedSymptoms.length > 0) {
          const nextSymptom = queuedSymptoms[0];
          const remainingSymptoms = queuedSymptoms.slice(1);

          // Show success and ask about next symptom
          setSuccessMessage(`Symptom logged successfully${issueMessage}!`);

          setTimeout(() => {
            const confirmed = window.confirm(
              `You also mentioned: "${nextSymptom}"\n\nWould you like to log that symptom now?`
            );

            if (confirmed) {
              // Reset form but keep conversation going
              setExtractedMetadata(null);
              setAdditionalInsights({});
              setConversationComplete(false);
              setSuggestedIssue(null);
              setIssueSelection(null);
              setError(null);
              setSuccessMessage(null);

              // Update queue (remove the one we're about to log)
              setQueuedSymptoms(remainingSymptoms);

              // Continue conversation with queued symptom
              const userMessage: ChatMessage = { role: 'user', content: nextSymptom };
              const updatedMessages = [...messages, userMessage];
              setMessages(updatedMessages);
              setLoading(true);

              // Process the queued symptom with conversation history
              // Filter to only user/assistant messages
              const conversationHistory = messages.filter(
                msg => msg.role === 'user' || msg.role === 'assistant'
              ) as ConversationMessage[];

              processChatMessage(conversationHistory, nextSymptom, issues)
                .then((result) => {
                  setExtractedMetadata(result.extractedData.metadata);
                  setAdditionalInsights(result.additionalInsights);
                  setConversationComplete(result.extractedData.conversationComplete || false);

                  // Handle new queued symptoms from this one
                  if (result.extractedData.queuedSymptoms && result.extractedData.queuedSymptoms.length > 0) {
                    setQueuedSymptoms([...remainingSymptoms, ...result.extractedData.queuedSymptoms]);
                  }

                  // Handle AI's issue suggestion
                  if (result.extractedData.suggestedIssue) {
                    setSuggestedIssue(result.extractedData.suggestedIssue);
                  }

                  // Handle issue selection
                  if (result.extractedData.issueSelection) {
                    setIssueSelection(result.extractedData.issueSelection);
                  }

                  // Add AI response
                  if (result.extractedData.aiMessage) {
                    setMessages([...updatedMessages, { role: 'assistant', content: result.extractedData.aiMessage }]);
                  }
                })
                .catch((err) => {
                  setError(err instanceof Error ? err.message : 'An error occurred');
                  setMessages([]);
                })
                .finally(() => {
                  setLoading(false);
                });
            } else {
              // User declined, clear queue and reset
              setQueuedSymptoms([]);
              handleReset();
            }
          }, 500);
        } else {
          // No queued symptoms, show card and continue conversation
          setSuccessMessage(`Symptom logged successfully${issueMessage}!`);

          // Insert symptom card into messages
          const symptomCardMessage: ChatMessage = {
            role: 'system',
            content: '',
            type: 'symptom-card',
            symptomId: symptomId,
            symptomData: {
              metadata: extractedMetadata,
              additionalInsights,
              issueId: finalIssueId,
              issueName: issueSelection?.type === 'new'
                ? issueSelection.newIssueName
                : issues.find(i => i.id === finalIssueId)?.name
            }
          };

          setMessages(prevMessages => [...prevMessages, symptomCardMessage]);

          // Clear only metadata states, keep messages visible
          setExtractedMetadata(null);
          setAdditionalInsights({});
          setConversationComplete(false);
          setSuggestedIssue(null);
          setIssueSelection(null);

          // Clear success message after 2s
          setTimeout(() => {
            setSuccessMessage(null);
          }, 2000);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save symptom');
        setConversationComplete(false); // Allow retry
      }
    };

    saveSymptomEntry();
  }, [conversationComplete, extractedMetadata, issueSelection]);

  const quickPrompts = [
    'I have a bad headache',
    'severe chest pain for the past week',
    'my stomach has been hurting',
  ];

  return (
    <div className="flex flex-col h-[500px] sm:h-[600px] lg:h-[calc(100vh-120px)] bg-white border border-gray-200 rounded-lg">
      {/* Agent Header - Minimal */}
      <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 border-b border-gray-200">
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-400 flex items-center justify-center text-white text-xs font-semibold relative">
          S
          <div className="absolute top-0 right-0 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
        </div>
        <div className="flex-1">
          <div className="text-xs font-semibold text-gray-900">Symptom Agent</div>
          <div className="text-[10px] text-gray-500">Active</div>
        </div>
        {messages.length > 1 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-xs"
          >
            Clear Chat
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">

        {/* Messages area with responsive padding */}
        <ScrollArea className="flex-1 px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6">
          {messages.map((message, index) => {
            // Render symptom card
            if (message.type === 'symptom-card' && message.symptomData && message.symptomId) {
              return (
                <SymptomCard
                  key={`${message.symptomId}-${index}`}
                  symptomId={message.symptomId}
                  metadata={message.symptomData.metadata}
                  additionalInsights={message.symptomData.additionalInsights}
                  issueId={message.symptomData.issueId}
                  issueName={message.symptomData.issueName}
                  onUpdate={handleSymptomUpdate}
                />
              );
            }

            // Render normal message
            return (
              <Message
                key={index}
                role={message.role as 'user' | 'assistant'}
                content={message.content}
              />
            );
          })}

          {loading && (
            <div className="flex justify-start mb-3">
              <div className="bg-gray-100 rounded-2xl px-3 py-1.5 max-w-[85%] sm:max-w-[80%]">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin text-gray-500" />
                  <span className="text-xs text-gray-600">Typing...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </ScrollArea>

        {/* Error display */}
        {error && (
          <div className="mx-3 sm:mx-4 md:mx-6 mb-3 sm:mb-4">
            <Alert variant="destructive">
              <AlertCircle className="h-3 w-3" />
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* Success message */}
        {successMessage && (
          <div className="mx-3 sm:mx-4 md:mx-6 mb-3 sm:mb-4">
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-3 w-3 text-green-600" />
              <AlertDescription className="text-xs text-green-900">{successMessage}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* Quick Prompts - only show when chat is empty or only has greeting */}
        {messages.length <= 1 && (
          <div className="px-3 sm:px-4 md:px-6 pb-3 sm:pb-4 md:pb-6">
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setInput(prompt)}
                  className="px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input area - minimal with responsive padding */}
        <div className="border-t border-gray-200 p-3 sm:p-4 md:p-6">
          <ChatInput
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            disabled={loading}
          />
        </div>
      </div>

      {/* Resume Draft Dialog */}
      <Dialog open={showResumeDialog} onOpenChange={setShowResumeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xs font-semibold">Resume Previous Conversation?</DialogTitle>
            <DialogDescription className="text-xs">
              You have an unfinished symptom entry from earlier. Would you like to continue where you left off?
            </DialogDescription>
          </DialogHeader>

          {pendingDraft && (
            <div className="py-4">
              <p className="text-xs text-gray-500 mb-2">
                Draft saved: {new Date(pendingDraft.timestamp).toLocaleString()}
              </p>
              <p className="text-xs text-gray-900">
                <strong>Messages:</strong> {pendingDraft.messages.length}
              </p>
              {pendingDraft.extractedMetadata?.location && (
                <p className="text-xs text-gray-900">
                  <strong>Location:</strong> {pendingDraft.extractedMetadata.location}
                </p>
              )}
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={handleStartFresh} className="text-xs h-9">
              Start Fresh
            </Button>
            <Button
              onClick={handleResumeDraft}
              className="text-xs h-9"
              style={{ backgroundColor: '#62B8FF' }}
            >
              Resume Draft
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
