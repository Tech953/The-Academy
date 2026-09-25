import AcademyScene from './AcademyScene';
import { ACADEMY_SCENES } from './sceneData';

export function Scene02Student() {
  return <AcademyScene scene={ACADEMY_SCENES[1]} index={1} />;
}