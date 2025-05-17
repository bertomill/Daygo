'use client';

import { useState } from 'react';
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Bookmark, Heart, Calendar, CheckCircle, List, Clock, Award, TrendingUp, Star } from "lucide-react";
import { toast } from "sonner";
import { saveCommunityTemplate } from "@/services/templateService";
import { useRouter } from "next/navigation";

// Mock data for community templates
const COMMUNITY_TEMPLATES = [
  {
    id: 1,
    name: "Gratitude Journal",
    description: "Start your day with positivity by noting things you're grateful for.",
    author: "Daygo",
    authorAvatar: null,
    likes: 842,
    category: "Mindfulness",
    tags: ["gratitude", "positivity", "morning-routine"],
    featured: true,
    isPopular: true,
    fields: [
      { name: "Three things I'm grateful for today", type: "textarea" },
      { name: "One person I appreciate", type: "text" },
      { name: "A small win worth celebrating", type: "text" }
    ]
  },
  {
    id: 2,
    name: "Daily Focus Planner",
    description: "Prioritize your tasks and track your accomplishments throughout the day.",
    author: "Daygo",
    authorAvatar: null,
    likes: 635,
    category: "Productivity",
    tags: ["focus", "planning", "goals"],
    featured: true,
    isPopular: true,
    fields: [
      { name: "Top 3 priorities", type: "textarea" },
      { name: "Tasks to complete", type: "checklist" },
      { name: "Energy level", type: "rating" },
      { name: "Notes", type: "textarea" }
    ]
  },
  {
    id: 3,
    name: "Evening Reflection",
    description: "End your day with thoughtful reflection on accomplishments and lessons.",
    author: "Daygo",
    authorAvatar: null,
    likes: 529,
    category: "Self-Improvement",
    tags: ["reflection", "evening-routine", "mindfulness"],
    featured: false,
    isPopular: true,
    fields: [
      { name: "What went well today?", type: "textarea" },
      { name: "What could I improve?", type: "textarea" },
      { name: "Tomorrow's focus", type: "text" }
    ]
  },
  {
    id: 4,
    name: "Mood Tracker",
    description: "Monitor your emotions throughout the day to identify patterns and triggers.",
    author: "Daygo",
    authorAvatar: null,
    likes: 412,
    category: "Mental Health",
    tags: ["mood", "emotions", "self-awareness"],
    featured: false,
    isPopular: false,
    fields: [
      { name: "Current mood", type: "rating" },
      { name: "Factors affecting my mood", type: "checklist" },
      { name: "Self-care activities", type: "checklist" }
    ]
  },
  {
    id: 5,
    name: "Habit Builder",
    description: "Track your daily habits and build consistency for personal growth.",
    author: "Daygo",
    authorAvatar: null,
    likes: 378,
    category: "Productivity",
    tags: ["habits", "consistency", "growth"],
    featured: false,
    isPopular: false,
    fields: [
      { name: "Habits to track", type: "checklist" },
      { name: "Streak count", type: "number" },
      { name: "Notes on progress", type: "textarea" }
    ]
  },
  {
    id: 6,
    name: "Weekly Review",
    description: "Reflect on your week and set intentions for the coming days.",
    author: "Daygo",
    authorAvatar: null,
    likes: 347,
    category: "Planning",
    tags: ["weekly", "review", "goals"],
    featured: false,
    isPopular: false,
    fields: [
      { name: "Key accomplishments", type: "textarea" },
      { name: "Challenges faced", type: "textarea" },
      { name: "Goals for next week", type: "textarea" }
    ]
  },
];

