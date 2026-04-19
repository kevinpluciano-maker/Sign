import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Ruler, Mail, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CustomSizeRequestProps {
  productName: string;
}

const CustomSizeRequest = ({ productName }: CustomSizeRequestProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: "",
    width: "",
    height: "",
    units: "inches",
    quantity: "",
    email: "",
    phone: "",
    notes: ""
  });
  const { toast } = useToast();

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
    
    // Dimensions validation
    if (!formData.width || parseFloat(formData.width) <= 0) {
      newErrors.width = 'Width is required';
    }
    if (!formData.height || parseFloat(formData.height) <= 0) {
      newErrors.height = 'Height is required';
    }
    
    // Quantity validation
    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      newErrors.quantity = 'Quantity is required';
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
      const quoteData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || 'Not provided',
        subject: `Custom Quote Request from ${formData.name}`,
        message: `Product: ${productName}\n\nCustom Size Request:\nWidth: ${formData.width} ${formData.units}\nHeight: ${formData.height} ${formData.units}\nQuantity: ${formData.quantity}\n\nAdditional Notes:\n${formData.notes || 'None'}`
      };

      // Backend URL - use env variable or fallback to Emergent backend
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 
                         import.meta.env.REACT_APP_BACKEND_URL || 
                         'https://checkout-flow-176.preview.emergentagent.com';

      const response = await fetch(
        `${backendUrl}/api/contact`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(quoteData),
        }
      );

      if (response.ok) {
        toast({
          title: "Quote Request Submitted",
          description: "We'll send you a custom quote within 24 hours.",
        });
        
        setIsOpen(false);
        setFormData({
          name: "",
          width: "",
          height: "",
          units: "inches",
          quantity: "",
          email: "",
          phone: "",
          notes: ""
        });
        setErrors({});
      } else {
        throw new Error('Failed to submit quote request');
      }
    } catch (error) {
      console.error('Error submitting quote request:', error);
      toast({
        title: "Submission Failed",
        description: "Please try again or email us directly at acrylicbraillesigns@gmail.com",
        variant: "destructive"
      });
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Ruler className="h-4 w-4 mr-2" />
          Request Custom Size Quote
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Request Custom Size Quote</DialogTitle>
          <DialogDescription>
            Get a personalized quote for {productName} in your custom dimensions.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Your Name *</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Smith"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              required
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.name}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                required
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.email}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="width">Width *</Label>
              <Input
                id="width"
                type="number"
                step="0.1"
                placeholder="e.g., 15"
                value={formData.width}
                onChange={(e) => handleInputChange("width", e.target.value)}
                required
                className={errors.width ? 'border-red-500' : ''}
              />
              {errors.width && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.width}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="height">Height *</Label>
              <Input
                id="height"
                type="number"
                step="0.1"
                placeholder="e.g., 8"
                value={formData.height}
                onChange={(e) => handleInputChange("height", e.target.value)}
                required
                className={errors.height ? 'border-red-500' : ''}
              />
              {errors.height && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.height}
                </p>
              )}
            </div>
          </div>
          
          <div>
            <Label htmlFor="units">Units</Label>
            <select
              id="units"
              className="w-full p-2 border border-border rounded-md bg-background"
              value={formData.units}
              onChange={(e) => handleInputChange("units", e.target.value)}
            >
              <option value="inches">Inches</option>
              <option value="mm">Millimeters</option>
              <option value="cm">Centimeters</option>
            </select>
          </div>

          <div>
            <Label htmlFor="quantity">Quantity *</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              placeholder="e.g., 10"
              value={formData.quantity}
              onChange={(e) => handleInputChange("quantity", e.target.value)}
              required
              className={errors.quantity ? 'border-red-500' : ''}
            />
            {errors.quantity && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.quantity}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any special requirements or questions..."
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="flex-1" disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              <Mail className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Submitting...' : 'Request Quote'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CustomSizeRequest;