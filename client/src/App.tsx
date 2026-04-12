import { Suspense, lazy } from 'react';
import { Switch, Route } from 'wouter';
import { queryClient } from './lib/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { Skeleton } from '@/components/ui/skeleton';
import SkipLink from '@/components/SkipLink';

// Lazy load pages for code splitting
const Home = lazy(() => import('@/pages/Home'));
const Docs = lazy(() => import('@/pages/Docs'));
const ApiDocs = lazy(() => import('@/pages/ApiDocs'));
const ExpressGenerator = lazy(() => import('@/pages/ExpressGenerator'));
const NotFound = lazy(() => import('@/pages/not-found'));

// Loading fallback component
function PageLoader() {
  return (
    <div
      className="flex items-center justify-center min-h-screen"
      role="status"
      aria-label="Loading page"
    >
      <div className="space-y-4 w-full max-w-2xl px-4">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-2/3" />
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/docs" component={Docs} />
        <Route path="/api-docs" component={ApiDocs} />
        <Route path="/express" component={ExpressGenerator} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

import { ThemeProvider } from '@/components/theme-provider';

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <QueryClientProvider client={queryClient}>
        <SkipLink targetId="main-content" />
        <Toaster />
        <Router />
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
