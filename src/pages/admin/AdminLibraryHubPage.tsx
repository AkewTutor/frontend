import { useSearchParams } from 'react-router-dom';
import AdminLibraryPage from '@/pages/admin/AdminLibraryPage';
import AdminLibraryActivity from '@/pages/admin/AdminLibraryActivity';

export default function AdminLibraryHubPage() {
  const [params] = useSearchParams();
  return params.get('cohortId') ? <AdminLibraryPage /> : <AdminLibraryActivity />;
}