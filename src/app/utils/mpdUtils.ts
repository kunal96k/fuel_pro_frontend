export interface MPDLike {
  id?: string;
  mpdName: string;
}

export function sortMpdsDeterministically<T extends MPDLike>(list: T[]): T[] {
  return [...list].sort((a, b) => {
    const numA = parseInt((a.mpdName.match(/\d+/) || ['999'])[0], 10);
    const numB = parseInt((b.mpdName.match(/\d+/) || ['999'])[0], 10);
    if (numA !== numB) return numA - numB;
    return a.mpdName.localeCompare(b.mpdName);
  });
}

export function resolveMpdNameFromList<T extends MPDLike>(rawName?: string, mpdList: T[] = []): string {
  if (!rawName || !rawName.trim()) return '';
  const clean = rawName.trim();

  // 1. Direct exact or case-insensitive name match with existing MPDs
  if (mpdList && mpdList.length > 0) {
    const exact = mpdList.find(m => m.mpdName.toLowerCase() === clean.toLowerCase());
    if (exact) return exact.mpdName;
  }

  // 2. If code like "MPD_1", "MPD 1", "MPD_2", "MPD 2"
  const match = clean.match(/^MPD_?(\d+)$/i);
  if (match && mpdList && mpdList.length > 0) {
    const tabIndex = parseInt(match[1], 10) - 1;
    const sorted = sortMpdsDeterministically(mpdList);
    if (tabIndex >= 0 && tabIndex < sorted.length) {
      return sorted[tabIndex].mpdName;
    }
  }

  return clean;
}

export function isStrictMpdMatch(recMpd?: any, targetMpd?: string): boolean {
  if (!targetMpd || !targetMpd.trim()) return true;
  if (!recMpd) return false;

  const recStr = typeof recMpd === 'object'
    ? (recMpd.mpdName || recMpd.mpd || recMpd.mpdId || recMpd.dispenser || '')
    : String(recMpd);

  if (!recStr || !recStr.trim()) return false;

  const rNorm = recStr.trim().toLowerCase();
  const tNorm = targetMpd.trim().toLowerCase();

  // Exact name or substring match
  if (rNorm === tNorm || rNorm.includes(tNorm) || tNorm.includes(rNorm)) return true;

  // Numerical dispenser / MPD number match (e.g. Dispenser 1 == MPD 1 == 1)
  const rNum = recStr.match(/(?:dispenser|mpd)\s*(\d+)/i)?.[1] || recStr.match(/\b\d+\b/)?.[0];
  const tNum = targetMpd.match(/(?:dispenser|mpd)\s*(\d+)/i)?.[1] || targetMpd.match(/\b\d+\b/)?.[0];

  return Boolean(rNum && tNum && rNum === tNum);
}
