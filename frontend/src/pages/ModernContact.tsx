import SEO from "@/components/SEO";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Send, 
  MessageCircle, 
  Zap,
  Globe,
  Shield,
  Star,
  ArrowRight,
  CheckCircle,
  Upload,
  AlertCircle
} from "lucide-react";
import Header from "@/components/Header";
import ImprovedNavigation from "@/components/ImprovedNavigation";
import ImprovedFooter from "@/components/ImprovedFooter";
import { useNavigate } from "react-router-dom";

const ModernContact = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    subject: 'General Inquiry',
    message: '',
    urgency: 'standard',
    budget: '',
    source: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Message validation
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }
    
    // File size validation (max 5MB)
    if (selectedFile && selectedFile.size > 5 * 1024 * 1024) {
      newErrors.file = 'File size must be less than 5MB';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const contactData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || 'Not provided',
        subject: formData.subject,
        message: formData.message,
        company: formData.company || 'Not provided',
        urgency: formData.urgency,
        budget: formData.budget || 'Not specified',
        source: formData.source || 'Website contact form'
      };

      // Backend URL - use env variable or fallback to Emergent backend
      const backendUrl = (await import('@/config/api')).BACKEND_URL;
      console.log('Submitting contact form to:', backendUrl);

      const response = await fetch(
        `${backendUrl}/api/contact`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(contactData),
        }
      );

      console.log('Response status:', response.status);
      const responseData = await response.json();
      console.log('Response data:', responseData);

      if (response.ok) {
        setIsSubmitted(true);
      } else {
        throw new Error(responseData.detail || 'Failed to submit contact form');
      }
    } catch (error) {
      console.error('Error submitting contact form:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to submit contact form: ${errorMessage}\n\nPlease try again or email us directly at acrylicbraillesigns@gmail.com`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, file: 'File size must be less than 5MB' }));
        return;
      }
      setSelectedFile(file);
      setErrors(prev => ({ ...prev, file: '' }));
    }
  };

  if (isSubmitted) {
    return (
      <>
        <SEO
          title="Thank You | Contact Submitted | AB Signs"
          description="Thank you for contacting us. We'll get back to you within 24 hours."
          canonical="/contact"
          type="website"
        />
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-cyan-50">
          <Header />
          <ImprovedNavigation />
          
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-3xl mx-auto">
              {/* Success Icon and Message */}
              <div className="text-center mb-12">
                <div className="w-24 h-24 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <CheckCircle className="h-14 w-14 text-white" />
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                  Message Sent Successfully!
                </h1>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Thank you for reaching out. Our team will review your project details and respond within 24 hours.
                </p>
              </div>
              
              {/* Info Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <Card className="bg-white border-2 border-cyan-100 hover:border-cyan-300 transition-colors shadow-sm">
                  <CardContent className="p-6">
                    <div className="text-sm font-semibold text-cyan-600 mb-2">Reference ID</div>
                    <div className="font-mono text-xl font-bold text-gray-900">BSG-{Date.now().toString().slice(-6)}</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-white border-2 border-cyan-100 hover:border-cyan-300 transition-colors shadow-sm">
                  <CardContent className="p-6">
                    <div className="text-sm font-semibold text-cyan-600 mb-2">Expected Response</div>
                    <div className="text-xl font-bold text-gray-900">Within 24 hours</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-white border-2 border-cyan-100 hover:border-cyan-300 transition-colors shadow-sm">
                  <CardContent className="p-6">
                    <div className="text-sm font-semibold text-cyan-600 mb-2">Project Type</div>
                    <div className="text-xl font-bold text-gray-900 capitalize">{formData.urgency} Priority</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-white border-2 border-cyan-100 hover:border-cyan-300 transition-colors shadow-sm">
                  <CardContent className="p-6">
                    <div className="text-sm font-semibold text-cyan-600 mb-2">Next Steps</div>
                    <div className="text-xl font-bold text-gray-900">Quote & Timeline</div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-2 border-cyan-600 text-cyan-600 hover:bg-cyan-50 font-semibold"
                  onClick={() => navigate('/products')}
                >
                  View Our Portfolio
                </Button>
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold shadow-lg"
                  onClick={() => navigate('/products')}
                >
                  Continue Shopping
                </Button>
              </div>
            </div>
          </div>
          
          <ImprovedFooter />
        </div>
      </>
    );
  }

  return (
    <>
      <SEO
        title="Contact Us | Professional ADA Compliant Braille Signs | Acrylic Braille Signs"
        description="Get in touch with our ADA compliance experts for custom acrylic braille signage quotes, project consultation, and professional support. Available 24/7 for urgent projects."
        canonical="/contact"
        type="website"
      />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-cyan-50">
        <Header />
        <ImprovedNavigation />{" "}

        {/* Streamlined Hero Section - Smaller, Cleaner */}
        <div className="relative overflow-hidden py-12">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/10 to-blue-500/10"></div>
          <div className="container mx-auto px-4 relative">
            <div className="max-w-3xl mx-auto text-center">
              <Badge className="mb-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-0 px-6 py-2 text-sm font-semibold">
                <Zap className="h-4 w-4 mr-2" />
                ADA EXPERTS AVAILABLE
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                Get Your Custom
                <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
                  {" "}Braille Quote
                </span>
              </h1>
              <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
                Professional ADA compliant signage consultation and rapid delivery.
              </p>
              
              <div className="flex flex-wrap justify-center gap-3 mb-8">
                <div className="flex items-center gap-2 bg-white shadow-md px-4 py-2 rounded-xl text-gray-700 text-sm">
                  <Clock className="h-4 w-4 text-green-500" />
                  <span className="font-medium">24hr Response</span>
                </div>
                <div className="flex items-center gap-2 bg-white shadow-md px-4 py-2 rounded-xl text-gray-700 text-sm">
                  <Shield className="h-4 w-4 text-cyan-500" />
                  <span className="font-medium">ADA Compliant</span>
                </div>
                <div className="flex items-center gap-2 bg-white shadow-md px-4 py-2 rounded-xl text-gray-700 text-sm">
                  <Globe className="h-4 w-4 text-blue-500" />
                  <span className="font-medium">Nationwide</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Streamlined Contact Form */}
            <Card className="bg-white shadow-lg border border-gray-200 rounded-2xl">
              <CardContent className="p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Start Your Project</h2>
                  <p className="text-gray-600">
                    Tell us about your braille signage needs and get a custom quote within 24 hours.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name" className="text-gray-900 mb-2 block font-semibold">
                        Full Name *
                      </Label>
                      <Input
                        id="name"
                        required
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className={`bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-cyan-500 focus:ring-cyan-500 h-10 ${errors.name ? 'border-red-500' : ''}`}
                        placeholder="John Smith"
                      />
                      {errors.name && (
                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.name}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-gray-900 mb-2 block font-semibold">
                        Email Address *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-cyan-500 focus:ring-cyan-500 h-10 ${errors.email ? 'border-red-500' : ''}`}
                        placeholder="john@company.com"
                      />
                      {errors.email && (
                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.email}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone" className="text-gray-900 mb-2 block font-semibold">
                        Phone Number
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-cyan-500 focus:ring-cyan-500 h-10"
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    <div>
                      <Label htmlFor="company" className="text-gray-900 mb-2 block font-semibold">
                        Company Name
                      </Label>
                      <Input
                        id="company"
                        value={formData.company}
                        onChange={(e) => handleInputChange('company', e.target.value)}
                        className="bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-cyan-500 focus:ring-cyan-500 h-10"
                        placeholder="Your Company"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="message" className="text-gray-900 mb-2 block font-semibold">
                      Your Message *
                    </Label>
                    <Textarea
                      id="message"
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      className={`bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:border-cyan-500 focus:ring-cyan-500 min-h-[120px] ${errors.message ? 'border-red-500' : ''}`}
                      placeholder="Tell us about your project, questions, or requirements..."
                    />
                    {errors.message && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="file" className="text-gray-900 mb-2 block font-semibold">
                      Attach File (Optional)
                    </Label>
                    <div className="relative">
                      <Input
                        id="file"
                        type="file"
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                        className="bg-gray-50 border-gray-300 text-gray-900 focus:border-cyan-500 focus:ring-cyan-500 h-10"
                      />
                      {selectedFile && (
                        <p className="text-sm text-gray-600 mt-2 flex items-center gap-2">
                          <Upload className="h-4 w-4 text-cyan-600" />
                          {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)
                        </p>
                      )}
                      {errors.file && (
                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.file}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Max file size: 5MB. Formats: PDF, DOC, DOCX, JPG, PNG, GIF</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="urgency" className="text-gray-900 mb-2 block font-semibold">
                        Project Timeline
                      </Label>
                      <select
                        id="urgency"
                        value={formData.urgency}
                        onChange={(e) => handleInputChange('urgency', e.target.value)}
                        className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-md px-3 py-3 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      >
                        <option value="standard" className="text-gray-900">Standard (2-3 weeks)</option>
                        <option value="expedited" className="text-gray-900">Expedited (1 week)</option>
                        <option value="rush" className="text-gray-900">Rush (3-5 days)</option>
                        <option value="emergency" className="text-gray-900">Emergency (24-48 hours)</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="budget" className="text-gray-900 mb-2 block font-semibold">
                        Budget Range
                      </Label>
                      <select
                        id="budget"
                        value={formData.budget}
                        onChange={(e) => handleInputChange('budget', e.target.value)}
                        className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-md px-3 py-3 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      >
                        <option value="" className="text-gray-900">Select budget</option>
                        <option value="under-500" className="text-gray-900">Under $500</option>
                        <option value="500-1000" className="text-gray-900">$500 - $1,000</option>
                        <option value="1000-5000" className="text-gray-900">$1,000 - $5,000</option>
                        <option value="5000-10000" className="text-gray-900">$5,000 - $10,000</option>
                        <option value="over-10000" className="text-gray-900">Over $10,000</option>
                      </select>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white py-6 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 rounded-xl"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>Processing Your Request...</>
                    ) : (
                      <>
                        <Send className="h-5 w-5 mr-2" />
                        Get Your ADA Compliant Quote
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Streamlined Contact Information */}
            <div className="space-y-6">
              {/* Contact Methods - Compact */}
              <Card className="bg-white shadow-lg border border-gray-200 rounded-2xl">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Contact Our Team</h3>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg">
                        <Phone className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h4 className="text-gray-900 font-semibold">Call Our Specialists</h4>
                        <p className="text-cyan-600 font-semibold">+1 (647) 278-2905</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg">
                        <Mail className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h4 className="text-gray-900 font-semibold">Email Our Team</h4>
                        <p className="text-cyan-600 font-semibold">acrylicbraillesigns@gmail.com</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Business Hours - Compact */}
              <Card className="bg-white shadow-lg border border-gray-200 rounded-2xl">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-cyan-500" />
                    Business Hours
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Monday - Friday</span>
                      <span className="text-gray-900 font-semibold">7:00 AM - 4:00 PM EST</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Saturday</span>
                      <span className="text-gray-900 font-semibold">9:00 AM - 2:00 PM EST</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sunday</span>
                      <span className="text-gray-400">Closed</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Why Choose Us - Compact */}
              <Card className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-2xl">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Why Choose Us?</h3>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-gray-800">15+ years ADA expertise</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-gray-800">100% ADA compliant</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-gray-800">Free consultation</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-gray-800">Fast shipping</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        
        <ImprovedFooter />
      </div>
    </>
  );
};

export default ModernContact;