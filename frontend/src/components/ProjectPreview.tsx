import React from 'react';
import { Folder, File, ChevronRight, ChevronDown, Code2 } from 'lucide-react';
import { WizardState, TreeNode } from '../types/wizard';

interface ProjectPreviewProps {
  wizardState: WizardState;
}

const ProjectPreview: React.FC<ProjectPreviewProps> = ({ wizardState }) => {
  const [expandedNodes, setExpandedNodes] = React.useState<Set<string>>(new Set(['root', 'src']));

  const toggleNode = (nodePath: string) => {
    const newExpanded = new Set(expandedNodes);
    if (expandedNodes.has(nodePath)) {
      newExpanded.delete(nodePath);
    } else {
      newExpanded.add(nodePath);
    }
    setExpandedNodes(newExpanded);
  };

  const generateProjectStructure = (): TreeNode => {
    const { config, language, buildTool, integrations, scenarios } = wizardState;
    const projectName = config.projectName || 'my-qa-project';
    
    const structure: TreeNode = {
      name: projectName,
      type: 'folder',
      children: []
    };

    // Add build files
    if (buildTool === 'Maven') {
      structure.children?.push({ name: 'pom.xml', type: 'file' });
    } else if (buildTool === 'Gradle') {
      structure.children?.push({ name: 'build.gradle', type: 'file' });
    } else if (buildTool === 'NPM' || buildTool === 'Yarn') {
      structure.children?.push({ name: 'package.json', type: 'file' });
    } else if (buildTool === 'NuGet') {
      structure.children?.push({ name: 'packages.config', type: 'file' });
    }

    structure.children?.push({ name: 'README.md', type: 'file' });

    // Add source structure
    const srcFolder: TreeNode = { name: 'src', type: 'folder', children: [] };
    
    if (language === 'Java') {
      const packagePath = config.packageName?.replace(/\./g, '/') || 'com/qastarter/demo';
      srcFolder.children?.push({
        name: 'main',
        type: 'folder',
        children: [
          {
            name: 'java',
            type: 'folder',
            children: [
              {
                name: packagePath.split('/')[0],
                type: 'folder',
                children: [
                  {
                    name: packagePath.split('/')[1],
                    type: 'folder',
                    children: [
                      {
                        name: packagePath.split('/')[2],
                        type: 'folder',
                        children: [
                          { name: 'pages', type: 'folder', children: [
                            { name: 'LoginPage.java', type: 'file' }
                          ]},
                          { name: 'utils', type: 'folder', children: [
                            { name: 'WebDriverManager.java', type: 'file' }
                          ]}
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      });
      
      srcFolder.children?.push({
        name: 'test',
        type: 'folder',
        children: [
          {
            name: 'java',
            type: 'folder',
            children: [
              {
                name: packagePath.split('/')[0],
                type: 'folder',
                children: [
                  {
                    name: packagePath.split('/')[1],
                    type: 'folder',
                    children: [
                      {
                        name: packagePath.split('/')[2],
                        type: 'folder',
                        children: [
                          { name: 'tests', type: 'folder', children: 
                            scenarios.map(scenario => ({ name: `${scenario}Test.java`, type: 'file' as const }))
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      });
    } else if (language === 'Python') {
      srcFolder.children?.push({
        name: 'tests',
        type: 'folder',
        children: scenarios.map(scenario => ({ name: `test_${scenario.toLowerCase().replace(/\s+/g, '_')}.py`, type: 'file' as const }))
      });
      srcFolder.children?.push({
        name: 'pages',
        type: 'folder',
        children: [{ name: 'login_page.py', type: 'file' }]
      });
    } else if (language === 'JavaScript' || language === 'TypeScript') {
      const extension = language === 'TypeScript' ? 'ts' : 'js';
      srcFolder.children?.push({
        name: 'tests',
        type: 'folder',
        children: scenarios.map(scenario => ({ name: `${scenario.toLowerCase().replace(/\s+/g, '-')}.test.${extension}`, type: 'file' as const }))
      });
      srcFolder.children?.push({
        name: 'pages',
        type: 'folder',
        children: [{ name: `loginPage.${extension}`, type: 'file' }]
      });
    } else if (language === 'C#') {
      srcFolder.children?.push({
        name: 'Tests',
        type: 'folder',
        children: scenarios.map(scenario => ({ name: `${scenario}Test.cs`, type: 'file' as const }))
      });
      srcFolder.children?.push({
        name: 'Pages',
        type: 'folder',
        children: [{ name: 'LoginPage.cs', type: 'file' }]
      });
    }

    structure.children?.push(srcFolder);

    // Add resources
    structure.children?.push({
      name: 'resources',
      type: 'folder',
      children: [
        { name: 'config.properties', type: 'file' },
        { name: 'test-data.json', type: 'file' }
      ]
    });

    // Add reports folder
    if (integrations.reporting) {
      structure.children?.push({
        name: 'reports',
        type: 'folder',
        children: [
          { name: `${integrations.reporting.replace(/\s+/g, '')}.html`, type: 'file' }
        ]
      });
    }

    // Add integration files
    if (integrations.others.includes('Docker')) {
      structure.children?.push({
        name: 'docker',
        type: 'folder',
        children: [{ name: 'Dockerfile', type: 'file' }]
      });
    }

    if (integrations.cicd === 'GitHub Actions') {
      structure.children?.push({
        name: '.github',
        type: 'folder',
        children: [
          {
            name: 'workflows',
            type: 'folder',
            children: [{ name: 'ci.yml', type: 'file' }]
          }
        ]
      });
    } else if (integrations.cicd === 'Azure Pipeline') {
      structure.children?.push({ name: 'azure-pipelines.yml', type: 'file' });
    } else if (integrations.cicd === 'Jenkins') {
      structure.children?.push({ name: 'Jenkinsfile', type: 'file' });
    }

    return structure;
  };

  const renderTree = (node: TreeNode, level: number = 0, path: string = 'root'): React.ReactNode => {
    const currentPath = `${path}/${node.name}`;
    const isExpanded = expandedNodes.has(currentPath);
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={currentPath} className="select-none">
        <div
          className={`flex items-center space-x-3 py-2 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 cursor-pointer transition-all duration-200 group ${
            hasChildren ? 'hover:shadow-sm' : ''
          }`}
          style={{ paddingLeft: `${level * 20 + 12}px` }}
          onClick={() => hasChildren && toggleNode(currentPath)}
        >
          {hasChildren && (
            <button className="flex items-center justify-center w-5 h-5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors duration-150">
              {isExpanded ? (
                <ChevronDown size={14} className="text-slate-600 dark:text-slate-400" />
              ) : (
                <ChevronRight size={14} className="text-slate-600 dark:text-slate-400" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-5" />}
          
          {node.type === 'folder' ? (
            <Folder size={18} className="text-blue-500 dark:text-blue-400 group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors duration-150" />
          ) : (
            <File size={18} className="text-slate-500 dark:text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors duration-150" />
          )}
          
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors duration-150">
            {node.name}
          </span>
        </div>
        
        {hasChildren && isExpanded && (
          <div className="animate-fade-in">
            {node.children?.map(child => renderTree(child, level + 1, currentPath))}
          </div>
        )}
      </div>
    );
  };

  const projectStructure = generateProjectStructure();

  return (
    <div className="card animate-slide-up">
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-2 h-6 gradient-primary rounded-full"></div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Project Structure Preview</h3>
          <Code2 size={20} className="text-blue-500 dark:text-blue-400" />
        </div>
        
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 max-h-96 overflow-y-auto border border-slate-200 dark:border-slate-700">
          <div className="font-mono text-sm">
            {renderTree(projectStructure)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectPreview;