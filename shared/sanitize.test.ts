import { describe, it, expect } from 'vitest';
import {
  sanitizeProjectName,
  sanitizeGroupId,
  sanitizeArtifactId,
  sanitizeFilePath,
  sanitizePackagePath,
  sanitizeTemplateValue,
  sanitizeXmlValue,
  sanitizeJsonValue,
  sanitizeFilename,
  sanitizeProjectConfig
} from './sanitize';

describe('sanitizeProjectName', () => {
  it('should return valid project name unchanged', () => {
    expect(sanitizeProjectName('my-project')).toBe('my-project');
    expect(sanitizeProjectName('MyProject123')).toBe('MyProject123');
    expect(sanitizeProjectName('test_project')).toBe('test_project');
  });

  it('should remove path traversal attempts', () => {
    expect(sanitizeProjectName('../../../etc/passwd')).toBe('etcpasswd');
    expect(sanitizeProjectName('..\\..\\windows')).toBe('windows');
    expect(sanitizeProjectName('project/../secret')).toBe('projectsecret');
  });

  it('should replace invalid characters with hyphens', () => {
    expect(sanitizeProjectName('my project')).toBe('my-project');
    expect(sanitizeProjectName('my@project!')).toBe('my-project');
    expect(sanitizeProjectName('project#$%name')).toBe('project-name');
  });

  it('should collapse multiple hyphens', () => {
    expect(sanitizeProjectName('my---project')).toBe('my-project');
    expect(sanitizeProjectName('a--b--c')).toBe('a-b-c');
  });

  it('should remove leading/trailing hyphens', () => {
    expect(sanitizeProjectName('-project-')).toBe('project');
    expect(sanitizeProjectName('---test---')).toBe('test');
  });

  it('should limit length to 100 characters', () => {
    const longName = 'a'.repeat(150);
    expect(sanitizeProjectName(longName).length).toBe(100);
  });

  it('should return default for empty/invalid input', () => {
    expect(sanitizeProjectName('')).toBe('my-project');
    expect(sanitizeProjectName(null as any)).toBe('my-project');
    expect(sanitizeProjectName(undefined as any)).toBe('my-project');
    expect(sanitizeProjectName('...')).toBe('my-project');
  });
});

describe('sanitizeGroupId', () => {
  it('should return valid group ID unchanged', () => {
    expect(sanitizeGroupId('com.example')).toBe('com.example');
    expect(sanitizeGroupId('org.company.project')).toBe('org.company.project');
  });

  it('should convert to lowercase', () => {
    expect(sanitizeGroupId('Com.Example')).toBe('com.example');
    expect(sanitizeGroupId('ORG.COMPANY')).toBe('org.company');
  });

  it('should remove invalid characters', () => {
    expect(sanitizeGroupId('com.example!')).toBe('com.example');
    expect(sanitizeGroupId('com@example#test')).toBe('comexampletest');
  });

  it('should ensure segments start with letter', () => {
    expect(sanitizeGroupId('com.123example')).toBe('com.x123example');
    expect(sanitizeGroupId('1com.example')).toBe('x1com.example');
  });

  it('should return default for empty/invalid input', () => {
    expect(sanitizeGroupId('')).toBe('com.example');
    expect(sanitizeGroupId(null as any)).toBe('com.example');
    expect(sanitizeGroupId('...')).toBe('com.example');
  });
});

describe('sanitizeArtifactId', () => {
  it('should return valid artifact ID unchanged', () => {
    expect(sanitizeArtifactId('my-artifact')).toBe('my-artifact');
    expect(sanitizeArtifactId('project123')).toBe('project123');
  });

  it('should convert to lowercase', () => {
    expect(sanitizeArtifactId('MyArtifact')).toBe('myartifact');
    expect(sanitizeArtifactId('PROJECT')).toBe('project');
  });

  it('should replace invalid characters with hyphens', () => {
    expect(sanitizeArtifactId('my_artifact')).toBe('my-artifact');
    expect(sanitizeArtifactId('my artifact')).toBe('my-artifact');
  });

  it('should ensure starts with letter', () => {
    expect(sanitizeArtifactId('123artifact')).toBe('x123artifact');
    expect(sanitizeArtifactId('-artifact')).toBe('artifact');
  });

  it('should return default for empty/invalid input', () => {
    expect(sanitizeArtifactId('')).toBe('my-artifact');
    expect(sanitizeArtifactId(null as any)).toBe('my-artifact');
  });
});

