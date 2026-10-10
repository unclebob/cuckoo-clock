const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14, 0);
const SYNODIC_MONTH = 29.530588853;

export function moon(date: Date): string {
  const days = (date.getTime() - KNOWN_NEW_MOON) / 86400000;
  let age = days % SYNODIC_MONTH;
  if (age < 0) {
    age += SYNODIC_MONTH;
  }
  const fraction = age / SYNODIC_MONTH;
  const index = Math.floor((fraction + 1 / 16) * 8) % 8;
  switch (index) {
    case 0:
      return "New";
    case 1:
      return "Waxing Crescent";
    case 2:
      return "First Quarter";
    case 3:
      return "Waxing Gibbous";
    case 4:
      return "Full";
    case 5:
      return "Waning Gibbous";
    case 6:
      return "Last Quarter";
    case 7:
      return "Waning Crescent";
    default:
      return "New";
  }
}
