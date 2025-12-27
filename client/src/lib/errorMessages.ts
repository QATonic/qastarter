// Centralized error messages for consistent user communication

export const ErrorMessages = {
  // Network errors
  NETWORK_ERROR: "Unable to connect to the server. Please check your internet connection and try again.",
  TIMEOUT_ERROR: "The request took too long to complete. Please try again.",
  SERVER_ERROR: "The server encountered an error. Our team has been notified. Please try again later.",
  
  // Project generation errors
  GENERATION_FAILED: "Failed to generate your project. This might be due to an invalid configuration or server issue.",
  GENERATION_TIMEOUT: "Project generation is taking longer than expected. Please try again with a simpler configuration.",
  DOWNLOAD_FAILED: "Failed to download the project file. Please try generating it again.",
  
  // Configuration errors
  INVALID_CONFIG: "Your configuration contains invalid values. Please review your selections and try again.",
  MISSING_REQUIRED: "Some required fields are missing. Please complete all required steps.",
  INCOMPATIBLE_OPTIONS: "The selected options are not compatible with each other. Please review your choices.",
  
  // Dependencies errors
  DEPENDENCIES_LOAD_FAILED: "Failed to load project dependencies. Dependencies will be configured during generation.",
  DEPENDENCIES_INVALID: "Unable to resolve dependencies for your configuration. Please check your selections.",
  
  // Storage errors
  STORAGE_FULL: "Your browser's storage is full. Please clear some space or use a different browser.",
  STORAGE_UNAVAILABLE: "Browser storage is not available. Some features may not work properly.",
  
  // Template errors
  TEMPLATE_NOT_FOUND: "The requested template pack could not be found. Please select different options.",
  TEMPLATE_INVALID: "The template configuration is invalid. Please report this issue.",
  
  // Validation errors
  VALIDATION_FAILED: "Please fix the validation errors before proceeding.",
  STEP_INCOMPLETE: "Please complete all required fields in this step.",
};

export const ErrorTitles = {
  NETWORK: "Connection Error",
  SERVER: "Server Error",
  GENERATION: "Generation Failed",
  CONFIG: "Configuration Error",
  DEPENDENCIES: "Dependencies Error",
  STORAGE: "Storage Error",
  TEMPLATE: "Template Error",
  VALIDATION: "Validation Error",
};

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Check for specific error types
    if (error.message.includes("network") || error.message.includes("fetch")) {
      return ErrorMessages.NETWORK_ERROR;
    }
    if (error.message.includes("timeout")) {
      return ErrorMessages.TIMEOUT_ERROR;
    }
    
    // Return the error message if it's user-friendly
    if (error.message.length < 200 && !error.message.includes("undefined")) {
      return error.message;
    }
  }
  
  return ErrorMessages.SERVER_ERROR;
}

export function getErrorTitle(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes("network") || error.message.includes("fetch")) {
      return ErrorTitles.NETWORK;
    }
    if (error.message.includes("generation") || error.message.includes("generate")) {
      return ErrorTitles.GENERATION;
    }
    if (error.message.includes("validation") || error.message.includes("invalid")) {
      return ErrorTitles.VALIDATION;
    }
  }
  
  return ErrorTitles.SERVER;
}
