import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main id="main-content" className="flex-1 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-8 text-center space-y-6">
            <div className="mx-auto w-fit p-4 rounded-full bg-destructive/10">
              <AlertCircle className="h-10 w-10 text-destructive" />
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground">404</h1>
              <p className="text-lg text-muted-foreground">Page not found</p>
              <p className="text-sm text-muted-foreground">
                The page you&apos;re looking for doesn&apos;t exist or has been moved.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link href="/">
                <Button className="gap-2 w-full sm:w-auto">
                  <Home className="h-4 w-4" />
                  Go Home
                </Button>
              </Link>
              <Link href="/express">
                <Button variant="outline" className="gap-2 w-full sm:w-auto">
                  <ArrowLeft className="h-4 w-4" />
                  Launch Generator
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
