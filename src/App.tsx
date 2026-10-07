import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { Toaster } from '@/components/ui/sonner';
import router from '@/routes';

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <Toaster />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
