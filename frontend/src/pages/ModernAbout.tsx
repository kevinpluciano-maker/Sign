import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Award, 
  Users, 
  Globe, 
  Zap, 
  Target, 
  Lightbulb, 
  Shield, 
  Star,
  ArrowRight,
  CheckCircle,
  TrendingUp,
  Heart,
  Sparkles
} from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import ImprovedNavigation from "@/components/ImprovedNavigation";
import ImprovedFooter from "@/components/ImprovedFooter";

const ModernAbout = () => {
  const stats = [
    { icon: Users, label: "ADA Projects Completed", value: "10,000+", color: "from-cyan-500 to-blue-500" },
    { icon: Globe, label: "States Served", value: "50+", color: "from-green-500 to-emerald-500" },
    { icon: Award, label: "Years ADA Expertise", value: "15+", color: "from-blue-500 to-purple-500" },
    { icon: Star, label: "Client Satisfaction", value: "99.8%", color: "from-cyan-400 to-teal-500" }
  ];

  const values = [
    {
      icon: Target,
      title: "ADA Compliance Excellence",
      description: "Every braille sign is crafted to exceed ADA requirements with precise raised braille, proper contrast ratios, and perfect mounting specifications.",
      color: "from-cyan-500 to-blue-600"
    },
    {
      icon: Lightbulb,
      title: "Premium Acrylic Innovation",
      description: "We use the highest quality acrylic materials with advanced tactile braille technology, ensuring durability and accessibility.",
      color: "from-green-500 to-teal-500"
    },
    {
      icon: Shield,
      title: "100% ADA Guarantee",
      description: "Lifetime warranty on ADA compliance. Every sign is inspected and certified to meet all federal accessibility requirements.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Heart,
      title: "Customer Obsessed",
      description: "Your success is our success. We go above and beyond to exceed expectations on every project.",
      color: "from-red-500 to-rose-500"
    }
  ];

  const timeline = [
    {
      year: "2008",
      title: "Founded with ADA Focus",
      description: "Started as specialists in ADA compliant braille signage, recognizing the critical need for accessible environments."
    },
    {
      year: "2011", 
      title: "Acrylic Braille Innovation",
      description: "Pioneered premium acrylic braille signage with superior tactile quality and durability."
    },
    {
      year: "2014",
      title: "Nationwide ADA Expertise",
      description: "Expanded to serve all 50 states, becoming the trusted ADA compliance partner for major facilities."
    },
    {
      year: "2017",
      title: "Advanced Braille Technology",
      description: "Introduced precision CNC machining for perfect Grade 2 braille dots and consistent tactile quality."
    },
    {
      year: "2020",
      title: "Digital ADA Consultation",
      description: "Launched virtual ADA assessments and remote compliance verification services."
    },
    {
      year: "2024",
      title: "AI-Powered ADA Compliance",
      description: "Implemented AI-assisted design verification to ensure 100% ADA compliance on every project."
    }
  ];

  const team = [
    {
      name: "Sarah Chen",
      role: "Founder & ADA Expert",
      bio: "15+ years specializing in ADA compliance, former accessibility consultant for Fortune 500 companies.",
      image: "👩‍💼"
    },
    {
      name: "Marcus Rodriguez", 
      role: "Braille Production Director",
      bio: "Master craftsman with 20+ years in precision braille manufacturing and tactile signage.",
      image: "👨‍🔧"
    },
    {
      name: "Dr. Emily Watson",
      role: "ADA Compliance Director",
      bio: "PhD in Accessibility Design, published researcher in braille standards and inclusive environments.",
      image: "👩‍🎓"
    },
    {
      name: "James Park",
      role: "Client Success Manager",
      bio: "ADA project specialist ensuring seamless compliance for healthcare, education, and commercial facilities.",
      image: "👨‍💼"
    }
  ];

  return (
    <>
      <SEO
        title="About Us | ADA Compliance Experts | Acrylic Braille Signs"
        description="Discover our 15+ year journey specializing in ADA compliant acrylic braille signage. Award-winning accessibility solutions, nationwide service, and 100% compliance guarantee."
        canonical="/about"
        type="website"
      />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-cyan-50">
        <Header />
        <ImprovedNavigation />
        
        {/* Streamlined Hero Section */}
        <div className="relative overflow-hidden py-12">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/10 to-blue-500/10"></div>
          <div className="container mx-auto px-4 relative">
            <div className="max-w-3xl mx-auto text-center">
              <Badge className="mb-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-0 px-6 py-2 text-sm font-semibold">
                <Sparkles className="h-4 w-4 mr-2" />
                ADA SPECIALISTS SINCE 2008
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                Leading
                <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
                  {" "}ADA Braille Signage
                </span>
              </h1>
              <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
                For over 15 years, we've been creating accessible environments with premium acrylic braille signage that exceeds ADA requirements. Serving Canada & USA with professional installation and support.
              </p>
            </div>
          </div>
        </div>

        {/* Streamlined Stats Section */}
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
            {stats.map((stat, index) => (
              <Card key={index} className="bg-white border border-gray-200 shadow-md text-center hover:scale-105 transition-all duration-300 rounded-xl">
                <CardContent className="p-4">
                  <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-full flex items-center justify-center mx-auto mb-3`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
                  <div className="text-gray-600 text-sm font-medium">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Streamlined Mission Statement */}
          <div className="max-w-3xl mx-auto mb-16">
            <Card className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 shadow-lg rounded-2xl">
              <CardContent className="p-8 text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Our ADA Mission</h2>
                <p className="text-lg text-gray-700 leading-relaxed">
                  To create truly accessible environments through superior ADA compliant acrylic braille signage. We believe accessibility should never compromise design.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Values Section */}
          <div className="mb-20">
            <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 shadow-2xl rounded-3xl">
              <CardContent className="p-12">
                <div className="text-center mb-12">
                  <h2 className="text-4xl font-bold text-white mb-4">What Drives Us</h2>
                  <p className="text-xl text-slate-300">The core values that guide every decision we make</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {values.map((value, index) => (
                    <Card key={index} className="bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/15 transition-all duration-300">
                      <CardContent className="p-8">
                        <div className={`w-14 h-14 bg-gradient-to-r ${value.color} rounded-lg flex items-center justify-center mb-6`}>
                          <value.icon className="h-7 w-7 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-4">{value.title}</h3>
                        <p className="text-slate-300 leading-relaxed">{value.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Timeline Section */}
          <div className="mb-20">
            <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 shadow-2xl rounded-3xl">
              <CardContent className="p-12">
                <div className="text-center mb-12">
                  <h2 className="text-4xl font-bold text-white mb-4">Our Journey</h2>
                  <p className="text-xl text-slate-300">Milestones that shaped our company</p>
                </div>
                
                <div className="max-w-4xl mx-auto">
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 to-purple-500"></div>
                    
                    <div className="space-y-8">
                      {timeline.map((item, index) => (
                        <div key={index} className="relative flex items-start gap-8">
                          <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg z-10">
                            {item.year.slice(-2)}
                          </div>
                          <Card className="flex-1 bg-white/10 backdrop-blur-lg border-white/20">
                            <CardContent className="p-6">
                              <div className="flex items-center gap-4 mb-3">
                                <span className="text-2xl font-bold text-white">{item.year}</span>
                                <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
                                  {item.title}
                                </Badge>
                              </div>
                              <p className="text-slate-300">{item.description}</p>
                            </CardContent>
                          </Card>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Team Section */}
          <div className="mb-20">
            <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 shadow-2xl rounded-3xl">
              <CardContent className="p-12">
                <div className="text-center mb-12">
                  <h2 className="text-4xl font-bold text-white mb-4">Meet Our Experts</h2>
                  <p className="text-xl text-slate-300">The passionate team behind every perfect sign</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {team.map((member, index) => (
                    <Card key={index} className="bg-white/10 backdrop-blur-lg border-white/20 text-center hover:scale-105 transition-transform duration-300">
                      <CardContent className="p-6">
                        <div className="text-6xl mb-4">{member.image}</div>
                        <h3 className="text-xl font-bold text-white mb-2">{member.name}</h3>
                        <Badge className="mb-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
                          {member.role}
                        </Badge>
                        <p className="text-sm text-slate-300">{member.bio}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Certifications & Awards */}
          <div className="mb-20">
            <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 shadow-2xl rounded-3xl">
              <CardContent className="p-12">
                <h2 className="text-4xl font-bold text-white text-center mb-8">Recognition & Certifications</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Award className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">ADA Certified</h3>
                    <p className="text-slate-300">Official ADA compliance certification for accessibility design</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Shield className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">ISO 9001</h3>
                    <p className="text-slate-300">International quality management system certification</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <TrendingUp className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Industry Leader</h3>
                    <p className="text-slate-300">Recognized as top 10 signage company in Canada & USA</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 shadow-2xl rounded-3xl">
              <CardContent className="p-12">
                <h2 className="text-4xl font-bold text-white mb-6">Ready to Create Something Amazing?</h2>
                <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
                  Join thousands of satisfied clients who trust us with their most important signage projects. Let's bring your vision to life.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Link to="/contact">
                    <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-4">
                      Start Your Project
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </Button>
                  </Link>
                  <Link to="/products">
                    <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 text-lg px-8 py-4">
                      View Our Work
                    </Button>
                  </Link>
                </div>
                
                <div className="flex flex-wrap justify-center gap-6 mt-8 pt-8 border-t border-white/20">
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <span>Free consultation</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <span>24-hour quotes</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <span>Canada & USA service</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                    <span>100% ADA compliant</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <ImprovedFooter />
      </div>
    </>
  );
};

export default ModernAbout;