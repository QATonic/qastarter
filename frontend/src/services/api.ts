import { WizardState, OptionData, FilterRules } from '../types/wizard';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// API Response Types
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: ValidationError[];
  timestamp: string;
  requestId: string;
}

interface ValidationError {
  field: string;
  message: string;
  code: string;
}

interface GenerateProjectResponse {
  projectId: string;
  downloadUrl: string;
  expiresAt: string;
  size: number;
  files: {
    name: string;
    path: string;
    type: 'file' | 'directory';
  }[];
}

// HTTP Client Class
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'X-Request-ID': crypto.randomUUID(),
    };

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP Error: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

// Create API client instance
const apiClient = new ApiClient(API_BASE_URL);

// API Service Functions
export const apiService = {
  /**
   * Fetch configuration options from backend
   */
  async getConfigurationOptions(): Promise<OptionData> {
    try {
      const response = await apiClient.get<OptionData>('/api/v1/config/options');
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch configuration options');
      }
      return response.data;
    } catch (error) {
      console.error('Error fetching configuration options:', error);
      // Return fallback data aligned with actual templates (33 templates)
      return {
        testingTypes: ['Web', 'API', 'Mobile', 'Desktop'],
        methodologies: ['TDD', 'BDD', 'Hybrid'],
        tools: [
          'Selenium', 'Playwright', 'Cypress', 'WebdriverIO',
          'RestAssured', 'Requests', 'Supertest', 'RestSharp',
          'Appium', 'XCUITest', 'Espresso',
          'WinAppDriver', 'PyAutoGUI'
        ],
        languages: ['Java', 'Python', 'JavaScript', 'TypeScript', 'C#', 'Swift'],
        buildTools: ['Maven', 'Gradle', 'npm', 'pip', 'NuGet', 'SPM'],
        testRunners: ['JUnit 5', 'TestNG', 'Pytest', 'Jest', 'Mocha', 'NUnit', 'XCTest', 'Cypress'],
        scenarios: {
          Web: ['Login', 'Logout', 'SignUp', 'Search', 'Navigation', 'Form Validation'],
          API: ['CRUD Operations', 'Authentication', 'Error Handling', 'Schema Validation', 'Rate Limiting'],
          Mobile: ['Login', 'Logout', 'SignUp', 'Navigation', 'Push Notifications', 'Gestures', 'Device Rotation'],
          Desktop: ['Login', 'File Operations', 'Menu Navigation', 'Form Validation', 'Window Management']
        },
        cicdOptions: ['Jenkins', 'GitHub Actions', 'GitLab CI', 'Azure DevOps', 'CircleCI'],
        reportingOptions: ['Allure Reports', 'Extent Reports', 'TestNG Reports', 'JUnit Reports', 'Pytest HTML', 'Mochawesome'],
        otherIntegrations: ['Docker', 'Selenium Grid', 'BrowserStack', 'Sauce Labs'],
        dependencies: ['Logging', 'Screenshot', 'Config Loader', 'Page Object Model', 'Data Provider', 'Retry Logic', 'Wait Helpers']
      };
    }
  },

  /**
   * Fetch filter rules from backend
   */
  async getFilterRules(): Promise<FilterRules> {
    try {
      const response = await apiClient.get<FilterRules>('/api/v1/config/filters');
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch filter rules');
      }
      return response.data;
    } catch (error) {
      console.error('Error fetching filter rules:', error);
      // Return fallback data aligned with actual templates
      return {
        testingType: {
          'Web': {
            tools: ['Selenium', 'Playwright', 'Cypress', 'WebdriverIO'],
            languages: ['Java', 'Python', 'JavaScript', 'TypeScript', 'C#']
          },
          'API': {
            tools: ['RestAssured', 'Requests', 'Supertest', 'RestSharp'],
            languages: ['Java', 'Python', 'JavaScript', 'TypeScript', 'C#']
          },
          'Mobile': {
            tools: ['Appium', 'XCUITest', 'Espresso'],
            languages: ['Java', 'Python', 'JavaScript', 'TypeScript', 'C#', 'Swift']
          },
          'Desktop': {
            tools: ['WinAppDriver', 'PyAutoGUI'],
            languages: ['Java', 'Python', 'C#']
          }
        },
        tool: {
          'Selenium': { languages: ['Java', 'Python', 'JavaScript', 'TypeScript', 'C#'] },
          'Playwright': { languages: ['Java', 'Python', 'JavaScript', 'TypeScript', 'C#'] },
          'Cypress': { languages: ['JavaScript', 'TypeScript'] },
          'WebdriverIO': { languages: ['JavaScript', 'TypeScript'] },
          'RestAssured': { languages: ['Java'] },
          'Requests': { languages: ['Python'] },
          'Supertest': { languages: ['JavaScript', 'TypeScript'] },
          'RestSharp': { languages: ['C#'] },
          'Appium': { languages: ['Java', 'Python', 'JavaScript', 'TypeScript', 'C#'] },
          'XCUITest': { languages: ['Swift'] },
          'Espresso': { languages: ['Java'] },
          'WinAppDriver': { languages: ['Java', 'Python', 'C#'] },
          'PyAutoGUI': { languages: ['Python'] }
        },
        language: {
          'Java': { buildTools: ['Maven', 'Gradle'], testRunners: ['JUnit 5', 'TestNG'] },
          'Python': { buildTools: ['pip'], testRunners: ['Pytest'] },
          'JavaScript': { buildTools: ['npm'], testRunners: ['Jest', 'Mocha', 'Cypress'] },
          'TypeScript': { buildTools: ['npm'], testRunners: ['Jest', 'Mocha', 'Cypress'] },
          'C#': { buildTools: ['NuGet'], testRunners: ['NUnit'] },
          'Swift': { buildTools: ['SPM'], testRunners: ['XCTest'] }
        },
        toolLanguage: {
          'Selenium-Java': { testRunners: ['TestNG', 'JUnit 5'], buildTools: ['Maven', 'Gradle'] },
          'Selenium-Python': { testRunners: ['Pytest'], buildTools: ['pip'] },
          'Selenium-JavaScript': { testRunners: ['Jest'], buildTools: ['npm'] },
          'Selenium-TypeScript': { testRunners: ['Jest'], buildTools: ['npm'] },
          'Selenium-C#': { testRunners: ['NUnit'], buildTools: ['NuGet'] },
          'Playwright-Java': { testRunners: ['TestNG', 'JUnit 5'], buildTools: ['Maven'] },
          'Playwright-Python': { testRunners: ['Pytest'], buildTools: ['pip'] },
          'Playwright-JavaScript': { testRunners: ['Jest'], buildTools: ['npm'] },
          'Playwright-TypeScript': { testRunners: ['Jest'], buildTools: ['npm'] },
          'Playwright-C#': { testRunners: ['NUnit'], buildTools: ['NuGet'] },
          'Cypress-JavaScript': { testRunners: ['Cypress'], buildTools: ['npm'] },
          'Cypress-TypeScript': { testRunners: ['Cypress'], buildTools: ['npm'] },
          'WebdriverIO-JavaScript': { testRunners: ['Mocha'], buildTools: ['npm'] },
          'WebdriverIO-TypeScript': { testRunners: ['Mocha'], buildTools: ['npm'] },
          'RestAssured-Java': { testRunners: ['TestNG'], buildTools: ['Maven'] },
          'Requests-Python': { testRunners: ['Pytest'], buildTools: ['pip'] },
          'Supertest-JavaScript': { testRunners: ['Jest'], buildTools: ['npm'] },
          'Supertest-TypeScript': { testRunners: ['Jest'], buildTools: ['npm'] },
          'RestSharp-C#': { testRunners: ['NUnit'], buildTools: ['NuGet'] },
          'Appium-Java': { testRunners: ['TestNG'], buildTools: ['Maven'] },
          'Appium-Python': { testRunners: ['Pytest'], buildTools: ['pip'] },
          'Appium-JavaScript': { testRunners: ['Jest'], buildTools: ['npm'] },
          'Appium-TypeScript': { testRunners: ['Jest'], buildTools: ['npm'] },
          'Appium-C#': { testRunners: ['NUnit'], buildTools: ['NuGet'] },
          'Espresso-Java': { testRunners: ['JUnit 5'], buildTools: ['Gradle'] },
          'XCUITest-Swift': { testRunners: ['XCTest'], buildTools: ['SPM'] },
          'WinAppDriver-Java': { testRunners: ['TestNG'], buildTools: ['Maven'] },
          'WinAppDriver-Python': { testRunners: ['Pytest'], buildTools: ['pip'] },
          'WinAppDriver-C#': { testRunners: ['NUnit'], buildTools: ['NuGet'] },
          'PyAutoGUI-Python': { testRunners: ['Pytest'], buildTools: ['pip'] }
        }
      };
    }
  },

  /**
   * Generate project based on wizard configuration
   */
  async generateProject(wizardState: WizardState): Promise<GenerateProjectResponse> {
    try {
      const response = await apiClient.post<GenerateProjectResponse>('/api/v1/projects/generate', wizardState);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to generate project');
      }
      return response.data;
    } catch (error) {
      console.error('Error generating project:', error);
      throw error;
    }
  },

  /**
   * Check server health
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await apiClient.get('/health');
      return response.success;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
};

export type {
  ApiResponse,
  ValidationError,
  GenerateProjectResponse
}; 