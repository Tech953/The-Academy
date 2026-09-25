// Optional scene metadata for Replit workspace integrations. When the
// workspace's scene controls are enabled for this project, a viewer's click on
// a scene segment scopes their next chat request to that scene's source file.
// Fill one entry per SCENE_DURATIONS key in VideoTemplate.tsx only when a
// skill reference asks for it; otherwise leave the map empty. Scenes missing
// from the map still play and can be jumped to.
//
// Example:
//   export const SCENE_DETAILS: Record<string, SceneDetails> = {
//     open: { title: 'Intro', filePath: 'src/components/video/video_scenes/Scene1.tsx' },
//   };

export interface SceneDetails {
  title: string;
  filePath: string;
}

export const SCENE_DETAILS: Record<string, SceneDetails> = {
  archive: { title: 'Archive Online', filePath: 'src/components/video/scenes/Scene01Archive.tsx' },
  student: { title: 'Build Your Student', filePath: 'src/components/video/scenes/Scene02Student.tsx' },
  alignment: { title: 'Choose an Alignment', filePath: 'src/components/video/scenes/Scene03Alignment.tsx' },
  campus: { title: 'Explore the Campus', filePath: 'src/components/video/scenes/Scene04Campus.tsx' },
  commands: { title: 'Type. Look. Go.', filePath: 'src/components/video/scenes/Scene05Commands.tsx' },
  people: { title: 'People and Reputation', filePath: 'src/components/video/scenes/Scene06People.tsx' },
  confluence: { title: 'Confluence Hall', filePath: 'src/components/video/scenes/Scene07Confluence.tsx' },
  courses: { title: 'Choose a Course', filePath: 'src/components/video/scenes/Scene08Courses.tsx' },
  practice: { title: 'Practice and Learn', filePath: 'src/components/video/scenes/Scene09Practice.tsx' },
  mastery: { title: 'Track Your Progress', filePath: 'src/components/video/scenes/Scene10Mastery.tsx' },
  notebook: { title: 'Research Notebook', filePath: 'src/components/video/scenes/Scene11Notebook.tsx' },
  radiant: { title: 'Radiant AI', filePath: 'src/components/video/scenes/Scene12Radiant.tsx' },
  character: { title: 'Character Growth', filePath: 'src/components/video/scenes/Scene13Character.tsx' },
  mobile: { title: 'The Mobile Companion', filePath: 'src/components/video/scenes/Scene14Mobile.tsx' },
  finale: { title: 'The Academy', filePath: 'src/components/video/scenes/Scene15Finale.tsx' },
};
