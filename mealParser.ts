export function parseMeal(text: string) {
  const parts = text.split(/,| and /i).map(s => s.trim()).filter(Boolean);
  return { items: parts };
}
