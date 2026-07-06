import TextCharacterCreation from '../TextCharacterCreation';

export default function TextCharacterCreationExample() {
  return (
    <TextCharacterCreation 
      onComplete={(character) => console.log('Character created:', character)}
    />
  );
}