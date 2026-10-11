import { useSupportContact } from '@/hooks/useComplaints';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Static contact info only. Deliberately NOT a form: support contact is manual by design
// (8-8, Doc 01 §1.7 Assumption #4). Do not merge this with SubmitComplaintPage.
export default function SupportContactPage() {
  const { data, isLoading, error } = useSupportContact();

  if (isLoading) {
    return (
      <div className="p-6">
        <p role="status">Loading support details…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <p role="alert">We could not load the support details. Please try again later.</p>
      </div>
    );
  }

  const telegramUrl = `https://t.me/${data.telegramHandle.replace(/^@/, '')}`;

  return (
    <div className="mx-auto max-w-xl p-6">
      <h1 className="mb-4 text-2xl font-semibold">Contact support</h1>
      <Card>
        <CardHeader>
          <CardTitle>Reach the AKEWTutor team</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium">Phone</dt>
              <dd>
                <a href={`tel:${data.phone}`} className="underline">
                  {data.phone}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium">Telegram</dt>
              <dd>
                <a
                  href={telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  {data.telegramHandle}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium">Hours</dt>
              <dd>{data.hours}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
