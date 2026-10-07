# งาน Backend Upload Files

**ใส่ลิงก์ตรงนี้:** https://github.com/Akirakato112233/file-upload-api

Repository เป็น **Public** ใช้ **Node.js + Express + Multer** เวอร์ชันโปรเจกต์ **1.0.0**
รันและทดสอบบน **GitHub Codespaces** ที่ `http://localhost:3000` แล้ว

## ภาพจาก Terminal — ทดสอบครบ 5 ข้อ

1. อัปโหลดไฟล์เดียว: **201 Created**
2. อัปโหลดหลายไฟล์ PNG + PDF: **201 Created**, จำนวน 2 ไฟล์
3. ดึงรายชื่อรูปภาพ: **200 OK**, ไม่รวม PDF
4. ดาวน์โหลดด้วย `curl -OJ`: **สำเร็จ** และตรวจว่าไบต์ตรงกับต้นฉบับ
5. ลบด้วย `curl -X DELETE -i`: **204 No Content** และเรียกไฟล์ที่ลบแล้วได้ **404**

![ผลทดสอบ curl จาก Codespaces Terminal](evidence/01-codespaces-curl-tests.png)

## ภาพโฟลเดอร์ uploads ใน Codespaces

![Explorer และรายการไฟล์ uploads](evidence/02-codespaces-uploads-folder.png)

[ผลลัพธ์ Terminal ฉบับข้อความ](evidence/terminal-output.txt)
