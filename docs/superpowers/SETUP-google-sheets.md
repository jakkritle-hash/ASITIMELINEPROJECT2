# คู่มือตั้งค่า Google Sheet + Login (เฟส 4)

ทำตามขั้นตอนนี้เพื่อสลับจากข้อมูลตัวอย่าง (fixtures) เป็น Google Sheet จริง + เปิดล็อกอิน Google

---

## 1. เปิด Google Sheets API + สร้าง Service Account

1. ไปที่ https://console.cloud.google.com → สร้าง Project ใหม่ (เช่น "Coworkweb")
2. เมนู **APIs & Services → Library** → ค้น **Google Sheets API** → กด **Enable**
3. เมนู **APIs & Services → Credentials → Create Credentials → Service account**
   - ตั้งชื่อ เช่น `coworkweb-sheets` → Create → ข้าม role → Done
4. คลิก service account ที่สร้าง → แท็บ **Keys → Add Key → Create new key → JSON** → ดาวน์โหลดไฟล์ JSON
5. เปิดไฟล์ JSON จะเห็น `client_email` และ `private_key` — เก็บไว้ใช้ขั้นที่ 4

## 2. แชร์ Google Sheet ให้ Service Account

1. เปิด [Google Sheet ของโปรเจกต์](https://docs.google.com/spreadsheets/d/1PqBojl-LRRnfCymOtz-jGRyCBq_-iY9YKurvSv-sCf8/edit)
2. กด **Share** → วางอีเมล `client_email` จากขั้นที่ 1 → ให้สิทธิ์ **Editor** → Send
   > ⚠️ ถ้า Workspace บล็อกการแชร์ออกนอกองค์กร: ย้าย Sheet ไปไว้ใน **Shared Drive** แล้วเพิ่ม service account เป็นสมาชิก Content manager

## 3. สร้าง OAuth Client (สำหรับ Login)

1. **APIs & Services → OAuth consent screen** → เลือก **Internal** (เฉพาะ planbmedia.co.th) → กรอกชื่อแอป → Save
2. **Credentials → Create Credentials → OAuth client ID → Web application**
   - **Authorized redirect URIs** ใส่:
     - `http://localhost:3000/api/auth/callback/google` (สำหรับ dev)
     - `https://<โดเมนที่ deploy>/api/auth/callback/google` (ตอน deploy จริง)
   - กด Create → เก็บ **Client ID** และ **Client secret**

## 4. ใส่ค่าใน `.env.local`

แก้ไฟล์ `.env.local` (สร้างจาก `.env.example`) ใส่ค่า:

```bash
AUTH_GOOGLE_ID=<OAuth Client ID>
AUTH_GOOGLE_SECRET=<OAuth Client secret>
AUTH_SECRET=<สุ่มด้วย: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">

SHEET_ID=1PqBojl-LRRnfCymOtz-jGRyCBq_-iY9YKurvSv-sCf8
GOOGLE_SERVICE_ACCOUNT_EMAIL=<client_email จากไฟล์ JSON>
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="<private_key จากไฟล์ JSON — คงเครื่องหมาย \n ไว้ทั้งหมด อยู่ในเครื่องหมายคำพูด>"

ALLOWED_DOMAIN=planbmedia.co.th
BOOTSTRAP_ADMIN_EMAILS=jakkrit.le@planbmedia.co.th
SEED_SECRET=<ตั้งรหัสอะไรก็ได้สำหรับยิง seed ครั้งเดียว>
```

> 💡 `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` ให้ก็อป `private_key` ทั้งก้อน (ขึ้นต้น `-----BEGIN PRIVATE KEY-----`) ใส่ในเครื่องหมายคำพูด โค้ดจะแปลง `\n` เป็นบรรทัดใหม่ให้เอง

## 5. สร้าง Tabs + ข้อมูลเริ่มต้น (seed ครั้งเดียว)

```bash
npm run dev
# อีกหน้าต่างหนึ่ง:
curl -X POST http://localhost:3000/api/seed -H "x-seed-secret: <SEED_SECRET>"
```
ผลลัพธ์ควรได้ `{"ok":true,"tabsCreated":[...],"tabsSeeded":[...]}` → เปิด Google Sheet จะเห็น 6 tabs พร้อม header + ข้อมูลตัวอย่าง

## 6. ตรวจสอบ

- เปิด http://localhost:3000/api/health → ควรได้ `ok:true` และเห็นจำนวนแถวแต่ละ tab
- เปิด http://localhost:3000 → ระบบจะพาไปหน้า login → เข้าด้วยอีเมล `@planbmedia.co.th`
- ล็อกอินสำเร็จ → เห็นข้อมูลจาก Sheet, แก้ Task / ลากการ์ด / จัดการทีม แล้วข้อมูลบันทึกลง Sheet จริง (ลอง refresh ดู)
- อีเมลใน `BOOTSTRAP_ADMIN_EMAILS` จะได้สิทธิ์ Admin อัตโนมัติ

## หมายเหตุ
- ถ้ายังไม่ใส่ `GOOGLE_SERVICE_ACCOUNT_EMAIL` ระบบจะใช้ fixtures (โหมดตัวอย่าง) และไม่บังคับล็อกอิน — สะดวกตอนพัฒนา
- Deploy บน Vercel: ใส่ env ทั้งหมดใน Project Settings → Environment Variables (รวม redirect URI โดเมนจริงใน OAuth)
