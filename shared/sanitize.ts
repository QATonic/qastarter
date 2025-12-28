/**
 * Input Sanitization Utilities for QAStarter
 * Prevents path traversal attacks and ensures safe file system operations
 */

/**
 * Sanitize project name for safe file system usage
 * - Removes path traversal characters
 * - Replaces invalid characters with hyphens
 * - Limits length to prevent issues
 */
export function sanitizeProjectName(name: string): string {
  if (!name || typeof name !== 'string') {
    return 'my-project';
  }

  return name
    // Remove path traversal attempts
    .replace(/\.\./g, '')
    .replace(/[\/\\]/g, '')
    // Replace invalid characters with hyphens
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    // Collapse multiple hyphens
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
    // Limit length
    .substring(0, 100)
    // Ensure not empty after sanitization
    || 'my-project';
}

/**
 * Sanitize group ID (Java package naming convention)
 * - Must start with letter
 * - Only letters, numbers, dots allowed
 * - Each segment must start with lowercase letter
 */
export function sanitizeGroupId(groupId: string): string {
  if (!groupId || typeof groupId !== 'string') {
    return 'com.example';
  }

  // Split by dots and sanitize each segment
  const segments = groupId
    .toLowerCase()
    .split('.')
    .map(segment => {
      // Remove invalid characters
      let clean = segment.replace(/[^a-z0-9]/g, '');
      // Ensure starts with letter
      if (clean && !/^[a-z]/.test(clean)) {
        clean = 'x' + clean;
      }
      return clean;
    })
    .filter(segment => segment.length > 0);

  return segments.length > 0 ? segments.join('.') : 'com.example';
}

/**
 * Sanitize artifact ID (Maven artifact naming convention)
 * - Lowercase letters, numbers, hyphens only
 * - Must start with letter
 */
export function sanitizeArtifactId(artifactId: string): string {
  if (!artifactId || typeof artifactId !== 'string') {
    return 'my-artifact';
  }

  let clean = artifactId
    .toLowerCase()
    // Replace invalid characters with hyphens
    .replace(/[^a-z0-9-]/g, '-')
    // Collapse multiple hyphens
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
    // Limit length
    .substring(0, 100);

  // Ensure starts with letter
  if (clean && !/^[a-z]/.test(clean)) {
    clean = 'x' + clean;
  }

  return clean || 'my-artifact';
}

/**
 * Sanitize file path to prevent path traversal
 * - Removes .. sequences
 * - Normalizes slashes
 * - Removes absolute path indicators
 */
export function sanitizeFilePath(path: string): string {
  if (!path || typeof path !== 'string') {
    return '';
  }

  return path
    // Normalize slashes to forward slash
    .replace(/\\/g, '/')
    // Remove path traversal attempts
    .replace(/\.\./g, '')
    // Remove absolute path indicators
    .replace(/^[a-zA-Z]:/, '')
    .replace(/^\/+/, '')
    // Remove null bytes
    .replace(/\0/g, '')
    // Collapse multiple slashes
    .replace(/\/+/g, '/')
    // Remove leading/trailing slashes
    .replace(/^\/+|\/+$/g, '');
}

/**
 * Sanitize package path (converts group ID to directory path)
 */
export function sanitizePackagePath(groupId: string): string {
  const sanitizedGroupId = sanitizeGroupId(groupId);
  return sanitizedGroupId.replace(/\./g, '/');
}

/**
 * Validate and sanitize a string to be safe for use in templates
 * - Escapes HTML entities
 * - Removes control characters
 */
export function sanitizeTemplateValue(value: string): string {
  if (!value || typeof value !== 'string') {
    return '';
  }

  return value
    // Remove control characters
    .replace(/[\x00-\x1F\x7F]/g, '')
    // Escape HTML entities for safety in generated files
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Sanitize a string for use in XML/POM files
 */
export function sanitizeXmlValue(value: string): string {
  if (!value || typeof value !== 'string') {
    return '';
  }

  return value
    // Remove control characters except newline and tab
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Escape XML entities
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Sanitize a string for use in JSON
 */
export function sanitizeJsonValue(value: string): string {
  if (!value || typeof value !== 'string') {
    return '';
  }

  return value
    // Remove control characters
    .replace(/[\x00-\x1F\x7F]/g, '')
    // Escape backslashes and quotes
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"');
}


/**
 * Sanitize filename for use in HTTP Content-Disposition header
 * - Removes characters that could cause header injection
 * - Ensures safe filename for downloads
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') {
    return 'download';
  }

  return filename
    // Remove path traversal attempts
    .replace(/\.\./g, '')
    // Remove path separators
    .replace(/[\/\\]/g, '')
    // Remove characters that could cause header injection
    .replace(/[\r\n\t]/g, '')
    // Remove quotes and semicolons (header delimiters)
    .replace(/[";]/g, '')
    // Remove other potentially dangerous characters
    .replace(/[<>:|?*]/g, '')
    // Limit length
    .substring(0, 200)
    || 'download';
}

/**
 * Sanitize all fields in a project config object
 * Returns a new object with sanitized values
 */
export function sanitizeProjectConfig(config: {
  projectName: string;
  groupId?: string;
  artifactId?: string;
  [key: string]: any;
}): typeof config {
  return {
    ...config,
    projectName: sanitizeProjectName(config.projectName),
    groupId: config.groupId ? sanitizeGroupId(config.groupId) : undefined,
    artifactId: config.artifactId ? sanitizeArtifactId(config.artifactId) : undefined,
  };
}
