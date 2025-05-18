'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppSidebar } from '@/components/AppSidebar';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { getTemplate } from '@/services/templateService';
import { addJournalEntry, generateContentFromTemplateFields } from '@/services/journalService';
import { JournalTemplate, TemplateField } from '@/types/journal';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';

export default function NewJournalEntryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get('templateId');
  const communityTemplateParam = searchParams.get('communityTemplate');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [template, setTemplate] = useState<JournalTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<Record<string, any>>({
    title: '',
  });

  // Load template data (either from user templates or community template)
  useEffect(() => {
    const loadTemplate = async () => {
      try {
        setLoading(true);

        // Check if using a community template
        if (communityTemplateParam) {
          try {
            const parsedTemplate = JSON.parse(communityTemplateParam);
            
            // Convert community template format to our app's format
            const serverTimestamp = Timestamp.now();
            const formattedTemplate: JournalTemplate = {
              id: parsedTemplate.id.toString(),
              name: parsedTemplate.name,
              description: parsedTemplate.description,
              fields: parsedTemplate.fields.map((field: any) => ({
                name: field.name,
                type: field.type || 'text',
                label: field.name,
                placeholder: '',
                required: false
              })),
              userId: 'community',
              createdAt: serverTimestamp
            };
            
            setTemplate(formattedTemplate);
            setFormData(prev => ({ ...prev, title: `${formattedTemplate.name} - ${new Date().toLocaleDateString()}` }));
          } catch (error) {
            console.error('Error parsing community template:', error);
            toast.error('Invalid template data');
            router.push('/journal/select-template');
          }
        } 
        // Using user's saved template
        else if (templateId) {
          const fetchedTemplate = await getTemplate(templateId);
          setTemplate(fetchedTemplate);
          setFormData(prev => ({ ...prev, title: `${fetchedTemplate.name} - ${new Date().toLocaleDateString()}` }));
        } 
        // Basic entry without template
        else {
          // Create a basic template with proper Timestamp
          const serverTimestamp = Timestamp.now();
          setTemplate({
            id: 'basic',
            name: 'Quick Note (Simple)',
            description: 'A simple journal entry with just title and content',
            fields: [
              {
                name: 'content',
                type: 'textarea',
                label: 'Journal Content',
                placeholder: 'Write your thoughts here...',
                required: true,
              },
            ],
            userId: 'system',
            createdAt: serverTimestamp
          });
        }
      } catch (error) {
        console.error('Error loading template:', error);
        toast.error('Failed to load template');
      } finally {
        setLoading(false);
      }
    };

    loadTemplate();
  }, [templateId, communityTemplateParam, router]);

  const handleInputChange = (fieldName: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const handleSubmit = async () => {
    if (!template) return;

    // Basic validation
    if (!formData.title.trim()) {
      toast.error('Please enter a title for your journal entry');
      return;
    }

    // Validate required fields
    const requiredFields = template.fields.filter(field => field.required);
    for (const field of requiredFields) {
      if (!formData[field.name]) {
        toast.error(`Please fill in the required field: ${field.label}`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Prepare the data
      const templateFields: Record<string, string | undefined> = {};
      
      // Convert all values to appropriate types for storage
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'title') return; // Skip title
        // Convert booleans to strings for storage
        if (typeof value === 'boolean') {
          templateFields[key] = value ? 'true' : 'false';
        } else {
          templateFields[key] = value as string;
        }
      });
      
      // Generate content from template fields
      let content = '';
      
      // For Quick Note (Simple), ensure we use the content directly
      if (template.id === 'basic' && template.name === 'Quick Note (Simple)') {
        content = templateFields['content'] || '';
        
        // Log detailed info about the quick note for debugging
        console.log('Quick Note (Simple) details:');
        console.log('- Content length:', content.length);
        console.log('- Template ID:', template.id);
        console.log('- Title:', formData.title);
        console.log('- Content preview:', content ? `${content.substring(0, 50)}...` : 'Empty content');
        
        // Sanity check for empty content
        if (!content.trim()) {
          console.warn('Warning: Empty content for Quick Note');
        }
      } else {
        // For regular templates, generate formatted content
        content = generateContentFromTemplateFields(templateFields);
      }

      // Prepare data for submission
      const submissionData: {
        title: string;
        content: string;
        templateId?: string;
        templateFields: Record<string, string | undefined>;
      } = {
        title: formData.title as string,
        content,
        templateFields,
      };
      
      // Special handling for Quick Notes - ensure content is properly saved
      if (template.id === 'basic' && template.name === 'Quick Note (Simple)') {
        // Make absolutely sure content is populated properly for Quick Notes
        if (!content.trim() && templateFields['content']) {
          submissionData.content = templateFields['content'];
          console.log('Corrected empty content for Quick Note:', 
            submissionData.content ? submissionData.content.substring(0, 50) + '...' : 'still empty');
        }
      }
      
      // Only add templateId for non-basic templates
      if (template.id !== 'basic') {
        submissionData.templateId = template.id;
      }

      // Create the entry
      const entryId = await addJournalEntry(submissionData);

      toast.success('Journal entry saved successfully');
      
      // Check if there was a successful embedding (look for success message in console)
      // Note: This is a hacky way to check, but we can't directly access the embedding status
      // We could improve this with a proper API response later
      setTimeout(() => {
        const journalUrl = `/journal/${entryId}`;
        router.push(journalUrl);
      }, 500); // Small delay to show the success toast
    } catch (error) {
      console.error('Error saving journal entry:', error);
      toast.error('Failed to save journal entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render a field based on its type
  const renderField = (field: TemplateField) => {
    switch (field.type) {
      case 'text':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>{field.label} {field.required && <span className="text-destructive">*</span>}</Label>
            <Input
              id={field.name}
              placeholder={field.placeholder}
              value={formData[field.name] || ''}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
            />
          </div>
        );
      case 'textarea':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>{field.label} {field.required && <span className="text-destructive">*</span>}</Label>
            <Textarea
              id={field.name}
              placeholder={field.placeholder}
              value={formData[field.name] || ''}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              className="min-h-32"
            />
          </div>
        );
      case 'boolean':
        return (
          <div key={field.name} className="flex items-center gap-2 pt-2">
            <Checkbox
              id={field.name}
              checked={!!formData[field.name]}
              onCheckedChange={(checked) => handleInputChange(field.name, checked as boolean)}
            />
            <Label htmlFor={field.name} className="cursor-pointer">
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Label>
          </div>
        );
      case 'mantra':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>{field.label} {field.required && <span className="text-destructive">*</span>}</Label>
            <div className="p-4 border rounded-md bg-muted/50">
              <p className="italic text-muted-foreground">{field.placeholder || "No mantra text provided"}</p>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Checkbox
                id={`${field.name}_completed`}
                checked={!!formData[field.name]}
                onCheckedChange={(checked) => handleInputChange(field.name, checked as boolean)}
              />
              <Label htmlFor={`${field.name}_completed`} className="cursor-pointer">
                I have read and reflected on this mantra
              </Label>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

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
                  <Link href="/journal">Journal</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem>
                <BreadcrumbPage>New Entry</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          
          <div className="ml-auto flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting || loading}
              className="gap-1"
            >
              <Save className="h-4 w-4" />
              {isSubmitting ? 'Saving...' : 'Save Entry'}
            </Button>
          </div>
        </header>
        
        <main className="flex flex-1 flex-col gap-6 p-4 md:p-8 max-w-6xl mx-auto w-full">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-pulse">Loading template...</div>
            </div>
          ) : template ? (
            <>
              <h1 className="text-3xl font-bold">New Journal Entry</h1>
              
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Template: {template.name}</CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
              </Card>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Entry Title <span className="text-destructive">*</span></Label>
                  <Input
                    id="title"
                    placeholder="Enter a title for your journal entry"
                    value={formData.title || ''}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                  />
                </div>
                
                {template.fields.map(field => renderField(field))}
                
                <div className="flex justify-end">
                  <Button 
                    onClick={handleSubmit} 
                    disabled={isSubmitting}
                    size="lg"
                    className="gap-1"
                  >
                    <Save className="h-4 w-4" />
                    {isSubmitting ? 'Saving...' : 'Save Journal Entry'}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex justify-center py-10">
              <p>Template not found. <Link href="/journal/select-template" className="text-primary underline">Select a different template</Link></p>
            </div>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
} 