import SEO from "@/components/SEO";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, MapPin, Clock, Send, MessageCircle, Headphones, Star } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";

const Contact = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Backend URL - use env variable or fallback to Emergent backend
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 
                         import.meta.env.REACT_APP_BACKEND_URL || 
                         'https://codebrowser-1.preview.emergentagent.com';

      const response = await fetch(`${backendUrl}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          phone: formData.phone,
          subject: formData.subject || `Contact from ${formData.company || 'website'}`,
          message: formData.message
        }),
      });

      if (response.ok) {
        toast({
          title: "Message Sent!",
          description: "Thank you for contacting us. We'll get back to you within 24 hours.",
        });
        // Reset form
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          company: '',
          subject: '',
          message: ''
        });
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again or email us directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SEO 
        title="Contact Us - Professional Signage Solutions | Signassist"
        description="Get in touch with Acrylic Braille Signs for premium architectural signage, door numbers, and ADA-compliant signs. Expert consultation and Canada & USA service available."
        keywords="contact signage company, professional signs quote, ADA compliance consultation, architectural signage support"
      />
      
      {/* Luxury Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(30,41,59,0.9) 50%, rgba(15,23,42,0.95) 100%)',
          }}
        />
        <div className="absolute inset-0 opacity-10">
          <div 
            className="w-full h-full"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M40 40L50 30L60 40L50 50z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: '80px 80px'
            }}
          />
        </div>
        
        <div className="relative z-10 container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center text-white">
            <Badge 
              className="mb-6 px-6 py-2 text-sm font-semibold"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.1))',
                border: '1px solid rgba(255,255,255,0.2)',
                color: 'white',
                backdropFilter: 'blur(10px)'
              }}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Let's Connect
            </Badge>
            
            <h1 
              className="text-5xl md:text-6xl lg:text-7xl font-black mb-8 leading-tight"
              style={{
                fontFamily: '"Inter", "SF Pro Display", system-ui, sans-serif',
                letterSpacing: '-0.02em',
                textShadow: '0 4px 20px rgba(0,0,0,0.5)',
                background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Contact Us
            </h1>
            
            <p 
              className="text-xl md:text-2xl text-white/90 mb-12 leading-relaxed max-w-3xl mx-auto"
              style={{
                fontFamily: '"Inter", system-ui, sans-serif',
                fontWeight: '400',
                letterSpacing: '0.01em',
                textShadow: '0 2px 10px rgba(0,0,0,0.3)'
              }}
            >
              Ready to elevate your space with premium signage? Our expert team is here to bring your vision to life.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Information & Form Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Contact Information */}
            <div className="lg:col-span-1">
              <Badge 
                className="mb-6 px-4 py-2"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  color: 'white',
                  border: 'none'
                }}
              >
                <Headphones className="w-4 h-4 mr-2" />
                Get In Touch
              </Badge>
              
              <h2 
                className="text-3xl md:text-4xl font-black mb-8 text-gray-900"
                style={{
                  fontFamily: '"Inter", system-ui, sans-serif',
                  letterSpacing: '-0.01em'
                }}
              >
                We're Here to Help
              </h2>
              
              <div className="space-y-6">
                {[
                  {
                    icon: <Phone className="w-6 h-6" />,
                    title: "Phone",
                    info: "+1 (647) 278-2905",
                    subtitle: "Mon - Fri, 7:00 AM - 4:00 PM EST",
                    gradient: "from-blue-500 to-indigo-600"
                  },
                  {
                    icon: <Mail className="w-6 h-6" />,
                    title: "Email",
                    info: "info@signassist.com",
                    subtitle: "We respond within 24 hours",
                    gradient: "from-purple-500 to-pink-600"
                  },
                  {
                    icon: <MapPin className="w-6 h-6" />,
                    title: "Headquarters",
                    info: "Los Angeles, CA",
                    subtitle: "Canada & USA service available",
                    gradient: "from-green-500 to-teal-600"
                  },
                  {
                    icon: <Clock className="w-6 h-6" />,
                    title: "Business Hours",
                    info: "7:00 AM - 4:00 PM EST",
                    subtitle: "Monday through Friday",
                    gradient: "from-orange-500 to-red-600"
                  }
                ].map((contact, index) => (
                  <Card 
                    key={index}
                    className="p-6 border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.7))',
                      backdropFilter: 'blur(20px)'
                    }}
                  >
                    <CardContent className="p-0 flex items-start space-x-4">
                      <div 
                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${contact.gradient} flex items-center justify-center text-white flex-shrink-0`}
                      >
                        {contact.icon}
                      </div>
                      <div>
                        <h3 
                          className="text-lg font-bold text-gray-900 mb-1"
                          style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
                        >
                          {contact.title}
                        </h3>
                        <p className="text-gray-800 font-semibold">{contact.info}</p>
                        <p className="text-gray-600 text-sm">{contact.subtitle}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card 
                className="p-8 border-0 shadow-2xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(248,250,252,0.9))',
                  backdropFilter: 'blur(20px)'
                }}
              >
                <CardHeader className="p-0 mb-8">
                  <div className="flex items-center space-x-3 mb-4">
                    <div 
                      className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white"
                    >
                      <Send className="w-6 h-6" />
                    </div>
                    <CardTitle 
                      className="text-3xl font-black text-gray-900"
                      style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
                    >
                      Send Us a Message
                    </CardTitle>
                  </div>
                  <p className="text-gray-600 text-lg">
                    Tell us about your project and we'll provide a personalized consultation and quote within 24 hours.
                  </p>
                </CardHeader>
                
                <CardContent className="p-0">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          First Name *
                        </label>
                        <Input 
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          placeholder="John"
                          required
                          className="h-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                          style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Last Name *
                        </label>
                        <Input 
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          placeholder="Doe"
                          required
                          className="h-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                          style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
                        />
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Email Address *
                        </label>
                        <Input 
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="john@company.com"
                          required
                          className="h-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                          style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Phone Number
                        </label>
                        <Input 
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="+1 (555) 123-4567"
                          className="h-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                          style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Company Name
                      </label>
                      <Input 
                        name="company"
                        value={formData.company}
                        onChange={handleInputChange}
                        placeholder="Your Company"
                        className="h-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                        style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Subject
                      </label>
                      <Input 
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        placeholder="What can we help you with?"
                        className="h-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                        style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Project Details *
                      </label>
                      <Textarea 
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        placeholder="Tell us about your signage needs, project scope, timeline, and any specific requirements..."
                        rows={6}
                        required
                        className="border-2 border-gray-200 focus:border-blue-500 rounded-xl resize-none"
                        style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
                      />
                    </div>
                    
                    <Button 
                      type="submit"
                      size="lg"
                      disabled={isSubmitting}
                      className="w-full py-4 text-lg font-bold transition-all duration-300 hover:scale-[1.02]"
                      style={{
                        background: isSubmitting ? '#9ca3af' : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                        borderRadius: '12px',
                        boxShadow: '0 10px 25px rgba(59,130,246,0.3)',
                        fontFamily: '"Inter", system-ui, sans-serif',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase'
                      }}
                    >
                      <Send className="w-5 h-5 mr-2" />
                      {isSubmitting ? 'Sending...' : 'Send Message'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Premium Features Section */}
      <section 
        className="py-20"
        style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
        }}
      >
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <Badge 
              className="mb-6 px-4 py-2"
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white',
                border: 'none'
              }}
            >
              <Star className="w-4 h-4 mr-2" />
              Why Choose Us
            </Badge>
            
            <h2 
              className="text-4xl md:text-5xl font-black mb-6 text-gray-900"
              style={{
                fontFamily: '"Inter", system-ui, sans-serif',
                letterSpacing: '-0.01em'
              }}
            >
              Premium Service Guarantee
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "24-Hour Response",
                description: "Fast, professional responses to all inquiries within one business day.",
                icon: "⚡"
              },
              {
                title: "Expert Consultation",
                description: "Free design consultation with our signage specialists and ADA compliance experts.",
                icon: "🎯"
              },
              {
                title: "Canada & USA Service",
                description: "Professional delivery and support throughout Canada and the United States.",
                icon: "🌍"
              }
            ].map((feature, index) => (
              <Card 
                key={index}
                className="p-8 border-0 shadow-lg text-center hover:shadow-xl transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.7))',
                  backdropFilter: 'blur(20px)'
                }}
              >
                <CardContent className="p-0">
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 
                    className="text-xl font-bold mb-4 text-gray-900"
                    style={{ fontFamily: '"Inter", system-ui, sans-serif' }}
                  >
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default Contact;