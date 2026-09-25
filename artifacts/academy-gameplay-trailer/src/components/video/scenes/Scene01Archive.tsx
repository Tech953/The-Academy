import AcademyScene from './AcademyScene';
import { ACADEMY_SCENES } from './sceneData';

export function Scene01Archive() {
  return <AcademyScene scene={ACADEMY_SCENES[0]} index={0} />;
}