# Team Timeline Planner

ระบบวางแผนงานและไทม์ไลน์ทีม — Task / Subtask, ผู้รับผิดชอบแยกระดับ, ตรวจจับงานล่าช้าอัตโนมัติ, ซิงค์ข้อมูลเรียลไทม์ผ่าน Supabase, และ export เป็น Excel ได้ในคลิกเดียว

## Stack

- **React + Vite** — frontend
- **Supabase** — Postgres database + Realtime sync (ทีมเห็นข้อมูลเดียวกัน อัปเดตสด)
- **SheetJS (xlsx)** — export ข้อมูลเป็นไฟล์ .xlsx
- **Vercel** — hosting

---

## 1) ตั้งค่า Supabase (5 นาที)

1. ไปที่ [supabase.com](https://supabase.com) → สร้างบัญชี (ฟรี) → **New Project**
2. ตั้งชื่อโปรเจกต์ + รหัสผ่าน database → รอจนสร้างเสร็จ (~2 นาที)
3. ไปที่เมนู **SQL Editor** (แถบซ้าย) → **New query**
4. เปิดไฟล์ `supabase/schema.sql` ในโปรเจกต์นี้ → copy ทั้งหมด → วางใน SQL Editor → กด **Run**
   - คำสั่งนี้จะสร้างตาราง `tasks`, `subtasks`, `members` พร้อม Row Level Security และ Realtime
5. ไปที่เมนู **Project Settings → API**
   - copy ค่า **Project URL** → ใช้เป็น `VITE_SUPABASE_URL`
   - copy ค่า **anon public** key → ใช้เป็น `VITE_SUPABASE_ANON_KEY`

---

## 2) รันบนเครื่อง (local development)

```bash
npm install
cp .env.example .env.local
# แก้ .env.local ใส่ค่า Supabase URL และ anon key ที่ copy มา

npm run dev
```

เปิด `http://localhost:5173`

---

## 3) Deploy ขึ้น GitHub + Vercel

### Push ขึ้น GitHub

```bash
git init
git add .
git commit -m "Initial commit: Team Timeline Planner"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/team-timeline.git
git push -u origin main
```

> **สำคัญ**: `.env.local` ถูก ignore โดย `.gitignore` แล้ว จะไม่ถูก push ขึ้น GitHub — ปลอดภัย ไม่หลุด API key

### Deploy บน Vercel

1. ไปที่ [vercel.com](https://vercel.com) → login ด้วย GitHub
2. **Add New → Project** → เลือก repo `team-timeline`
3. Vercel จะ detect Vite framework อัตโนมัติ (ไม่ต้องแก้ build settings)
4. ก่อนกด Deploy ไปที่ **Environment Variables** เพิ่ม 2 ตัว:
   - `VITE_SUPABASE_URL` = ค่าจาก Supabase
   - `VITE_SUPABASE_ANON_KEY` = ค่าจาก Supabase
5. กด **Deploy** — เสร็จใน ~1 นาที ได้ลิงก์ `https://team-timeline-xxxx.vercel.app`

ส่งลิงก์นี้ให้ทีม — ทุกคนเห็นข้อมูลเดียวกัน อัปเดตสดทันที (ไม่ต้อง refresh)

---

## 4) Export เป็น Excel

กดปุ่ม **📊 Export Excel** มุมขวาบน จะได้ไฟล์ `.xlsx` ที่มี 2 ชีต:

- **Tasks** — สรุปงานหลัก พร้อม % คืบหน้า
- **Subtasks** — รายละเอียด subtask ทุกตัว พร้อมคอลัมน์ "ล่าช้า?" ระบุว่าใครเป็นคนรับผิดชอบที่ล่าช้า

นอกจากนี้ยัง export ได้โดยตรงจาก Supabase Dashboard → Table Editor → เลือกตาราง → ปุ่ม Export

---

## โครงสร้างโปรเจกต์

```
team-timeline/
├── src/
│   ├── lib/
│   │   ├── supabaseClient.js   ตั้งค่า Supabase client
│   │   ├── dataHooks.js        React hooks: useTasks(), useMembers() — sync แบบ realtime
│   │   ├── timeline.js         logic คำนวณสถานะ/% คืบหน้า/Gantt geometry
│   │   └── exportExcel.js      export เป็น .xlsx
│   ├── components/
│   │   ├── GanttChart.jsx
│   │   ├── TaskModal.jsx
│   │   ├── MemberModal.jsx
│   │   └── StatsBar.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── styles.css
├── supabase/
│   └── schema.sql              SQL schema สำหรับรันใน Supabase
├── .env.example
├── vercel.json
└── package.json
```

---

## ฟีเจอร์

- Gantt chart รายสัปดาห์ (W1, W2... รีเซ็ตทุกต้นเดือน) แถบสีเลื่อนตามวันที่จริง
- Task มีผู้รับผิดชอบหลัก, Subtask มีผู้รับผิดชอบ + วันกำหนดจบของตัวเอง (ดึงค่าเริ่มต้นจาก Task แต่แก้ไขแยกได้)
- ตรวจจับ "ล่าช้า" อัตโนมัติทั้งระดับ Task และ Subtask พร้อมระบุชื่อผู้รับผิดชอบที่ทำให้ล่าช้า
- % ความคืบหน้าคำนวณจากสัดส่วน Subtask ที่เสร็จ
- ฟิลเตอร์ตามสถานะ + ผู้รับผิดชอบ
- เพิ่ม Subtask แบบเร็ว (Enter) หรือวางทีละหลายรายการ
- ข้อมูลซิงค์เรียลไทม์ข้ามอุปกรณ์/คนในทีมผ่าน Supabase Realtime
- Export เป็น Excel (.xlsx) ได้ในคลิกเดียว

## หมายเหตุเรื่องความปลอดภัย

Schema ปัจจุบันเปิด Row Level Security แบบ "allow all" เพื่อให้ทีมใช้งานร่วมกันได้ทันทีโดยไม่ต้อง login ถ้าต้องการจำกัดสิทธิ์การแก้ไข (เช่น ต้อง login ก่อนถึงจะแก้ได้) แนะนำเพิ่ม Supabase Auth แล้วปรับ RLS policy ใน `supabase/schema.sql`
