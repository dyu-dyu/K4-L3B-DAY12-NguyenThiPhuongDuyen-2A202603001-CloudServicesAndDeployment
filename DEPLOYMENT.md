# Thông Tin Deploy — Checkpoint 5

> Điền file này sau khi deploy xong. `pytest tests/test_cp5.py` đọc file này
> để tìm địa chỉ service của bạn và gọi thử.
>
> **Chỉ ghi TÊN biến môi trường, tuyệt đối không dán giá trị API key vào đây.**
> Repo này công khai — dán khóa vào là mất khóa.

## Thông Tin Học Viên

| Mục | Nội dung |
|-----|----------|
| Họ và tên | Nguyễn Thị Phương Duyên |
| Mã học viên | 2A202603001 |
| Repo | https://github.com/dyu-dyu/K4-L3B-DAY12-NguyenThiPhuongDuyen-2A202603001-CloudServicesAndDeployment.git |

## Service

| Mục | Nội dung |
|-----|----------|
| Public URL | https://k4-l3b-day12-nguyenthiphuongduyen-2a202603001-cl-production.up.railway.app |
| Platform | Railway |
| Ngày deploy | 29/09/2026 |

## Biến Môi Trường Đã Set Trên Cloud

Ghi tên biến và **nguồn giá trị**, không ghi giá trị:

| Biến | Đã set | Ghi chú |
|------|--------|---------|
| `PORT` | ✅ | platform tự gán |
| `AGENT_API_KEY` | ✅ | đặt trong dashboard, không nằm trong repo |
| `REDIS_URL` | ✅ | lấy từ Redis add-on của Railway; `/ready` đã trả 200 với `redis: true` |
| `RATE_LIMIT_PER_MINUTE` | ✅ | 10 |
| `MONTHLY_BUDGET_USD` | ✅ | 10.0 |
| `LOG_LEVEL` | ✅ | INFO |

## Lệnh Kiểm Tra

Các lệnh dưới đây dùng Public URL Railway ở trên:

```bash
# 1. Liveness — mong đợi 200 {"status":"ok"}
curl -i https://k4-l3b-day12-nguyenthiphuongduyen-2a202603001-cl-production.up.railway.app/health

# 2. Readiness — mong đợi 200 {"status":"ready"} (đã nối được Redis)
curl -i https://k4-l3b-day12-nguyenthiphuongduyen-2a202603001-cl-production.up.railway.app/ready

# 3. Không có API key — mong đợi 401
curl -i -X POST https://k4-l3b-day12-nguyenthiphuongduyen-2a202603001-cl-production.up.railway.app/ask \
  -H "Content-Type: application/json" \
  -d '{"question":"Hello"}'

# 4. Có API key — mong đợi 200 kèm câu trả lời
curl -i -X POST https://k4-l3b-day12-nguyenthiphuongduyen-2a202603001-cl-production.up.railway.app/ask \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $AGENT_API_KEY" \
  -H "X-User-Id: sv-test" \
  -d '{"question":"Deploy là gì?"}'

# 5. Rate limit — gọi 15 lần, những lần cuối phải trả 429
for i in $(seq 1 15); do
  curl -s -o /dev/null -w "%{http_code} " -X POST \
    https://k4-l3b-day12-nguyenthiphuongduyen-2a202603001-cl-production.up.railway.app/ask \
    -H "Content-Type: application/json" \
    -H "X-API-Key: $AGENT_API_KEY" \
    -H "X-User-Id: sv-test" \
    -d '{"question":"test"}'
done; echo
```

## Kết Quả Chạy Thật

Dán output của các lệnh trên vào đây:

```text
GET /                    -> 200 (frontend Mây Nhỏ hiển thị thành công)
GET /health              -> 200 {"status":"ok","service":"day12-agent","version":"1.0.0"}
GET /ready               -> 200 {"status":"ready","redis":true}
POST /ask (không API key) -> 401 {"detail":"invalid or missing API key"}
```

Kết luận tại thời điểm kiểm tra ngày 29/09/2026: service, lớp xác thực và kết nối
Redis cloud đều hoạt động; liveness và readiness đều đạt. Chưa chạy kiểm tra
`/ask` có xác thực vì `DEPLOY_API_KEY` trên máy local chưa được cấu hình.

## Ảnh Chụp Màn Hình

Đặt ảnh trong thư mục `screenshots/`:

- `screenshots/dashboard.png` — trang quản lý service trên platform
- `screenshots/health.png` — kết quả gọi `/health` từ trình duyệt hoặc curl
- `screenshots/frontend.png` — giao diện web chạy trên domain Railway

---

## Nếu Dùng Phương Án Dự Phòng

Không đăng ký được tài khoản cloud? Vẫn nộp được bài, nhưng CP5 tối đa 60% điểm:

1. Đặt `LOCAL_FALLBACK=true` trong `.env`
2. Chạy `docker compose up -d` rồi kiểm tra `docker compose ps`
3. Chụp màn hình vào `screenshots/`
4. Chạy `pytest tests/test_cp5.py -v` — bộ test sẽ tự chuyển sang kiểm tra
   `http://localhost:8000`
5. Ghi rõ lý do không deploy được vào phần dưới đây:

Không sử dụng phương án dự phòng; service đang được deploy công khai trên Railway.
