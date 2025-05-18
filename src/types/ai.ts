import { Message } from 'ai';

export type MessagePart = 
  | {
      type: 'text';
      text: string;
    }
  | {
      type: 'tool-invocation';
      toolInvocation: {
        toolName: string;
        toolParameters: Record<string, any>;
      };
    }
  | {
      type: 'tool-result';
      toolResult: {
        toolName: string;
        toolResult: any;
      };
    };

export type ChatMessage = Message<MessagePart[]>; 