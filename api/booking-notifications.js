import { handleEmailApiRequest } from '../server/email-api.mjs';

export default function handler(request, response) {
  return handleEmailApiRequest(request, response, '/api/booking-notifications');
}
