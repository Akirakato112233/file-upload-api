# งานข้อ 2: Products CRUD + Swagger UI

**ใส่ลิงก์ตรงนี้:** https://github.com/Akirakato112233/file-upload-api

Repository เป็น **Public**; โปรเจกต์เวอร์ชัน **2.0.0** มี Node.js + Express Products CRUD API
พร้อม OpenAPI 3.0.3 และ Swagger UI ที่ `/api-docs`

ทดสอบ Swagger UI และทุก endpoint ด้วย **Try it out → Execute** แล้ว ภาพชุดนี้ถ่ายจากเซิร์ฟเวอร์ในเครื่องที่ `http://localhost:3002`; ผล `curl` ทั้ง 6 endpoint อยู่ใน [local-curl-output.txt](evidence/products/local-curl-output.txt)
Codespace ต้องติดตั้ง dependencies (`npm ci`) และรัน `npm start` เพื่อเปิด `/api-docs` ที่พอร์ต 3000

## หน้าแรก Swagger UI

![หน้าแรก Swagger UI แสดง Products CRUD API และ 6 operations](evidence/products/00-swagger-ui-local.jpg)

## GET /api/products — 200 OK

![GET รายการสินค้า แสดง response 200](evidence/products/01-get-products-local.jpg)

## POST /api/products — 201 Created

![POST สร้างสินค้าใหม่ แสดง response 201 และ id](evidence/products/02-post-products-local.jpg)

## GET /api/products/{id} — 200 OK

![GET สินค้าตาม id แสดง response 200](evidence/products/03-get-product-by-id-local.jpg)

## PUT /api/products/{id} — 200 OK

![PUT แทนที่ข้อมูลสินค้า แสดง response 200](evidence/products/04-put-product-local.jpg)

## PATCH /api/products/{id} — 200 OK

![PATCH แก้ไขราคา แสดง response 200](evidence/products/05-patch-product-local.jpg)

## DELETE /api/products/{id} — 204 No Content

![DELETE ลบสินค้า แสดง response 204](evidence/products/06-delete-product-local.jpg)
