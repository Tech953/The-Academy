import AcademyMap from '../AcademyMap';

export default function AcademyMapExample() {
  return (
    <AcademyMap 
      currentLocation="Main Lobby"
      onLocationSelect={(id) => console.log('Location selected:', id)}
    />
  );
}