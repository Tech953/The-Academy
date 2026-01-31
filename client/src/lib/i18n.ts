export interface LanguageStrings {
  [key: string]: string;
}

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
  strings: LanguageStrings;
}

const LANGUAGES: Record<string, Language> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    direction: 'ltr',
    strings: {
      'boot.welcome': 'THE ACADEMY OS',
      'boot.ready': "Type 'HELP' to begin.",
      'boot.loading': 'Loading system...',
      'cmd.help': 'Available commands',
      'cmd.unknown': 'Unknown command. Type HELP for available commands.',
      'cmd.save': 'Game saved successfully.',
      'cmd.load': 'Game loaded.',
      'nav.north': 'You head north.',
      'nav.south': 'You head south.',
      'nav.east': 'You head east.',
      'nav.west': 'You head west.',
      'nav.blocked': 'You cannot go that way.',
      'inventory.empty': 'Your inventory is empty.',
      'inventory.header': 'INVENTORY',
      'stats.header': 'CHARACTER STATS',
      'textbook.header': 'TEXTBOOKS',
      'textbook.notfound': 'Textbook not found.',
      'chapter.complete': 'Chapter completed!',
      'assignment.submitted': 'Assignment submitted.',
      'accessibility.applied': 'Accessibility profile applied:',
      'accessibility.invalid': 'Invalid accessibility profile.',
      'language.changed': 'Language changed to:',
      'language.invalid': 'Language not available.',
      'glossary.header': 'GLOSSARY',
      'glossary.notfound': 'Term not found in glossary.',
      'crisis.detected': 'It sounds like you might be going through a difficult time.',
      'crisis.support': 'Support resources are available.',
      'settings.saved': 'Settings saved.',
      'error.general': 'An error occurred. Please try again.',
      'desktop.email': 'ACADEMY EMAIL',
      'desktop.messages': 'CHATLINK',
      'desktop.assignments': 'ASSIGNMENTS',
      'desktop.perks': 'PERKS VIEWER',
      'desktop.resonance': 'RESONANCE',
      'desktop.skillgraph': 'SKILL GRAPH',
      'desktop.notebook': 'NOTEBOOK',
      'desktop.progress': 'PROGRESS',
      'desktop.schedule': 'SCHEDULE',
      'desktop.schoolfiles': 'SCHOOL FILES',
      'desktop.personalfiles': 'PERSONAL FILES',
      'desktop.cub': 'CUB LINK',
      'desktop.settings': 'SETTINGS',
      'desktop.academy': 'THE ACADEMY',
      'desktop.calculator': 'CALC',
      'desktop.notepad': 'NOTES',
      'desktop.files': 'FILES',
      'desktop.personal': 'PERSONAL PROFILE',
      'desktop.memories': 'POLAROID MEMORIES',
      'desktop.notifications': 'NOTIFICATIONS'
    }
  },
  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    direction: 'ltr',
    strings: {
      'boot.welcome': 'SISTEMA ACADEMIA',
      'boot.ready': "Escribe 'AYUDA' para comenzar.",
      'boot.loading': 'Cargando sistema...',
      'cmd.help': 'Comandos disponibles',
      'cmd.unknown': 'Comando desconocido. Escribe AYUDA para ver comandos disponibles.',
      'cmd.save': 'Juego guardado exitosamente.',
      'cmd.load': 'Juego cargado.',
      'nav.north': 'Te diriges al norte.',
      'nav.south': 'Te diriges al sur.',
      'nav.east': 'Te diriges al este.',
      'nav.west': 'Te diriges al oeste.',
      'nav.blocked': 'No puedes ir por ahí.',
      'inventory.empty': 'Tu inventario está vacío.',
      'inventory.header': 'INVENTARIO',
      'stats.header': 'ESTADÍSTICAS DEL PERSONAJE',
      'textbook.header': 'LIBROS DE TEXTO',
      'textbook.notfound': 'Libro de texto no encontrado.',
      'chapter.complete': '¡Capítulo completado!',
      'assignment.submitted': 'Tarea enviada.',
      'accessibility.applied': 'Perfil de accesibilidad aplicado:',
      'accessibility.invalid': 'Perfil de accesibilidad inválido.',
      'language.changed': 'Idioma cambiado a:',
      'language.invalid': 'Idioma no disponible.',
      'glossary.header': 'GLOSARIO',
      'glossary.notfound': 'Término no encontrado en el glosario.',
      'crisis.detected': 'Parece que podrías estar pasando por un momento difícil.',
      'crisis.support': 'Hay recursos de apoyo disponibles.',
      'settings.saved': 'Configuración guardada.',
      'error.general': 'Ocurrió un error. Por favor intenta de nuevo.',
      'desktop.email': 'CORREO ACADÉMICO',
      'desktop.messages': 'MENSAJES',
      'desktop.assignments': 'TAREAS',
      'desktop.perks': 'VENTAJAS',
      'desktop.resonance': 'RESONANCIA',
      'desktop.skillgraph': 'HABILIDADES',
      'desktop.notebook': 'CUADERNO',
      'desktop.progress': 'PROGRESO',
      'desktop.schedule': 'HORARIO',
      'desktop.schoolfiles': 'ARCHIVOS ESCOLARES',
      'desktop.personalfiles': 'ARCHIVOS PERSONALES',
      'desktop.cub': 'ENLACE CUB',
      'desktop.settings': 'AJUSTES',
      'desktop.academy': 'LA ACADEMIA',
      'desktop.calculator': 'CALC',
      'desktop.notepad': 'NOTAS',
      'desktop.files': 'ARCHIVOS',
      'desktop.personal': 'PERFIL PERSONAL',
      'desktop.memories': 'RECUERDOS POLAROID',
      'desktop.notifications': 'NOTIFICACIONES'
    }
  },
  fr: {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    direction: 'ltr',
    strings: {
      'boot.welcome': "SYSTÈME DE L'ACADÉMIE",
      'boot.ready': "Tapez 'AIDE' pour commencer.",
      'boot.loading': 'Chargement du système...',
      'cmd.help': 'Commandes disponibles',
      'cmd.unknown': "Commande inconnue. Tapez AIDE pour voir les commandes disponibles.",
      'cmd.save': 'Jeu sauvegardé avec succès.',
      'cmd.load': 'Jeu chargé.',
      'nav.north': 'Vous allez vers le nord.',
      'nav.south': 'Vous allez vers le sud.',
      'nav.east': "Vous allez vers l'est.",
      'nav.west': "Vous allez vers l'ouest.",
      'nav.blocked': 'Vous ne pouvez pas aller par là.',
      'inventory.empty': 'Votre inventaire est vide.',
      'inventory.header': 'INVENTAIRE',
      'stats.header': 'STATISTIQUES DU PERSONNAGE',
      'textbook.header': 'MANUELS SCOLAIRES',
      'textbook.notfound': 'Manuel scolaire non trouvé.',
      'chapter.complete': 'Chapitre terminé!',
      'assignment.submitted': 'Devoir soumis.',
      'accessibility.applied': "Profil d'accessibilité appliqué:",
      'accessibility.invalid': "Profil d'accessibilité invalide.",
      'language.changed': 'Langue changée en:',
      'language.invalid': 'Langue non disponible.',
      'glossary.header': 'GLOSSAIRE',
      'glossary.notfound': 'Terme non trouvé dans le glossaire.',
      'crisis.detected': 'Il semble que vous traversez une période difficile.',
      'crisis.support': 'Des ressources de soutien sont disponibles.',
      'settings.saved': 'Paramètres enregistrés.',
      'error.general': 'Une erreur est survenue. Veuillez réessayer.',
      'desktop.email': 'COURRIER ACADÉMIQUE',
      'desktop.messages': 'MESSAGES',
      'desktop.assignments': 'DEVOIRS',
      'desktop.perks': 'AVANTAGES',
      'desktop.resonance': 'RÉSONANCE',
      'desktop.skillgraph': 'COMPÉTENCES',
      'desktop.notebook': 'CARNET',
      'desktop.progress': 'PROGRÈS',
      'desktop.schedule': 'EMPLOI DU TEMPS',
      'desktop.schoolfiles': 'FICHIERS SCOLAIRES',
      'desktop.personalfiles': 'FICHIERS PERSONNELS',
      'desktop.cub': 'LIEN CUB',
      'desktop.settings': 'PARAMÈTRES',
      'desktop.academy': "L'ACADÉMIE",
      'desktop.calculator': 'CALC',
      'desktop.notepad': 'NOTES',
      'desktop.files': 'FICHIERS',
      'desktop.personal': 'PROFIL PERSONNEL',
      'desktop.memories': 'SOUVENIRS POLAROÏD',
      'desktop.notifications': 'NOTIFICATIONS'
    }
  },
  de: {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    direction: 'ltr',
    strings: {
      'boot.welcome': 'AKADEMIE-SYSTEM',
      'boot.ready': "Gib 'HILFE' ein um zu beginnen.",
      'boot.loading': 'System wird geladen...',
      'cmd.help': 'Verfügbare Befehle',
      'cmd.unknown': 'Unbekannter Befehl. Gib HILFE ein für verfügbare Befehle.',
      'cmd.save': 'Spiel erfolgreich gespeichert.',
      'cmd.load': 'Spiel geladen.',
      'nav.north': 'Du gehst nach Norden.',
      'nav.south': 'Du gehst nach Süden.',
      'nav.east': 'Du gehst nach Osten.',
      'nav.west': 'Du gehst nach Westen.',
      'nav.blocked': 'Du kannst dort nicht hingehen.',
      'inventory.empty': 'Dein Inventar ist leer.',
      'inventory.header': 'INVENTAR',
      'stats.header': 'CHARAKTERWERTE',
      'textbook.header': 'LEHRBÜCHER',
      'textbook.notfound': 'Lehrbuch nicht gefunden.',
      'chapter.complete': 'Kapitel abgeschlossen!',
      'assignment.submitted': 'Aufgabe eingereicht.',
      'accessibility.applied': 'Barrierefreiheitsprofil angewendet:',
      'accessibility.invalid': 'Ungültiges Barrierefreiheitsprofil.',
      'language.changed': 'Sprache geändert zu:',
      'language.invalid': 'Sprache nicht verfügbar.',
      'glossary.header': 'GLOSSAR',
      'glossary.notfound': 'Begriff nicht im Glossar gefunden.',
      'crisis.detected': 'Es scheint, dass du eine schwierige Zeit durchmachst.',
      'crisis.support': 'Unterstützungsressourcen sind verfügbar.',
      'settings.saved': 'Einstellungen gespeichert.',
      'error.general': 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.',
      'desktop.email': 'AKADEMIE-POST',
      'desktop.messages': 'NACHRICHTEN',
      'desktop.assignments': 'AUFGABEN',
      'desktop.perks': 'VORTEILE',
      'desktop.resonance': 'RESONANZ',
      'desktop.skillgraph': 'FÄHIGKEITEN',
      'desktop.notebook': 'NOTIZBUCH',
      'desktop.progress': 'FORTSCHRITT',
      'desktop.schedule': 'STUNDENPLAN',
      'desktop.schoolfiles': 'SCHULDATEIEN',
      'desktop.personalfiles': 'PERSÖNLICHE DATEIEN',
      'desktop.cub': 'CUB-LINK',
      'desktop.settings': 'EINSTELLUNGEN',
      'desktop.academy': 'DIE AKADEMIE',
      'desktop.calculator': 'RECHNER',
      'desktop.notepad': 'NOTIZEN',
      'desktop.files': 'DATEIEN',
      'desktop.personal': 'PERSÖNLICHES PROFIL',
      'desktop.memories': 'POLAROID-ERINNERUNGEN',
      'desktop.notifications': 'BENACHRICHTIGUNGEN'
    }
  },
  zh: {
    code: 'zh',
    name: 'Chinese (Simplified)',
    nativeName: '简体中文',
    direction: 'ltr',
    strings: {
      'boot.welcome': '学院操作系统',
      'boot.ready': "输入 '帮助' 开始。",
      'boot.loading': '系统加载中...',
      'cmd.help': '可用命令',
      'cmd.unknown': '未知命令。输入 帮助 查看可用命令。',
      'cmd.save': '游戏保存成功。',
      'cmd.load': '游戏已加载。',
      'nav.north': '你向北走去。',
      'nav.south': '你向南走去。',
      'nav.east': '你向东走去。',
      'nav.west': '你向西走去。',
      'nav.blocked': '你无法往那个方向走。',
      'inventory.empty': '你的物品栏是空的。',
      'inventory.header': '物品栏',
      'stats.header': '角色属性',
      'textbook.header': '教科书',
      'textbook.notfound': '找不到教科书。',
      'chapter.complete': '章节完成！',
      'assignment.submitted': '作业已提交。',
      'accessibility.applied': '无障碍配置已应用：',
      'accessibility.invalid': '无效的无障碍配置。',
      'language.changed': '语言已更改为：',
      'language.invalid': '语言不可用。',
      'glossary.header': '词汇表',
      'glossary.notfound': '词汇表中未找到该术语。',
      'crisis.detected': '看起来你可能正在经历困难时期。',
      'crisis.support': '支持资源可用。',
      'settings.saved': '设置已保存。',
      'error.general': '发生错误，请重试。',
      'desktop.email': '学院邮箱',
      'desktop.messages': '聊天链接',
      'desktop.assignments': '作业',
      'desktop.perks': '特长查看器',
      'desktop.resonance': '共振仪表盘',
      'desktop.skillgraph': '技能图谱',
      'desktop.notebook': '笔记本',
      'desktop.progress': '进度',
      'desktop.schedule': '课程表',
      'desktop.schoolfiles': '学校文件',
      'desktop.personalfiles': '个人文件',
      'desktop.cub': 'CUB链接',
      'desktop.settings': '设置',
      'desktop.academy': '学院',
      'desktop.calculator': '计算器',
      'desktop.notepad': '便签',
      'desktop.files': '文件',
      'desktop.personal': '个人资料',
      'desktop.memories': '宝丽来回忆',
      'desktop.notifications': '通知'
    }
  }
};

