import React, { useState } from 'react';
import { useSubmitAssessment, type WeeklyAssessment } from '@/hooks/useWeeklyAssessment';
import { Button } from '@/components/ui/button';

export interface AssessmentFormProps {
  cohortMembershipId: string;
  weekStartDate: string;
  existingAssessment?: WeeklyAssessment;
  onSuccess?: () => void;
}

export default function AssessmentForm({
  cohortMembershipId,
  weekStartDate,
  existingAssessment,
  onSuccess,
}: AssessmentFormProps) {
  const [tutorFeedback, setTutorFeedback] = useState(existingAssessment?.tutorFeedback || '');
  const [scoreSummary, setScoreSummary] = useState(existingAssessment?.scoreSummary || '');
  const [isEditing, setIsEditing] = useState(!existingAssessment);

  const { mutate, isPending } = useSubmitAssessment();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tutorFeedback.trim()) return;

    mutate(
      {
        cohortMembershipId,
        weekStartDate,
        tutorFeedback: tutorFeedback.trim(),
        scoreSummary: scoreSummary.trim() || undefined,
      },
      {
        onSuccess: () => {
          setIsEditing(false);
          onSuccess?.();
        },
      }
    );
  };

  if (!isEditing && existingAssessment) {
    return (
      <div className="assessment-readonly">
        <h3>Assessment for week of {weekStartDate}</h3>
        <p>
          <strong>Feedback:</strong> {existingAssessment.tutorFeedback}
        </p>
        {existingAssessment.scoreSummary && (
          <p>
            <strong>Score:</strong> {existingAssessment.scoreSummary}
          </p>
        )}
        <Button onClick={() => setIsEditing(true)} variant="secondary" size="sm">
          Edit
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="assessment-form">
      <h3>Assessment for week of {weekStartDate}</h3>
      <div className="form-group">
        <label htmlFor="tutorFeedback">Tutor Feedback *</label>
        <textarea
          id="tutorFeedback"
          value={tutorFeedback}
          onChange={(e) => setTutorFeedback(e.target.value)}
          required
          rows={4}
        />
      </div>
      <div className="form-group">
        <label htmlFor="scoreSummary">Score Summary (Optional)</label>
        <input
          id="scoreSummary"
          type="text"
          value={scoreSummary}
          onChange={(e) => setScoreSummary(e.target.value)}
        />
      </div>
      <div className="actions">
        {existingAssessment && (
          <Button type="button" onClick={() => setIsEditing(false)} variant="ghost" size="sm">
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={isPending || !tutorFeedback.trim()}
        >
          {isPending ? 'Submitting...' : 'Submit Assessment'}
        </Button>
      </div>
    </form>
  );
}
