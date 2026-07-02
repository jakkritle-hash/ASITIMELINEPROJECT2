/** % ความคืบหน้าของโปรเจกต์ = สัดส่วน task ที่อยู่คอลัมน์ 'Done' (ปัดเป็นจำนวนเต็ม) */
export function projectProgress(tasks: { columnStatus: string }[]): number {
  if (tasks.length === 0) return 0
  const done = tasks.filter((t) => t.columnStatus.toLowerCase() === 'done').length
  return Math.round((done / tasks.length) * 100)
}

/** โปรเจกต์ "เสร็จ" เมื่อมี task และทุก task Done (100%) */
export function isProjectComplete(tasks: { columnStatus: string }[]): boolean {
  return tasks.length > 0 && projectProgress(tasks) === 100
}
