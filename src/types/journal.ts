import { Timestamp } from "firebase/firestore";

export type JournalEntry = {
  id: string;
  title: string;
  content: string;
  createdAt: Timestamp;
  userId: string;
  templateId?: string;
  templateFields?: Record<string, string | undefined>;
};

export type TemplateField = {
  name: string;
  type: 'text' | 'textarea' | 'boolean' | 'mantra';
  label: string;
  placeholder?: string;
  required?: boolean;
};

export type JournalTemplate = {
  id: string;
  name: string;
  description: string;
  fields: TemplateField[];
  createdAt: Timestamp;
  userId: string;
  isDefault?: boolean;
}; 