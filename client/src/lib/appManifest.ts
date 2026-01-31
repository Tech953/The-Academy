export type AppUIMode = 'cli' | 'window' | 'both';
export type PerformanceTier = 'low' | 'mid' | 'high';

export interface AppManifest {
  id: string;
  name: string;
  command: string;
  description: string;
  version: string;
  permissions: string[];
  uiMode: AppUIMode;
  lowSpecCompatible: boolean;
  icon: string;
  category: 'system' | 'productivity' | 'communication' | 'education' | 'utility';
  author: string;
  windowConfig?: {
    defaultWidth: number;
    defaultHeight: number;
    resizable: boolean;
    minWidth?: number;
    minHeight?: number;
  };
}

export const SYSTEM_APPS: AppManifest[] = [
  {
    id: 'terminal',
    name: 'Terminal',
    command: 'term',
    description: 'Command-line interface for system access',
    version: '1.0.0',
    permissions: ['system', 'filesystem'],
    uiMode: 'both',
    lowSpecCompatible: true,
    icon: 'terminal',
    category: 'system',
    author: 'MOTHER-ARCHIVE',
    windowConfig: {
      defaultWidth: 600,
      defaultHeight: 400,
      resizable: true,
      minWidth: 400,
      minHeight: 300
    }
  },
  {
    id: 'file-manager',
    name: 'File Manager',
    command: 'files',
    description: 'Browse and manage files',
    version: '1.0.0',
    permissions: ['filesystem'],
    uiMode: 'both',
    lowSpecCompatible: true,
    icon: 'folder',
    category: 'system',
    author: 'MOTHER-ARCHIVE',
    windowConfig: {
      defaultWidth: 700,
      defaultHeight: 500,
      resizable: true,
      minWidth: 400,
      minHeight: 300
    }
  },
  {
    id: 'calculator',
    name: 'Calculator',
    command: 'calc',
    description: 'Basic arithmetic calculator',
    version: '1.0.0',
    permissions: ['math'],
    uiMode: 'both',
    lowSpecCompatible: true,
    icon: 'calculator',
    category: 'utility',
    author: 'MOTHER-ARCHIVE',
    windowConfig: {
      defaultWidth: 280,
      defaultHeight: 400,
      resizable: false
    }
  },
  {
    id: 'notes',
    name: 'Notes',
    command: 'notes',
    description: 'Personal note-taking application',
    version: '1.0.0',
    permissions: ['filesystem'],
    uiMode: 'window',
    lowSpecCompatible: true,
    icon: 'file-text',
    category: 'productivity',
    author: 'MOTHER-ARCHIVE',
    windowConfig: {
      defaultWidth: 500,
      defaultHeight: 400,
      resizable: true,
      minWidth: 300,
      minHeight: 200
    }
  },
  {
    id: 'browser',
    name: 'Academy Browser',
    command: 'browser',
    description: 'Internal network browser',
    version: '1.0.0',
    permissions: ['network'],
    uiMode: 'window',
    lowSpecCompatible: false,
    icon: 'globe',
    category: 'communication',
    author: 'MOTHER-ARCHIVE',
    windowConfig: {
      defaultWidth: 800,
      defaultHeight: 600,
      resizable: true,
      minWidth: 400,
      minHeight: 300
    }
  },
  {
    id: 'mail',
    name: 'Academy Mail',
    command: 'mail',
    description: 'Internal email client',
    version: '1.0.0',
    permissions: ['network', 'filesystem'],
    uiMode: 'window',
    lowSpecCompatible: true,
    icon: 'mail',
    category: 'communication',
    author: 'MOTHER-ARCHIVE',
    windowConfig: {
      defaultWidth: 700,
      defaultHeight: 500,
      resizable: true,
      minWidth: 500,
      minHeight: 400
    }
  },
  {
    id: 'messages',
    name: 'ChatLink',
    command: 'chat',
    description: 'Real-time messaging system',
    version: '1.0.0',
    permissions: ['network'],
    uiMode: 'window',
    lowSpecCompatible: true,
    icon: 'message-circle',
    category: 'communication',
    author: 'MOTHER-ARCHIVE',
    windowConfig: {
      defaultWidth: 400,
      defaultHeight: 500,
      resizable: true,
      minWidth: 300,
      minHeight: 400
    }
  },
  {
    id: 'settings',
    name: 'Settings',
    command: 'settings',
    description: 'System configuration',
    version: '1.0.0',
    permissions: ['system'],
    uiMode: 'window',
    lowSpecCompatible: true,
    icon: 'settings',
    category: 'system',
    author: 'MOTHER-ARCHIVE',
    windowConfig: {
      defaultWidth: 600,
      defaultHeight: 500,
      resizable: true,
      minWidth: 400,
      minHeight: 400
    }
  },
  {
    id: 'textbook-viewer',
    name: 'Textbook Viewer',
    command: 'textbook',
    description: 'Educational content viewer',
    version: '1.0.0',
    permissions: ['filesystem', 'education'],
    uiMode: 'window',
    lowSpecCompatible: true,
    icon: 'book-open',
    category: 'education',
    author: 'MOTHER-ARCHIVE',
    windowConfig: {
      defaultWidth: 800,
      defaultHeight: 600,
      resizable: true,
      minWidth: 500,
      minHeight: 400
    }
  },
  {
    id: 'assignment-portal',
    name: 'Assignment Portal',
    command: 'assignments',
    description: 'View and submit assignments',
    version: '1.0.0',
    permissions: ['filesystem', 'education'],
    uiMode: 'window',
    lowSpecCompatible: true,
    icon: 'clipboard-list',
    category: 'education',
    author: 'MOTHER-ARCHIVE',
    windowConfig: {
      defaultWidth: 700,
      defaultHeight: 500,
      resizable: true,
      minWidth: 500,
      minHeight: 400
    }
  }
];

class AppRegistry {
  private apps: Map<string, AppManifest> = new Map();
  private commandMap: Map<string, string> = new Map();

  constructor() {
    SYSTEM_APPS.forEach(app => {
      this.apps.set(app.id, app);
      this.commandMap.set(app.command, app.id);
    });
  }

  getApp(id: string): AppManifest | undefined {
    return this.apps.get(id);
  }

  getAppByCommand(command: string): AppManifest | undefined {
    const id = this.commandMap.get(command);
    return id ? this.apps.get(id) : undefined;
  }

  getAllApps(): AppManifest[] {
    return Array.from(this.apps.values());
  }

  getAppsByCategory(category: AppManifest['category']): AppManifest[] {
    return this.getAllApps().filter(app => app.category === category);
  }

  getLowSpecApps(): AppManifest[] {
    return this.getAllApps().filter(app => app.lowSpecCompatible);
  }

  getCommands(): string[] {
    return Array.from(this.commandMap.keys());
  }

  registerApp(manifest: AppManifest): void {
    this.apps.set(manifest.id, manifest);
    this.commandMap.set(manifest.command, manifest.id);
  }

  unregisterApp(id: string): void {
    const app = this.apps.get(id);
    if (app) {
      this.commandMap.delete(app.command);
      this.apps.delete(id);
    }
  }
}

export const appRegistry = new AppRegistry();
