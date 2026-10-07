import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { usePolicy } from '@/hooks/usePolicy';
import EmptyState from '@/components/common/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants';

const VALID_TYPES = ['PRIVACY', 'TERMS', 'SAFETY', 'REFUND', 'RULES'] as const;
type ValidType = (typeof VALID_TYPES)[number];

function PolicyViewer({ type }: { type: ValidType }) {
  const { data, isLoading, isError } = usePolicy(type);

  if (isLoading) {
    return <div className="p-4">Loading...</div>;
  }

  if (isError || !data) {
    return <EmptyState message="Policy not yet published" />;
  }

  return (
    <Card>
      <CardContent className="p-6">
        <h1 className="text-2xl font-bold mb-6">{data.title}</h1>
        <div className="prose dark:prose-invert max-w-none">
          <ReactMarkdown>{data.content}</ReactMarkdown>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PolicyPage() {
  const { type } = useParams<{ type: string }>();

  const upperType = type?.toUpperCase() || '';
  const isValid = VALID_TYPES.includes(upperType as ValidType);

  if (!isValid) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <p className="text-foreground text-2xl font-semibold">404</p>
        <p className="text-muted-foreground text-sm">Page not found</p>
        <Link to={ROUTES.HOME}>
          <Button>Go home</Button>
        </Link>
      </div>
    );
  }

  return <PolicyViewer type={upperType as ValidType} />;
}
