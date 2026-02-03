import { useCallback, useEffect, useRef, useState } from 'react';
import { XIcon, Copy, Sparkles, Send, List, Type, Pencil } from 'lucide-react';
import { sidebarController, SidebarPayload } from '@/services/sidebarControllerService';
import { useAISidebarContext } from '@/components/sidebars/SidebarProvider';
import { ChatMessage } from './types';
import { AISidebarOpenOptions } from '@/hooks/useAISidebar';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/Button';
import { marked } from 'marked';

type AISidebarOptions = AISidebarOpenOptions;

const PANEL_NAME = 'aiSidebar';

export const AISidebarPanel = () => {
  const {
    state,
    set,
    close,
    applyAI,
    generatePromptForTarget,
    sendAiPrompt,
    sendFlyerPrompt,
    checkAIStatus,
    setCurrentSessionId,
    setDesignerSessionId,
    clearAllSessionIds,
    onAIResult,
    onChatMessage,
  } = useAISidebarContext();

  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('AI is typing...');
  const [selectedTarget, setSelectedTarget] = useState('shortDescription');
  const [showChipMenu, setShowChipMenu] = useState(false);
  const [messageVersion, setMessageVersion] = useState(0);
  
  const latestOptionsRef = useRef<AISidebarOptions | null>(null);
  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const chatHistoryRef = useRef<HTMLDivElement | null>(null);
  const promptInputRef = useRef<HTMLTextAreaElement | null>(null);
  const chipMenuRef = useRef<HTMLDivElement | null>(null);
  const chipMenuButtonRef = useRef<HTMLButtonElement | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollAttemptsRef = useRef(0);
  const maxPollAttempts = 10;

  const isDesignerMode = state.isDesignerMode || state.features.includes('designer');

  const scrollToBottom = useCallback(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, []);

  const handleSidebarChange = useCallback(
    (payload: SidebarPayload) => {
      if (payload.name !== PANEL_NAME) {
        return;
      }
      setOpen(payload.open);
      const data = (payload.data as AISidebarOptions | undefined) ?? null;
      latestOptionsRef.current = data;
      
      if (payload.open && data) {
        // Update state when opening
        if (data.targetField) {
          set(data.targetField, data.features || ['course'], data.productDetails);
          setSelectedTarget(data.targetField);
        }
      }
    },
    [set],
  );

  useEffect(() => {
    const unsubscribe = sidebarController.subscribe(PANEL_NAME, handleSidebarChange);
    return () => {
      unsubscribe();
    };
  }, [handleSidebarChange]);

  // Subscribe to external chat messages
  useEffect(() => {
    const unsubscribe = onChatMessage((message) => {
      setMessages((prev) => [...prev, message]);
      scrollToBottom();
    });
    return unsubscribe;
  }, [onChatMessage, scrollToBottom]);

  // Subscribe to AI results
  useEffect(() => {
    const unsubscribe = onAIResult((result) => {
      if (latestOptionsRef.current?.onSelect) {
        latestOptionsRef.current.onSelect(result.field, result.value);
      }
    });
    return unsubscribe;
  }, [onAIResult]);

  // Handle sidebar open/close effects
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        if (document.activeElement && sidebarRef.current?.contains(document.activeElement)) {
          (document.activeElement as HTMLElement).blur();
        }
      }, 0);
      return;
    }

    const mq = window.matchMedia('(max-width: 1023px)');
    if (mq.matches) {
      const previous = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = previous;
      };
    }

    return undefined;
  }, [open]);

  // Handle ESC key
  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        sidebarController.close(PANEL_NAME);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!showChipMenu) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Check if click is outside both the dropdown menu and the button that opens it
      if (
        chipMenuRef.current &&
        !chipMenuRef.current.contains(target) &&
        chipMenuButtonRef.current &&
        !chipMenuButtonRef.current.contains(target)
      ) {
        setShowChipMenu(false);
      }
    };

    // Use a small delay to avoid closing immediately when opening
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showChipMenu]);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    pollAttemptsRef.current = 0;
  }, []);

  const markdownToHtml = useCallback((md: string): string => {
    return marked.parse(md || '') as string;
  }, []);

  const extractHtmlFromResult = useCallback((result: any): string | null => {
    if (result == null) {
      return null;
    }

    const candidates: string[] = [];
    if (typeof result === 'string') {
      candidates.push(result);
    } else if (typeof result === 'object') {
      ['html', 'unhtml', 'result', 'content'].forEach((key) => {
        const value = result?.[key];
        if (typeof value === 'string') {
          candidates.push(value);
        }
      });
    }

    for (const candidate of candidates) {
      let cleaned = candidate.trim();
      if (cleaned.startsWith('```html')) {
        cleaned = cleaned.substring(7);
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.substring(3);
      }
      if (cleaned.endsWith('```')) {
        cleaned = cleaned.substring(0, cleaned.length - 3);
      }
      cleaned = cleaned.trim();

      // Check if it's HTML
      if (/<([a-z][\w-]*)(\s[^>]*)?>/i.test(cleaned)) {
        return cleaned;
      }
    }

    return null;
  }, []);

  const handleFlyerCompletion = useCallback(
    (result: any) => {
      const htmlContent = extractHtmlFromResult(result);
      const newVersion = messageVersion + 1;
      setMessageVersion(newVersion);

      if (htmlContent) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'ai',
            text: `HTML template generated successfully! (v${newVersion}) Click "Apply" to load it into the editor.`,
            htmlContent: htmlContent,
            version: newVersion,
          },
        ]);
      } else {
        const aiText = result?.result || result?.html || result?.message || 'Response received.';
        const html = markdownToHtml(aiText);
        setMessages((prev) => [
          ...prev,
          { role: 'ai', text: aiText, html, version: newVersion },
        ]);
        const field = selectedTarget || state.targetField || 'shortDescription';
        applyAI({ field, value: aiText });
      }

      setLoading(false);
      scrollToBottom();
    },
    [messageVersion, extractHtmlFromResult, markdownToHtml, selectedTarget, state.targetField, applyAI, scrollToBottom],
  );

  const handleFlyerError = useCallback(
    (errorResult: any) => {
      const errorMessage = errorResult?.error || errorResult?.message || 'Flyer generation failed.';
      setMessages((prev) => [...prev, { role: 'ai', text: `Error: ${errorMessage}` }]);
      setLoading(false);
      scrollToBottom();
    },
    [scrollToBottom],
  );

  const handleRegularChat = useCallback(
    async (userPrompt: string, features: string[]) => {
      try {
        const res = await sendAiPrompt(userPrompt, features, state.productDetails);
        const aiText = res?.result || 'AI did not return a response.';

        const html = markdownToHtml(aiText);
        setMessages((prev) => [...prev, { role: 'ai', text: aiText, html }]);

        if (res?.sessionId) {
          setCurrentSessionId(res.sessionId);
        }

        setLoading(false);
        scrollToBottom();
      } catch {
        setMessages((prev) => [...prev, { role: 'ai', text: 'Error: Unable to get AI response.' }]);
        setLoading(false);
        scrollToBottom();
      }
    },
    [sendAiPrompt, state.productDetails, setCurrentSessionId, markdownToHtml, scrollToBottom],
  );

  const pollFlyerStatus = useCallback(
    (sessionId: string) => {
      stopPolling();
      pollAttemptsRef.current = 0;

      pollIntervalRef.current = setInterval(() => {
        pollAttemptsRef.current++;
        if (pollAttemptsRef.current > maxPollAttempts) {
          stopPolling();
          if (loading) {
            setLoading(false);
            setMessages((prev) => [
              ...prev,
              { role: 'ai', text: 'Error: Flyer generation timed out. Please try again.' },
            ]);
            scrollToBottom();
          }
          return;
        }

        checkAIStatus(sessionId)
          .then((statusRes: any) => {
            if (statusRes?.status === 'completed' || statusRes?.status === 'success') {
              stopPolling();
              handleFlyerCompletion(statusRes);
            } else if (statusRes?.status === 'failed' || statusRes?.status === 'error') {
              stopPolling();
              handleFlyerError(statusRes);
            } else if (statusRes?.status === 'processing' || statusRes?.status === 'pending') {
              setLoadingMessage(statusRes?.progress || 'Processing...');
            }
          })
          .catch((err) => {
            console.warn('Error checking AI status:', err);
          });
      }, 5000);
    },
    [checkAIStatus, stopPolling, loading, scrollToBottom, handleFlyerCompletion, handleFlyerError],
  );

  const handleFlyerGeneration = useCallback(
    async (promptToSend: string) => {
      try {
        setLoadingMessage('AI is generating flyer...');
        const res = await sendFlyerPrompt(promptToSend, state.features, state.productDetails);
        
        if (res?.sessionId) {
          setDesignerSessionId(res.sessionId);
          pollFlyerStatus(res.sessionId);
        } else {
          setLoading(false);
          scrollToBottom();
        }
      } catch {
        setMessages((prev) => [...prev, { role: 'ai', text: 'Error: Unable to initiate flyer generation.' }]);
        setLoading(false);
        scrollToBottom();
      }
    },
    [sendFlyerPrompt, state.features, state.productDetails, setDesignerSessionId, pollFlyerStatus, scrollToBottom],
  );

  const askAI = useCallback(() => {
    let featuresToUse = state.features || ['course'];
    const isDesignerMode = featuresToUse.includes('designer') || selectedTarget === 'designer';

    let userPrompt = prompt.trim();

    if (!userPrompt && isDesignerMode) {
      // Show confirmation for default prompt in designer mode
      if (window.confirm('This will generate a new flyer using the default prompt and replace any existing content in the editor. Are you sure you want to continue?')) {
        userPrompt = 'Generate a flyer';
      } else {
        return;
      }
    }

    if (!userPrompt || loading) return;

    let finalPrompt = userPrompt;
    if (!isDesignerMode) {
      const contextPrompt = generatePromptForTarget(state.targetField || selectedTarget);
      finalPrompt = `${contextPrompt}\n\n${userPrompt}`;
    }

    const originalUserPrompt = userPrompt;
    setMessages((prev) => [...prev, { role: 'user', text: originalUserPrompt }]);
    setPrompt('');
    setLoading(true);

    if (isDesignerMode) {
      setLoadingMessage('AI is generating flyer...');
      handleFlyerGeneration(finalPrompt);
    } else {
      setLoadingMessage('AI is typing...');
      handleRegularChat(finalPrompt, featuresToUse);
    }
  }, [prompt, loading, state.features, state.targetField, selectedTarget, generatePromptForTarget, handleFlyerGeneration, handleRegularChat]);

  const onApply = useCallback(
    (msg: ChatMessage) => {
      if (msg.role === 'ai') {
        const isDesignerMode = state.features.includes('designer') || selectedTarget === 'designer';

        if (isDesignerMode && msg.htmlContent) {
          // For designer mode, apply HTML content
          const field = selectedTarget || state.targetField || 'designer';
          applyAI({ field, value: msg.htmlContent });
        } else {
          // For other modes, apply text content
          const field = selectedTarget || state.targetField || 'shortDescription';
          applyAI({ field, value: msg.text });
        }
      }
    },
    [state.features, state.targetField, selectedTarget, applyAI],
  );

  const selectChipOption = useCallback(
    (value: string) => {
      setSelectedTarget(value);
      let featuresToUse = state.features || ['course'];
      
      if (value === 'designer') {
        featuresToUse = ['designer'];
      } else if (value === 'name' || value === 'shortDescription') {
        featuresToUse = state.features || ['course'];
      }

      set(value, featuresToUse, state.productDetails);
      setShowChipMenu(false);
    },
    [state.features, state.productDetails, set],
  );

  const handleClose = useCallback(() => {
    sidebarController.close(PANEL_NAME);
    close();
  }, [close]);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Could show a toast here
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
      clearAllSessionIds();
    };
  }, [stopPolling, clearAllSessionIds]);

  const classes = cn(
    'fixed inset-y-0 right-0 z-[1000] w-full max-w-[420px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl transition-transform duration-300 ease-in-out flex flex-col',
    open ? 'translate-x-0' : 'translate-x-full',
  );

  return (
    <>
      <div
        ref={sidebarRef}
        className={classes}
        aria-hidden={!open}
        data-ai-sidebar-panel
      >
        <header className="relative flex items-start justify-between px-6 pb-4 pt-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary-500" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">AI Assistant</h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <XIcon className="h-5 w-5" />
            <span className="sr-only">Close AI sidebar</span>
          </button>
        </header>

        <div ref={chatHistoryRef} className="flex-1 overflow-y-auto px-6 pb-6 space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={cn(
                'flex',
                msg.role === 'user' ? 'justify-end' : 'justify-start',
              )}
            >
              <div
                className={cn(
                  'max-w-[80%] rounded-lg p-3',
                  msg.role === 'user'
                    ? 'bg-primary-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-50',
                )}
              >
                <div className="text-xs font-semibold mb-1 opacity-70">
                  {msg.role === 'user' ? 'You' : 'AI'}
                </div>
                {msg.role === 'user' ? (
                  <div className="text-sm">{msg.text}</div>
                ) : msg.htmlContent ? (
                  <div className="text-sm">
                    <div className="text-xs mb-2 opacity-70">Version {msg.version}</div>
                    <div>{msg.text}</div>
                  </div>
                ) : msg.html ? (
                  <div className="text-sm" dangerouslySetInnerHTML={{ __html: msg.html }} />
                ) : (
                  <div className="text-sm">{msg.text}</div>
                )}
                {msg.role === 'ai' && (
                  <div className="flex items-center gap-2 mt-2">
                    {(isDesignerMode && msg.htmlContent) || (!isDesignerMode && !msg.htmlContent) ? (
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => onApply(msg)}
                        className="text-xs"
                      >
                        Apply
                      </Button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => copyToClipboard(msg.text)}
                      className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                      title="Copy"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <div className="h-4 w-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">{loadingMessage}</span>
              {isDesignerMode && loading && (
                <Button
                  size="xs"
                  variant="outline"
                  onClick={stopPolling}
                  className="text-xs ml-2"
                >
                  Cancel
                </Button>
              )}
            </div>
          )}
        </div>

        <form
          className="border-t border-slate-200 dark:border-slate-800 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            askAI();
          }}
        >
          {/* Rounded container for input area */}
          <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-4 shadow-sm relative">
            {/* Dropdown menu - positioned above textarea */}
            {!isDesignerMode && showChipMenu && (
              <div ref={chipMenuRef} className="absolute bottom-full left-4 mb-2 w-[calc(100%-2rem)] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-20">
                <button
                  type="button"
                  onClick={() => {
                    selectChipOption('shortDescription');
                    setShowChipMenu(false);
                  }}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 rounded-t-lg flex items-center gap-3"
                >
                  <List className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  <span className="text-slate-700 dark:text-slate-300">Description</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    selectChipOption('name');
                    setShowChipMenu(false);
                  }}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 border-t border-slate-200 dark:border-slate-700 rounded-b-lg flex items-center gap-3"
                >
                  <Type className="h-4 w-4 text-slate-600 dark:text-slate-400 font-bold" />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">Name</span>
                </button>
              </div>
            )}
            
            {/* Textarea */}
            <textarea
              ref={promptInputRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Type your message..."
              rows={3}
              className="w-full px-4 py-3 text-sm bg-white dark:bg-slate-900 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white resize-none mb-3"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  askAI();
                }
              }}
            />
            
            {/* Designer Mode button and Send button container */}
            <div className="flex items-center justify-between">
              {/* Designer Mode button or Field selector button */}
              {isDesignerMode ? (
                <button
                  type="button"
                  className="px-6 py-2 text-sm font-medium text-white rounded-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 transition-all shadow-sm"
                >
                  Designer Mode
                </button>
              ) : (
                <button
                  ref={chipMenuButtonRef}
                  type="button"
                  onClick={() => setShowChipMenu(!showChipMenu)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-all flex items-center gap-2"
                >
                  <Pencil className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                  <span>{selectedTarget === 'name' ? 'Name' : selectedTarget === 'shortDescription' ? 'Description' : 'Designer'}</span>
                  <span className="ml-auto">▼</span>
                </button>
              )}
              
              {/* Circular Send button */}
              <button
                type="submit"
                disabled={loading || !prompt.trim()}
                className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all shadow-sm"
                aria-label="Send message"
              >
                <Send className="h-5 w-5 text-slate-600 dark:text-slate-300" />
              </button>
            </div>
          </div>
        </form>
      </div>

      <div
        className={cn(
          'fixed inset-0 z-[999] bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300',
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={() => sidebarController.close(PANEL_NAME)}
        aria-hidden="true"
      />
    </>
  );
};

export default AISidebarPanel;
