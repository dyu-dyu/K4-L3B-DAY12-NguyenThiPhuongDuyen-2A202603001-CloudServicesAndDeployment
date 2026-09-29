# Phiếu Phản Ánh — K4 Level 3B, Ngày 12

> **Bài làm cá nhân.** Trả lời bằng lời của chính bạn, dựa trên những gì bạn
> quan sát được khi chạy code — không sao chép đáp án của người khác.
>
> Cách trả lời: thay từng dòng trả lời mẫu bên dưới bằng câu trả lời của bạn.
> `grade.py` đếm số câu đã trả lời (15 điểm cho 10 câu).
>
> Họ và tên: Nguyễn Thị Phương Duyên  Mã học viên: 2A202603001

---

### Câu 1 — Fail fast (CP1)

Trong `Settings`, `agent_api_key` không có giá trị mặc định nên app chết ngay
khi khởi động nếu thiếu biến môi trường. Hãy mô tả một tình huống cụ thể mà
việc "chết sớm" này cứu bạn, so với việc để mặc định `"changeme"`.

> Một tình huống cụ thể là khi deploy lên Railway nhưng quên khai báo
> `AGENT_API_KEY`. Vì trường này không có giá trị mặc định, Pydantic báo lỗi ngay
> khi ứng dụng khởi động và deployment không qua được health check. Nhờ vậy tôi
> biết cấu hình đang thiếu trước khi public service. Nếu dùng mặc định
> `"changeme"`, ứng dụng vẫn chạy và người khác có thể đoán khóa này để gọi
> `/ask`, làm tiêu tốn quota hoặc chi phí mà tôi không nhận ra ngay.

---

### Câu 2 — Log cho máy đọc (CP1)

Chạy service và gọi `/ask` vài lần. Dán một dòng log JSON bạn thu được, rồi
nêu **hai** việc bạn làm được với dòng log đó mà `print("đã trả lời xong")`
không làm được.

> Một dòng log JSON tôi thu được khi gọi hàm logging của service là:
>
> ```json
> {"event": "ask_completed", "level": "info", "timestamp": "2026-09-29T13:31:47.824937+00:00", "user_id": "exercise-test", "tokens_in": 12, "tokens_out": 24, "cost_usd": 3.6e-05}
> ```
>
> Với log này, tôi có thể lọc hoặc đếm các sự kiện `ask_completed` theo
> `user_id`, khoảng thời gian và mức log mà không phải tách chuỗi thủ công. Tôi
> cũng có thể cộng `tokens_in`, `tokens_out`, `cost_usd` để tạo dashboard hoặc
> cảnh báo khi chi phí tăng bất thường. Một câu `print("đã trả lời xong")` không
> có các trường có cấu trúc nên không làm tốt được hai việc đó.

---

### Câu 3 — Kích thước image (CP2)

Build cả hai phiên bản và ghi lại số đo thật:

```bash
docker build -f <Dockerfile-1-stage> -t agent:single .
docker build -t agent:multi .
docker images | grep agent
```

| Bản | Dung lượng |
|-----|-----------|
| 1 stage (bản đầu) | khoảng 1.47 GB (dùng base đầy đủ `python:3.11`) |
| Multi-stage | 271 MB |

Giải thích: phần dung lượng chênh lệch đó là những gì?

> Bản multi-stage hiện tại được Docker báo là 271 MB. Khi thử build lại bản một
> stage, Docker Desktop gặp lỗi `commit failed: input/output error` sau khi tải
> base image đầy đủ, nên con số khoảng 1.47 GB ở trên là kích thước ước tính từ
> image `python:3.11` đầy đủ thay vì một kết quả build hoàn tất. Phần chênh lệch
> chủ yếu đến từ hệ điều hành và công cụ có trong base image đầy đủ, cache/công
> cụ cài đặt và mọi thứ của môi trường build. Bản multi-stage chỉ lấy các package
> Python đã cài từ stage `builder` sang stage runtime `python:3.11-slim`, nên
> không mang toàn bộ công cụ build sang image chạy thật.

---

### Câu 4 — Thứ tự lệnh trong Dockerfile (CP2)

Sửa một ký tự trong `app/main.py` rồi build lại. Với Dockerfile của bạn, những
layer nào được dùng lại từ cache, layer nào phải chạy lại? Nếu bạn đặt
`COPY . .` lên trước `RUN pip install` thì kết quả khác thế nào?

> Khi chỉ sửa một ký tự trong `app/main.py`, các bước của stage `builder` vẫn
> dùng cache vì `requirements.txt` không đổi, nên Docker không phải chạy lại
> `pip install`. Trong stage runtime, các layer tạo user, đặt `WORKDIR` và copy
> dependency từ builder vẫn dùng lại được; từ lệnh `COPY app ./app` trở đi phải
> tạo lại vì nội dung thư mục `app` đã đổi. Nếu đặt `COPY . .` trước
> `RUN pip install`, mọi thay đổi nhỏ trong source đều làm layer copy đổi và kéo
> theo layer cài dependency bị chạy lại, khiến build chậm hơn nhiều dù danh sách
> thư viện không thay đổi.

---

### Câu 5 — Vì sao không chạy bằng root (CP2)

Container mặc định chạy bằng root. Mô tả chuỗi sự kiện dẫn từ "một lỗ hổng
trong code Python của bạn" tới "kẻ tấn công có quyền cao trên máy host", và
lệnh `USER` cắt đứt chuỗi đó ở chỗ nào.

