import { isSameShift, isTimeInShift } from './mpdUtils';

/**
 * Parses any time string format (24-hour "14:30", "16:07:00", 12-hour "04:30 PM", ISO string)
 * into total minutes from midnight (0 to 1439).
 */
export function parseTimeToMinutes(timeStr?: string): number {
  if (!timeStr || typeof timeStr !== 'string') return 0;
  
  const cleanTime = timeStr.trim().toUpperCase();
  
  // Parse 12-hour AM/PM format (e.g., "06:33 PM" or "6:33 PM")
  const ampmMatch = cleanTime.match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)/);
  if (ampmMatch) {
    let h = parseInt(ampmMatch[1], 10);
    const m = parseInt(ampmMatch[2], 10);
    const period = ampmMatch[3];
    if (period === 'PM' && h < 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  }
  
  // Parse 24-hour format (e.g., "16:07", "18:45:00", "2026-09-08T16:07:00")
  const match24 = cleanTime.match(/(?:T|\s|^)(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (match24) {
    const h = parseInt(match24[1], 10);
    const m = parseInt(match24[2], 10);
    return h * 60 + m;
  }
  
  return 0;
}

export function getShiftForTime(timeStr?: string): string {
  if (!timeStr) return 'Shift 1 (Morning)';
  
  const totalMinutes = parseTimeToMinutes(timeStr);
  
  // Morning Shift: 06:00 (360 min) to 14:00 (840 min)
  if (totalMinutes >= 360 && totalMinutes < 840) {
    return 'Shift 1 (Morning)';
  }
  // Afternoon Shift: 14:00 (840 min) to 22:00 (1320 min)
  if (totalMinutes >= 840 && totalMinutes < 1320) {
    return 'Shift 2 (Afternoon)';
  }
  // Night Shift: 22:00 (1320 min) to 06:00 (360 min)
  return 'Shift 3 (Night)';
}

/**
 * Evaluates whether a record belongs to targetShift.
 * 1. If recordShiftName is provided, compares recordShiftName directly.
 * 2. If recordShiftName is missing/blank, auto-computes shift from recordTimeStr:
 *    - Uses dynamic masterShifts operating hours if provided.
 *    - Otherwise uses universal 2-shift ("Day" 06:00-18:00, "Night" 18:00-06:00) & 3-shift time mapping.
 */
export function isRecordInShift(
  recordShiftName?: string,
  recordTimeStr?: string,
  targetShift?: string,
  masterShifts?: Array<{ shiftName: string; startTime?: string; endTime?: string }>
): boolean {
  if (!targetShift) return true;
  
  const normTarget = (targetShift || '').toLowerCase().trim();
  if (!normTarget) return true;
  
  // 1. Explicit shiftName check if present on record
  if (recordShiftName && typeof recordShiftName === 'string' && recordShiftName.trim() !== '') {
    if (isSameShift(recordShiftName, targetShift)) return true;
    const normRec = recordShiftName.toLowerCase().trim();
    if (normRec === normTarget || normRec.includes(normTarget) || normTarget.includes(normRec)) {
      return true;
    }
    const recNum = normRec.match(/\b([1-9])\b/)?.[1];
    const tgtNum = normTarget.match(/\b([1-9])\b/)?.[1];
    if (recNum && tgtNum && recNum === tgtNum) return true;
  }
  
  // 2. Fallback: If shift is NOT mentioned/empty, auto-calculate from record time!
  if (recordTimeStr && typeof recordTimeStr === 'string' && recordTimeStr.trim() !== '') {
    // 2a. Dynamic match using configured Master Shifts
    if (masterShifts && masterShifts.length > 0) {
      const matchedShift = masterShifts.find(s => isSameShift(s.shiftName, targetShift));
      if (matchedShift && matchedShift.startTime && matchedShift.endTime) {
        return isTimeInShift(recordTimeStr, matchedShift);
      }
    }
    
    // 2b. Standard 2-shift / 3-shift time mapping fallbacks
    const totalMinutes = parseTimeToMinutes(recordTimeStr);

    // Standard 2-shift models: "Day" / "Day Shift" (06:00 to 18:00)
    if (normTarget.includes('day') && !normTarget.includes('night') && !normTarget.includes('afternoon') && !normTarget.includes('evening')) {
      return totalMinutes >= 360 && totalMinutes < 1080;
    }
    // Standard 2-shift models: "Night" / "Night Shift" (18:00 to 06:00)
    if (normTarget.includes('night') && !normTarget.includes('day') && !normTarget.includes('morning')) {
      return totalMinutes >= 1080 || totalMinutes < 360;
    }
    
    // Standard 3-shift models
    const computedShift = (getShiftForTime(recordTimeStr) || '').toLowerCase();
    if (computedShift.includes('morning') && (normTarget.includes('morning') || normTarget.includes('day') || normTarget.includes('shift 1') || normTarget.includes('1'))) return true;
    if ((computedShift.includes('afternoon') || computedShift.includes('evening')) && (normTarget.includes('afternoon') || normTarget.includes('evening') || normTarget.includes('shift 2') || normTarget.includes('2') || normTarget.includes('day'))) return true;
    if (computedShift.includes('night') && (normTarget.includes('night') || normTarget.includes('shift 3') || normTarget.includes('3'))) return true;
    
    const compNum = computedShift.match(/\b([1-9])\b/)?.[1];
    const tgtNum = normTarget.match(/\b([1-9])\b/)?.[1];
    if (compNum && tgtNum && compNum === tgtNum) return true;
  }
  
  return false;
}
