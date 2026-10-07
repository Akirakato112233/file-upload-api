# สถานะหลักฐาน

ผลใน `terminal-output.txt` เป็นผลการรันจริง **ในเครื่อง local** ที่พอร์ต 3300
เมื่อวันที่ 8 ตุลาคม 2026 (เวลาไทย) เนื่องจาก Docker ใช้พอร์ต 3000 และ 3001 อยู่
ไม่ใช่ผลจาก Codespaces

ผลที่ได้:

| ข้อ | การทดสอบ | ผล |
| --- | --- | --- |
| 1 | อัปโหลด avatar.png | HTTP 201 |
| 2 | อัปโหลด a.png และ b.pdf | HTTP 201, count 2 |
| 3 | รายการรูปภาพ | HTTP 200, มี PNG สองไฟล์และไม่มี PDF |
| 4 | ดาวน์โหลด | ไบต์ตรงกับ avatar.png โดยตรวจด้วย cmp |
| 5 | ลบ | HTTP 204 และดาวน์โหลดซ้ำได้ 404 |

Integration tests: ผ่าน 9/9 กรณี

## หลักฐานที่ยังต้องทำบน Codespaces

1. สร้าง public GitHub repository และ Codespace หลังล็อกอิน GitHub
2. รัน `npm start` ใน Terminal แรก แล้ว `npm run demo` ใน Terminal ที่สอง
3. ถ่ายภาพคำสั่งและผลลัพธ์ข้อ 1–3 และข้อ 4–5 ให้เห็น URL ของ Codespace
4. ขยายโฟลเดอร์ `uploads` ใน Explorer ให้เห็นไฟล์ PNG และ PDF ที่เหลือจากข้อ 2 แล้วถ่ายภาพ
5. เพิ่มภาพลงโฟลเดอร์ `evidence`, commit และ push ผลจาก Codespace

การรัน demo อีกครั้งจะเขียน `terminal-output.txt` ใหม่โดยแสดงชื่อ Codespace จริงผ่าน `CODESPACE_NAME`
ไม่ต้อง commit ไฟล์ใน `uploads/`, `evidence/downloads/` หรือ `evidence/responses/`
