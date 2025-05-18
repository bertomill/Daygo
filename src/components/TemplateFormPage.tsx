"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TemplateField } from '@/types/journal';
import { getTemplate, addTemplate, updateTemplate } from '@/services/templateService';
import { toast } from 'sonner';
import { AppSidebar } from './AppSidebar';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import {
  GripVertical,
  ToggleLeft,
  Type,
  Quote, 
  AlignLeft,
  Save,
  MoreHorizontal,
  Plus
} from "lucide-react";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Generate a valid field name from a display label
const generateFieldName = (label: string): string => {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '_') // Replace non-alphanumeric with underscore
    .replace(/_{2,}/g, '_')     // Replace multiple underscores with a single one
    .replace(/^_|_$/g, '')      // Remove leading/trailing underscores
    .substring(0, 50)           // Limit length
    || 'field';                 // Fallback if empty
};

// Field types and their corresponding icons/labels
const FIELD_TYPES = [
  { id: "text", label: "Short Text", icon: Type },
  { id: "textarea", label: "Long Text", icon: AlignLeft },
  { id: "boolean", label: "Checkbox", icon: ToggleLeft },
  { id: "mantra", label: "Mantra", icon: Quote }
];

// Interface for a template field item
interface FieldItem extends TemplateField {
  id: string;
}

