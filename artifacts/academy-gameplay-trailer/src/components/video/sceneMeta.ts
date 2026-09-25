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
  archive: { title: 'Central Plaza', filePath: 'src/components/video/LiveFootageScene.tsx' },
  student: { title: 'Find Your Bearings', filePath: 'src/components/video/LiveFootageScene.tsx' },
  alignment: { title: 'Student Status', filePath: 'src/components/video/LiveFootageScene.tsx' },
  campus: { title: 'People Nearby', filePath: 'src/components/video/LiveFootageScene.tsx' },
  commands: { title: 'Live Conversations', filePath: 'src/components/video/LiveFootageScene.tsx' },
  people: { title: 'Explore the Campus', filePath: 'src/components/video/LiveFootageScene.tsx' },
  confluence: { title: 'Study and Progress', filePath: 'src/components/video/LiveFootageScene.tsx' },
  courses: { title: 'Desktop Gameplay', filePath: 'src/components/video/LiveFootageScene.tsx' },
  practice: { title: 'Desktop to Mobile', filePath: 'src/components/video/LiveFootageScene.tsx' },
  mastery: { title: 'Mobile Adventure', filePath: 'src/components/video/LiveFootageScene.tsx' },
  notebook: { title: 'Faculty on Mobile', filePath: 'src/components/video/LiveFootageScene.tsx' },
  radiant: { title: 'Study and Student File', filePath: 'src/components/video/LiveFootageScene.tsx' },
  character: { title: 'Review the Student File', filePath: 'src/components/video/LiveFootageScene.tsx' },
  mobile: { title: 'Return to the Companion', filePath: 'src/components/video/LiveFootageScene.tsx' },
  finale: { title: 'TheeAcademy', filePath: 'src/components/video/LiveFootageScene.tsx' },
};
