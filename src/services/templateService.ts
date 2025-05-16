'use client';

import { collection, addDoc, doc, updateDoc, serverTimestamp, query, orderBy, getDocs, where, deleteDoc, limit } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { JournalTemplate } from "@/types/journal";

const COLLECTION_NAME = 'templates';

// Collection reference
const templatesRef = collection(db, COLLECTION_NAME);

// Add a new journal template
export async function addTemplate(template: Omit<JournalTemplate, "id" | "createdAt" | "userId"> & { isDefault?: boolean }) {
  try {
    if (!auth.currentUser) {
      throw new Error("User must be logged in to add templates");
    }

    const userId = auth.currentUser.uid;
    
    // Log the template data before saving
    console.log("Template data to save:", template);
    console.log("Fields to save:", template.fields);
    
    // If this is the first template or marked as default, clear any existing defaults
    if (template.isDefault) {
      await clearDefaultTemplates();
    }
    
    // Ensure each field has a valid type
    const validatedFields = Array.isArray(template.fields) ? template.fields.map(field => ({
      ...field,
      name: field.name || '',
      type: field.type || 'text',
      label: field.label || '',
      placeholder: field.placeholder || '',
      required: field.required || false
    })) : [];
    
    console.log("Validated fields to save:", validatedFields);
    
    const docRef = await addDoc(templatesRef, {
      ...template,
      fields: validatedFields,
      userId,
      createdAt: serverTimestamp()
    });
    
    return {
      id: docRef.id,
      ...template,
      fields: validatedFields,
      userId
    };
  } catch (error) {
    console.error("Error adding template:", error);
    throw error;
  }
}

// Update a journal template
export async function updateTemplate(id: string, template: Partial<JournalTemplate> & { isDefault?: boolean }) {
  try {
    if (!auth.currentUser) {
      throw new Error("User must be logged in to update templates");
    }

    console.log("Updating template:", id, template);

    // If this template is being set as default, clear other defaults
    if (template.isDefault) {
      await clearDefaultTemplates();
    }
    
    // Ensure fields are properly formatted if present
    const updatedTemplate = {...template};
    if (template.fields) {
      const validatedFields = Array.isArray(template.fields) ? template.fields.map(field => ({
        ...field,
        name: field.name || '',
        type: field.type || 'text',
        label: field.label || '',
        placeholder: field.placeholder || '',
        required: field.required || false
      })) : [];
      
      console.log("Validated fields for update:", validatedFields);
      updatedTemplate.fields = validatedFields;
    }
    
    const templateRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(templateRef, {
      ...updatedTemplate,
      updatedAt: serverTimestamp()
    });
    
    return {
      id,
      ...updatedTemplate
    };
  } catch (error) {
    console.error("Error updating template:", error);
    throw error;
  }
}

// Delete a journal template
export async function deleteTemplate(id: string) {
  try {
    if (!auth.currentUser) {
      throw new Error("User must be logged in to delete templates");
    }
    
    const templateRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(templateRef);
    
    return { id };
  } catch (error) {
    console.error("Error deleting template:", error);
    throw error;
  }
}

// Get a single template by ID
export async function getTemplate(id: string) {
  try {
    if (!auth.currentUser) {
      throw new Error("User must be logged in to get templates");
    }
    
    console.log("Fetching template with ID:", id);
    
    const templateSnap = await getDocs(query(collection(db, COLLECTION_NAME), where('__name__', '==', id), where('userId', '==', auth.currentUser.uid)));
    
    if (templateSnap.empty) {
      console.error("Template not found or no permission");
      throw new Error("Template not found or you do not have permission to access it");
    }
    
    const data = templateSnap.docs[0].data();
    console.log("Raw template data from Firebase:", data);
    console.log("Template fields from Firebase:", data.fields);
    
    // Ensure fields are correctly formatted
    const parsedFields = Array.isArray(data.fields) ? data.fields : [];
    console.log("Parsed fields:", parsedFields);
    
    return {
      id: templateSnap.docs[0].id,
      name: data.name,
      description: data.description,
      fields: parsedFields,
      userId: data.userId,
      createdAt: data.createdAt,
    } as JournalTemplate;
  } catch (error) {
    console.error("Error getting template:", error);
    throw error;
  }
}

// Get all templates for the current user
export async function getTemplates(): Promise<JournalTemplate[]> {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('You must be logged in to access templates');
    }

    const q = query(templatesRef, where('userId', '==', currentUser.uid));
    const querySnapshot = await getDocs(q);
    
    const templates: JournalTemplate[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      templates.push({
        id: doc.id,
        name: data.name,
        description: data.description,
        fields: data.fields || [],
        userId: data.userId,
        createdAt: data.createdAt,
      });
    });
    
    return templates;
  } catch (error) {
    console.error('Error getting templates:', error);
    throw error;
  }
}

// Get the default template
export async function getDefaultTemplate() {
  try {
    if (!auth.currentUser) {
      throw new Error("User must be logged in to get templates");
    }

    const userId = auth.currentUser.uid;
    
    // Query for the default template
    const q = query(
      templatesRef, 
      where("userId", "==", userId),
      where("isDefault", "==", true)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      // Return the most recently created template if no default exists
      const recentQ = query(
        templatesRef, 
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(1)
      );
      
      const recentSnapshot = await getDocs(recentQ);
      
      if (recentSnapshot.empty) {
        return null;
      }
      
      return {
        id: recentSnapshot.docs[0].id,
        ...recentSnapshot.docs[0].data()
      } as JournalTemplate;
    }
    
    return {
      id: querySnapshot.docs[0].id,
      ...querySnapshot.docs[0].data()
    } as JournalTemplate;
  } catch (error) {
    console.error("Error getting default template:", error);
    throw error;
  }
}

// Clear all default templates
async function clearDefaultTemplates() {
  if (!auth.currentUser) {
    return;
  }

  const userId = auth.currentUser.uid;
  
  const q = query(
    templatesRef, 
    where("userId", "==", userId),
    where("isDefault", "==", true)
  );
  
  const querySnapshot = await getDocs(q);
  
  const updatePromises = querySnapshot.docs.map(doc => 
    updateDoc(doc.ref, { isDefault: false })
  );
  
  await Promise.all(updatePromises);
} 