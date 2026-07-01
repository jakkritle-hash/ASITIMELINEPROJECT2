# Project Tracking Dashboard — Design Spec

วันที่: 2026-07-01
สถานะ: รอผู้ใช้รีวิว

## 1. ภาพรวม (Overview)

เว็บแอปติดตามงานภายในองค์กร Plan B Media แสดงงานทุกโปรเจกต์เป็น **Gantt timeline รวม** หน้าเดียว และเจาะเข้าแต่ละโปรเจกต์เป็น **Kanban board** ได้ ข้อมูลทั้งหมดเก็บใน **Google Sheet** (ทำหน้าที่เป็นฐานข้อมูล) ผู้ใช้ล็อกอินด้วย Google เฉพาะโดเมน `@planbmedia.co.th`

เป้าหมาย: ให้ทีมเห็นภาระงานรวม, สถานะ SLA, และความเคลื่อนไหวของงานได้ในที่เดียว โดยที่ข้อมูลยังเปิดดู/แก้ไขใน Google Sheet ได้เอง

## 2. ผู้ใช้และสิทธิ์ (Roles)

3 ระดับ บังคับสิทธิ์ในชั้นแอป (server-side) เพราะ Google Sheet ควบคุมสิทธิ์ระดับแถวไม่ได้:

| Role | สิทธิ์ |
|---|---|
| **Admin** | จัดการผู้ใช้/บทบาท, สร้าง/ลบทีม, เห็นและแก้ทุกโปรเจกต์, ตั้งค่า Config |
| **Manager** | จัดการทีมที่ตนเป็นหัวหน้า, สร้าง/แก้โปรเจกต์ในทีม, มอบหมายงาน, ดู SLA ทั้งทีม |
| **Member** | สร้างโปรเจกต์ของตัวเอง, แก้ Task ที่ตนเกี่ยวข้อง, ลากการ์ด Kanban ของงานตน |

- ล็อกอินครั้งแรก = auto-provision เป็น `Member` (Admin ปรับ role ภายหลัง)
- **Bootstrap Admin**: อีเมลใน env `BOOTSTRAP_ADMIN_EMAILS` (คั่นด้วย ,) จะได้ role `Admin` อัตโนมัติเมื่อล็อกอินครั้งแรก เพื่อให้มีคนตั้ง role คนอื่นได้ตั้งแต่วันแรก
- โดเมนอื่นนอกจาก `@planbmedia.co.th` ถูกปฏิเสธตั้งแต่ชั้น OAuth (`hd` param) และตรวจซ้ำฝั่ง server

## 3. โครงสร้างข้อมูล (Entity Model)

ลำดับชั้น: **Organization → Team → Project → Task**

- **Team** = กลุ่มคนถาวร (เช่น Marketing, Dev) ดึงมาใส่โปรเจกต์ได้
- **Project** = ชื่อโปรเจกต์ + ทีมงานหลายคน + ช่วงเวลา (start→due) + สถานะ SLA
- **Task** = งานย่อยในโปรเจกต์ + ผู้รับผิดชอบ 1 คน + ช่วงเวลาของตัวเอง + สถานะคอลัมน์ Kanban + editCount + log

## 4. ฐานข้อมูล — Google Sheet (6 tabs)

Spreadsheet: `1PqBojl-LRRnfCymOtz-jGRyCBq_-iY9YKurvSv-sCf8`

**Users**: `id, email, name, role, avatarColor, active, createdAt`
**Teams**: `id, name, memberIds (csv), leadUserId, createdAt`
**Projects**: `id, name, teamId, memberIds (csv), ownerUserId, startDate, dueDate, status, description, kanbanColumns (csv), createdAt, updatedAt`
**Tasks**: `id, projectId, title, assigneeId, columnStatus, startDate, dueDate, slaStatus, editCount, description, order, createdAt, updatedAt`
**ActivityLog** (append-only): `id, timestamp, actorId, entityType, entityId, action, field, oldValue, newValue`
**Config** (key-value): `slaAtRiskDays=2, allowedDomain=planbmedia.co.th, pollInterval=20, timezone=Asia/Bangkok, ...`

หมายเหตุการออกแบบ:
- ความสัมพันธ์ many-to-many (สมาชิกทีม/โปรเจกต์) เก็บเป็น csv ของ id ในคอลัมน์เดียว เพื่อลดจำนวน tab และ API call
- ทุก id เป็น UUID สั้น สร้างฝั่งแอป (ไม่พึ่งเลขแถว) เพื่อความคงทนเวลาแถวสลับ

## 5. หน้าจอหลัก (UI)

