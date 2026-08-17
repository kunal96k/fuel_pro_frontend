/**
 * Shift Utility for Auto-Calculating Shift from Time
 * 
 * Rules:
 * - If shiftName is present on a record, use explicit shiftName matching.
 * - IF shiftName is NOT mentioned or empty, automatically calculate shift from timeStr (saleTime / usageTime)
 *   and match against targetShift operating hours.
 */

export function getShiftForTime(timeStr?: string): string {
  if (!timeStr) return 'Shift 1 (Morning)';
  
  let hours = 0;
  let minutes = 0;
  
  const cleanTime = timeStr.trim().toUpperCase();
  
  // Parse 12-hour AM/PM format (e.g., "06:33 PM" or "6:33 PM")
  const ampmMatch = cleanTime.match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)/);
  if (ampmMatch) {
    let h = parseInt(ampmMatch[1], 10);
    const m = parseInt(ampmMatch[2], 10);
    const period = ampmMatch[3];
    if (period === 'PM' && h < 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    hours = h;
    minutes = m;
  } else {
    // Parse 24-hour format (e.g., "14:30", "18:45:00")
    const match24 = cleanTime.match(/(\d{1,2}):(\d{2})/);
    if (match24) {
      hours = parseInt(match24[1], 10);
      minutes = parseInt(match24[2], 10);
    }
  }
  
  const totalMinutes = hours * 60 + minutes;
  
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
 * If recordShiftName is provided, compares recordShiftName.
 * If recordShiftName is missing or blank, auto-computes shift from recordTimeStr.
 */
export function isRecordInShift(recordShiftName?: string, recordTimeStr?: string, targetShift?: string): boolean {
  if (!targetShift) return true;
  
  const normTarget = targetShift.toLowerCase().trim();
  
  // 1. Explicit shiftName check if present
  if (recordShiftName && recordShiftName.trim() !== '') {
    const normRec = recordShiftName.toLowerCase().trim();
    if (normRec === normTarget || normRec.includes(normTarget) || normTarget.includes(normRec)) {
      return true;
    }
    const recNum = normRec.match(/\b([1-9])\b/)?.[1];
    const tgtNum = normTarget.match(/\b([1-9])\b/)?.[1];
    if (recNum && tgtNum && recNum === tgtNum) return true;
    if (normRec.includes('morning') && normTarget.includes('morning')) return true;
    if ((normRec.includes('afternoon') || normRec.includes('evening')) && (normTarget.includes('afternoon') || normTarget.includes('evening'))) return true;
    if (normRec.includes('night') && normTarget.includes('night')) return true;
  }
  
  // 2. Fallback: If shift is NOT mentioned/empty, auto-calculate from record time!
  if (recordTimeStr && recordTimeStr.trim() !== '') {
    const computedShift = getShiftForTime(recordTimeStr).toLowerCase();
    if (computedShift.includes('morning') && normTarget.includes('morning')) return true;
    if ((computedShift.includes('afternoon') || computedShift.includes('evening')) && (normTarget.includes('afternoon') || normTarget.includes('evening'))) return true;
    if (computedShift.includes('night') && normTarget.includes('night')) return true;
    
    const compNum = computedShift.match(/\b([1-9])\b/)?.[1];
    const tgtNum = normTarget.match(/\b([1-9])\b/)?.[1];
    if (compNum && tgtNum && compNum === tgtNum) return true;
  }
  
  return false;
}
