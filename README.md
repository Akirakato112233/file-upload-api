# File Upload API — v1.0.0

Backend สำหรับงาน Upload Files ด้วย Node.js, Express และ Multer

**ลิงก์ส่งงาน:** https://github.com/Akirakato112233/file-upload-api

**[ดูภาพหลักฐานและผลทดสอบบน Codespaces](evidence/README.md)** — curl ครบ 5 ข้อผ่านที่พอร์ต 3000 และ integration tests ผ่าน 9/9 กรณี

## เริ่มใช้งานบน GitHub Codespaces

1. เปิด repository แล้วเลือก **Code → Codespaces → Create codespace on main** (หรือ branch ที่มีโค้ดนี้)
2. รอ dev container ติดตั้งแพ็กเกจด้วย `npm ci` อัตโนมัติ
3. เปิด Terminal แล้วรัน:

```bash
npm start
```

เซิร์ฟเวอร์ใช้ `http://localhost:3000` ใน Codespace เปิด Terminal อีกหน้าสำหรับทดสอบ
โฟลเดอร์ `.devcontainer` กำหนด Node.js 22 และ forward พอร์ต 3000 ไว้แล้ว
ให้พอร์ตที่ forward เป็น **Private** ตามค่าเริ่มต้น: repository public ไม่จำเป็นต้องเปิด API ให้คนทั่วไปใช้

## รันในเครื่อง

ต้องมี Node.js 22 ขึ้นไป

```bash
npm ci
npm start
```

ถ้าพอร์ต 3000 ถูกใช้แล้ว รัน `PORT=3300 npm start` และเปลี่ยน URL ทดสอบเป็นพอร์ต 3300
ใช้ `npm run dev` เมื่อต้องการเริ่มเซิร์ฟเวอร์ใหม่อัตโนมัติหลังแก้โค้ด

## Endpoints

| Method | Path | หน้าที่ | สำเร็จ |
| --- | --- | --- | --- |
| POST | `/api/files` | อัปโหลดไฟล์เดียว ฟิลด์ `file` | 201 |
| POST | `/api/files/multiple` | อัปโหลดหลายไฟล์ ฟิลด์ `files` สูงสุด 5 ไฟล์ | 201 |
| GET | `/api/files/multiple` | รายการไฟล์รูปภาพทั้งหมด ไม่รวม PDF | 200 |
| GET | `/api/files` | รายการไฟล์ทั้งหมด รวม PDF | 200 |
| GET | `/api/files/:filename` | ดาวน์โหลดตามชื่อที่เซิร์ฟเวอร์สร้าง | 200 |
| DELETE | `/api/files/:filename` | ลบไฟล์ตามชื่อที่เซิร์ฟเวอร์สร้าง | 204 |

ใช้ `GET /api/files/multiple` สำหรับข้อ 3 ตามโจทย์ ส่วน `GET /api/files` สอดคล้องกับตัวอย่างในเอกสาร
URL ใน JSON เป็น path สัมพัทธ์ ใช้กับ host ปัจจุบันได้ทั้ง localhost และ Codespaces

## ทดสอบตามโจทย์ทั้ง 5 ข้อ

มีไฟล์ตัวอย่าง `avatar.png`, `a.png`, `b.pdf` ใน repository แล้ว ให้รันจากโฟลเดอร์ราก

```bash
# 1. ไฟล์เดียว
curl -F "file=@./avatar.png" http://localhost:3000/api/files

# 2. หลายไฟล์
curl -F "files=@./a.png" -F "files=@./b.pdf" http://localhost:3000/api/files/multiple

# 3. รายการรูปภาพทั้งหมด
curl http://localhost:3000/api/files/multiple

# ตั้งค่าชื่อจาก filename ใน JSON ของข้อ 1 (ไม่ใช่ชื่อ avatar.png)
FILENAME="ใส่ชื่อไฟล์จากผลลัพธ์ข้อ1.png"

# 4. ดาวน์โหลด โดยใช้ชื่อจาก Content-Disposition
# เข้าโฟลเดอร์ว่างก่อน เพื่อป้องกัน curl -OJ พบชื่อไฟล์ซ้ำ
mkdir -p evidence/downloads
cd evidence/downloads
curl -OJ "http://localhost:3000/api/files/$FILENAME"
cd ../..

# 5. ลบไฟล์
curl -X DELETE -i "http://localhost:3000/api/files/$FILENAME"

# แสดงไฟล์ที่ยังเหลือจากข้อ 2
ls -lh uploads/
```

