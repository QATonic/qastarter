import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LandingPage from "@/components/LandingPage";
import Wizard from "@/components/Wizard";
import { useToast } from "@/hooks/use-toast";

type AppState = 'landing' | 'wizard' | 'generating';

interface WizardConfig {
  testingType: string;
  framework: string;
  language: string;
  testingPattern: string;
  testRunner: string;
  buildTool: string;
  projectName: string;
  groupId?: string;
  artifactId?: string;
  cicdTool: string;
  reportingTool: string;
  utilities: {
    configReader: boolean;
    jsonReader: boolean;
    screenshotUtility: boolean;
    logger: boolean;
    dataProvider: boolean;
  };
  dependencies: string[];
}

export default function Home() {
  const [appState, setAppState] = useState<AppState>('landing');
  const { toast } = useToast();

  const handleStartGeneration = () => {
    setAppState('wizard');
  };

  const handleBackToLanding = () => {
    setAppState('landing');
  };

  const handleDownload = async (config: WizardConfig) => {
    const response = await fetch('/api/generate-project', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Project generation failed');
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${config.projectName}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Project Generated Successfully!",
      description: `${config.projectName} has been downloaded to your device.`,
    });
  };

  const handleWizardComplete = async (config: WizardConfig) => {
    setAppState('generating');
    
    try {
      console.log('Generating project with config:', config);
      await handleDownload(config);
      setAppState('landing');
    } catch (error) {
      console.error('Error generating project:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "There was an error generating your project. Please try again.",
        variant: "destructive",
      });
      setAppState('wizard');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header onLogoClick={handleBackToLanding} />
      
      <main id="main-content" className="flex-1" role="main">
        {appState === 'landing' && (
          <LandingPage onStartGeneration={handleStartGeneration} />
        )}
        
        {appState === 'wizard' && (
          <Wizard 
            onComplete={handleWizardComplete}
            onBack={handleBackToLanding}
          />
        )}
        
        {appState === 'generating' && (
          <div className="flex items-center justify-center min-h-[60vh]" role="status" aria-label="Generating project">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" aria-hidden="true"></div>
              <h2 className="text-xl font-semibold">Generating Your Project...</h2>
              <p className="text-muted-foreground">This may take a few seconds</p>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
