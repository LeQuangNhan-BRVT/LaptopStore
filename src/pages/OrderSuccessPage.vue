<template>
  <div class="container text-center py-5">
    <div class="card shadow-sm p-5 d-inline-block">
      <div class="mb-4 text-success">
        <i class="bi bi-check-circle-fill" style="font-size: 4rem"></i>
      </div>
      <h2 class="mb-3">Đặt Hàng Thành Công!</h2>
      <p class="text-muted">Cảm ơn bạn đã mua sắm tại Laptop Halo.</p>
      <p>Đơn hàng của bạn đang được xử lý.</p>

      <div class="mt-4">
        <RouterLink to="/" class="btn btn-primary me-2">Về Trang Chủ</RouterLink>
        <RouterLink to="/orders" class="btn btn-outline-secondary">Xem Đơn Hàng</RouterLink>
      </div>
    </div>
  </div>
</template>
