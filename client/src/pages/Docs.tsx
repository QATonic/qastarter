import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle2, Terminal, BookOpen, Laptop, Smartphone, Globe, Server, AlertTriangle } from 'lucide-react';

export default function Docs() {
    const [activeTab, setActiveTab] = useState('web');

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />

            <main className="flex-1 container mx-auto px-4 py-8 lg:py-12">
                <div className="max-w-4xl mx-auto space-y-12">

                    {/* Hero Section */}
                    <section className="text-center space-y-4">
                        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                            Documentation & Guides
                        </h1>
                        <p className="text-xl text-muted-foreground">
                            Everything you need to know about generating, running, and maintaining your QA automation projects.
                        </p>
                    </section>

                    {/* Quick Start Guide */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-2 border-b pb-2">
                            <BookOpen className="h-6 w-6 text-primary" />
                            <h2 className="text-2xl font-bold">How to Generate a Project</h2>
                        </div>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                            {[
                                { title: "1. Select Type", desc: "Choose Web, Mobile, API, or Desktop testing." },
                                { title: "2. Choose Tech", desc: "Pick your language, framework, and tools." },
                                { title: "3. Configure", desc: "Set project name, dependencies, and utilities." },
                                { title: "4. Download", desc: "Get a production-ready ZIP file instantly." }
                            ].map((step, i) => (
                                <Card key={i} className="relative overflow-hidden border-primary/20">
                                    <div className="absolute -right-4 -top-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-4xl font-bold text-primary/20">
                                        {i + 1}
                                    </div>
                                    <CardHeader>
                                        <CardTitle className="text-lg">{step.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground">{step.desc}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </section>

                    {/* What's Included Section */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-2 border-b pb-2">
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                            <h2 className="text-2xl font-bold">What's Included?</h2>
                        </div>

                        <Tabs defaultValue="web" className="w-full" onValueChange={setActiveTab}>
                            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
                                <TabsTrigger value="web" className="flex gap-2 py-3"><Globe className="h-4 w-4" /> Web</TabsTrigger>
                                <TabsTrigger value="mobile" className="flex gap-2 py-3"><Smartphone className="h-4 w-4" /> Mobile</TabsTrigger>
                                <TabsTrigger value="api" className="flex gap-2 py-3"><Server className="h-4 w-4" /> API</TabsTrigger>
                                <TabsTrigger value="desktop" className="flex gap-2 py-3"><Laptop className="h-4 w-4" /> Desktop</TabsTrigger>
                            </TabsList>

                            <TabsContent value="web" className="mt-6 space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Web Automation (Selenium, Playwright, Cypress)</CardTitle>
                                        <CardDescription>Complete browser automation infrastructure</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <ul className="grid md:grid-cols-2 gap-3">
                                            <li className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" /> <span><b>Page Object Model (POM):</b> Structured pages and locators.</span></li>
                                            <li className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" /> <span><b>Driver Factory:</b> Thread-safe driver management.</span></li>
                                            <li className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" /> <span><b>Utility Helpers:</b> JSON reader, Excel reader, Screenshot capture.</span></li>
                                            <li className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" /> <span><b>Reporting:</b> Allure or ExtentReports integration.</span></li>
                                        </ul>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="mobile" className="mt-6 space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Mobile Automation (Appium, Flutter, Espresso)</CardTitle>
                                        <CardDescription>Native and Hybrid app testing framework</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <ul className="grid md:grid-cols-2 gap-3">
                                            <li className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" /> <span><b>Appium Service:</b> Programmatic server start/stop.</span></li>
                                            <li className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" /> <span><b>Capabilities Manager:</b> Configurable Android/iOS profiles.</span></li>
                                            <li className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" /> <span><b>Page Objects:</b> MobileElement / Widget locators.</span></li>
                                            <li className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" /> <span><b>Gestures:</b> Swipe, tap, and scroll helpers.</span></li>
                                        </ul>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="api" className="mt-6 space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>API Automation (RestAssured, Resty)</CardTitle>
                                        <CardDescription>REST and GraphQL testing framework</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <ul className="grid md:grid-cols-2 gap-3">
                                            <li className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" /> <span><b>Request Spec Builder:</b> Reusable headers and auth.</span></li>
                                            <li className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" /> <span><b>Schema Validation:</b> JSON/XML schema assertions.</span></li>
                                            <li className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" /> <span><b>POJO Models:</b> Request/Response serialization.</span></li>
                                            <li className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" /> <span><b>Endpoints Class:</b> Centralized API route management.</span></li>
                                        </ul>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="desktop" className="mt-6 space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Desktop Automation (WinAppDriver)</CardTitle>
                                        <CardDescription>Windows application testing</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <ul className="grid md:grid-cols-2 gap-3">
                                            <li className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" /> <span><b>Windows Driver:</b> WinAppDriver session management.</span></li>
                                            <li className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" /> <span><b>Screen Object Model:</b> Window and control mappings.</span></li>
                                            <li className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" /> <span><b>Process Management:</b> App launch and teardown helpers.</span></li>
                                        </ul>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </section>

                    {/* Running the Project */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-2 border-b pb-2">
                            <Terminal className="h-6 w-6 text-purple-600" />
                            <h2 className="text-2xl font-bold">How to Run Your Project</h2>
                        </div>

                        <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Prerequisites</AlertTitle>
                            <AlertDescription>
                                Ensure you have the request runtime installed:
                                <br />• <b>Java:</b> JDK 11+ & Maven/Gradle
                                <br />• <b>JavaScript/TypeScript:</b> Node.js 16+
                                <br />• <b>Python:</b> Python 3.8+
                                <br />• <b>Go:</b> Go 1.18+
                            </AlertDescription>
                        </Alert>

                        <Accordion type="single" collapsible className="w-full">
                            <AccordionItem value="item-1">
                                <AccordionTrigger className="text-lg font-medium">Java (Maven/Gradle)</AccordionTrigger>
                                <AccordionContent className="space-y-4 pt-2">
                                    <div className="bg-muted p-4 rounded-md font-mono text-sm">
                                        <p className="text-muted-foreground"># Install Dependencies</p>
                                        <p>mvn clean install</p>
                                        <p className="text-muted-foreground mt-2"># Run Tests</p>
                                        <p>mvn test</p>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-2">
                                <AccordionTrigger className="text-lg font-medium">JavaScript/TypeScript (npm)</AccordionTrigger>
                                <AccordionContent className="space-y-4 pt-2">
                                    <div className="bg-muted p-4 rounded-md font-mono text-sm">
                                        <p className="text-muted-foreground"># Install Dependencies</p>
                                        <p>npm install</p>
                                        <p className="text-muted-foreground mt-2"># Run Tests</p>
                                        <p>npm test</p>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-3">
                                <AccordionTrigger className="text-lg font-medium">Python (Pip)</AccordionTrigger>
                                <AccordionContent className="space-y-4 pt-2">
                                    <div className="bg-muted p-4 rounded-md font-mono text-sm">
                                        <p className="text-muted-foreground"># Install Dependencies</p>
                                        <p>pip install -r requirements.txt</p>
                                        <p className="text-muted-foreground mt-2"># Run Tests</p>
                                        <p>pytest</p>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="item-4">
                                <AccordionTrigger className="text-lg font-medium">Go (Mod)</AccordionTrigger>
                                <AccordionContent className="space-y-4 pt-2">
                                    <div className="bg-muted p-4 rounded-md font-mono text-sm">
                                        <p className="text-muted-foreground"># Install Dependencies</p>
                                        <p>go mod download</p>
                                        <p className="text-muted-foreground mt-2"># Run Tests</p>
                                        <p>go test ./...</p>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </section>

                    {/* Post Generation Checklist */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-2 border-b pb-2">
                            <CheckCircle2 className="h-6 w-6 text-blue-600" />
                            <h2 className="text-2xl font-bold">Post-Download Checklist</h2>
                        </div>

                        <Card className="border-l-4 border-l-blue-600">
                            <CardContent className="pt-6">
                                <h3 className="font-semibold mb-4 text-lg">Detailed Setup for 100% Success</h3>
                                <ul className="space-y-3">
                                    <li className="flex gap-3">
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-xs ring-1 ring-blue-600/20">1</span>
                                        <div>
                                            <span className="font-medium text-foreground">Update Configuration</span>
                                            <p className="text-sm text-muted-foreground">Check <code>src/test/resources/config.properties</code> or <code>.env</code>. Update URLs, credentials, and browser settings to match your local environment.</p>
                                        </div>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-xs ring-1 ring-blue-600/20">2</span>
                                        <div>
                                            <span className="font-medium text-foreground">Browser Drivers</span>
                                            <p className="text-sm text-muted-foreground">Most templates use WebDriverManager or Selenium Manager (auto-download). If you use a manual path, ensure your Chrome/Gecko driver matches your browser version.</p>
                                        </div>
                                    </li>
                                    <li className="flex gap-3">
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold text-xs ring-1 ring-blue-600/20">3</span>
                                        <div>
                                            <span className="font-medium text-foreground">Appium Server (Mobile Only)</span>
                                            <p className="text-sm text-muted-foreground">Ensure Appium is running locally (<code>npm install -g appium && appium</code>) or update the server URL in your config if using a cloud provider (BrowserStack/SauceLabs).</p>
                                        </div>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>
                    </section>

                </div>
            </main>

            <Footer />
        </div>
    );
}
