<template>
  <footer class="footer mt-auto py-4 border-top">
    <div class="container">
      <div class="row text-center text-md-start g-4">
        <div class="col-md-4">
          <h5 class="footer-title">Laptop Halo</h5>
          <p class="footer-text">Chuyên cung cấp laptop chính hãng.</p>
          <p class="footer-copy mb-0">&copy; 2025 Laptop Halo. All rights reserved.</p>
        </div>

        <div class="col-md-4">
          <h6 class="footer-title">Liên kết nhanh</h6>
          <ul class="list-unstyled footer-links">
            <li><a href="#">Chính sách bảo hành</a></li>
            <li><a href="#">Chính sách đổi trả</a></li>
            <li><a href="#">Liên hệ</a></li>
          </ul>
        </div>

        <div class="col-md-4">
          <h6 class="footer-title">Theo dõi Lê Quang Nhân</h6>
          <div class="footer-social">
            <a href="https://www.facebook.com/lequangnhanbrvt" class="me-3">Facebook</a>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>
<style scoped>
.footer {
  background-color: #f8f9fa;
  font-size: 0.9rem;
  color: #6c757d;
}

.footer-title {
  font-weight: 600;
  color: #212529;
  margin-bottom: 0.75rem;
}

.footer-text {
  margin-bottom: 0.5rem;
  line-height: 1.6;
}

.footer-copy {
  font-size: 0.85rem;
  color: #adb5bd;
}

.footer-links li {
  margin-bottom: 0.5rem;
}

.footer-links a {
  text-decoration: none;
  color: #6c757d;
  transition: color 0.2s ease;
}

.footer-links a:hover {
  color: #0d6efd; /* Bootstrap primary */
}

.footer-social a {
  text-decoration: none;
  font-weight: 500;
  color: #6c757d;
  transition: color 0.2s ease;
}

.footer-social a:hover {
  color: #0d6efd;
}
</style>
