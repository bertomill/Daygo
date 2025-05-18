'use client';

// Import necessary dependencies for React and UI components
import { useRef, useEffect, useState } from 'react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BotIcon, SendIcon, ThermometerIcon, ArrowRightLeft } from "lucide-react";
import { useChat } from '@ai-sdk/react';
import { Message } from 'ai';
import { SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { getAuth } from "firebase/auth";
import { toast } from "sonner";

// Type definitions for message parts and tool results
interface ToolInvocation {
  toolName: string;
  toolParameters: Record<string, unknown>;
}

interface ToolInvocationPart {
  type: 'tool-invocation';
  toolInvocation: ToolInvocation;
}

interface ToolResult {
  toolName: string;
  toolResultJSON: string;
}

interface ToolResultPart {
  type: 'tool-result';
  toolResult: ToolResult;
}

interface TextPart {
  type: 'text';
  text: string;
}

interface WeatherResult {
  location: string;
  temperature: number;
}

interface TempConversionResult {
  celsius: number;
}

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  date?: string;
  score?: number;
}

interface JournalSearchResult {
  entries: JournalEntry[];
  count: number;
  message?: string;
  error?: string;
}

type MessagePart = TextPart | ToolInvocationPart | ToolResultPart;

// Helper function to format weather data
const formatWeatherResult = (result: WeatherResult) => {
  if (!result) return null;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        <ThermometerIcon className="h-4 w-4" />
        <span>
          {result.location}: {result.temperature}°F
        </span>
      </div>
    </div>
  );
};

// Helper function to format temperature conversion
const formatTempConversion = (result: TempConversionResult) => {
  if (!result) return null;
  return (
    <div className="flex items-center gap-1">
      <ArrowRightLeft className="h-4 w-4" />
      <span>Converted to {result.celsius}°C</span>
    </div>
  );
};

