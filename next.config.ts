import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // ข้อมูลมาจาก Google Sheet (แก้ผ่าน Control Data) — หน้าอื่นต้องเห็นค่าล่าสุดเสมอ
    // ไม่งั้น client Router Cache จะ serve RSC เก่า (โดยเฉพาะหน้าที่ถูก prefetch = static 5 นาที)
    // การอ่าน Sheet ยังมี cache 15 วิฝั่ง server (getTabCached) กัน quota อยู่แล้ว
    staleTimes: { dynamic: 0, static: 0 },
  },
};

export default nextConfig;