export default function CommunityPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [savingTemplateId, setSavingTemplateId] = useState<number | null>(null);
  const router = useRouter();
  
  const filteredTemplates = COMMUNITY_TEMPLATES.filter(template => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        template.name.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query) ||
        template.author.toLowerCase().includes(query) ||
        template.tags.some(tag => tag.includes(query))
      );
    }
    if (activeCategory === 'featured') return template.featured;
    if (activeCategory === 'popular') return template.isPopular;
    if (activeCategory !== 'all') return template.category.toLowerCase() === activeCategory.toLowerCase();
    return true;
  });

  const handleUseTemplate = (templateId: number) => {
    // Find the template
    const template = COMMUNITY_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;
    
    // Redirect to create a new journal entry with this template
    router.push(`/journal/new?communityTemplate=${JSON.stringify(template)}`);
  };

  const handleSaveTemplate = async (templateId: number) => {
    try {
      setSavingTemplateId(templateId);
      
      // Find the template
      const template = COMMUNITY_TEMPLATES.find(t => t.id === templateId);
      if (!template) {
        toast.error("Template not found");
        return;
      }
      
      // Save to user's collection
      await saveCommunityTemplate(template);
      toast.success("Template saved to your collection");
      
      // Optional: redirect to templates page
      // router.push("/templates");
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error("Failed to save template. Please make sure you're logged in.");
    } finally {
      setSavingTemplateId(null);
    }
  };

  const handleLikeTemplate = (templateId: number) => {
    toast.success("Template liked!");
    // In a real app, this would update the like count and user's preferences
  };

  return (
    <div className="flex h-screen w-full">
      <AppSidebar />
      
      <main className="flex-1 overflow-auto">
        <div className="w-full p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold">Community Templates</h1>
              <p className="text-muted-foreground mt-1">
                Discover and use journal templates created by the Daygo community
              </p>
            </div>
            
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search templates..." 
                className="pl-9 w-full sm:w-[300px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <Tabs defaultValue="all" onValueChange={setActiveCategory} className="mb-8">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Templates</TabsTrigger>
              <TabsTrigger value="featured">Featured</TabsTrigger>
              <TabsTrigger value="popular">Popular</TabsTrigger>
              <TabsTrigger value="Mindfulness">Mindfulness</TabsTrigger>
              <TabsTrigger value="Productivity">Productivity</TabsTrigger>
              <TabsTrigger value="Mental Health">Mental Health</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.map((template) => (
                  <TemplateCard 
                    key={template.id} 
                    template={template} 
                    onUse={handleUseTemplate}
                    onSave={handleSaveTemplate}
                    onLike={handleLikeTemplate}
                    isSaving={savingTemplateId === template.id}
                  />
                ))}
              </div>
              
              {filteredTemplates.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No templates found matching your search</p>
                </div>
              )}
            </TabsContent>
            
            {['featured', 'popular', 'Mindfulness', 'Productivity', 'Mental Health'].map((category) => (
              <TabsContent key={category} value={category} className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTemplates.map((template) => (
                    <TemplateCard 
                      key={template.id} 
                      template={template} 
                      onUse={handleUseTemplate}
                      onSave={handleSaveTemplate}
                      onLike={handleLikeTemplate}
                      isSaving={savingTemplateId === template.id}
                    />
                  ))}
                </div>
                
                {filteredTemplates.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No templates found in this category</p>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </main>
    </div>
  );
}

interface TemplateCardProps {
  template: typeof COMMUNITY_TEMPLATES[0];
  onUse: (id: number) => void;
  onSave: (id: number) => void;
  onLike: (id: number) => void;
  isSaving: boolean;
}

function TemplateCard({ template, onUse, onSave, onLike, isSaving }: TemplateCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };
  
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'mindfulness':
        return <CheckCircle className="h-4 w-4" />;
      case 'productivity':
        return <List className="h-4 w-4" />;
      case 'self-improvement':
        return <TrendingUp className="h-4 w-4" />;
      case 'mental health':
        return <Heart className="h-4 w-4" />;
      case 'planning':
        return <Calendar className="h-4 w-4" />;
      default:
        return <Star className="h-4 w-4" />;
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1 font-normal">
              {getCategoryIcon(template.category)}
              {template.category}
            </Badge>
            {template.featured && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Award className="h-3 w-3" />
                Featured
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={(e) => {
              e.stopPropagation();
              onLike(template.id);
            }}>
              <Heart className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={(e) => {
              e.stopPropagation();
              onSave(template.id);
            }}>
              <Bookmark className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardTitle className="mt-2">{template.name}</CardTitle>
        <CardDescription className="line-clamp-2">{template.description}</CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="space-y-2">
          {template.fields.slice(0, 3).map((field, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm">
              <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
              <p className="text-sm text-muted-foreground truncate">{field.name}</p>
            </div>
          ))}
          {template.fields.length > 3 && (
            <p className="text-xs text-muted-foreground">+ {template.fields.length - 3} more fields</p>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-2 pt-0">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={template.authorAvatar || undefined} />
            <AvatarFallback className="text-xs">DG</AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground">{template.author}</span>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={(e) => {
              e.stopPropagation();
              onSave(template.id);
            }}
            disabled={isSaving}
          >
            <Bookmark className="h-4 w-4 mr-1" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
          <Button size="sm" onClick={() => onUse(template.id)}>
            Use
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
} 