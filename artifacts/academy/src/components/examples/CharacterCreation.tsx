import CharacterCreation from '../CharacterCreation';

export default function CharacterCreationExample() {
  return (
    <CharacterCreation 
      onComplete={(character) => console.log('Character created:', character)}
    />
  );
}