export class I18nManager {
  private currentLanguage: Language;
  private fallbackLanguage: Language;

  constructor() {
    this.fallbackLanguage = LANGUAGES.en;
    this.currentLanguage = LANGUAGES.en;
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('academy-language');
      if (stored && LANGUAGES[stored]) {
        this.currentLanguage = LANGUAGES[stored];
      }
    } catch (e) {
      console.warn('Failed to load language settings:', e);
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem('academy-language', this.currentLanguage.code);
    } catch (e) {
      console.warn('Failed to save language settings:', e);
    }
  }

  setLanguage(code: string): boolean {
    const lang = LANGUAGES[code];
    if (!lang) return false;
    
    this.currentLanguage = lang;
    document.documentElement.dir = lang.direction;
    document.documentElement.lang = lang.code;
    this.saveToStorage();
    return true;
  }

  getCurrentLanguage(): Language {
    return this.currentLanguage;
  }

  getLanguageCode(): string {
    return this.currentLanguage.code;
  }

  t(key: string, replacements?: Record<string, string>): string {
    let text = this.currentLanguage.strings[key] 
      || this.fallbackLanguage.strings[key] 
      || key;
    
    if (replacements) {
      Object.entries(replacements).forEach(([placeholder, value]) => {
        text = text.replace(new RegExp(`\\{${placeholder}\\}`, 'g'), value);
      });
    }
    
    return text;
  }

  listLanguages(): Language[] {
    return Object.values(LANGUAGES);
  }

  getAvailableLanguages(): Language[] {
    return Object.values(LANGUAGES);
  }

  formatForTerminal(): string[] {
    const current = this.currentLanguage;
    const languages = this.listLanguages();
    
    return [
      '╔════════════════════════════════════════╗',
      '║         LANGUAGE SETTINGS              ║',
      '╠════════════════════════════════════════╣',
      `║ Current: ${current.nativeName} (${current.code})${' '.repeat(Math.max(0, 25 - current.nativeName.length - current.code.length))}║`,
      '╠════════════════════════════════════════╣',
      '║ Available Languages:                   ║',
      ...languages.map(l => 
        `║   ${l.code.toUpperCase()}: ${l.nativeName}${' '.repeat(Math.max(0, 32 - l.nativeName.length))}║`
      ),
      '╚════════════════════════════════════════╝',
      '',
      'Commands:',
      '  LANG <code>  - Change language (e.g., LANG ES)',
      '  LANG LIST    - Show available languages'
    ];
  }
}

export const i18nManager = new I18nManager();
