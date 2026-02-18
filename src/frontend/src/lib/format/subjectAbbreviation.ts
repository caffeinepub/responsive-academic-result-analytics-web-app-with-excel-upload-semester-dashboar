/**
 * Derives a short abbreviation from a subject name by taking the first letter of each word.
 * Example: "Digital Electronics" -> "DE"
 */
export function deriveSubjectAbbreviation(subjectName: string): string {
  if (!subjectName || subjectName.trim() === '') {
    return '';
  }

  const words = subjectName
    .trim()
    .split(/\s+/)
    .filter(word => word.length > 0);

  if (words.length === 0) {
    return '';
  }

  // Take first letter of each word, uppercase
  return words
    .map(word => word[0].toUpperCase())
    .join('');
}

/**
 * Formats a subject code with its abbreviation derived from the subject catalog.
 * Example: "CS101" with name "Computer Science" -> "CS101 (CS)"
 * Falls back to just the code if name is unavailable.
 */
export function formatSubjectCodeWithAbbreviation(
  subjectCode: string,
  subjectCatalog: Record<string, string>
): string {
  const subjectName = subjectCatalog[subjectCode];
  
  if (!subjectName || subjectName === 'Name not available') {
    return subjectCode;
  }

  const abbreviation = deriveSubjectAbbreviation(subjectName);
  
  if (!abbreviation) {
    return subjectCode;
  }

  return `${subjectCode} (${abbreviation})`;
}