// Main chat page component
export default function AiChatPage() {
  // Get current user from Firebase
  const [userId, setUserId] = useState<string | null>(null);
  
  // Effect to get the current user's ID
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
      }
    });
    
    return () => unsubscribe();
  }, []);
  
  // Initialize chat functionality with useChat hook
  const { messages, input, handleInputChange, handleSubmit, isLoading, error, reload } = useChat({
    // Set initial system message to define AI assistant's role and capabilities
    initialMessages: [
      {
        id: 'system-1',
        role: 'system',
        content: `You are Daygo AI, a specialized assistant for the Daygo journaling app.
        Your purpose is to help users gain insights from their journal entries, reflect on patterns in their writing,
        and provide thoughtful responses to help users with their personal growth and self-awareness.
        Be supportive, thoughtful, and personalized in your responses.
        
        You have access to the following tools:
        1. A weather tool that you can use to get the current weather in a specific location (in Fahrenheit).
        2. A temperature conversion tool that can convert Fahrenheit to Celsius.
        3. A journal search tool that can find relevant journal entries based on a query.
        
        Use these tools when appropriate. When users ask about their journal entries or past experiences, use the
        searchJournalEntries tool to find and reference their actual journal content.
        
        For journal queries, first use the search tool and then craft your response based on the content of their
        entries. If no entries are found, acknowledge this and offer to help them journal about the topic.`
      }
    ],
    maxSteps: 5, // Enable multi-step tool calls
    body: {
      userId: userId, // Pass the user ID to the API
    },
    onError: (err) => {
      console.error("Chat error occurred:", err);
      toast.error("Error connecting to AI chat service");
    },
    onFinish: (message) => {
      console.log("Chat finished with message:", message);
    }
  });
  
  // Ref for auto-scrolling to bottom of chat
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll effect when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Error logging effect
  useEffect(() => {
    if (error) {
      console.error('AI Chat Error:', error);
    }
  }, [error]);

  // Retry handler for error recovery
  const handleRetry = () => {
    if (error) {
      console.log("Retrying last message");
      reload();
    }
  };

  // Format journal entries search results
  const formatJournalResults = (result: JournalSearchResult) => {
    if (!result || !result.entries || result.entries.length === 0) {
      return (
        <div className="text-sm italic">
          {result?.message || "No journal entries found matching your query."}
        </div>
      );
    }
    
    return (
      <div className="flex flex-col gap-2">
        <div className="text-sm font-medium">Found {result.entries.length} relevant journal entries:</div>
        {result.entries.map((entry: JournalEntry, index: number) => (
          <div key={index} className="border-l-2 border-primary pl-2 mb-1">
            <div className="font-medium text-sm">{entry.title} {entry.date && `(${entry.date})`}</div>
            <div className="text-sm line-clamp-3">{entry.content}</div>
          </div>
        ))}
      </div>
    );
  };

  // Render different types of message parts (text, tool invocations, tool results)
  const renderMessagePart = (message: Message, part: MessagePart, index: number) => {
    switch (part.type) {
      case 'text':
        return <div key={`${message.id}-${index}`}>{part.text}</div>;
      case 'tool-invocation':
        return (
          <div key={`${message.id}-${index}`} className="bg-muted/30 p-2 rounded-md my-2 text-sm">
            <div className="font-medium">Using tool: {part.toolInvocation.toolName}</div>
            <div className="font-mono text-xs overflow-x-auto mt-1">
              <div>Parameters:</div>
              <pre>{JSON.stringify(part.toolInvocation.toolParameters, null, 2)}</pre>
            </div>
          </div>
        );
      case 'tool-result':
        const toolName = part.toolResult.toolName;
        try {
          const resultData = JSON.parse(part.toolResult.toolResultJSON);
          
          return (
            <div key={`${message.id}-${index}`} className="bg-muted/20 p-2 rounded-md my-2">
              {toolName === 'weather' && formatWeatherResult(resultData as WeatherResult)}
              {toolName === 'convertFahrenheitToCelsius' && formatTempConversion(resultData as TempConversionResult)}
              {toolName === 'searchJournalEntries' && formatJournalResults(resultData as JournalSearchResult)}
            </div>
          );
        } catch {
          return (
            <div key={`${message.id}-${index}`} className="text-xs bg-muted/20 p-2 rounded-md my-2">
              Tool result: {part.toolResult.toolResultJSON}
            </div>
          );
        }
      default:
        return <div key={`${message.id}-${index}`}>{JSON.stringify(part)}</div>;
    }
  };

  // Layout structure with sidebar and main content area
  return (
    <div className="grid grid-cols-[auto_1fr] min-h-screen w-full">
      <AppSidebar />
      <SidebarInset className="flex flex-col w-full overflow-x-hidden">
        {/* Header with breadcrumb navigation */}
        <header className="flex sticky top-0 z-10 h-16 shrink-0 items-center gap-2 border-b bg-background px-4 w-full">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Talk to Daygo AI</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        
        {/* Main content area */}
        <main className="flex flex-1 flex-col gap-6 p-4 md:p-8 overflow-auto w-full max-w-full overflow-x-hidden">
          {/* Page title and description */}
          <div className="flex items-center justify-between w-full">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Talk to Daygo AI</h1>
              <p className="text-muted-foreground">
                Your personal AI assistant that knows your journal entries and can provide insights.
              </p>
            </div>
          </div>
          
          {/* Chat interface card */}
          <div className="grid gap-6 w-full max-w-full">
            <Card className="w-full max-w-full">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center">
                  <BotIcon className="mr-2 h-5 w-5" />
                  Chat with Daygo AI
                </CardTitle>
                <CardDescription>
                  Ask questions about your journal entries, get insights, or just chat about your day.
                  Try asking &quot;What have I written about productivity?&quot; or &quot;Find entries where I discussed my goals.&quot;
                </CardDescription>
              </CardHeader>
              <CardContent className="w-full">
                <div className="flex flex-col gap-4 w-full">
                  {/* Chat messages container */}
                  <div className="flex flex-col gap-3 h-[400px] overflow-y-auto border rounded-md p-4 w-full overflow-x-hidden">
                    {/* Welcome message or chat history */}
                    {messages.filter(m => m.role !== 'system').length === 0 ? (
                      <div className="flex justify-start w-full">
                        <div className="w-full max-w-[80%] rounded-lg px-4 py-2 bg-muted">
                          Hello! I&apos;m Daygo AI, your personal journal assistant. How can I help you today? 
                          You can ask me about your journal entries, reflect on your writing, or even get insights from your past reflections.
                        </div>
                      </div>
                    ) : (
                      messages.filter(m => m.role !== 'system').map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.role === 'user' ? 'justify-end' : 'justify-start'
                          } w-full`}
                        >
                          <div
                            className={`w-full max-w-[80%] rounded-lg px-4 py-2 ${
                              message.role === 'user'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            {message.parts && Array.isArray(message.parts) 
                              ? message.parts.map((part, i) => renderMessagePart(message, part as MessagePart, i))
                              : message.content}
                          </div>
                        </div>
                      ))
                    )}
                    {/* Loading indicator */}
                    {isLoading && (
                      <div className="flex justify-start w-full">
                        <div className="w-full max-w-[80%] rounded-lg px-4 py-2 bg-muted">
                          <div className="flex gap-1">
                            <div className="h-2 w-2 rounded-full bg-current animate-bounce" />
                            <div className="h-2 w-2 rounded-full bg-current animate-bounce delay-75" />
                            <div className="h-2 w-2 rounded-full bg-current animate-bounce delay-150" />
                          </div>
                        </div>
                      </div>
                    )}
                    {/* Error display */}
                    {error && (
                      <div className="flex justify-center w-full">
                        <div className="w-full max-w-[80%] rounded-lg px-4 py-2 bg-destructive text-destructive-foreground">
                          <p className="font-medium">Error: {error.message || "Something went wrong. Please try again."}</p>
                          {error.cause ? (
                            <p className="text-xs mt-1">Details: {String(JSON.stringify(error.cause))}</p>
                          ) : null}
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleRetry} 
                            className="mt-2 bg-background/10 hover:bg-background/20 text-white"
                          >
                            Retry
                          </Button>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  
                  {/* Message input form */}
                  <form onSubmit={handleSubmit} className="flex gap-2">
                    <Input
                      placeholder="Type your message... (e.g., 'What have I written about productivity?')"
                      value={input}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      className="flex-1"
                    />
                    <Button type="submit" disabled={isLoading || !input.trim()}>
                      <SendIcon className="h-4 w-4 mr-2" />
                      Send
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </SidebarInset>
    </div>
  );
} 