หรือรันทดสอบครบทั้ง 5 ข้ออัตโนมัติ:

```bash
npm run demo
# หากใช้พอร์ต 3300:
BASE_URL=http://localhost:3300 npm run demo
```

สคริปต์บันทึกผลจริงลง `evidence/terminal-output.txt` ตรวจว่าไฟล์ดาวน์โหลดมีไบต์ตรงกับต้นฉบับ
และตรวจว่าดาวน์โหลดไฟล์ที่ลบแล้วได้ 404 ไฟล์จากการอัปโหลดหลายไฟล์จะคงอยู่ให้ถ่ายภาพ `uploads/`
แต่ละรอบจะสร้างชื่อไฟล์ใหม่ ดังนั้นรันซ้ำแล้วรายการไฟล์จะเพิ่มขึ้น

## การตรวจไฟล์และข้อผิดพลาด

- อนุญาต JPEG, PNG, WebP และ PDF ขนาดไม่เกิน 5 MB ต่อไฟล์
- ตรวจ MIME type, นามสกุล และ magic bytes ให้ตรงกัน
- พักไฟล์ใน `uploads/.staging/` ก่อนตรวจสอบ แล้วจึงย้ายเข้า `uploads/`
- ถ้าไฟล์ใดใน batch ไม่ผ่าน จะล้างไฟล์ของ batch นั้น
- ตั้งชื่อ UUID ป้องกันชื่อซ้ำ; ไม่เปิด `uploads/` เป็น static directory
- ปฏิเสธ path traversal, hidden files และ symbolic links
- 400 = ไม่แนบไฟล์/ชื่อฟิลด์ผิด/เกินจำนวน, 413 = ใหญ่เกินกำหนด, 415 = ชนิดไฟล์ไม่ถูกต้อง, 404 = ไม่พบไฟล์

เป็น API สำหรับงานทดลองใน Codespace ส่วนตัว ไม่มีระบบสมาชิกหรือฐานข้อมูล
การตรวจ magic bytes ไม่ใช่การสแกนไวรัส หากนำไปให้คนทั่วไปใช้งานต้องเพิ่ม authentication, quota และ malware scanning
ไฟล์ที่อัปโหลดไม่ถูก commit; การลบ Codespace จะลบไฟล์ที่เก็บอยู่ด้วย

## ตรวจสอบอัตโนมัติ

```bash
npm test
```

ใช้ Node test runner และ HTTP จริงกับโฟลเดอร์ชั่วคราว ไม่แตะไฟล์ใน `uploads/` ของผู้ใช้
ครอบคลุม upload/download/delete, รายการภาพ, ไฟล์ปลอม, rollback, ขนาดและจำนวนเกิน, ชื่อซ้ำ และ path traversal

## โครงสร้าง

```text
.devcontainer/devcontainer.json   ตั้งค่า Codespaces
src/app.js                       ประกอบ Express app
src/server.js                    เปิดพอร์ต
src/middlewares/upload.js         Multer และตรวจเนื้อหาไฟล์
src/middlewares/errorHandler.js   HTTP errors แบบ JSON
src/routes/files.js              Routes ทั้งหมด
test/files.test.js               Integration tests
scripts/demo.sh                  curl ทั้ง 5 ข้อและบันทึกผล
uploads/                         ไฟล์ที่รับเข้า (ไม่ commit)
evidence/                        ผลทดสอบและภาพหลักฐาน
```

อ้างอิง API ของ Multer: https://expressjs.com/en/resources/middleware/multer/
