import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText, Folder, FolderOpen, Eye, AlertCircle,
  ChevronDown, ChevronRight, HardDrive, Package, FileCheck2,
  FileCode, FileJson, FileImage, Terminal, Settings, Database, Braces
} from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface ProjectFile {
  name: string;
  type: 'file' | 'folder';
  content?: string;
  children?: ProjectFile[];
}

interface ProjectPreviewProps {
  projectName: string;
  configuration: Record<string, any>;
  onDownload: () => void;
  isGenerating?: boolean;
  hideDownloadButton?: boolean;
}

export default function ProjectPreview({
  projectName,
  configuration,
  onDownload,
  isGenerating = false,
  hideDownloadButton = false
}: ProjectPreviewProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // Fetch real project preview data based on user configuration
  const { data: previewData, isLoading, error } = useQuery({
    queryKey: ['/api/project-preview', configuration],
    queryFn: async () => {
      const response = await apiRequest('POST', '/api/project-preview', configuration);
      return await response.json();
    },
    enabled: !!configuration && Object.keys(configuration).length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1
  });

  const projectStructure = previewData?.data?.projectStructure || [];
  const sampleFiles = previewData?.data?.sampleFiles || [];
  const totalFiles = previewData?.data?.totalFiles || 0;
  const estimatedSize = previewData?.data?.estimatedSize || 0;
  const keyFiles = previewData?.data?.keyFiles || [];
  const dependencyCount = previewData?.data?.dependencyCount || 0;

  // Handle folder expand/collapse
  const toggleFolder = (folderPath: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderPath)) {
      newExpanded.delete(folderPath);
    } else {
      newExpanded.add(folderPath);
    }
    setExpandedFolders(newExpanded);
  };

  // VS Code-style File Icon Helper
  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();

    switch (ext) {
      case 'ts':
      case 'tsx':
        return <FileCode className="w-4 h-4 text-blue-500 flex-shrink-0" />;
      case 'js':
      case 'jsx':
        return <FileCode className="w-4 h-4 text-yellow-500 flex-shrink-0" />;
      case 'json':
        return <FileJson className="w-4 h-4 text-yellow-700 flex-shrink-0" />;
      case 'java':
      case 'class':
        return <FileCode className="w-4 h-4 text-red-500 flex-shrink-0" />;
      case 'py':
        return <FileCode className="w-4 h-4 text-blue-400 flex-shrink-0" />;
      case 'cs':
        return <FileCode className="w-4 h-4 text-green-600 flex-shrink-0" />;
      case 'xml':
      case 'html':
        return <FileCode className="w-4 h-4 text-orange-500 flex-shrink-0" />;
      case 'css':
      case 'scss':
        return <FileCode className="w-4 h-4 text-blue-300 flex-shrink-0" />;
      case 'md':
      case 'txt':
        return <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />;
      case 'yml':
      case 'yaml':
        return <Settings className="w-4 h-4 text-purple-500 flex-shrink-0" />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'svg':
        return <FileImage className="w-4 h-4 text-pink-500 flex-shrink-0" />;
      case 'sql':
        return <Database className="w-4 h-4 text-yellow-600 flex-shrink-0" />;
      case 'sh':
      case 'bat':
        return <Terminal className="w-4 h-4 text-green-500 flex-shrink-0" />;
      case 'gradle':
      case 'properties':
      case 'gitignore':
        return <Settings className="w-4 h-4 text-gray-600 flex-shrink-0" />;
      default:
        return <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />;
    }
  };

  const handleFileClick = (file: ProjectFile, fullPath: string = '') => {
    if (file.type === 'file') {
      // First try to get content from the file itself
      if (file.content) {
        setSelectedFile(file.content);
        return;
      }

      // If no content, try to find it in sample files
      const sampleFile = sampleFiles.find((sf: any) =>
        sf.path.endsWith(file.name) || sf.path.includes(fullPath)
      );

      if (sampleFile) {
        setSelectedFile(sampleFile.content);
      } else {
        setSelectedFile(`// File: ${file.name}\n// Click "Generate and Download Project" to see the full content`);
      }
    } else {
      // If it's a folder, toggle its expanded state
      toggleFolder(fullPath);
    }
  };

  const renderFileTree = (files: ProjectFile[], depth = 0, parentPath = '') => {
    return files.map((file, index) => {
      const currentPath = parentPath ? `${parentPath}/${file.name}` : file.name;
      const isExpanded = expandedFolders.has(currentPath);
      const hasChildren = file.type === 'folder' && file.children && file.children.length > 0;

      // Determine if this file is currently being viewed
      // Note: We'd need to track selectedFilePath logic ideally, but checking content is a proxy for now
      // Let's improve this by storing selectedPath in state instead of just content, but sticking to simple UI for now.

      return (
        <div key={index}>
          <div
            className={`
              flex items-center space-x-1 py-1 px-2 cursor-pointer text-sm font-mono
              ${file.type === 'file' ? 'hover:bg-accent hover:text-accent-foreground' : 'hover:bg-muted/50'}
              rounded-sm transition-colors duration-200
            `}
            style={{ paddingLeft: `${depth * 12 + 8}px` }}
            onClick={() => handleFileClick(file, currentPath)}
            data-testid={`${file.type}-${file.name}`}
          >
            {/* Expand/collapse chevron for folders with children */}
            {file.type === 'folder' && hasChildren ? (
              isExpanded ? (
                <ChevronDown className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              ) : (
                <ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              )
            ) : (
              <div className="w-3 h-3 flex-shrink-0" /> /* Spacer for alignment */
            )}

            {/* File/folder icon */}
            {file.type === 'folder' ? (
              isExpanded ? (
                <FolderOpen className="w-4 h-4 text-blue-500 flex-shrink-0" />
              ) : (
                <Folder className="w-4 h-4 text-blue-500 flex-shrink-0" />
              )
            ) : (
              getFileIcon(file.name)
            )}

            <span className="truncate">{file.name}</span>
          </div>

          {/* Render children only if folder is expanded */}
          {file.type === 'folder' && file.children && isExpanded && (
            <div className="border-l border-border/50 ml-3">
              {renderFileTree(file.children, depth + 1, currentPath)}
            </div>
          )}
        </div>
      );
    });
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Eye className="w-5 h-5" />
              <span>Project Preview</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Project Structure</h3>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4 ml-4" />
                  <Skeleton className="h-4 w-1/2 ml-8" />
                  <Skeleton className="h-4 w-2/3 ml-4" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium mb-2">File Preview</h3>
                <Skeleton className="h-64 w-full" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-4 w-1/3 mb-4" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <span>Preview Unavailable</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-48 text-muted-foreground">
              <div className="text-center space-y-3">
                <AlertCircle className="w-10 h-10 mx-auto text-muted-foreground/50" />
                <div>
                  <p className="text-sm font-medium">Unable to load project preview</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Don't worry - your project will still generate correctly when you download it.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Format size in KB or MB
  const formatSize = (sizeKB: number) => {
    if (sizeKB > 1024) {
      return `${(sizeKB / 1024).toFixed(2)} MB`;
    }
    return `${sizeKB} KB`;
  };

  return (
    <div className="space-y-4">
      {/* Project Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <HardDrive className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Estimated Size</p>
                  <p className="text-lg font-semibold" data-testid="text-estimated-size">
                    {estimatedSize > 0 ? formatSize(estimatedSize) : '~'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileCheck2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Key Files</p>
                  <p className="text-lg font-semibold" data-testid="text-key-files">
                    {keyFiles.length}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Files</p>
                  <p className="text-lg font-semibold" data-testid="text-total-files">
                    {totalFiles}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Dependencies</p>
                  <p className="text-lg font-semibold" data-testid="text-dependencies">
                    {dependencyCount}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Eye className="w-5 h-5" />
            <span>Project Preview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {/* File Tree */}
            <div>
              <h3 className="text-sm font-medium mb-2">Project Structure</h3>
              <ScrollArea className="h-64 border rounded-md p-2">
                {projectStructure.length > 0 ? (
                  renderFileTree(projectStructure)
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    Project structure will appear here
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* File Content */}
            <div>
              <h3 className="text-sm font-medium mb-2">File Preview</h3>
              <ScrollArea className="h-64 border rounded-md p-2">
                {selectedFile ? (
                  <pre className="text-xs font-mono whitespace-pre-wrap">
                    {selectedFile}
                  </pre>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    Click on a file to preview its content
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}