describe('sanitizeFilePath', () => {
  it('should return valid path unchanged', () => {
    expect(sanitizeFilePath('src/main/java')).toBe('src/main/java');
    expect(sanitizeFilePath('test/resources')).toBe('test/resources');
  });

  it('should remove path traversal attempts', () => {
    expect(sanitizeFilePath('../../../etc/passwd')).toBe('etc/passwd');
    expect(sanitizeFilePath('src/../../../secret')).toBe('src/secret');
    expect(sanitizeFilePath('..\\..\\windows\\system32')).toBe('windows/system32');
  });

  it('should normalize backslashes to forward slashes', () => {
    expect(sanitizeFilePath('src\\main\\java')).toBe('src/main/java');
    expect(sanitizeFilePath('test\\resources')).toBe('test/resources');
  });

  it('should remove absolute path indicators', () => {
    expect(sanitizeFilePath('/etc/passwd')).toBe('etc/passwd');
    expect(sanitizeFilePath('C:\\Windows\\System32')).toBe('Windows/System32');
    expect(sanitizeFilePath('D:/Projects/test')).toBe('Projects/test');
  });

  it('should remove null bytes', () => {
    expect(sanitizeFilePath('src\0/main')).toBe('src/main');
  });

  it('should collapse multiple slashes', () => {
    expect(sanitizeFilePath('src//main///java')).toBe('src/main/java');
  });

  it('should return empty string for invalid input', () => {
    expect(sanitizeFilePath('')).toBe('');
    expect(sanitizeFilePath(null as any)).toBe('');
  });
});

describe('sanitizePackagePath', () => {
  it('should convert group ID to path', () => {
    expect(sanitizePackagePath('com.example')).toBe('com/example');
    expect(sanitizePackagePath('org.company.project')).toBe('org/company/project');
  });

  it('should sanitize group ID before converting', () => {
    expect(sanitizePackagePath('Com.Example')).toBe('com/example');
    expect(sanitizePackagePath('com.123test')).toBe('com/x123test');
  });
});

describe('sanitizeTemplateValue', () => {
  it('should escape HTML entities', () => {
    expect(sanitizeTemplateValue('<script>')).toBe('&lt;script&gt;');
    expect(sanitizeTemplateValue('a & b')).toBe('a &amp; b');
    expect(sanitizeTemplateValue('"quoted"')).toBe('&quot;quoted&quot;');
  });

  it('should remove control characters', () => {
    expect(sanitizeTemplateValue('test\x00value')).toBe('testvalue');
    expect(sanitizeTemplateValue('line\x1Fbreak')).toBe('linebreak');
  });

  it('should return empty string for invalid input', () => {
    expect(sanitizeTemplateValue('')).toBe('');
    expect(sanitizeTemplateValue(null as any)).toBe('');
  });
});

describe('sanitizeXmlValue', () => {
  it('should escape XML entities', () => {
    expect(sanitizeXmlValue('<tag>')).toBe('&lt;tag&gt;');
    expect(sanitizeXmlValue('a & b')).toBe('a &amp; b');
    expect(sanitizeXmlValue("it's")).toBe('it&apos;s');
  });

  it('should preserve newlines and tabs', () => {
    expect(sanitizeXmlValue('line1\nline2')).toBe('line1\nline2');
    expect(sanitizeXmlValue('col1\tcol2')).toBe('col1\tcol2');
  });

  it('should remove other control characters', () => {
    expect(sanitizeXmlValue('test\x00value')).toBe('testvalue');
  });
});

