export interface MPDLike {
  id?: string | number;
  mpdName: string;
}

export function extractMpdNumber(name?: string): number {
  if (!name || typeof name !== 'string') return 999;
  const clean = name.trim();
  const match = clean.match(/(?:dispenser|mpd)\s*(\d+)/i) || clean.match(/\b\d+\b/);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  if (match && match[0]) {
    return parseInt(match[0], 10);
  }
  return 999;
}

export function sortMpdsDeterministically<T extends MPDLike>(list: T[]): T[] {
  return [...list].sort((a, b) => {
    const numA = extractMpdNumber(a.mpdName);
    const numB = extractMpdNumber(b.mpdName);

    if (numA !== numB) {
      return numA - numB;
    }

    const idA = a.id != null ? parseInt(String(a.id).replaceAll(/\D+/g, ''), 10) : NaN;
    const idB = b.id != null ? parseInt(String(b.id).replaceAll(/\D+/g, ''), 10) : NaN;

    if (!isNaN(idA) && !isNaN(idB) && idA !== idB) {
      return idA - idB;
    }

    return (a.mpdName || '').localeCompare(b.mpdName || '');
  });
}

export function resolveMpdNameFromList<T extends MPDLike>(rawName?: string, mpdList: T[] = []): string {
  if (!rawName || !rawName.trim()) return '';
  const clean = rawName.trim();

  if (mpdList && mpdList.length > 0) {
    // 1. Direct exact case-insensitive name match
    const exact = mpdList.find(m => m.mpdName.trim().toLowerCase() === clean.toLowerCase());
    if (exact) return exact.mpdName;

    // 2. Direct ID match if clean is numeric
    const cleanIdNum = clean.replaceAll(/\D+/g, '');
    if (cleanIdNum) {
      const matchById = mpdList.find(m => m.id != null && String(m.id).replaceAll(/\D+/g, '') === cleanIdNum);
      if (matchById) return matchById.mpdName;
    }

    // 3. If code like "MPD_1", "MPD 1", "MPD_2", "MPD 2"
    const match = clean.match(/^MPD_?(\d+)$/i);
    if (match) {
      const tabIndex = parseInt(match[1], 10) - 1;
      const sorted = sortMpdsDeterministically(mpdList);
      if (tabIndex >= 0 && tabIndex < sorted.length) {
        return sorted[tabIndex].mpdName;
      }
    }
  }

  return clean;
}

export function isStrictMpdMatch(recMpd?: any, targetMpd?: string): boolean {
  if (!targetMpd || !targetMpd.trim()) return true;
  if (!recMpd) return false;

  // 1. Match by numeric mpdId if object has mpdId
  if (typeof recMpd === 'object' && recMpd.mpdId != null && targetMpd) {
    const rId = String(recMpd.mpdId).replaceAll(/\D+/g, '');
    const tId = targetMpd.replaceAll(/\D+/g, '');
    if (rId && tId && rId === tId) return true;
  }

  const recStr = typeof recMpd === 'object'
    ? (recMpd.mpdName || recMpd.mpd || recMpd.dispenser || '')
    : String(recMpd);

  if (!recStr || !recStr.trim()) return false;

  const rNorm = recStr.replaceAll(/_/g, ' ').trim().toLowerCase();
  const tNorm = targetMpd.replaceAll(/_/g, ' ').trim().toLowerCase();

  // 2. Exact name match (case-insensitive)
  if (rNorm === tNorm) return true;

  // 3. Substring match
  if (rNorm.includes(tNorm) || tNorm.includes(rNorm)) return true;

  // 4. Tab alias match (e.g. "mpd 1" vs "mpd_1")
  const cleanR = rNorm.replace(/\s+/g, '');
  const cleanT = tNorm.replace(/\s+/g, '');
  if (cleanR === cleanT) return true;

  // 5. Numerical dispenser / MPD number match (e.g. "MPD 1" vs "Dispenser 1 - Petrol Regular")
  const numR = extractMpdNumber(recStr);
  const numT = extractMpdNumber(targetMpd);
  if (numR !== 999 && numT !== 999 && numR === numT) {
    return true;
  }

  return false;
}

export function isSameShift(shift1?: string, shift2?: string): boolean {
  if (!shift1 || !shift2) return false;
  const s1 = shift1.trim().toLowerCase();
  const s2 = shift2.trim().toLowerCase();

  // 1. Direct exact match
  if (s1 === s2) return true;

  // 2. Match base name without time brackets/dots e.g. "Morning Shift (06:00-14:00)" vs "Morning Shift..."
  const base1 = s1.split('(')[0].replace(/\.+$/, '').trim();
  const base2 = s2.split('(')[0].replace(/\.+$/, '').trim();
  if (base1 && base2 && (base1 === base2 || base1.includes(base2) || base2.includes(base1))) {
    return true;
  }

  // 3. Substring match
  if (s1.includes(s2) || s2.includes(s1)) {
    return true;
  }

  // 4. Number match for numbered shifts (e.g. "Shift 1" vs "Shift 1 (Morning)")
  const num1 = s1.match(/\b\d+\b/)?.[0];
  const num2 = s2.match(/\b\d+\b/)?.[0];
  if (num1 && num2 && num1 === num2) {
    return true;
  }

  return false;
}

export function isTimeInShift(timeStr?: string, shift?: { startTime?: string; endTime?: string }): boolean {
  if (!timeStr || !shift || !shift.startTime || !shift.endTime) return true;

  const parseMin = (t: string) => {
    const parts = t.trim().split(':');
    return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
  };

  const targetMin = parseMin(timeStr);
  const startMin = parseMin(shift.startTime);
  const endMin = parseMin(shift.endTime);

  if (startMin <= endMin) {
    return targetMin >= startMin && targetMin < endMin;
  } else {
    // Overnight shift (e.g. 22:00 to 06:00)
    return targetMin >= startMin || targetMin < endMin;
  }
}

export function isRecordInActiveShift(
  r: any,
  targetShiftName?: string,
  masterShifts: Array<{ shiftName: string; startTime?: string; endTime?: string }> = []
): boolean {
  if (!targetShiftName) return true;

  // 1. If explicit shift name / shift field is present on record:
  if (r.shiftName || r.shift) {
    return isSameShift(r.shiftName || r.shift, targetShiftName);
  }

  // 2. If time field is present (saleTime, usageTime, time, depositTime):
  const recTime = r.saleTime || r.sale_time || r.usageTime || r.usage_time || r.time || r.depositTime || r.deposit_time;
  if (recTime && masterShifts && masterShifts.length > 0) {
    const matchedShift = masterShifts.find(s => isSameShift(s.shiftName, targetShiftName));
    if (matchedShift) {
      return isTimeInShift(recTime, matchedShift);
    }
  }

  return false;
}
