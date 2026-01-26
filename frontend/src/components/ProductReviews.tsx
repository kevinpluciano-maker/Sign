import { useState, useEffect } from "react";
import { Star, ThumbsUp, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  images?: string[];
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

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

  // Fetch reviews on component mount
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
    
    const reviewData = {
      productId,
      productName,
      author: newReview.author,
      email: newReview.email,
      rating: newReview.rating,
      title: newReview.title,
      content: newReview.content
    };

    try {
      const response = await fetch(`${BACKEND_URL}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData),
      });

      if (response.ok) {
        toast({
          title: "Review Submitted!",
          description: "Thank you for sharing your experience.",
        });
        setShowReviewForm(false);
        setNewReview({ rating: 0, title: "", content: "", author: "", email: "" });
        // Refresh reviews
        fetchReviews();
      } else {
        throw new Error('Failed to submit');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ rating, size = 5 }: { rating: number; size?: number }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-${size} w-${size} ${
            star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Rating Summary */}
      <Card>
        <CardContent className="p-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Overall Rating */}
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
                <div className="text-5xl font-bold">{averageRating.toFixed(1)}</div>
                <div>
                  <StarRating rating={Math.round(averageRating)} />
                  <p className="text-sm text-gray-600 mt-1">
                    Based on {totalReviews} reviews
                  </p>
                </div>
              </div>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-2">
              {ratingDistribution.map((dist) => (
                <div key={dist.stars} className="flex items-center gap-3">
                  <span className="text-sm w-8">{dist.stars}★</span>
                  <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400"
                      style={{ width: `${(dist.count / totalReviews) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-12">{dist.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Write Review Button */}
          <div className="mt-6 text-center md:text-left">
            {!showReviewForm ? (
              <Button onClick={() => setShowReviewForm(true)}>
                Write a Review
              </Button>
            ) : (
              <Button variant="outline" onClick={() => setShowReviewForm(false)}>
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Review Form */}
      {showReviewForm && (
        <Card>
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold mb-6">Write Your Review</h3>
            <form onSubmit={handleSubmitReview} className="space-y-6">
              {/* Rating */}
              <div>
                <Label className="mb-2 block">Your Rating *</Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setNewReview({ ...newReview, rating: star })}
                    >
                      <Star
                        className={`h-8 w-8 cursor-pointer transition-colors ${
                          star <= (hoverRating || newReview.rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300 hover:text-yellow-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Name and Email */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="author">Your Name *</Label>
                  <Input
                    id="author"
                    required
                    value={newReview.author}
                    onChange={(e) => setNewReview({ ...newReview, author: e.target.value })}
                    placeholder="John Smith"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={newReview.email}
                    onChange={(e) => setNewReview({ ...newReview, email: e.target.value })}
                    placeholder="john@example.com"
                  />
                  <p className="text-xs text-gray-500 mt-1">Not displayed publicly</p>
                </div>
              </div>

              {/* Title */}
              <div>
                <Label htmlFor="title">Review Title *</Label>
                <Input
                  id="title"
                  required
                  value={newReview.title}
                  onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                  placeholder="Sum up your experience in one sentence"
                />
              </div>

              {/* Review Content */}
              <div>
                <Label htmlFor="content">Your Review *</Label>
                <Textarea
                  id="content"
                  required
                  rows={5}
                  value={newReview.content}
                  onChange={(e) => setNewReview({ ...newReview, content: e.target.value })}
                  placeholder="Share your experience with this product. What did you like or dislike? How well did it meet your needs?"
                />
              </div>

              <Button type="submit" className="w-full md:w-auto">
                Submit Review
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        <h3 className="text-2xl font-bold">Customer Reviews</h3>
        {reviews.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
            </CardContent>
          </Card>
        ) : (
          reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-cyan-100 text-cyan-700">
                        {review.author.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{review.author}</span>
                        {review.verified && (
                          <div className="flex items-center gap-1 text-green-600 text-sm">
                            <CheckCircle className="h-4 w-4" />
                            <span>Verified Purchase</span>
                          </div>
                        )}
                      </div>
                      <StarRating rating={review.rating} />
                      <p className="text-sm text-gray-500 mt-1">{review.date}</p>
                    </div>
                  </div>
                </div>

                <h4 className="font-semibold text-lg mb-2">{review.title}</h4>
                <p className="text-gray-700 leading-relaxed mb-4">{review.content}</p>

                {/* Review Images */}
                {review.images && review.images.length > 0 && (
                  <div className="flex gap-2 mb-4">
                    {review.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`Review image ${idx + 1}`}
                        className="h-20 w-20 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                )}

                {/* Helpful Button */}
                <div className="flex items-center gap-2 pt-4 border-t">
                  <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
                    <ThumbsUp className="h-4 w-4" />
                    <span>Helpful ({review.helpful})</span>
                  </button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ProductReviews;
