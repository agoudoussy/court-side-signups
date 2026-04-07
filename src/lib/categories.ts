export function getAgeCategory(birthDate: string): { age: number; category: string } | null {
  if (!birthDate) return null;
  const [y, mo, d] = birthDate.split("-").map(Number);
  const birth = new Date(y, mo - 1, d);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  
  if (age < 5 || age > 18) return null;
  
  let category = "U8";
  if (age <= 7) category = "U8";
  else if (age <= 9) category = "U10";
  else if (age <= 11) category = "U12";
  else if (age <= 13) category = "U14";
  else if (age <= 15) category = "U16";
  else category = "U18";
  
  return { age, category };
}

export const SLOTS = [
  { name: "Mercredi après-midi", time: "15h00–17h00", terrain: "Terrain A", places: 12 },
  { name: "Samedi matin", time: "08h00–10h00", terrain: "Terrain B", places: 3 },
  { name: "Samedi après-midi", time: "14h00–16h00", terrain: "Terrain A", places: 0 },
];
