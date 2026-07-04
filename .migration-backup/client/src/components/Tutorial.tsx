import { useState, useCallback } from 'react';
import { ChevronRight, ChevronLeft, X, BookOpen, Compass, Users, GraduationCap, Shield, Terminal, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TutorialSection {
  id: string;
  title: string;
  icon: typeof BookOpen;
  content: TutorialPage[];
}

interface TutorialPage {
  heading: string;
  paragraphs: string[];
  commands?: { command: string; description: string }[];
  tip?: string;
}

interface TutorialProps {
  onClose: () => void;
  characterName?: string;
}

const tutorialSections: TutorialSection[] = [
  {
    id: 'welcome',
    title: 'Welcome',
    icon: BookOpen,
    content: [
      {
        heading: 'A Word Before You Begin',
        paragraphs: [
          'Listen carefully now. What you are about to undertake is no ordinary journey. The Academy stands before you, ancient and watchful, its corridors stretching into shadows that have witnessed generations pass through these very halls.',
          'This is a text-based adventure, friend. That means the world unfolds through words, through the careful rhythm of language. There are no flashy graphics here, no hand-holding. Just you, your wits, and the stories that await.',
          'Everything you need to survive, to thrive, to perhaps even uncover the deeper mysteries of this place, you will learn in the pages that follow. Take your time. Rushing has never served anyone well within these walls.',
        ],
        tip: 'The Academy remembers. Your choices, your words, your silences. All of it matters.',
      },
      {
        heading: 'The Nature of This World',
        paragraphs: [
          'The Academy is not merely a school. It is a living thing, breathing with secrets both mundane and extraordinary. One hundred and forty-four souls walk these grounds, students and faculty alike, each carrying their own stories, their own ambitions, their own shadows.',
          'You have come here for your education, yes. Your GED. But understand this: the curriculum extends far beyond mathematics and literature. There are lessons here that no textbook could ever contain.',
          'The Mother-Archive watches. Always. But whether it watches over you, or simply watches you, well. That distinction may prove important.',
        ],
      },
    ],
  },
  {
    id: 'controls',
    title: 'Controls',
    icon: Terminal,
    content: [
      {
        heading: 'Speaking to the Machine',
        paragraphs: [
          'Communication here is simple, but let me be clear about the simplicity. You type commands into the terminal. The terminal listens. The world responds. That is the fundamental contract between you and this place.',
          'You can type in plain English, naturally, as you might speak to another person. Say what you mean. Ask what you want to know. The system understands intent, not just keywords.',
          'Type "look around" or simply "look" to observe your surroundings. Type "go north" or just "north" to move. Speak to the interface as you would speak to someone who genuinely wants to help you.',
        ],
        commands: [
          { command: 'LOOK', description: 'Observe your current surroundings in detail' },
          { command: 'NORTH / SOUTH / EAST / WEST', description: 'Move in a cardinal direction' },
          { command: 'UP / DOWN', description: 'Ascend or descend stairs, elevators' },
          { command: 'ENTER [place]', description: 'Enter a specific location' },
        ],
        tip: 'You can also ask questions naturally. "What do I see?" or "Where can I go?" work just as well as formal commands.',
      },
      {
        heading: 'The Command Palette',
        paragraphs: [
          'On the right side of your screen, you will find the Command Palette. Think of it as a reference guide, a companion that lists every action available to you. If you ever forget a command, it waits there, patient.',
          'You can click any command directly to execute it. But I would encourage you to type, to engage with the terminal properly. There is something to be said for the tactile experience of spelling out your intentions.',
          'The palette organizes commands by purpose: Movement, Academic, Social, and System. Each category contains the tools specific to that aspect of your life here.',
        ],
        commands: [
          { command: 'HELP', description: 'Display all available commands' },
          { command: 'CLEAR', description: 'Clear the terminal screen' },
          { command: 'STATUS', description: 'View your character information' },
          { command: 'INVENTORY', description: 'Check what you are carrying' },
        ],
      },
      {
        heading: 'Alternative Input Methods',
        paragraphs: [
          'For those who prefer to speak rather than type, voice input stands ready. Click the microphone icon in the Command Palette, and the system will listen. Speak your command clearly, and it shall be done.',
          'You may also use keyboard shortcuts for common actions. The arrow keys navigate your command history, up for previous commands, down for more recent ones. Efficiency has its place.',
          'A controller, should you have one connected, can navigate the command palette. Use the directional inputs to select commands, and the primary button to execute. The Academy accommodates various approaches.',
        ],
        tip: 'Press the up arrow key to recall your last command. Useful when you need to repeat an action.',
      },
    ],
  },
  {
    id: 'exploration',
    title: 'Exploration',
    icon: Compass,
    content: [
      {
        heading: 'Moving Through Space',
        paragraphs: [
          'The Academy spans considerable ground. Halls connect to halls. Rooms open onto courtyards. Stairways lead to places both familiar and strange. Navigation requires attention.',
          'When you enter a new space, the terminal will describe what you see, what exits are available, who might be present. Read these descriptions carefully. Details matter here. A door mentioned in passing might lead somewhere significant.',
          'Movement commands are straightforward: north, south, east, west, up, down. But you can also enter specific locations by name. "Enter library" or "go to the cafeteria" will serve when you know your destination.',
        ],
        commands: [
          { command: 'LOOK', description: 'Examine your current location thoroughly' },
          { command: 'EXAMINE [target]', description: 'Study a specific object or person closely' },
          { command: 'SEARCH', description: 'Search the area for hidden details' },
        ],
        tip: 'Each location has its own character, its own secrets. Return to places at different times. The Academy changes.',
      },
      {
        heading: 'Observing the Details',
        paragraphs: [
          'A good observer sees what others miss. The LOOK command reveals your immediate environment, but EXAMINE allows you to focus on specifics. Examine a painting. Examine a locked door. Examine a fellow student who seems nervous.',
          'Some details reveal themselves only to those who search for them. Hidden notes. Concealed passages. Objects that seem unremarkable until you give them proper attention.',
          'The world rewards curiosity, but also punishes carelessness. Not every secret is meant to be uncovered. Not every door should be opened.',
        ],
      },
    ],
  },
  {
    id: 'social',
    title: 'Social Life',
    icon: Users,
    content: [
      {
        heading: 'The Souls of the Academy',
        paragraphs: [
          'One hundred students. Forty-four faculty and staff. Each one a complete person with their own history, their own desires, their own opinions of you. Relationships here are not accessories. They are survival.',
          'To see who shares a space with you, use the LIST command. Names and brief descriptions will appear. But knowing a name is not the same as knowing a person.',
          'TALK to people. EXAMINE them to notice details about their appearance, their mood. ASK them about topics that interest you. Every conversation teaches something, even if only about the person you are speaking with.',
        ],
        commands: [
          { command: 'LIST', description: 'See who is present in your location' },
          { command: 'TALK [name]', description: 'Initiate conversation with someone' },
          { command: 'ASK [name] ABOUT [topic]', description: 'Inquire about a specific subject' },
          { command: 'EXAMINE [name]', description: 'Observe someone carefully' },
        ],
      },
      {
        heading: 'Reputation and Standing',
        paragraphs: [
          'Three reputations define your position here. Your standing with the Faculty determines academic opportunities, access, trust. Your reputation among Students shapes your social life, alliances, friendships, rivalries.',
          'And then there is the third reputation. The Mysterious one. This measures something different. Your connection to the stranger aspects of this place. The things that happen after dark. The questions that have no official answers.',
          'Your actions shape all three. Helping a professor raises faculty standing. Sharing notes with classmates builds student reputation. And the mysterious? That reputation finds you, not the other way around.',
        ],
        commands: [
          { command: 'REPUTATION', description: 'View your current standing with all groups' },
        ],
        tip: 'Some doors only open for those with the right reputation. Choose your alliances thoughtfully.',
      },
    ],
  },
  {
    id: 'academic',
    title: 'Academics',
    icon: GraduationCap,
    content: [
      {
        heading: 'The Curriculum',
        paragraphs: [
          'Twenty-four courses await you, organized into the four pillars of the GED examination: Language Arts, Mathematics, Science, and Social Studies. Six courses per pillar. This is the structure of your days.',
          'Each course has a textbook, seven chapters deep. Each week brings new lectures. Attendance matters. Study matters. But more than that, understanding matters. The Academy does not simply want you to pass. It wants you to learn.',
          'Your academic progress affects everything. It opens doors. It closes others. Faculty notice studious pupils. Students respect those who excel. And the GED itself? That is your eventual goal, your ticket to whatever comes after.',
        ],
        commands: [
          { command: 'SCHEDULE', description: 'View your current class schedule' },
          { command: 'GRADES', description: 'Check your grades in all courses' },
          { command: 'GPA', description: 'See your overall academic standing' },
          { command: 'TRANSCRIPT', description: 'Review your complete academic record' },
        ],
      },
      {
        heading: 'Study and Attendance',
        paragraphs: [
          'Reading your textbooks is essential. Use the READ command followed by a course name to open a textbook. You will see the table of contents. Then CHAPTER followed by the course and number to read specific sections.',
          'Lectures happen weekly. Use LECTURE with a course name and week number to review lecture notes. These contain information beyond the textbooks. Perspectives. Insights. Sometimes, between the lines, warnings.',
          'ATTEND a class to participate in sessions. Active participation improves grades and builds rapport with instructors. It also, occasionally, reveals information that passive study cannot.',
        ],
        commands: [
          { command: 'READ [course]', description: 'Open a textbook and view chapters' },
          { command: 'CHAPTER [course] [number]', description: 'Read a specific chapter' },
          { command: 'LECTURE [course] [week]', description: 'Review lecture notes' },
          { command: 'ATTEND [course]', description: 'Participate in a class session' },
        ],
        tip: 'Some lectures contain hints about Academy secrets. Pay attention to what professors emphasize.',
      },
    ],
  },
  {
    id: 'survival',
    title: 'Survival',
    icon: Shield,
    content: [
      {
        heading: 'Energy and Wellness',
        paragraphs: [
          'You are not inexhaustible. Your character possesses Energy, a measure of your capacity to act. Exploration consumes it. Classes drain it. Intense conversations exhaust it. Without energy, you become vulnerable.',
          'Rest restores energy. Return to your dormitory. Find quiet spaces. Let time pass. But understand that rest also means time moves forward, and the Academy operates on schedules. Missing classes. Missing opportunities. These have consequences.',
          'Your Health represents physical condition. Most activities do not threaten it directly, but the Academy contains dangers for the unwary. Maintain both resources. They are the foundation upon which everything else stands.',
        ],
      },
      {
        heading: 'The Passage of Time',
        paragraphs: [
          'Time flows here. Morning becomes afternoon becomes evening becomes night. Each period changes what is possible. Certain locations open or close. Certain people appear or vanish. Certain events only occur when the hour is right.',
          'Use the TIME command to check the current hour. Plan accordingly. A library visit at midnight differs substantially from one at noon. A conversation with a student in the dining hall at breakfast reveals different truths than one in the dormitory after dark.',
          'Time also brings scheduled events. Classes. Meals. Social gatherings. Keeping track of these rhythms helps you navigate the Academy more effectively.',
        ],
        commands: [
          { command: 'TIME', description: 'Check the current time of day' },
          { command: 'SAVE', description: 'Save your current progress' },
          { command: 'LOAD', description: 'Restore a previous save' },
        ],
        tip: 'Night at the Academy is different. Not dangerous, necessarily, but different. Explore carefully.',
      },
    ],
  },
  {
    id: 'mystery',
    title: 'The Mystery',
    icon: Eye,
    content: [
      {
        heading: 'What Lies Beneath',
        paragraphs: [
          'I will not tell you everything. Some things you must discover for yourself. But know this: The Academy is more than it appears. Much more.',
          'The Mother-Archive is real. It watches. It remembers. Some say it speaks, to those who know how to listen. Others say it merely records, a passive observer of all that transpires within these walls.',
          'There are locked doors. Restricted sections. Faculty who grow quiet when certain topics arise. Students who disappear for days and return changed. These are not coincidences. They are threads.',
        ],
      },
      {
        heading: 'A Final Word',
        paragraphs: [
          'You have what you need now. The basics. The foundation. What you build upon it is your choice.',
          'Be observant. Be thoughtful. Be brave, when bravery is called for, but do not mistake recklessness for courage. The Academy rewards wisdom. It has little patience for fools.',
          'Your story begins now. The terminal awaits your first command. The halls stretch before you. The mystery whispers.',
          'Welcome to The Academy. I expect great things from you.',
        ],
        tip: 'Type HELP at any time to see available commands. And remember: even the smallest detail might matter.',
      },
    ],
  },
];

export default function Tutorial({ onClose, characterName }: TutorialProps) {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const currentSection = tutorialSections[currentSectionIndex];
  const currentPage = currentSection.content[currentPageIndex];
  const totalPages = tutorialSections.reduce((sum, section) => sum + section.content.length, 0);
  
  const getCurrentGlobalPage = useCallback(() => {
    let count = 0;
    for (let i = 0; i < currentSectionIndex; i++) {
      count += tutorialSections[i].content.length;
    }
    return count + currentPageIndex + 1;
  }, [currentSectionIndex, currentPageIndex]);

  const handleNext = useCallback(() => {
    if (currentPageIndex < currentSection.content.length - 1) {
      setCurrentPageIndex(prev => prev + 1);
    } else if (currentSectionIndex < tutorialSections.length - 1) {
      setCurrentSectionIndex(prev => prev + 1);
      setCurrentPageIndex(0);
    } else {
      onClose();
    }
  }, [currentPageIndex, currentSection.content.length, currentSectionIndex, onClose]);

  const handlePrev = useCallback(() => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(prev => prev - 1);
    } else if (currentSectionIndex > 0) {
      const prevSection = tutorialSections[currentSectionIndex - 1];
      setCurrentSectionIndex(prev => prev - 1);
      setCurrentPageIndex(prevSection.content.length - 1);
    }
  }, [currentPageIndex, currentSectionIndex]);

  const handleSectionJump = useCallback((sectionIndex: number) => {
    setCurrentSectionIndex(sectionIndex);
    setCurrentPageIndex(0);
  }, []);

  const isFirstPage = currentSectionIndex === 0 && currentPageIndex === 0;
  const isLastPage = currentSectionIndex === tutorialSections.length - 1 && 
                     currentPageIndex === currentSection.content.length - 1;

  const Icon = currentSection.icon;

  return (
    <div 
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      style={{ background: 'rgba(0, 0, 0, 0.85)' }}
      data-testid="tutorial-overlay"
    >
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-lg border-2"
        style={{ 
          background: 'hsl(var(--terminal-bg))',
          borderColor: 'hsl(var(--terminal-glow) / 0.4)',
          boxShadow: '0 0 40px hsl(var(--terminal-glow) / 0.15)',
        }}
        data-testid="tutorial-modal"
      >
        <div 
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: 'hsl(var(--terminal-glow) / 0.3)' }}
        >
          <div className="flex items-center gap-3">
            <Icon className="w-5 h-5" style={{ color: 'hsl(var(--terminal-glow))' }} />
            <h2 
              className="text-lg font-bold uppercase tracking-wider"
              style={{ color: 'hsl(var(--terminal-glow))' }}
            >
              {currentSection.title}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <span 
              className="text-sm opacity-60"
              style={{ color: 'hsl(var(--terminal-glow))' }}
            >
              Page {getCurrentGlobalPage()} of {totalPages}
            </span>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onClose}
              className="opacity-60 hover:opacity-100"
              style={{ color: 'hsl(var(--terminal-glow))' }}
              data-testid="button-close-tutorial"
              aria-label="Close tutorial"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="flex">
          <nav 
            className="hidden md:flex flex-col w-48 border-r py-4 shrink-0"
            style={{ borderColor: 'hsl(var(--terminal-glow) / 0.2)' }}
            aria-label="Tutorial sections"
          >
            {tutorialSections.map((section, index) => {
              const SectionIcon = section.icon;
              const isActive = index === currentSectionIndex;
              return (
                <button
                  key={section.id}
                  onClick={() => handleSectionJump(index)}
                  className={`flex items-center gap-2 px-4 py-2 text-left text-sm transition-colors ${
                    isActive ? 'opacity-100' : 'opacity-50 hover:opacity-80'
                  }`}
                  style={{ 
                    color: 'hsl(var(--terminal-glow))',
                    background: isActive ? 'hsl(var(--terminal-glow) / 0.1)' : 'transparent',
                  }}
                  data-testid={`button-section-${section.id}`}
                >
                  <SectionIcon className="w-4 h-4" />
                  <span>{section.title}</span>
                </button>
              );
            })}
          </nav>

          <div className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
            <div className="p-6 md:p-8">
              <h3 
                className="text-xl md:text-2xl font-bold mb-6 pb-3 border-b"
                style={{ 
                  color: 'hsl(120, 100%, 75%)',
                  borderColor: 'hsl(var(--terminal-glow) / 0.2)',
                }}
              >
                {currentPage.heading}
              </h3>

              <div className="space-y-5">
                {currentPage.paragraphs.map((paragraph, index) => (
                  <p 
                    key={index}
                    className="leading-relaxed text-base md:text-lg"
                    style={{ 
                      color: 'hsl(var(--terminal-glow))',
                      fontFamily: 'monospace',
                    }}
                  >
                    {paragraph.replace(/\[NAME\]/g, characterName || 'student')}
                  </p>
                ))}
              </div>

              {currentPage.commands && currentPage.commands.length > 0 && (
                <div 
                  className="mt-8 p-4 rounded border"
                  style={{ 
                    background: 'hsl(var(--terminal-glow) / 0.05)',
                    borderColor: 'hsl(var(--terminal-glow) / 0.2)',
                  }}
                >
                  <h4 
                    className="text-sm uppercase tracking-wider mb-3 opacity-70"
                    style={{ color: 'hsl(var(--terminal-glow))' }}
                  >
                    Available Commands
                  </h4>
                  <div className="space-y-2">
                    {currentPage.commands.map((cmd, index) => (
                      <div 
                        key={index}
                        className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4"
                      >
                        <code 
                          className="font-bold text-sm md:w-48 shrink-0"
                          style={{ color: 'hsl(180, 100%, 70%)' }}
                        >
                          {cmd.command}
                        </code>
                        <span 
                          className="text-sm opacity-80"
                          style={{ color: 'hsl(var(--terminal-glow))' }}
                        >
                          {cmd.description}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentPage.tip && (
                <div 
                  className="mt-6 p-4 rounded border-l-4"
                  style={{ 
                    background: 'hsl(45, 100%, 50% / 0.08)',
                    borderColor: 'hsl(45, 100%, 60%)',
                  }}
                >
                  <p 
                    className="text-sm italic"
                    style={{ color: 'hsl(45, 100%, 70%)' }}
                  >
                    {currentPage.tip}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div 
          className="flex items-center justify-between px-6 py-4 border-t"
          style={{ borderColor: 'hsl(var(--terminal-glow) / 0.3)' }}
        >
          <Button
            variant="ghost"
            onClick={handlePrev}
            disabled={isFirstPage}
            className="gap-2"
            style={{ 
              color: 'hsl(var(--terminal-glow))',
              opacity: isFirstPage ? 0.3 : 1,
            }}
            data-testid="button-prev-page"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>

          <div className="flex gap-1">
            {tutorialSections.map((section, index) => (
              <div
                key={section.id}
                className="w-2 h-2 rounded-full transition-colors"
                style={{ 
                  background: index === currentSectionIndex 
                    ? 'hsl(var(--terminal-glow))' 
                    : 'hsl(var(--terminal-glow) / 0.3)',
                }}
                aria-hidden="true"
              />
            ))}
          </div>

          <Button
            variant="ghost"
            onClick={handleNext}
            className="gap-2"
            style={{ color: 'hsl(var(--terminal-glow))' }}
            data-testid="button-next-page"
          >
            {isLastPage ? 'Begin Adventure' : 'Next'}
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
