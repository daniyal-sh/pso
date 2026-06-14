export const olympiadSubjects = [
  "Mathematics",
  "Physics",
  "Biology",
  "Chemistry",
  "Informatics",
  "Astronomy",
  "Artificial Intelligence",
  "Nuclear Science",
] as const;

export const adminSubjects = [...olympiadSubjects].sort() as (typeof olympiadSubjects)[number][];

export type OlympiadSubject = (typeof olympiadSubjects)[number];

const subjectAliases: Record<string, OlympiadSubject> = {
  IOAA: "Astronomy",
  IOAI: "Artificial Intelligence",
  INSO: "Nuclear Science",
};

export function normalizeSubject(subject: string) {
  return subjectAliases[subject] ?? subject;
}

export function sortSubjects(subjects: string[]) {
  return [...subjects].sort((a, b) => {
    const aIndex = olympiadSubjects.indexOf(normalizeSubject(a) as OlympiadSubject);
    const bIndex = olympiadSubjects.indexOf(normalizeSubject(b) as OlympiadSubject);
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return a.localeCompare(b);
  });
}

export function subjectIcon(subject: string) {
  const normalized = normalizeSubject(subject);
  if (normalized === "Mathematics") return "pi";
  if (normalized === "Chemistry") return "flask";
  if (normalized === "Biology") return "dna";
  if (normalized === "Astronomy") return "orbit";
  if (normalized === "Informatics") return "code";
  if (normalized === "Artificial Intelligence") return "brain-circuit";
  if (normalized === "Nuclear Science") return "radiation";
  return "atom";
}
