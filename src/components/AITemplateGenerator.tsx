"use client";

import { useState, useEffect } from "react";
import { Sparkles, Send, Bot, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { addTemplate } from "@/services/templateService";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface AITemplateResult {
  name: string;
  description: string;
  fields: Array<{
    name: string;
    type: "text" | "textarea" | "boolean" | "mantra";
    label: string;
    placeholder?: string;
    required?: boolean;
  }>;
}

export function AITemplateGenerator() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "system",
      content: "You are an AI assistant that helps users create journal templates."
    },
    {
      role: "assistant",
      content: "Hi there! I can help you create a personalized journal template. What kind of journal template would you like to create? (e.g., gratitude journal, fitness tracker, daily reflection, etc.)"
    }
  ]);
  const [input, setInput] = useState("");
  const [generatedTemplate, setGeneratedTemplate] = useState<AITemplateResult | null>(null);
  const router = useRouter();

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMessage: Message = {
      role: "user",
      content: input,
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    
    try {
      // Get the current messages including the new user message
      const currentMessages = [...messages, userMessage];
      
      // Call the serverless API route
      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: currentMessages }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get response from AI');
      }
      
      const data = await response.json();
      const assistantMessage = data.response.content;
      
      // Add the assistant's response to the messages
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: assistantMessage
        }
      ]);
      
      // After 3 exchanges (3 user messages), generate template
      if (currentMessages.filter(m => m.role === "user").length === 3) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Perfect! I have enough information to create your journal template now. Let me generate that for you..."
          }
        ]);
        
        setIsGenerating(true);
        
        try {
          // Call the template generation API
          const templateResponse = await fetch('/api/openai/template', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ messages: currentMessages }),
          });
          
          if (!templateResponse.ok) {
            const errorData = await templateResponse.json();
            throw new Error(errorData.error || 'Failed to generate template');
          }
          
          const templateData = await templateResponse.json();
          
          if (templateData.template) {
            setGeneratedTemplate(templateData.template);
            
            setMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content: `I've created a template called "${templateData.template.name}" with ${templateData.template.fields.length} fields. Would you like to save this template or make any changes?`
              }
            ]);
          } else {
            throw new Error('No template data received');
          }
        } catch (error) {
          console.error("Error generating template:", error);
          toast.error("Failed to generate template. Using a sample template instead.");
          
          // Fallback to sample template
          const fallbackTemplate = generateSampleTemplate(currentMessages);
          setGeneratedTemplate(fallbackTemplate);
          
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: `I've created a template called "${fallbackTemplate.name}" with ${fallbackTemplate.fields.length} fields. Would you like to save this template or make any changes?`
            }
          ]);
        } finally {
          setIsGenerating(false);
        }
      } else if (currentMessages.filter(m => m.role === "user").length > 3 && generatedTemplate) {
        // If user confirms they want to save the template
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Great! I've saved your template. You can now use it to create new journal entries."
          }
        ]);
        handleSaveTemplate();
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to get response. Using simulated responses instead.");
      simulateResponse([...messages, userMessage]);
    }
  };

  // Fallback function for simulation
  const simulateResponse = (currentMessages: Message[]) => {
    setTimeout(() => {
      const userMessageCount = currentMessages.filter(m => m.role === "user").length;
      
      if (userMessageCount === 1) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Great! Can you tell me a bit more about what specific sections or prompts you'd like to include in your journal template?"
          }
        ]);
      } else if (userMessageCount === 2) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Thank you for sharing those details. Would you like the entries to be mostly free-form text, or would you prefer structured questions with specific answer formats (like yes/no questions, rating scales, etc.)?"
          }
        ]);
      } else if (userMessageCount === 3) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Perfect! I have enough information to create your journal template now. Let me generate that for you..."
          }
        ]);
        setIsGenerating(true);
        
        // Simulate generating the template
        setTimeout(() => {
          const templateExample = generateSampleTemplate(currentMessages);
          setGeneratedTemplate(templateExample);
          setIsGenerating(false);
          
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: `I've created a template called "${templateExample.name}" with ${templateExample.fields.length} fields. Would you like to save this template or make any changes?`
            }
          ]);
        }, 3000);
      } else if (userMessageCount > 3 && generatedTemplate) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Great! I've saved your template. You can now use it to create new journal entries."
          }
        ]);
        handleSaveTemplate();
      }
      
      setIsLoading(false);
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSaveTemplate = async () => {
    if (!generatedTemplate) return;
    
    try {
      setIsLoading(true);
      await addTemplate(generatedTemplate);
      toast.success("Template saved successfully!");
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error("Failed to save template. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetChat = () => {
    setMessages([
      {
        role: "system",
        content: "You are an AI assistant that helps users create journal templates."
      },
      {
        role: "assistant",
        content: "Hi there! I can help you create a personalized journal template. What kind of journal template would you like to create? (e.g., gratitude journal, fitness tracker, daily reflection, etc.)"
      }
    ]);
    setGeneratedTemplate(null);
    setIsGenerating(false);
  };

  // Reset the chat when dialog is closed
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        resetChat();
      }, 300); // Wait for dialog close animation
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Sparkles className="mr-2 h-4 w-4" />
          AI Template
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Template Generator
          </DialogTitle>
          <DialogDescription>
            Describe the journal template you want to create and our AI will build it for you.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto py-4 px-1">
          <div className="space-y-4">
            {messages
              .filter(m => m.role !== "system")
              .map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "assistant" ? "justify-start" : "justify-end"
                  }`}
                >
                  <div
                    className={`rounded-lg px-4 py-2 max-w-[80%] ${
                      message.role === "assistant"
                        ? "bg-muted text-foreground"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
            ))}
            
            {isGenerating && (
              <div className="flex justify-start">
                <div className="rounded-lg px-4 py-2 max-w-[80%] bg-muted text-foreground">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Generating template...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="border-t pt-4">
          <div className="flex gap-2">
            <Textarea
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-10 flex-1"
              disabled={isLoading || isGenerating}
            />
            <Button 
              onClick={handleSend} 
              size="icon" 
              disabled={isLoading || !input.trim() || isGenerating}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        
        <DialogFooter className="mt-2">
          {generatedTemplate && messages.length >= 8 && (
            <Button onClick={handleSaveTemplate} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>Save Template</>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// This function generates a sample template based on user messages
function generateSampleTemplate(messages: Message[]): AITemplateResult {
  // Extract some keywords from the user messages
  const userMessages = messages.filter(m => m.role === "user").map(m => m.content.toLowerCase());
  
  // Check for common journal types based on keywords
  const isGratitude = userMessages.some(m => m.includes("gratitude") || m.includes("thankful"));
  const isMood = userMessages.some(m => m.includes("mood") || m.includes("emotion") || m.includes("feeling"));
  const isGoals = userMessages.some(m => m.includes("goal") || m.includes("achievement") || m.includes("target"));
  
  if (isGratitude) {
    return {
      name: "Daily Gratitude Journal",
      description: "A template for recording things you're grateful for each day",
      fields: [
        {
          name: "date",
          type: "text",
          label: "Date",
          required: true
        },
        {
          name: "gratitude1",
          type: "textarea",
          label: "I am grateful for...",
          placeholder: "What are you thankful for today?",
          required: true
        },
        {
          name: "gratitude2",
          type: "textarea",
          label: "Another thing I appreciate is...",
          placeholder: "Something else you're grateful for"
        },
        {
          name: "gratitude3",
          type: "textarea",
          label: "One small joy I experienced today was...",
          placeholder: "A small moment that brought you joy"
        },
        {
          name: "reflections",
          type: "textarea",
          label: "Reflections on gratitude",
          placeholder: "How did focusing on gratitude affect your day?"
        }
      ]
    };
  } else if (isMood) {
    return {
      name: "Mood Tracker Journal",
      description: "Track your daily moods and emotions",
      fields: [
        {
          name: "date",
          type: "text",
          label: "Date",
          required: true
        },
        {
          name: "overallMood",
          type: "text",
          label: "Overall Mood (1-10)",
          placeholder: "Rate your mood from 1-10",
          required: true
        },
        {
          name: "morningMood",
          type: "text",
          label: "Morning Mood",
          placeholder: "How did you feel in the morning?"
        },
        {
          name: "eveningMood",
          type: "text",
          label: "Evening Mood",
          placeholder: "How did you feel in the evening?"
        },
        {
          name: "triggers",
          type: "textarea",
          label: "Mood Triggers",
          placeholder: "What influenced your mood today?"
        },
        {
          name: "improveStrategy",
          type: "textarea",
          label: "Strategies to improve mood",
          placeholder: "What could help improve your mood tomorrow?"
        }
      ]
    };
  } else if (isGoals) {
    return {
      name: "Goal Setting Journal",
      description: "Set and track your goals and achievements",
      fields: [
        {
          name: "date",
          type: "text",
          label: "Date",
          required: true
        },
        {
          name: "mainGoal",
          type: "textarea",
          label: "Main Goal for Today",
          placeholder: "What's your primary goal today?",
          required: true
        },
        {
          name: "secondaryGoals",
          type: "textarea",
          label: "Secondary Goals",
          placeholder: "Any other goals you want to accomplish"
        },
        {
          name: "obstacles",
          type: "textarea",
          label: "Potential Obstacles",
          placeholder: "What might get in your way?"
        },
        {
          name: "strategies",
          type: "textarea",
          label: "Strategies to Overcome Obstacles",
          placeholder: "How will you overcome these challenges?"
        },
        {
          name: "completed",
          type: "boolean",
          label: "Goal Completed?",
          required: true
        },
        {
          name: "reflection",
          type: "textarea",
          label: "End of Day Reflection",
          placeholder: "Reflect on your progress today"
        }
      ]
    };
  } else {
    // Default to a general reflection journal
    return {
      name: "Daily Reflection Journal",
      description: "A template for daily personal reflection",
      fields: [
        {
          name: "date",
          type: "text",
          label: "Date",
          required: true
        },
        {
          name: "highlight",
          type: "textarea",
          label: "Today's Highlight",
          placeholder: "What was the best part of your day?",
          required: true
        },
        {
          name: "challenge",
          type: "textarea",
          label: "Today's Challenge",
          placeholder: "What was difficult or challenging today?"
        },
        {
          name: "learned",
          type: "textarea",
          label: "What I Learned",
          placeholder: "Something you learned or realized today"
        },
        {
          name: "tomorrow",
          type: "textarea",
          label: "Plan for Tomorrow",
          placeholder: "What are you looking forward to tomorrow?"
        },
        {
          name: "grateful",
          type: "textarea",
          label: "Gratitude",
          placeholder: "What are you grateful for today?"
        },
        {
          name: "affirmation",
          type: "mantra",
          label: "Daily Affirmation",
          placeholder: "A positive statement to affirm yourself"
        }
      ]
    };
  }
} 