### 5.1 Dashboard — Gantt รวม (ตารางเดียว)
- แถว = Project (แสดง avatar ทีมรวม) มีปุ่ม **+/−** กาง/ยุบดู Task ย่อย
- แถวย่อย = Task (แสดง avatar ผู้รับผิดชอบ + แท่งช่วงเวลาของตัวเอง)
- **แกนเวลาหลายชั้น ปรับตามระดับซูม (adaptive layers)** — ทุกชั้นมีครบ ไม่ตัดทิ้ง:

| ระดับซูม | ชั้นที่แสดง |
|---|---|
| ปี | ปี + ไตรมาส |
| ไตรมาส | ไตรมาส + เดือน |
| เดือน | เดือน + สัปดาห์ |
| สัปดาห์ | สัปดาห์ + วัน |
| วัน | เดือน + สัปดาห์ + วัน |

- **สถานะ SLA แสดงด้วย สี + สัญลักษณ์** (รองรับ color-blind / ปริ้นขาวดำ):
  - 🟢 `✓` On-track · 🟠 `⚠` At-risk · 🔴 `✕` Overdue · ⚪ `✔` Done
- เส้นแดงแนวตั้ง = วันนี้ (today marker)
- แถบสรุปด้านบน: จำนวนโปรเจกต์ / เกินกำหนด / ใกล้ครบ
- คลิกชื่อโปรเจกต์/แท่ง → เข้าหน้า Kanban

### 5.2 Kanban (รายโปรเจกต์)
- 4 คอลัมน์เริ่มต้น: **To Do / In Progress / Review / Done** (Admin/Manager เพิ่ม/แก้คอลัมน์ต่อโปรเจกต์ได้)
- การ์ด Task แสดง: ชื่อ, สถานะ SLA (สี+สัญลักษณ์), avatar ผู้รับผิดชอบ, วันครบ, editCount
- ลากการ์ดข้ามคอลัมน์ = เปลี่ยน `columnStatus` (ลง log + คำนวณ SLA ใหม่)
- คลิกการ์ด → รายละเอียด Task เต็ม (คนทำ, วันเริ่ม/ครบ, SLA, editCount, Activity Log ของ task นั้น)

### 5.3 หน้าจัดการ (Admin/Manager)
- **Members**: ดูรายชื่อ, ปรับ role, เปิด/ปิด active (Admin)
- **Teams**: สร้างทีม, เพิ่ม/ลบสมาชิก, ตั้งหัวหน้าทีม
- **Project settings**: แก้รายละเอียด, สมาชิก, ช่วงเวลา, คอลัมน์ Kanban

## 6. พฤติกรรมสำคัญ (Business Logic)

- **คำนวณ SLA** (ฝั่ง server ทุกครั้งที่อ่าน/บันทึก) — อ้างอิงเขตเวลา **`Asia/Bangkok`** (ตั้งใน Config: `timezone`) และเทียบเป็น "วันตามปฏิทิน" ไม่ใช่ชั่วโมง:
  - `Done` ถ้า columnStatus อยู่คอลัมน์ปลายทาง (Done)
  - `Overdue` ถ้า `today > dueDate` และยังไม่ Done
  - `At-risk` ถ้าเหลือ ≤ `slaAtRiskDays` (default 2) วันถึง dueDate
  - `On-track` กรณีอื่น
  - สถานะโปรเจกต์ = สถานะแย่สุดของ Task ในโปรเจกต์ (Overdue > At-risk > On-track)
- **นับครั้งแก้ไข**: ทุกการบันทึกที่เปลี่ยนฟิลด์ของ Task → `editCount + 1`
- **Activity Log**: ทุก create/update/move/delete เขียน 1 บรรทัดใน ActivityLog (append-only) เก็บ actor, ค่าเดิม/ใหม่, เวลา
- **อัปเดตหน้าจอ**: poll ข้อมูลทุก ~20 วิ (จาก Config) + ปุ่ม refresh ด้วยตนเอง (Sheets ไม่มี real-time จริง)

## 7. สถาปัตยกรรมทางเทคนิค (Architecture)

- **Frontend/Backend**: Next.js (App Router) — server actions/route handlers เรียก Google Sheets API
- **Auth**: Auth.js (NextAuth) Google provider, จำกัด `hd=planbmedia.co.th` + ตรวจ email domain ฝั่ง server, เก็บ session แบบ JWT
- **Data access layer**: โมดูลกลาง `sheetsClient` ห่อ Google Sheets API v4
  - **การยืนยันตัวตนเข้าถึง Sheet**: ใช้ **service account** เป็นหลัก (แชร์ Sheet สิทธิ์ Editor ให้อีเมล service account) — *ข้อควรระวัง:* บาง Google Workspace มี policy ห้ามแชร์ไฟล์ออกนอกองค์กร ถ้าติด policy ใช้ทางเลือกสำรอง: ย้าย Sheet ไปไว้ใน Shared Drive ที่เพิ่ม service account เป็นสมาชิกได้ หรือใช้ domain-wide delegation. เก็บเป็นจุดตรวจตอน setup
  - **Cache**: ใช้ **Next.js Data Cache** (`unstable_cache` + `revalidate ~15 วิ` + tag-based invalidation) ไม่ใช้ in-memory ล้วน เพราะบน Vercel serverless หน่วยความจำไม่ shared ข้าม instance — invalidate tag ทันทีหลังเขียนเพื่อให้เห็นผลเร็ว
  - **เขียนแบบ optimistic**: อ่าน `updatedAt` ก่อนเขียน ถ้าไม่ตรง = แจ้ง conflict ให้ผู้ใช้ refresh (กันเขียนทับ)
  - เขียนแบบ batch เมื่อทำได้ (batchUpdate) — เช่น อัปเดต Task + append ActivityLog ใน request เดียว เพื่อลด API call/quota