> Nếu code Python có lỗ hổng cho phép thực thi lệnh từ xa, kẻ tấn công trước hết
> có quyền chạy lệnh trong container với đúng user của process. Nếu process là
> root, họ có toàn quyền sửa file, cài công cụ và truy cập các tài nguyên được
> mount trong container. Khi container còn được cấp capability nguy hiểm, mount
> Docker socket hoặc có lỗi container escape, quyền root đó có thể được dùng để
> tác động tới host. `USER appuser` cắt chuỗi ngay sau bước thực thi lệnh: mã độc
> chỉ chạy với user thường UID 10001, nên không tự do sửa file hệ thống hay thực
> hiện các thao tác cần root. Nó không thay thế việc vá lỗ hổng nhưng làm giảm
> đáng kể hậu quả khi ứng dụng bị chiếm quyền.

---

### Câu 6 — Cửa sổ trượt (CP3)

Rate limit của bạn dùng sliding window 60 giây. Nếu thay bằng cách đếm theo
phút đồng hồ (reset lúc giây 00), một người dùng có thể gửi tối đa bao nhiêu
request trong 2 giây liên tiếp khi hạn mức là 10/phút? Giải thích cách đạt được
con số đó.

> Người dùng có thể gửi tối đa 20 request trong 2 giây: gửi 10 request ở cuối
> phút, ví dụ từ `10:00:59`, rồi gửi thêm 10 request ngay sau khi bộ đếm reset ở
> `10:01:00`. Mỗi phút đồng hồ đều chỉ ghi nhận 10 request nên fixed window vẫn
> cho qua, dù thực tế 20 request nằm sát nhau. Sliding window nhìn lại đúng 60
> giây gần nhất nên sẽ thấy 10 request cũ và chặn đợt tiếp theo.

---

### Câu 7 — Rate limit và cost guard (CP3)

Hai cơ chế này khác nhau ở điểm nào? Cho một tình huống mà rate limit cho qua
nhưng cost guard phải chặn, và một tình huống ngược lại.

> Rate limit giới hạn tốc độ/số request trong một cửa sổ ngắn, còn cost guard
> giới hạn tổng số tiền một user đã tiêu trong tháng. Ví dụ user mới chỉ gửi một
> request rất dài: rate limit vẫn cho qua vì chưa đủ 10 request/phút, nhưng cost
> guard phải chặn nếu chi phí dự kiến làm vượt ngân sách tháng. Chiều ngược lại,
> một user còn gần như nguyên ngân sách và gửi 11 câu hỏi rất ngắn liên tiếp:
> cost guard vẫn có thể cho phép vì tổng tiền còn thấp, nhưng rate limit phải
> chặn request thứ 11 trong cửa sổ 60 giây.

---

### Câu 8 — /health khác /ready (CP4)

Nếu gộp hai endpoint làm một và cho nó kiểm tra Redis, chuyện gì xảy ra với cụm
3 container khi Redis mất kết nối 30 giây? Trả lời theo đúng thứ tự sự kiện.

> Nếu gộp hai endpoint và liveness cũng kiểm tra Redis, khi Redis mất kết nối thì
> cả ba container cùng trả health check lỗi. Orchestrator cho rằng process bị
> hỏng nên restart cả ba container, làm các request đang xử lý bị ngắt. Sau khi
> khởi động lại, Redis vẫn đang mất kết nối nên probe tiếp tục lỗi và cả cụm rơi
> vào vòng lặp restart, trong khi restart ứng dụng không thể sửa Redis. Khi tách
> riêng, `/health` vẫn 200 để container không bị restart, còn `/ready` trả 503 để
> load balancer tạm ngừng gửi traffic; khi Redis phục hồi, instance tự sẵn sàng
> lại mà không cần restart.

---

### Câu 9 — Stateless (CP4)

Chạy `docker compose up --scale agent=3` rồi gọi `/ask` nhiều lần với cùng một
`X-User-Id`. Quan sát `history_length` trong response. Nếu lịch sử được lưu
trong một dict Python thay vì Redis, bạn sẽ thấy con số đó thay đổi thế nào?

> Vì cả ba instance dùng chung Redis, lịch sử của cùng `X-User-Id` được nhìn thấy
> giống nhau dù request rơi vào container nào. Mỗi lần `/ask` ghi hai message
> (một `user`, một `assistant`), nên `history_length` trước khi ghi tăng theo
> chuỗi 0, 2, 4, 6... cho đến giới hạn lưu history. Nếu thay Redis bằng một dict
> Python trong từng process, mỗi container có một bản lịch sử riêng. Khi request
> được chia qua ba container, số có thể thành 0, 0, 0, 2, 2, 2... hoặc nhảy lùi
> tùy container nhận request, thay vì tăng đều. Khi container restart, phần lịch
> sử nằm trong dict của container đó cũng mất.

---

### Câu 10 — Deploy thật (CP5)

Ghi lại **một** lỗi bạn gặp khi deploy lên cloud (build fail, health check
timeout, sai REDIS_URL, app không đọc `$PORT`...): thông báo lỗi là gì, bạn
tìm ra nguyên nhân bằng cách nào, và sửa ra sao?

> Lỗi tôi gặp sau khi deploy Railway là `/health` trả 200 nhưng `/ready` trả 503
> với `{"status":"not ready","redis":false}`. Việc `/health` vẫn thành công cho
> thấy process FastAPI đang chạy, còn `/ready` thất bại giúp tôi khoanh vùng lỗi
> ở dependency Redis thay vì Dockerfile hay `$PORT`. Tôi kiểm tra biến môi
> trường và kết nối Redis trên Railway, bảo đảm `REDIS_URL` được lấy từ Redis
> add-on của project rồi redeploy. Sau khi cấu hình kết nối đúng, kiểm tra lại URL
> công khai cho kết quả `/ready` 200 với
> `{"status":"ready","redis":true}`.