export function TemplateFormPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [templateId, setTemplateId] = useState<string | undefined>(undefined);
  
  // Template metadata
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  
  // Fields state
  const [fields, setFields] = useState<FieldItem[]>([
    {
      id: "field-" + Date.now(),
      name: generateFieldName("Your first field"),
      type: "text",
      label: "Your first field",
      placeholder: "Enter some text here",
      required: false
    }
  ]);
  
  const [activeAddMenu, setActiveAddMenu] = useState<number | null>(null);
  
  // Load existing template if editing
  useEffect(() => {
    const id = params?.id as string;
    
    if (id) {
      setIsEditing(true);
      setTemplateId(id);
      setLoading(true);
      
      getTemplate(id)
        .then(data => {
          setTemplateName(data.name);
          setTemplateDescription(data.description);
          
          // Convert template fields to field items with ids
          const fieldItems = data.fields.map(field => ({
            ...field,
            id: "field-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9)
          }));
          
          setFields(fieldItems);
        })
        .catch(error => {
          console.error('Error loading template:', error);
          toast.error('Failed to load template');
          router.push('/templates');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [params, router]);
  
  // Add a new field at specific index
  const addFieldAtIndex = (type: TemplateField["type"], index: number) => {
    const newField: FieldItem = {
      id: "field-" + Date.now(),
      name: generateFieldName(getDefaultLabel(type)),
      type: type,
      label: getDefaultLabel(type),
      placeholder: getDefaultPlaceholder(type),
      required: false
    };
    
    const updatedFields = [...fields];
    updatedFields.splice(index, 0, newField);
    setFields(updatedFields);
    setActiveAddMenu(null);
    
    // Scroll to the new field after a short delay
    setTimeout(() => {
      const fieldElements = document.querySelectorAll('[data-field-id]');
      if (fieldElements && fieldElements[index]) {
        fieldElements[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };
  
  // Get default label based on field type
  const getDefaultLabel = (type: TemplateField["type"]): string => {
    switch (type) {
      case "text": return "Short Text Field";
      case "textarea": return "Long Text Field";
      case "boolean": return "Yes/No Question";
      case "mantra": return "Daily Mantra";
      default: return "New Field";
    }
  };
  
  // Get default placeholder based on field type
  const getDefaultPlaceholder = (type: TemplateField["type"]): string => {
    switch (type) {
      case "text": return "Enter text here";
      case "textarea": return "Write your thoughts here...";
      case "boolean": return "";
      case "mantra": return "I am capable of achieving my goals";
      default: return "";
    }
  };
  
  // Update field properties
  const updateField = (id: string, updates: Partial<FieldItem>) => {
    setFields(fields.map(field => 
      field.id === id ? { ...field, ...updates } : field
    ));
  };
  
  // Remove a field
  const removeField = (id: string) => {
    if (fields.length > 1) {
      setFields(fields.filter(field => field.id !== id));
    } else {
      toast.error("Template must have at least one field");
    }
  };
  
  // Handle drag and drop reordering
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(fields);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setFields(items);
  };
  
  // Save the template
  const saveTemplate = async () => {
    // Validate input
    if (!templateName.trim()) {
      toast.error("Template name is required");
      return;
    }
    
    if (!templateDescription.trim()) {
      toast.error("Template description is required");
      return;
    }
    
    if (fields.some(field => !field.label.trim())) {
      toast.error("All fields must have labels");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare template data
      const templateData = {
        name: templateName,
        description: templateDescription,
        fields: fields.map(field => ({
          name: generateFieldName(field.label),
          type: field.type,
          label: field.label,
          placeholder: field.placeholder || "",
          required: field.required || false
        }))
      };
      
      if (isEditing && templateId) {
        await updateTemplate(templateId, templateData);
        toast.success("Template updated successfully");
      } else {
        await addTemplate(templateData);
        toast.success("Template created successfully");
      }
      
      router.push("/templates");
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error(isEditing ? "Failed to update template" : "Failed to create template");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // The "+" button component to insert between fields
  const AddFieldButton = ({ index }: { index: number }) => (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-center my-2">
        <div className="flex-grow h-px bg-border"></div>
        <button
          onClick={() => setActiveAddMenu(activeAddMenu === index ? null : index)}
          className="mx-2 flex items-center justify-center h-8 w-8 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
        >
          <Plus className="h-4 w-4" />
        </button>
        <div className="flex-grow h-px bg-border"></div>
      </div>

      {activeAddMenu === index && (
        <div className="absolute z-10 left-1/2 transform -translate-x-1/2 mt-1 bg-popover rounded-md shadow-lg p-1 border border-border flex gap-1">
          {FIELD_TYPES.map(type => (
            <button
              key={type.id}
              onClick={() => addFieldAtIndex(type.id as TemplateField["type"], index)}
              className="flex items-center gap-1 rounded-md px-3 py-2 text-sm hover:bg-muted"
            >
              <type.icon className="h-4 w-4" />
              <span>{type.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex sticky top-0 z-10 h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/templates">Templates</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem>
                <BreadcrumbPage>{isEditing ? 'Edit Template' : 'New Template'}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          
          <div className="ml-auto flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => router.push('/templates')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={saveTemplate} 
              disabled={isSubmitting || loading}
              className="gap-1"
            >
              <Save className="h-4 w-4" />
              {isSubmitting 
                ? isEditing ? "Updating..." : "Creating..." 
                : isEditing ? "Update Template" : "Create Template"
              }
            </Button>
          </div>
        </header>
        
        <main className="flex flex-1 flex-col gap-6 p-4 md:p-8 max-w-6xl mx-auto w-full"
              onClick={() => activeAddMenu !== null && setActiveAddMenu(null)}>
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-pulse">Loading template...</div>
            </div>
          ) : (
            <>
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold mb-6">{isEditing ? 'Edit Template' : 'Create Template'}</h1>
                  <Card className="w-full">
                    <CardContent className="pt-6 space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Template Name</label>
                        <Input 
                          placeholder="Daily Journal" 
                          value={templateName}
                          onChange={(e) => setTemplateName(e.target.value)}
                          className="w-full"
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          Give your template a descriptive name
                        </p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium mb-1 block">Description</label>
                        <Textarea 
                          placeholder="A template for daily journal entries"
                          value={templateDescription}
                          onChange={(e) => setTemplateDescription(e.target.value)}
                          className="w-full"
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          Briefly describe the purpose of this template
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Template Fields</h2>
                  </div>
                  
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="fields">
                      {(provided) => (
                        <div 
                          {...provided.droppableProps} 
                          ref={provided.innerRef} 
                          className="space-y-2"
                        >
                          {/* Add field button at the top */}
                          {fields.length === 0 ? (
                            <AddFieldButton index={0} />
                          ) : (
                            <>
                              <AddFieldButton index={0} />
                              {fields.map((field, index) => (
                                <div key={field.id} className="space-y-2">
                                  <Draggable draggableId={field.id} index={index}>
                                    {(provided, snapshot) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        className={`border border-border rounded-lg overflow-hidden ${
                                          snapshot.isDragging ? "opacity-70" : "opacity-100"
                                        }`}
                                        onClick={(e) => e.stopPropagation()}
                                        data-field-id={field.id}
                                      >
                                        <div className="flex items-center justify-between p-3 bg-muted/50">
                                          <div className="flex items-center gap-2">
                                            <div {...provided.dragHandleProps} className="cursor-grab">
                                              <GripVertical className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                            <Input
                                              value={field.label}
                                              onChange={(e) => updateField(field.id, { label: e.target.value })}
                                              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto text-base font-medium py-2"
                                              placeholder="Field Label"
                                            />
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Switch
                                              checked={field.required}
                                              onCheckedChange={(checked) =>
                                                updateField(field.id, { required: checked })
                                              }
                                            />
                                            <span className="text-sm text-muted-foreground">
                                              Required
                                            </span>
                                            <DropdownMenu>
                                              <DropdownMenuTrigger asChild>
                                                <Button
                                                  variant="ghost"
                                                  className="h-8 w-8 p-0 hover:bg-muted"
                                                >
                                                  <MoreHorizontal className="h-4 w-4" />
                                                  <span className="sr-only">Open menu</span>
                                                </Button>
                                              </DropdownMenuTrigger>
                                              <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                  onClick={() => removeField(field.id)}
                                                  className="text-destructive focus:text-destructive"
                                                >
                                                  Delete Field
                                                </DropdownMenuItem>
                                              </DropdownMenuContent>
                                            </DropdownMenu>
                                          </div>
                                        </div>
                                        
                                        <div className="p-6 space-y-6">
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                              <label className="text-sm font-medium mb-2 block">
                                                Field Type
                                              </label>
                                              <Select
                                                value={field.type}
                                                onValueChange={(value) => 
                                                  updateField(field.id, { 
                                                    type: value as TemplateField["type"],
                                                    placeholder: value === "mantra" ? "Enter the mantra text here" : field.placeholder
                                                  })
                                                }
                                              >
                                                <SelectTrigger className="w-full">
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="text">Short Text</SelectItem>
                                                  <SelectItem value="textarea">Long Text</SelectItem>
                                                  <SelectItem value="boolean">Yes/No</SelectItem>
                                                  <SelectItem value="mantra">Mantra</SelectItem>
                                                </SelectContent>
                                              </Select>
                                              <p className="text-sm text-muted-foreground mt-2">
                                                {field.type === "mantra" 
                                                  ? "A mantra field provides text for users to recite" 
                                                  : field.type === "textarea"
                                                  ? "A multi-line input field for longer responses"
                                                  : field.type === "boolean"
                                                  ? "A simple yes/no checkbox question"
                                                  : "A single line input field"}
                                              </p>
                                            </div>
                                            
                                            {field.type !== "boolean" && (
                                              <div>
                                                <label className="text-sm font-medium mb-2 block">
                                                  {field.type === "mantra" ? "Mantra Text" : "Placeholder"}
                                                </label>
                                                {field.type === "textarea" || field.type === "mantra" ? (
                                                  <Textarea
                                                    value={field.placeholder || ""}
                                                    onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                                                    placeholder={field.type === "mantra" ? "Enter the mantra text here" : "Enter placeholder text"}
                                                    className="min-h-20"
                                                  />
                                                ) : (
                                                  <Input
                                                    value={field.placeholder || ""}
                                                    onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                                                    placeholder="Enter placeholder text"
                                                  />
                                                )}
                                                <p className="text-sm text-muted-foreground mt-2">
                                                  {field.type === "mantra" 
                                                    ? "The actual mantra text that will be displayed to the user" 
                                                    : "Helper text shown in the input field"}
                                                </p>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </Draggable>
                                  <AddFieldButton index={index + 1} />
                                </div>
                              ))}
                            </>
                          )}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <Button 
                  onClick={saveTemplate} 
                  disabled={isSubmitting || loading}
                  size="lg"
                  className="gap-1"
                >
                  <Save className="h-4 w-4" />
                  {isSubmitting 
                    ? isEditing ? "Updating..." : "Creating..." 
                    : isEditing ? "Update Template" : "Create Template"
                  }
                </Button>
              </div>
            </>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
} 