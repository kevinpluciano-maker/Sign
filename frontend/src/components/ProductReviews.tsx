import { useState, useEffect } from "react";
import { Star, ThumbsUp, CheckCircle, MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  verified: boolean;
  title: string;
  content: string;
  helpful: number;
}

interface ProductReviewsProps {
  productId: string;
  productName: string;
}

const ProductReviews = ({ 
  productId, 
  productName
}: ProductReviewsProps) => {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 0,
    title: "",
    content: "",
    author: "",
    email: ""
  });
  const [hoverRating, setHoverRating] = useState(0);

  // Backend URL - use env variable or fallback to Emergent backend
  const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL as string) || 'https://bsign-backend.onrender.com';

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/reviews/${productId}`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
        setAverageRating(data.averageRating || 0);
        setTotalReviews(data.totalReviews || 0);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newReview.rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a star rating",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          productName,
          author: newReview.author,
          email: newReview.email,
          rating: newReview.rating,
          title: newReview.title,
          content: newReview.content
        }),
      });

      if (response.ok) {
        toast({
          title: "Thank you!",
          description: "Your review has been submitted.",
        });
        setShowReviewForm(false);
        setNewReview({ rating: 0, title: "", content: "", author: "", email: "" });
        fetchReviews();
      } else {
        throw new Error('Failed to submit');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Elegant star component
  const StarIcon = ({ filled, size = 16 }: { filled: boolean; size?: number }) => (
    <Star
      className={`transition-colors ${filled ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
      style={{ width: size, height: size }}
    />
  );

  if (loading) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground text-sm">Loading reviews...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Section Header */}
      <div className="text-center mb-10">
        <h2 className="text-2xl font-light tracking-wide text-foreground mb-2">
          Customer Reviews
        </h2>
        <div className="w-16 h-px bg-primary/30 mx-auto"></div>
      </div>

      {/* Rating Summary */}
      {totalReviews > 0 && (
        <div className="flex flex-col items-center mb-10 pb-10 border-b border-border/50">
          <div className="flex items-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <StarIcon key={star} filled={star <= Math.round(averageRating)} size={24} />
            ))}
          </div>
          <p className="text-3xl font-light text-foreground mb-1">
            {averageRating.toFixed(1)}
          </p>
          <p className="text-sm text-muted-foreground">
            Based on {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
          </p>
        </div>
      )}

      {/* Write Review Button */}
      {!showReviewForm && (
        <div className="text-center mb-10">
          <Button 
            onClick={() => setShowReviewForm(true)} 
            variant="outline"
            className="px-8 py-5 text-sm tracking-wide border-primary/30 hover:bg-primary/5 hover:border-primary/50"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Write a Review
          </Button>
        </div>
      )}

      {/* Review Form */}
      {showReviewForm && (
        <div className="mb-10 p-8 bg-muted/30 rounded-lg border border-border/50">
          <h3 className="text-lg font-light tracking-wide mb-6 text-center">Share Your Experience</h3>
          
          <form onSubmit={handleSubmitReview} className="space-y-6 max-w-lg mx-auto">
            {/* Star Rating */}
            <div className="text-center">
              <Label className="text-sm text-muted-foreground mb-3 block">Your Rating</Label>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-8 w-8 transition-colors ${
                        star <= (hoverRating || newReview.rating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-gray-200 hover:text-amber-200'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Name & Email */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Name</Label>
                <Input
                  value={newReview.author}
                  onChange={(e) => setNewReview(prev => ({ ...prev, author: e.target.value }))}
                  placeholder="Your name"
                  required
                  className="mt-1 bg-background border-border/50 focus:border-primary/50"
                />
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Email</Label>
                <Input
                  type="email"
                  value={newReview.email}
                  onChange={(e) => setNewReview(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="your@email.com"
                  required
                  className="mt-1 bg-background border-border/50 focus:border-primary/50"
                />
                <p className="text-xs text-muted-foreground mt-1">Not displayed publicly</p>
              </div>
            </div>

            {/* Title */}
            <div>
              <Label className="text-sm text-muted-foreground">Review Title</Label>
              <Input
                value={newReview.title}
                onChange={(e) => setNewReview(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Summarize your experience"
                required
                className="mt-1 bg-background border-border/50 focus:border-primary/50"
              />
            </div>

            {/* Content */}
            <div>
              <Label className="text-sm text-muted-foreground">Your Review</Label>
              <Textarea
                value={newReview.content}
                onChange={(e) => setNewReview(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Share your thoughts about this product..."
                required
                rows={4}
                className="mt-1 bg-background border-border/50 focus:border-primary/50 resize-none"
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-center gap-3 pt-2">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setShowReviewForm(false)}
                className="px-6"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={submitting}
                className="px-8"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-6">
        {reviews.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm">
              No reviews yet. Be the first to share your experience!
            </p>
          </div>
        ) : (
          reviews.map((review) => (
            <div 
              key={review.id} 
              className="pb-6 border-b border-border/30 last:border-0"
            >
              {/* Review Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-medium text-foreground">{review.author}</span>
                    {review.verified && (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                        <CheckCircle className="h-3 w-3" />
                        Verified
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <StarIcon key={star} filled={star <= review.rating} size={14} />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">{review.date}</span>
                  </div>
                </div>
              </div>

              {/* Review Content */}
              <h4 className="font-medium text-foreground mb-2">{review.title}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                {review.content}
              </p>

              {/* Helpful */}
              <button className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <ThumbsUp className="h-3.5 w-3.5" />
                Helpful ({review.helpful || 0})
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProductReviews;
