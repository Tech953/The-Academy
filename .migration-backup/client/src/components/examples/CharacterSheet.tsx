import CharacterSheet, { Character } from '../CharacterSheet';

export default function CharacterSheetExample() {
  // Mock character data for demonstration
  const mockCharacter: Character = {
    name: "Alex Chen",
    background: "Transfer Student from Unknown Origins",
    stats: {
      intellect: 75,
      charisma: 60,
      intuition: 85,
      resilience: 50
    },
    reputation: {
      faculty: 45,
      students: 30,
      mysterious: 15
    },
    currentClass: "Introduction to Metaphysical Studies",
    energy: 65,
    maxEnergy: 100
  };

  return <CharacterSheet character={mockCharacter} />;
}