describe('sanitizeJsonValue', () => {
  it('should escape backslashes and quotes', () => {
    expect(sanitizeJsonValue('path\\to\\file')).toBe('path\\\\to\\\\file');
    expect(sanitizeJsonValue('say "hello"')).toBe('say \\"hello\\"');
  });

  it('should remove control characters', () => {
    expect(sanitizeJsonValue('test\x00value')).toBe('testvalue');
  });

  it('should return empty string for invalid input', () => {
    expect(sanitizeJsonValue('')).toBe('');
    expect(sanitizeJsonValue(null as any)).toBe('');
  });
});

describe('Security: Path Traversal Prevention', () => {
  const maliciousInputs = [
    '../../../etc/passwd',
    '..\\..\\..\\windows\\system32\\config\\sam',
    '....//....//etc/passwd',
    '%2e%2e%2f%2e%2e%2f',
    '..%252f..%252f',
    '/etc/passwd',
    'C:\\Windows\\System32',
    '\\\\server\\share',
    'file:///etc/passwd',
    '\0../etc/passwd',
  ];

  it('should sanitize all malicious project names', () => {
    maliciousInputs.forEach(input => {
      const result = sanitizeProjectName(input);
      expect(result).not.toContain('..');
      expect(result).not.toContain('/');
      expect(result).not.toContain('\\');
      expect(result).not.toContain('\0');
    });
  });

  it('should sanitize all malicious file paths', () => {
    maliciousInputs.forEach(input => {
      const result = sanitizeFilePath(input);
      expect(result).not.toContain('..');
      expect(result).not.toMatch(/^[a-zA-Z]:/);
      expect(result).not.toMatch(/^\//);
      expect(result).not.toContain('\0');
    });
  });
});


describe('sanitizeFilename', () => {
  it('should return valid filename unchanged', () => {
    expect(sanitizeFilename('my-project.zip')).toBe('my-project.zip');
    expect(sanitizeFilename('report_2024.pdf')).toBe('report_2024.pdf');
  });

  it('should remove path separators', () => {
    expect(sanitizeFilename('../../../etc/passwd')).toBe('etcpasswd');
    expect(sanitizeFilename('path\\to\\file.txt')).toBe('pathtofile.txt');
  });

  it('should remove header injection characters', () => {
    expect(sanitizeFilename('file\r\nX-Injected: header')).toBe('fileX-Injected header');
    expect(sanitizeFilename('file"name')).toBe('filename');
    expect(sanitizeFilename('file;name')).toBe('filename');
  });

  it('should remove dangerous characters', () => {
    expect(sanitizeFilename('file<script>.txt')).toBe('filescript.txt');
    expect(sanitizeFilename('file:name?.txt')).toBe('filename.txt');
  });

  it('should limit length to 200 characters', () => {
    const longName = 'a'.repeat(250) + '.zip';
    expect(sanitizeFilename(longName).length).toBeLessThanOrEqual(200);
  });

  it('should return default for empty/invalid input', () => {
    expect(sanitizeFilename('')).toBe('download');
    expect(sanitizeFilename(null as any)).toBe('download');
  });
});

describe('sanitizeProjectConfig', () => {
  it('should sanitize all relevant fields', () => {
    const config = {
      projectName: '../malicious-name',
      groupId: 'Com.Example',
      artifactId: 'My_Artifact',
      framework: 'selenium',
      language: 'java'
    };

    const result = sanitizeProjectConfig(config);

    expect(result.projectName).toBe('malicious-name');
    expect(result.groupId).toBe('com.example');
    expect(result.artifactId).toBe('my-artifact');
    // Non-sanitized fields should remain unchanged
    expect(result.framework).toBe('selenium');
    expect(result.language).toBe('java');
  });

  it('should handle missing optional fields', () => {
    const config = {
      projectName: 'my-project',
      framework: 'playwright'
    };

    const result = sanitizeProjectConfig(config);

    expect(result.projectName).toBe('my-project');
    expect(result.groupId).toBeUndefined();
    expect(result.artifactId).toBeUndefined();
  });
});
