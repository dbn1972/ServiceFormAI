import { Star, ThumbsUp, Send, CheckCircle, Loader2 } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { consumerService } from '../services/api/consumer.service';
import type { Application } from '../shared/types';

export default function FeedbackRating() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [applicationId, setApplicationId] = useState(searchParams.get('applicationId') || '');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const commentRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    Promise.all([
      consumerService.getMyApplications(undefined, { page: 1, limit: 100 }),
      consumerService.getCitizenFeedback(),
    ]).then(([applicationsResponse, feedback]) => {
      const alreadyRated = new Set(feedback.map((entry: any) => entry.application_id));
      const eligible = applicationsResponse.data.filter((application) =>
        ['COMPLETED', 'APPROVED', 'REJECTED'].includes(application.status) && !alreadyRated.has(application.id),
      );
      setApplications(eligible);
      if (!applicationId && eligible.length) setApplicationId(eligible[0].id);
    }).catch(() => setError('Unable to load completed applications for feedback.'));
  }, []);

  const selectedApplication = applications.find((application) => application.id === applicationId);

  const handleSubmit = async () => {
    if (submitting || !applicationId || rating < 1 || rating > 5) return;
    setSubmitting(true);
    try {
      await consumerService.submitFeedback({
        applicationId,
        rating,
        comment: commentRef.current?.value || '',
        tags: selectedTags,
      });
      setSubmitted(true);
      setError(null);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to submit feedback.');
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

        {error && <div role="alert" className="mb-5 border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

        {submitted ? (
          <div className="bg-success/10 border border-success/20 rounded-lg p-6" role="status">
            <CheckCircle className="w-7 h-7 text-success mb-2" />
            <h2 className="font-semibold">Feedback submitted</h2>
            <p className="text-sm text-muted-foreground mt-1">Your feedback is linked to {selectedApplication?.trackingNumber} and will be reviewed independently.</p>
          </div>
        ) : applications.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-6">
            <p className="font-medium">No completed applications available for feedback.</p>
            <p className="text-sm text-muted-foreground mt-1">Feedback becomes available after an application reaches a final decision.</p>
          </div>
        ) : (
        <>
        {/* Service Info */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-success" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold mb-1">{selectedApplication?.service?.name || selectedApplication?.formData?.serviceName || 'Government service'}</h2>
              <label className="block text-sm text-muted-foreground mb-2">Application
                <select value={applicationId} onChange={(event) => setApplicationId(event.target.value)} className="mt-1 block w-full rounded-md border border-border bg-input-background px-3 py-2 text-foreground">
                  {applications.map((application) => <option key={application.id} value={application.id}>{application.trackingNumber} · {application.service?.name || application.formData?.serviceName || application.serviceId}</option>)}
                </select>
              </label>
              <p className="text-sm text-muted-foreground mb-2">Tracking number: {selectedApplication?.trackingNumber}</p>
              <span className="px-3 py-1 bg-success/10 text-success rounded-full text-xs font-medium">
                {selectedApplication?.status}
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

        {/* Quick Feedback */}
        <div className="bg-card border border-border rounded-xl p-6 mb-6">
          <h3 className="font-semibold mb-4">What did you like?</h3>
          <div className="flex flex-wrap gap-3">
            {['Fast processing', 'Easy to use', 'Helpful staff', 'Clear instructions', 'Good communication', 'Transparent process'].map((tag) => (
              <button key={tag} aria-pressed={selectedTags.includes(tag)} onClick={() => setSelectedTags((previous) => previous.includes(tag) ? previous.filter((item) => item !== tag) : [...previous, tag])} className={`px-4 py-2 border border-border rounded-full text-sm transition-colors ${selectedTags.includes(tag) ? 'bg-primary/10 text-primary border-primary' : 'hover:bg-muted'}`}>
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
            ref={commentRef}
            placeholder="Tell us more about your experience..."
            className="w-full min-h-[150px] px-4 py-3 bg-input-background border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <button type="button" onClick={() => navigate('/applications')} className="flex-1 py-3 px-6 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80">
            Skip for Now
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || rating === 0 || !applicationId}
            className="flex-1 py-3 px-6 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            Submit Feedback
          </button>
        </div>
        </>
        )}
      </div>
    </div>
  );
}
