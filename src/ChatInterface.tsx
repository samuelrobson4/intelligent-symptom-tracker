/**
 * Chat-based interface for conversational symptom logging
 * Upgraded with shadcn/ui components
 */

import { useState, useRef, useEffect } from 'react';
import { processChatMessage, ConversationMessage } from '@/claudeService';
import { SymptomMetadata, AdditionalInsights, SuggestedIssue, SymptomEntry, Issue } from '@/types';
import { Message } from '@/components/Message';
import { ChatInput } from '@/components/ChatInput';
import { IssueSelector } from '@/components/IssueSelector';
import {
  getEnrichedIssues,
  EnrichedIssue,
  saveIssue,
  saveSymptom,
  linkSymptomToIssue,
  generateUUID,
} from '@/localStorage';
import { getTodayISO } from '@/utils/dateHelpers';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertCircle, CheckCircle2, Loader2, Save } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

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
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // Issue tracking state
  const [issues, setIssues] = useState<EnrichedIssue[]>([]);
  const [suggestedIssue, setSuggestedIssue] = useState<SuggestedIssue | null>(null);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [newIssueName, setNewIssueName] = useState('');
  const [newIssueStartDate, setNewIssueStartDate] = useState(getTodayISO());

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load active issues on mount
  useEffect(() => {
    setIssues(getEnrichedIssues('active'));
  }, []);

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
    const newMessages: ChatMessage[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);
    setLoading(true);

    try {
      // Process the message with conversation context and active issues
      const result = await processChatMessage(
        newMessages.slice(0, -1) as ConversationMessage[],
        userMessage,
        issues // Pass active issues for AI to suggest matches
      );

      // Update metadata
      setExtractedMetadata(result.extractedData.metadata);
      setAdditionalInsights(result.additionalInsights);
      setConversationComplete(result.extractedData.conversationComplete || false);

      // Handle AI's issue suggestion
      if (result.extractedData.suggestedIssue) {
        setSuggestedIssue(result.extractedData.suggestedIssue);

        // Auto-select if AI is confident
        if (
          result.extractedData.suggestedIssue.isRelated &&
          result.extractedData.suggestedIssue.confidence > 0.7 &&
          result.extractedData.suggestedIssue.existingIssueId
        ) {
          setSelectedIssueId(result.extractedData.suggestedIssue.existingIssueId);
        }
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
    setShowSaveDialog(false);
    // Reset issue state
    setSuggestedIssue(null);
    setSelectedIssueId(null);
    setNewIssueName('');
    setNewIssueStartDate(getTodayISO());
  };

  const handleSaveSymptom = () => {
    if (!extractedMetadata) {
      setError('No symptom data to save');
      return;
    }

    try {
      // Generate symptom ID
      const symptomId = generateUUID();
      let finalIssueId: string | undefined = undefined;

      // Handle new issue creation
      if (selectedIssueId === '__new__') {
        if (!newIssueName.trim()) {
          setError('Please provide a name for the new issue');
          return;
        }

        if (!newIssueStartDate) {
          setError('Please provide a start date for the new issue');
          return;
        }

        const newIssue: Issue = {
          id: generateUUID(),
          name: newIssueName.trim(),
          status: 'active',
          startDate: newIssueStartDate,
          createdAt: new Date(),
          symptomIds: [symptomId],
        };

        saveIssue(newIssue);
        finalIssueId = newIssue.id;

        // Refresh issues list
        setIssues(getEnrichedIssues('active'));
      } else if (selectedIssueId && selectedIssueId !== '__none__') {
        // Link to existing issue
        finalIssueId = selectedIssueId;
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
      if (finalIssueId && selectedIssueId !== '__new__') {
        linkSymptomToIssue(symptomId, finalIssueId);
      }

      // Close dialog and reset form
      setShowSaveDialog(false);
      handleReset();

      // Notify parent component to refresh tables
      onDataChange?.();

      // Show success message
      const issueMessage = finalIssueId
        ? ` and linked to ${selectedIssueId === '__new__' ? newIssueName : issues.find(i => i.id === finalIssueId)?.name}`
        : '';
      alert(`Symptom logged successfully${issueMessage}!`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save symptom');
    }
  };

  const handleContinueEditing = () => {
    setShowSaveDialog(false);
    setConversationComplete(false);
  };

  const getSeverityBadge = (severity: number) => {
    if (severity >= 7) return <Badge variant="destructive">{severity}/10</Badge>;
    if (severity >= 4) return <Badge variant="default" className="bg-yellow-500">{severity}/10</Badge>;
    return <Badge variant="secondary">{severity}/10</Badge>;
  };

  const quickPrompts = [
    'I have a bad headache',
    'severe chest pain for the past week',
    'my stomach has been hurting',
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-white border border-gray-200 rounded-lg">
      {/* Agent Header - Minimal */}
      <div className="flex items-center gap-3 p-3 border-b border-gray-200">
        <div className="w-8 h-8 rounded-full bg-blue-400 flex items-center justify-center text-white text-xs font-semibold relative">
          S
          <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></div>
        </div>
        <div>
          <div className="text-xs font-semibold text-gray-900">Symptom Agent</div>
          <div className="text-[10px] text-gray-500">Active</div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">

        {/* Messages area */}
        <ScrollArea className="flex-1 px-3 py-3">
          {messages.map((message, index) => (
            <Message key={index} role={message.role} content={message.content} />
          ))}

          {loading && (
            <div className="flex justify-start mb-3">
              <div className="bg-gray-100 rounded-2xl px-3 py-1.5 max-w-[80%]">
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
          <div className="mx-3 mb-2">
            <Alert variant="destructive">
              <AlertCircle className="h-3 w-3" />
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* Completion status - minimal */}
        {conversationComplete && (
          <div className="mx-3 mb-2 flex items-center justify-between px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3 w-3 text-green-600" />
              <span className="text-xs text-green-900">Ready to save</span>
            </div>
            <Button
              size="sm"
              className="bg-blue-400 hover:bg-blue-500 text-xs h-7 px-3"
              onClick={() => setShowSaveDialog(true)}
            >
              Save
            </Button>
          </div>
        )}

        {/* Quick Prompts - only show when no messages */}
        {messages.length === 0 && (
          <div className="px-3 pb-3">
            <div className="flex flex-wrap gap-2">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setInput(prompt)}
                  className="px-3 py-1.5 text-xs text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input area - minimal */}
        <div className="border-t border-gray-200 p-3">
          <ChatInput
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            disabled={loading}
          />
        </div>
      </div>

      {/* Save Confirmation Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Confirm Symptom Entry</DialogTitle>
            <DialogDescription>
              Please review your symptom information before saving.
            </DialogDescription>
          </DialogHeader>

          {extractedMetadata && (
            <div className="space-y-4 py-4">
              {/* Primary Metadata */}
              <div>
                <h4 className="font-semibold mb-3">Symptom Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">{extractedMetadata.location || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Onset Date</p>
                    <p className="font-medium">{extractedMetadata.onset || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Severity</p>
                    <div className="mt-1">
                      {extractedMetadata.severity !== null && extractedMetadata.severity !== undefined
                        ? getSeverityBadge(extractedMetadata.severity)
                        : <span className="text-sm">Not provided</span>}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="font-medium">{extractedMetadata.description || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              {/* Additional Insights */}
              {Object.keys(additionalInsights).length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold mb-3">Additional Insights</h4>
                    <div className="space-y-3">
                      {Object.entries(additionalInsights).map(([key, value]) =>
                        value ? (
                          <div key={key}>
                            <p className="text-sm text-muted-foreground">
                              {key.charAt(0).toUpperCase() + key.slice(1)}
                            </p>
                            <p className="text-sm">{value}</p>
                          </div>
                        ) : null
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Issue Selector */}
              <Separator />
              <IssueSelector
                issues={issues}
                selectedIssueId={selectedIssueId}
                onSelectIssue={setSelectedIssueId}
                suggestedIssue={suggestedIssue}
                newIssueName={newIssueName}
                onNewIssueNameChange={setNewIssueName}
                newIssueStartDate={newIssueStartDate}
                onNewIssueStartDateChange={setNewIssueStartDate}
              />
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={handleContinueEditing}>
              Continue Editing
            </Button>
            <Button onClick={handleSaveSymptom}>
              <Save className="h-4 w-4 mr-2" />
              Save Symptom
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
