/**
 * Derives a short abbreviation from a subject name by taking the first letter of each word.
 * Special rules:
 * - Excludes the word "and" (case-insensitive)
 * - Maps "through" to "TH" instead of "T"
 * Example: "Research and Development" -> "RD"
 * Example: "Walk Through Design" -> "WTHD"
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

  // Custom word mappings (case-insensitive)
  const customMappings: Record<string, string> = {
    'through': 'TH'
  };

  // Words to exclude (case-insensitive)
  const excludedWords = new Set(['and']);

  // Process each word
  return words
    .map(word => {
      const lowerWord = word.toLowerCase();
      
      // Skip excluded words
      if (excludedWords.has(lowerWord)) {
        return '';
      }
      
      // Check for custom mappings
      if (customMappings[lowerWord]) {
        return customMappings[lowerWord];
      }
      
      // Default: take first letter uppercase
      return word[0].toUpperCase();
    })
    .filter(part => part.length > 0)
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
