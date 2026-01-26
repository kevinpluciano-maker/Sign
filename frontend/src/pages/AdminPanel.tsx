import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import ImprovedFooter from '@/components/ImprovedFooter';
import SimpleWYSIWYGEditor from '@/components/admin/SimpleWYSIWYGEditor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Lock, Settings, FileText, Image as ImageIcon, Home, Star, Trash2, Edit2, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import SEO from '@/components/SEO';

interface ContentSection {
  id: string;
  name: string;
  content: string;
  fontSize: string;
  fontFamily: string;
}

const AdminPanel = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sections, setSections] = useState<ContentSection[]>([]);

  // Initialize sections from localStorage or defaults
  useEffect(() => {
    // Simple authentication check (you can enhance this)
    const adminAuth = localStorage.getItem('admin_authenticated');
    if (!adminAuth) {
      toast.error('Please log in to access the admin panel');
      navigate('/login');
      return;
    }

    setIsAuthenticated(true);
    loadSections();
    setIsLoading(false);
  }, [navigate]);

  // Load sections from localStorage
  const loadSections = () => {
    const defaultSections: ContentSection[] = [
      {
        id: 'hero-title',
        name: 'Hero Section Title',
        content: '<h1>Professional Acrylic Braille Signs</h1>',
        fontSize: '48px',
        fontFamily: 'Inter'
      },
      {
        id: 'hero-description',
        name: 'Hero Section Description',
        content: '<p>Professional quality door signs, restroom signs, and custom architectural signage for modern workspaces.</p>',
        fontSize: '20px',
        fontFamily: 'Inter'
      },
      {
        id: 'about-content',
        name: 'About Page Content',
        content: '<p>We specialize in creating high-quality ADA compliant signage solutions.</p>',
        fontSize: '16px',
        fontFamily: 'Inter'
      },
      {
        id: 'footer-description',
        name: 'Footer Description',
        content: '<p>Premium acrylic braille signs and ADA compliant signage solutions.</p>',
        fontSize: '14px',
        fontFamily: 'Inter'
      }
    ];

    // Load from localStorage or use defaults
    const loadedSections = defaultSections.map(section => {
      const saved = localStorage.getItem(`wysiwyg_${section.id}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return {
            ...section,
            content: parsed.content,
            fontSize: parsed.fontSize,
            fontFamily: parsed.fontFamily
          };
        } catch (e) {
          console.error('Error loading section:', section.id, e);
          return section;
        }
      }
      return section;
    });

    setSections(loadedSections);
  };

  // Save section to backend (would be an API call in production)
  const handleSaveSectionToBackend = async (sectionId: string, data: any) => {
    try {
      // In a real application, this would be an API call to save to database
      // For now, we'll save to localStorage
      const section = sections.find(s => s.id === sectionId);
      if (!section) return;

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      // Update the backend (this would be a real API call)
      const backendUrl = import.meta.env.VITE_API_URL || process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      
      try {
        const response = await fetch(`${backendUrl}/api/content/${sectionId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            section_id: sectionId,
            content: data.content,
            font_size: data.fontSize,
            font_family: data.fontFamily,
            plain_text: data.plainText
          })
        });

        if (!response.ok) {
          throw new Error('Failed to save to backend');
        }

        console.log('Saved to backend successfully');
      } catch (apiError) {
        console.warn('Backend API not available, using localStorage only:', apiError);
        // Fallback to localStorage only if backend is not available
      }

      // Update local state
      setSections(prev => prev.map(s => 
        s.id === sectionId 
          ? { ...s, content: data.content, fontSize: data.fontSize, fontFamily: data.fontFamily }
          : s
      ));

      toast.success('Content saved successfully!');
    } catch (error) {
      console.error('Error saving to backend:', error);
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <SEO 
        title="Admin Panel - AB Signs"
        description="Admin panel for managing content"
        noIndex={true}
      />
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">Admin Panel</h1>
                <p className="text-muted-foreground">
                  Manage your website content with the WYSIWYG editor
                </p>
              </div>
              <Lock className="h-8 w-8 text-primary" />
            </div>
          </div>

          <Tabs defaultValue="content" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="content">
                <FileText className="h-4 w-4 mr-2" />
                Content
              </TabsTrigger>
              <TabsTrigger value="homepage">
                <Home className="h-4 w-4 mr-2" />
                Homepage
              </TabsTrigger>
              <TabsTrigger value="images">
                <ImageIcon className="h-4 w-4 mr-2" />
                Images
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Content Management</CardTitle>
                  <CardDescription>
                    Edit text content across your website with rich formatting options
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    {sections.map((section) => (
                      <SimpleWYSIWYGEditor
                        key={section.id}
                        sectionId={section.id}
                        sectionName={section.name}
                        initialContent={section.content}
                        initialFontSize={section.fontSize}
                        initialFontFamily={section.fontFamily}
                        onSave={(data) => handleSaveSectionToBackend(section.id, data)}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="homepage" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Homepage Sections</CardTitle>
                  <CardDescription>
                    Edit homepage specific content
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    {sections.filter(s => s.id.includes('hero')).map((section) => (
                      <SimpleWYSIWYGEditor
                        key={section.id}
                        sectionId={section.id}
                        sectionName={section.name}
                        initialContent={section.content}
                        initialFontSize={section.fontSize}
                        initialFontFamily={section.fontFamily}
                        onSave={(data) => handleSaveSectionToBackend(section.id, data)}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="images" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Image Management</CardTitle>
                  <CardDescription>
                    Upload and manage images (Coming soon)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Image management features will be available soon.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>
                    Configure global website settings (Coming soon)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">General settings will be available soon.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>

        <ImprovedFooter />
      </div>
    </>
  );
};

export default AdminPanel;