- **Hosting**: Vercel (มี tier ฟรีพอสำหรับทีมขนาดนี้)
- **โครงสร้างโค้ด** (แบ่งเป็นหน่วยที่เข้าใจ/ทดสอบแยกกันได้):
  - `lib/sheets/` — data access ต่อ tab (getUsers, upsertTask, appendLog, ...)
  - `lib/domain/` — logic บริสุทธิ์ (คำนวณ SLA, สิทธิ์, mapping) ทดสอบได้โดยไม่แตะ Sheets
  - `lib/auth/` — config auth + guard สิทธิ์
  - `app/(dashboard)/` — หน้า Gantt
  - `app/(dashboard)/projects/[id]/` — หน้า Kanban
  - `app/admin/` — จัดการ members/teams
  - `components/gantt/`, `components/kanban/` — UI ประกอบ

## 8. การจัดการข้อผิดพลาด (Error Handling)

- **Rate limit (429)**: retry แบบ exponential backoff + เสิร์ฟจาก cache ระหว่างรอ + แจ้งผู้ใช้ว่าข้อมูลอาจหน่วง
- **Write conflict**: ตรวจ `updatedAt` ไม่ตรง → ไม่เขียนทับ, แจ้งผู้ใช้ให้ refresh แล้วทำใหม่
- **Sheet เข้าไม่ได้ / โครงสร้างผิด**: หน้าตรวจสุขภาพ (health check) ตอน start + ข้อความชัดเจนว่าต้องแชร์ Sheet ให้ service account
- **โดเมนไม่ผ่าน**: หน้า error อธิบายว่าต้องใช้อีเมล `@planbmedia.co.th`

## 9. การทดสอบ (Testing)

- **Unit**: logic ใน `lib/domain/` (คำนวณ SLA ทุกกรณี, การ map สิทธิ์ตาม role, adaptive layer rules) — ไม่แตะ Sheets จริง
- **Integration**: `lib/sheets/` ยิงกับ Sheet ทดสอบแยก (หรือ mock Sheets API) — CRUD + append log + optimistic conflict
- **E2E (เบา)**: login flow (mock Google), สร้างโปรเจกต์→เพิ่ม task→ลาก Kanban→เห็นใน Gantt

## 10. ข้อจำกัดที่รับทราบร่วมกัน (Accepted Trade-offs)

- Google Sheet ไม่ใช่ DB จริง: อัปเดตหน่วง (poll ~20 วิ), เสี่ยง rate limit เมื่อคนเยอะพร้อมกัน, การเขียนพร้อมกันใช้ optimistic lock กัน (ไม่ใช่ transaction จริง)
- เหมาะกับทีมขนาดเล็ก–กลาง ถ้าโตมากในอนาคตแนะนำย้ายเป็น Supabase (โครง data access layer ถูกออกแบบให้เปลี่ยน backend ได้โดยไม่รื้อ UI)

## 11. Setup ที่ผู้ใช้ต้องเตรียม (ตอน implement)

1. สร้าง Google Cloud project + เปิด Google Sheets API + สร้าง **service account** (ผมจะแนะนำทีละขั้น)
2. แชร์ Google Sheet ให้อีเมล service account สิทธิ์ **Editor**
3. สร้าง OAuth client (Google) สำหรับ login + ตั้ง `hd`
4. ใส่ค่า env: `GOOGLE_SERVICE_ACCOUNT_KEY`, `SHEET_ID`, `AUTH_GOOGLE_ID/SECRET`, `NEXTAUTH_SECRET`, `BOOTSTRAP_ADMIN_EMAILS`
5. Deploy บน Vercel

## 12. นอกขอบเขต (Out of Scope — เฟสนี้)

ไฟล์แนบใน task, คอมเมนต์/แชท, การแจ้งเตือนอีเมล/LINE, มือถือ native, รายงาน export ขั้นสูง — เก็บไว้เฟสถัดไป
