import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Link } from 'wouter';
import { ArrowLeft, Copy, Check, Terminal, Code, Database, Zap } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleCopy}
      className="h-6 w-6"
      data-testid="button-copy"
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
    </Button>
  );
}

function CodeBlock({ code, language = 'bash' }: { code: string; language?: string }) {
  return (
    <div className="relative group">
      <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm font-mono">
        <code>{code}</code>
      </pre>
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <CopyButton text={code} />
      </div>
    </div>
  );
}

export default function ApiDocs() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-5xl mx-auto py-8 px-4">
        <Link href="/">
          <Button variant="ghost" className="mb-6" data-testid="link-back-home">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Generator
          </Button>
        </Link>

        <div className="space-y-2 mb-8">
          <h1 className="text-4xl font-bold" data-testid="text-page-title">
            API Documentation
          </h1>
          <p className="text-muted-foreground text-lg">
            Use our public API to generate QA automation projects programmatically via curl,
            scripts, or CLI tools.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <Terminal className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">curl Friendly</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Generate projects with a single curl command. Perfect for CI/CD pipelines.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <Database className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Metadata API</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Query available frameworks, languages, and compatibility options.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <Zap className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-lg">Smart Defaults</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Auto-selects compatible test runners and build tools based on your language.
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="generate" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="generate" data-testid="tab-generate">
              Generate Project
            </TabsTrigger>
            <TabsTrigger value="metadata" data-testid="tab-metadata">
              Metadata
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">GET</Badge>
                  <code className="text-lg font-mono">/api/v1/generate</code>
                </div>
                <CardDescription>
                  Generate a QA automation project and download as a ZIP file.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3">Quick Start</h3>
                  <CodeBlock
                    code={`# Generate a Selenium + Java project
curl "https://qastarter.com/api/v1/generate?framework=selenium&language=java" -o project.zip

# Generate a Playwright + TypeScript project
curl "https://qastarter.com/api/v1/generate?framework=playwright&language=typescript" -o project.zip

# Generate a Cypress project with GitHub Actions CI/CD
curl "https://qastarter.com/api/v1/generate?framework=cypress&language=typescript&cicdTool=github-actions" -o project.zip`}
                  />
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Query Parameters</h3>
                  <ScrollArea className="h-[400px]">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 pr-4">Parameter</th>
                          <th className="text-left py-2 pr-4">Default</th>
                          <th className="text-left py-2">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        <tr>
                          <td className="py-2 pr-4 font-mono text-xs">projectName</td>
                          <td className="py-2 pr-4">
                            <code>my-qa-project</code>
                          </td>
                          <td className="py-2">Name of the generated project</td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-4 font-mono text-xs">testingType</td>
                          <td className="py-2 pr-4">
                            <code>web</code>
                          </td>
                          <td className="py-2">Type: web, mobile, api, desktop</td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-4 font-mono text-xs">framework</td>
                          <td className="py-2 pr-4">
                            <code>selenium</code>
                          </td>
                          <td className="py-2">
                            Testing framework (selenium, playwright, cypress, etc.)
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-4 font-mono text-xs">language</td>
                          <td className="py-2 pr-4">
                            <code>java</code>
                          </td>
                          <td className="py-2">
                            Programming language (java, python, typescript, etc.)
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-4 font-mono text-xs">testRunner</td>
                          <td className="py-2 pr-4">
                            <em>auto</em>
                          </td>
                          <td className="py-2">
                            Auto-selected based on language (testng, junit5, pytest, jest, etc.)
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-4 font-mono text-xs">buildTool</td>
                          <td className="py-2 pr-4">
                            <em>auto</em>
                          </td>
                          <td className="py-2">
                            Auto-selected based on language (maven, gradle, npm, pip)
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-4 font-mono text-xs">testingPattern</td>
                          <td className="py-2 pr-4">
                            <code>page-object-model</code>
                          </td>
                          <td className="py-2">Pattern: page-object-model, bdd, fluent</td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-4 font-mono text-xs">cicdTool</td>
                          <td className="py-2 pr-4">
                            <em>none</em>
                          </td>
                          <td className="py-2">
                            CI/CD: github-actions, jenkins, gitlab-ci, azure-devops, circleci
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-4 font-mono text-xs">reportingTool</td>
                          <td className="py-2 pr-4">
                            <em>none</em>
                          </td>
                          <td className="py-2">
                            Reporting: allure, extent-reports, mochawesome, etc.
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-4 font-mono text-xs">utilities</td>
                          <td className="py-2 pr-4">
                            <em>none</em>
                          </td>
                          <td className="py-2">
                            Comma-separated: configReader, jsonReader, screenshotUtility, logger,
                            dataProvider
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-4 font-mono text-xs">includeSampleTests</td>
                          <td className="py-2 pr-4">
                            <code>true</code>
                          </td>
                          <td className="py-2">Include sample test files (true/false)</td>
                        </tr>
                      </tbody>
                    </table>
                  </ScrollArea>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Response</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Returns a ZIP file with <code>Content-Type: application/zip</code>
                  </p>
                  <CodeBlock
                    code={`# The response is a binary ZIP file
# Save it with the -o flag:
curl "https://qastarter.com/api/v1/generate?framework=selenium&language=java" -o selenium-project.zip

# Extract immediately:
curl "https://qastarter.com/api/v1/generate?framework=playwright&language=typescript" | tar -xzf -`}
                  />
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Error Response</h3>
                  <CodeBlock
                    code={`{
  "success": false,
  "message": "Invalid combination of testing type, framework, and language",
  "hint": "Use GET /api/v1/metadata to see compatible options"
}`}
                    language="json"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Example: Complete Configuration</CardTitle>
                <CardDescription>
                  Generate a fully configured Selenium + Java project with all options
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CodeBlock
                  code={`curl "https://qastarter.com/api/v1/generate?\\
  projectName=my-selenium-tests&\\
  testingType=web&\\
  framework=selenium&\\
  language=java&\\
  testRunner=testng&\\
  buildTool=maven&\\
  testingPattern=page-object-model&\\
  cicdTool=github-actions&\\
  reportingTool=allure&\\
  utilities=logger,screenshotUtility,configReader&\\
  includeSampleTests=true" \\
  -o my-selenium-tests.zip`}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metadata" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">GET</Badge>
                  <code className="text-lg font-mono">/api/v1/metadata</code>
                </div>
                <CardDescription>
                  Get all available options and their compatibility information.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3">Request</h3>
                  <CodeBlock code={`curl "https://qastarter.com/api/v1/metadata"`} />
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Response Structure</h3>
                  <CodeBlock
                    code={`{
  "success": true,
  "data": {
    "version": "1.0.0",
    "testingTypes": [
      { "id": "web", "label": "Web Applications", "frameworks": ["selenium", "playwright", "cypress", "webdriverio"] },
      { "id": "mobile", "label": "Mobile Applications", "frameworks": ["appium", "espresso", "xcuitest"] },
      { "id": "api", "label": "API Testing", "frameworks": ["restassured", "requests", "supertest", "restsharp", "graphql", "grpc"] },
      { "id": "desktop", "label": "Desktop Applications", "frameworks": ["winappdriver", "pyautogui"] }
    ],
    "frameworks": [
      { 
        "id": "selenium", 
        "label": "Selenium WebDriver",
        "languages": ["java", "python", "csharp", "javascript", "typescript"],
        "cicdTools": ["jenkins", "github-actions", "gitlab-ci", "azure-devops", "circleci"],
        "reportingTools": ["allure", "extent-reports", "testng-reports", "junit-reports"],
        "testingPatterns": ["page-object-model", "bdd"]
      }
      // ... more frameworks
    ],
    "languages": [
      { "id": "java", "label": "Java", "testRunners": ["testng", "junit5"], "buildTools": ["maven", "gradle"] },
      { "id": "python", "label": "Python", "testRunners": ["pytest"], "buildTools": ["pip"] },
      { "id": "typescript", "label": "TypeScript", "testRunners": ["jest", "mocha"], "buildTools": ["npm"] }
      // ... more languages
    ],
    "testRunners": [...],
    "buildTools": [...],
    "cicdTools": [...],
    "reportingTools": [...],
    "testingPatterns": [...],
    "utilities": [...]
  }
}`}
                    language="json"
                  />
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Use Cases</h3>
                  <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Build CLI tools that offer autocomplete for available options</li>
                    <li>Create IDE plugins that validate user selections</li>
                    <li>Generate dynamic forms that show only compatible options</li>
                    <li>Validate configurations before making generate requests</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Rate Limiting
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              To ensure fair usage, our API has the following rate limits:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>
                <strong>General API:</strong> 100 requests per 15 minutes
              </li>
              <li>
                <strong>Project Generation:</strong> 10 requests per 15 minutes
              </li>
            </ul>
            <p className="text-sm text-muted-foreground">
              Rate limit information is included in response headers: <code>RateLimit-Limit</code>,{' '}
              <code>RateLimit-Remaining</code>, <code>RateLimit-Reset</code>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
