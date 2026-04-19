/**
 * [REFACTORED] EditorContext now serves ONLY as read-only config source
 * for header/footer components. All legacy edit-mode / localStorage / section
 * reorder / publish functionality is removed. Content management happens
 * exclusively via the new /admin route (persisted to MongoDB).
 */
import React, { createContext, useContext } from 'react';

interface EditorData {
  sections: Array<{ id: string; title: string; content: string; order: number; visible?: boolean }>;
  productData: Record<string, any>;
  headerData: {
    phone: string;
    email: string;
    businessHours: string;
    topBarText: string;
    quickLinks: string;
    logo?: string;
  };
  footerData: {
    companyName: string;
    companyDescription: string;
    phone: string;
    email: string;
    businessHours: string;
    year: string;
    newsletter?: { title: string; description: string };
  };
}

interface EditorContextType {
  isEditing: boolean;
  isPreviewing: boolean;
  sections: EditorData['sections'];
  productData: EditorData['productData'];
  headerData: EditorData['headerData'];
  footerData: EditorData['footerData'];
  // All mutators are no-ops — the legacy admin is fully deprecated.
  toggleEditing: () => void;
  togglePreviewing: () => void;
  updateSections: (sections: EditorData['sections']) => void;
  updateSectionOrder: (sections: EditorData['sections']) => void;
  toggleSectionVisibility: (id: string) => void;
  updateProductData: (data: Record<string, any>) => void;
  updateHeaderData: (data: Partial<EditorData['headerData']>) => void;
  updateFooterData: (data: Partial<EditorData['footerData']>) => void;
  saveChanges: () => Promise<void>;
  publishChanges: () => Promise<void>;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

const sections: EditorData['sections'] = [
  { id: 'header', title: 'Header', content: '', order: 1, visible: true },
  { id: 'navigation', title: 'Navigation', content: '', order: 2, visible: true },
  { id: 'hero', title: 'Hero Section', content: '', order: 3, visible: true },
  { id: 'featured-products', title: 'Featured Products', content: '', order: 4, visible: true },
  { id: 'features', title: 'Features', content: '', order: 5, visible: true },
  { id: 'footer', title: 'Footer', content: '', order: 6, visible: true },
];

const headerData: EditorData['headerData'] = {
  phone: '+1 (647) 278-2905',
  email: 'acrylicbraillesigns@gmail.com',
  businessHours: '7:00 AM - 4:00 PM EST',
  topBarText: 'Nationwide ADA Compliance - Expert Braille Signage - Premium Quality Guarantee',
  quickLinks: 'ADA Guides | Braille Signs | Custom Projects',
};

const footerData: EditorData['footerData'] = {
  companyName: 'Acrylic Braille Signs',
  companyDescription:
    'Professional ADA compliant acrylic braille signage solutions for offices, hospitals, and commercial spaces. Quality guaranteed with Canada & USA service.',
  phone: '+1 (647) 278-2905',
  email: 'acrylicbraillesigns@gmail.com',
  businessHours: 'Business Hours: 7:00 AM - 4:00 PM EST',
  year: '2025',
  newsletter: {
    title: 'Stay Updated',
    description: 'Get the latest on new products and special offers.',
  },
};

const noop = () => {};
const noopAsync = async () => {};

export const EditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const value: EditorContextType = {
    isEditing: false,
    isPreviewing: false,
    sections,
    productData: {},
    headerData,
    footerData,
    toggleEditing: noop,
    togglePreviewing: noop,
    updateSections: noop,
    updateSectionOrder: noop,
    toggleSectionVisibility: noop,
    updateProductData: noop,
    updateHeaderData: noop,
    updateFooterData: noop,
    saveChanges: noopAsync,
    publishChanges: noopAsync,
  };
  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
};

export const useEditor = () => {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error('useEditor must be used within EditorProvider');
  return ctx;
};
