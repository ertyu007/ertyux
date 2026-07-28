# Admin Stable V7

ชุดนี้ออกแบบใหม่ให้เรียบและลดจุดที่เกิดบั๊กจาก modal, Framer Motion และ CSS ของหน้าเว็บไซต์หลัก

## ไฟล์ที่ต้องวางทับ

คัดลอกโฟลเดอร์:

```text
src/app/admin
```

ไปวางทับที่:

```text
<โปรเจกต์ของคุณ>/src/app/admin
```

ภายในมี 6 ไฟล์:

```text
actions.ts
AdminClient.tsx
AdminWrapper.tsx
LoginForm.tsx
page.tsx
ProjectImageUploader.tsx
```

## สิ่งที่เปลี่ยน

- ตัด Framer Motion ออกจากหน้า Admin ทั้งหมด
- ตัด Sidebar และเอฟเฟกต์ที่ไม่จำเป็น
- Modal ถูก render ผ่าน React Portal ไปที่ `document.body`
- Modal ไม่ถูกตัดด้วย `overflow`, transform หรือ stacking context ของหน้าเดิม
- ใช้สีพื้นฐานของตัวเอง ไม่พึ่งตัวแปรธีมจาก `globals.css`
- กล่องลากไฟล์อยู่ภายใน Editor และมีขนาดคงที่
- ลากหลายไฟล์ลงได้ทั่วทั้งกล่อง
- เลือกหลายไฟล์พร้อมกันได้
- สูงสุด 5 รูป รูปละไม่เกิน 5 MB
- อัปโหลดรูปตรงไป Supabase Storage ผ่าน Signed Upload URL
- Server Action รับเฉพาะข้อมูลขนาดเล็ก จึงไม่ชนเพดาน 1 MB
- แสดงสถานะตามจำนวนไฟล์ที่อัปโหลดเสร็จจริง
- ถ้าอัปโหลดหรือบันทึกล้มเหลว ระบบพยายามลบไฟล์ที่ค้าง
- รองรับรูปเดิมแบบ URL เดี่ยวและ JSON array
- ไม่มี import `Github`
- ไม่มี `pointerEvents` prop ผิดประเภท
- `dataTransfer` ใช้เฉพาะกับ `DragEvent<HTMLDivElement>`

## Environment ที่ต้องมี

```env
ADMIN_PASSWORD=your-password-at-least-8-characters
ADMIN_SESSION_SECRET=your-long-random-secret
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

ห้ามนำ `SUPABASE_SERVICE_ROLE_KEY` ไปใส่ในตัวแปรที่ขึ้นต้นด้วย `NEXT_PUBLIC_`

## Browser Supabase client

ไฟล์ `src/lib/supabase.ts` ควรมีลักษณะนี้:

```ts
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

## Supabase Storage

Bucket ต้องชื่อ:

```text
portfolio
```

แนะนำให้ตั้งค่า:

```text
Public bucket: เปิด
File size limit: 5 MB
Allowed MIME types:
- image/jpeg
- image/png
- image/webp
- image/gif
- image/avif
```

## ไม่ต้องเพิ่ม Server Action body limit

ไฟล์รูปไม่ผ่าน Server Action แล้ว จึงไม่จำเป็นต้องใส่:

```js
experimental: {
  serverActions: {
    bodySizeLimit: "30mb"
  }
}
```

## ทดสอบหลังวางไฟล์

```powershell
Remove-Item .next -Recurse -Force -ErrorAction SilentlyContinue
npm run build
```

จากนั้นรัน:

```powershell
npm run dev
```

เปิด:

```text
http://localhost:3000/admin
```

## การตรวจที่ทำกับชุดนี้

- TypeScript isolated type check ผ่านโดยใช้ stub สำหรับ dependency ภายนอก
- ตรวจ syntax ของ TS/TSX ครบทั้ง 6 ไฟล์
- ตรวจแล้วไม่มี `Github` import
- ตรวจแล้วไม่มี `pointerEvents` prop บน motion element
- `dataTransfer` อยู่เฉพาะ handler ที่พิมพ์เป็น `DragEvent<HTMLDivElement>`

การ build ขั้นสุดท้ายยังขึ้นอยู่กับ dependency, environment และ Supabase schema ใน repository จริงของคุณ
