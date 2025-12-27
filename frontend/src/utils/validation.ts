export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateProjectName = (name: string): ValidationResult => {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'Project name is required' };
  }
  
  if (name.length < 2) {
    return { isValid: false, error: 'Project name must be at least 2 characters' };
  }
  
  if (name.length > 50) {
    return { isValid: false, error: 'Project name must be less than 50 characters' };
  }
  
  // Check for valid characters (alphanumeric, hyphens, underscores)
  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    return { isValid: false, error: 'Project name can only contain letters, numbers, hyphens, and underscores' };
  }
  
  return { isValid: true };
};

export const validateGroupId = (groupId: string): ValidationResult => {
  if (!groupId || groupId.trim().length === 0) {
    return { isValid: false, error: 'Group ID is required' };
  }
  
  // Check for valid Java package name format
  if (!/^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)*$/.test(groupId)) {
    return { isValid: false, error: 'Group ID must be a valid Java package name (e.g., com.company.project)' };
  }
  
  return { isValid: true };
};

export const validateArtifactId = (artifactId: string): ValidationResult => {
  if (!artifactId || artifactId.trim().length === 0) {
    return { isValid: false, error: 'Artifact ID is required' };
  }
  
  if (artifactId.length < 2) {
    return { isValid: false, error: 'Artifact ID must be at least 2 characters' };
  }
  
  // Check for valid Maven artifact ID format
  if (!/^[a-z][a-z0-9-]*$/.test(artifactId)) {
    return { isValid: false, error: 'Artifact ID must start with a letter and contain only lowercase letters, numbers, and hyphens' };
  }
  
  return { isValid: true };
};

export const validatePackageName = (packageName: string): ValidationResult => {
  if (!packageName || packageName.trim().length === 0) {
    return { isValid: false, error: 'Package name is required' };
  }
  
  // Check for valid Java package name format
  if (!/^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)*$/.test(packageName)) {
    return { isValid: false, error: 'Package name must be a valid Java package name' };
  }
  
  return { isValid: true };
};

export const validateRequired = (value: string, fieldName: string): ValidationResult => {
  if (!value || value.trim().length === 0) {
    return { isValid: false, error: `${fieldName} is required` };
  }
  
  return { isValid: true };
}; 