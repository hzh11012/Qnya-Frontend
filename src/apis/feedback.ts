import request from '@/lib/request';

export type FeedbackType =
  'consultation' | 'suggestion' | 'complaint' | 'other';

const createFeedback = (
  animeId: string,
  data: { type: FeedbackType; content: string }
) => {
  return request.post(`/api/client/feedback/${animeId}`, data, {
    showSuccessToast: true
  });
};

export { createFeedback };
