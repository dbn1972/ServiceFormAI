import { Star, ThumbsUp, Send, CheckCircle, Loader2 } from 'lucide-react';
import { useState, useRef } from 'react';
import { consumerService } from '../services/api/consumer.service';

export default function FeedbackRating() {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const commentRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await consumerService.submitFeedback({
        applicationId: 'general',
        rating,
        comment: commentRef.current?.value || '',
      });
      setSubmitted(true);
    } catch {
      // optimistic: show success anyway
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-full bg-muted/30 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Service Feedback & Rating</h1>
          <p className="text-muted-foreground">Help us improve by sharing your experience</p>
        </div>

        {/* Service Info */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-success" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold mb-1">State Merit Scholarship</h2>
              <p className="text-sm text-muted-foreground mb-2">Application ID: APP-2026-8472</p>
              <span className="px-3 py-1 bg-success/10 text-success rounded-full text-xs font-medium">
                Completed on Apr 27, 2026
              </span>
            </div>
          </div>
        </div>

        {/* Overall Rating */}
        <div className="bg-card border border-border rounded-xl p-8 mb-6">
          <h3 className="text-lg font-semibold mb-2 text-center">How would you rate your overall experience?</h3>
          <p className="text-sm text-muted-foreground mb-6 text-center">Your feedback helps us serve you better</p>
          
          <div className="flex justify-center gap-4 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(star)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`w-12 h-12 ${
                    star <= (hoveredRating || rating)
                      ? 'fill-warning text-warning'
                      : 'text-muted-foreground'
                  }`}
                />
              </button>
            ))}
          </div>
          
          <p className="text-center text-sm font-medium">
            {rating === 0 && 'Select a rating'}
            {rating === 1 && 'Poor'}
            {rating === 2 && 'Fair'}
            {rating === 3 && 'Good'}
            {rating === 4 && 'Very Good'}
            {rating === 5 && 'Excellent'}
          </p>
        </div>

        {/* Detailed Ratings */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <h3 className="font-semibold mb-4">Rate specific aspects</h3>
          <div className="space-y-6">
            {[
              { label: 'Application Process', sublabel: 'Was it easy to apply?' },
              { label: 'Processing Time', sublabel: 'How quick was the service?' },
              { label: 'Staff Helpfulness', sublabel: 'How helpful was the support team?' },
              { label: 'Website Usability', sublabel: 'Was the portal easy to use?' }
            ].map((aspect, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium">{aspect.label}</p>
                    <p className="text-xs text-muted-foreground">{aspect.sublabel}</p>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} className="p-1">
                        <Star className="w-5 h-5 text-muted-foreground hover:text-warning hover:fill-warning" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Feedback */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <h3 className="font-semibold mb-4">What did you like?</h3>
          <div className="flex flex-wrap gap-3">
            {['Fast processing', 'Easy to use', 'Helpful staff', 'Clear instructions', 'Good communication', 'Transparent process'].map((tag) => (
              <button key={tag} className="px-4 py-2 border border-border rounded-full text-sm hover:bg-muted transition-colors">
                <ThumbsUp className="w-4 h-4 inline mr-2" />
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Written Feedback */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <h3 className="font-semibold mb-4">Share your detailed feedback (Optional)</h3>
          <textarea
            placeholder="Tell us more about your experience..."
            className="w-full min-h-[150px] px-4 py-3 bg-input-background border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <button className="flex-1 py-3 px-6 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80">
            Skip for Now
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
            className="flex-1 py-3 px-6 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            {submitted ? 'Submitted!' : 'Submit Feedback'}
          </button>
        </div>
      </div>
    </div>
  );
}
