<script setup lang="ts">
import { ref } from 'vue'
import Swal from 'sweetalert2'

// Biến quản lý form
const form = ref({
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
})

const isLoading = ref(false)

// Xử lý gửi liên hệ
const handleSubmit = async () => {
  // Validate cơ bản
  if (!form.value.name || !form.value.email || !form.value.message) {
    Swal.fire('Lỗi', 'Vui lòng điền đầy đủ thông tin bắt buộc (*)', 'error')
    return
  }

  isLoading.value = true

  // Giả lập gọi API (Bạn có thể thay bằng API thực tế gửi mail/lưu db)
  setTimeout(() => {
    isLoading.value = false
    Swal.fire({
      icon: 'success',
      title: 'Gửi thành công!',
      text: 'Cảm ơn bạn đã liên hệ. Chúng tôi sẽ phản hồi sớm nhất có thể.',
      confirmButtonColor: '#0d6efd',
    })

    // Reset form
    form.value = {
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: '',
    }
  }, 1500)
}
</script>

<template>
  <div class="contact-page">
    <div class="bg-primary text-white py-5 mb-5 header-banner">
      <div class="container text-center">
        <h1 class="fw-bold display-5">Liên Hệ Với Laptop Halo</h1>
        <p class="lead mb-0">Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ 12/7</p>
      </div>
    </div>

    <div class="container">
      <div class="row mb-5 text-center">
        <div class="col-lg-8 mx-auto">
          <h2 class="fw-bold text-primary mb-3">Laptop Halo - Uy Tín Tạo Niềm Tin</h2>
          <p class="text-muted">
            Chuyên cung cấp các dòng laptop chính hãng, gaming, văn phòng và đồ họa. Với đội ngũ kỹ
            thuật viên giàu kinh nghiệm, chúng tôi cam kết mang lại trải nghiệm dịch vụ tốt nhất
            cùng chế độ bảo hành hậu mãi tận tâm.
          </p>
        </div>
      </div>

      <div class="row g-4 mb-5">
        <div class="col-md-3">
          <div class="contact-card h-100 p-4 text-center shadow-sm rounded bg-white">
            <div class="icon-circle bg-primary text-white mb-3 mx-auto">
              <i class="bi bi-geo-alt-fill fs-4"></i>
            </div>
            <h5 class="fw-bold">Địa chỉ</h5>
            <p class="text-muted small mb-0">235 Nguyễn Văn Cừ, Quận 1, TP. Hồ Chí Minh</p>
          </div>
        </div>

        <div class="col-md-3">
          <div class="contact-card h-100 p-4 text-center shadow-sm rounded bg-white">
            <div class="icon-circle bg-success text-white mb-3 mx-auto">
              <i class="bi bi-telephone-fill fs-4"></i>
            </div>
            <h5 class="fw-bold">Hotline</h5>
            <p class="text-muted small mb-0">
              <a href="tel:0901234567" class="text-decoration-none text-muted">090.1234.567</a>
            </p>
          </div>
        </div>

        <div class="col-md-3">
          <div class="contact-card h-100 p-4 text-center shadow-sm rounded bg-white">
            <div class="icon-circle bg-warning text-white mb-3 mx-auto">
              <i class="bi bi-envelope-fill fs-4"></i>
            </div>
            <h5 class="fw-bold">Email</h5>
            <p class="text-muted small mb-0">
              <a href="mailto:support@laptopshop.com" class="text-decoration-none text-muted"
                >support@laptopshop.com</a
              >
            </p>
          </div>
        </div>

        <div class="col-md-3">
          <div class="contact-card h-100 p-4 text-center shadow-sm rounded bg-white">
            <div class="icon-circle bg-info text-white mb-3 mx-auto">
              <i class="bi bi-clock-fill fs-4"></i>
            </div>
            <h5 class="fw-bold">Giờ mở cửa</h5>
            <p class="text-muted small mb-0">Thứ 2 - Chủ Nhật<br />8:00 - 21:00</p>
          </div>
        </div>
      </div>

      <div class="row g-0 shadow-lg rounded overflow-hidden mb-5">
        <div class="col-lg-6 bg-white p-5">
          <h3 class="fw-bold mb-4">Gửi tin nhắn cho chúng tôi</h3>
          <form @submit.prevent="handleSubmit">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label fw-bold small"
                  >Họ tên <span class="text-danger">*</span></label
                >
                <input
                  type="text"
                  class="form-control bg-light border-0 py-2"
                  v-model="form.name"
                  placeholder="Nhập họ tên..."
                />
              </div>
              <div class="col-md-6">
                <label class="form-label fw-bold small"
                  >Email <span class="text-danger">*</span></label
                >
                <input
                  type="email"
                  class="form-control bg-light border-0 py-2"
                  v-model="form.email"
                  placeholder="Nhập email..."
                />
              </div>
              <div class="col-md-6">
                <label class="form-label fw-bold small">Số điện thoại</label>
                <input
                  type="tel"
                  class="form-control bg-light border-0 py-2"
                  v-model="form.phone"
                  placeholder="Nhập SĐT..."
                />
              </div>
              <div class="col-md-6">
                <label class="form-label fw-bold small">Chủ đề</label>
                <select class="form-select bg-light border-0 py-2" v-model="form.subject">
                  <option value="">Chọn chủ đề</option>
                  <option value="Tư vấn mua hàng">Tư vấn mua hàng</option>
                  <option value="Bảo hành">Bảo hành / Sửa chữa</option>
                  <option value="Khiếu nại">Góp ý / Khiếu nại</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
              <div class="col-12">
                <label class="form-label fw-bold small"
                  >Nội dung tin nhắn <span class="text-danger">*</span></label
                >
                <textarea
                  class="form-control bg-light border-0"
                  rows="5"
                  v-model="form.message"
                  placeholder="Bạn cần hỗ trợ gì?"
                ></textarea>
              </div>
              <div class="col-12 mt-4">
                <button
                  type="submit"
                  class="btn btn-primary w-100 py-2 fw-bold"
                  :disabled="isLoading"
                >
                  <span v-if="isLoading" class="spinner-border spinner-border-sm me-2"></span>
                  GỬI LIÊN HỆ
                </button>
              </div>
            </div>
          </form>
        </div>

        <div class="col-lg-6">
          <div class="h-100 w-100 map-container">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1970.4042824901246!2d106.65543836123378!3d10.714215339505008!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f3442c9eddf%3A0xe5025f0a9b1ddbb7!2zQ2jDuWEgQW4gSMOyYQ!5e1!3m2!1svi!2s!4v1765615014990!5m2!1svi!2s"
              width="600"
              height="450"
              style="border: 0"
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.header-banner {
  /* Bạn có thể thay bằng ảnh nền shop nếu muốn */
  background: linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%);
}

.contact-card {
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
  border: 1px solid #f0f0f0;
}

.contact-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1) !important;
  border-color: #cce5ff;
}

.icon-circle {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Style cho Input form để nhìn hiện đại hơn */
.form-control:focus,
.form-select:focus {
  background-color: #fff !important;
  box-shadow: 0 0 0 2px rgba(13, 110, 253, 0.25);
  border: 1px solid #86b7fe !important;
}

/* Map responsive */
.map-container iframe {
  width: 100%;
  height: 100%;
}
</style>
