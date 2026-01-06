<script setup lang="ts">
    import { ref, onMounted } from 'vue';
    import apiClient from '@/services/apiClient';
    import Swal from 'sweetalert2';
    import * as bootstrap from 'bootstrap'; // Import bootstrap an toàn
    
    // --- STATE ---
    const staffs = ref<any[]>([]);
    const isLoading = ref(false);
    const isEditMode = ref(false);
    let modalInstance: bootstrap.Modal | null = null;
    
    const form = ref({
      account_id: 0, // Dùng khi sửa
      full_name: '',
      email: '',
      password: '',
      phone_number: ''
    });
    
    // --- API FUNCTIONS ---
    
    // 1. Lấy danh sách nhân viên
    const fetchStaffs = async () => {
      try {
        isLoading.value = true;
        // Giả sử API lấy list user có filter role=staff hoặc role_id=2
        // Bạn cần đảm bảo Backend có endpoint này
        const res = await apiClient.get('/accounts?role_id=2'); 
        staffs.value = res.data;
      } catch (error) {
        console.error('Lỗi tải danh sách:', error);
      } finally {
        isLoading.value = false;
      }
    };
    
    
    const openModal = (staff?: any) => {
      const modalEl = document.getElementById('staffModal');
      if (modalEl) {
        modalInstance = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
        
        if (staff) {
          
          isEditMode.value = true;
          form.value = { 
            ...staff, 
            password: ''
          };
        } else {
          // Chế độ Thêm mới
          isEditMode.value = false;
          form.value = { account_id: 0, full_name: '', email: '', password: '', phone_number: '' };
        }
        
        modalInstance.show();
      }
    };
    
    
    const saveStaff = async () => {
      try {
        if (isEditMode.value) {
          // API Cập nhật (Nếu backend hỗ trợ)
          await apiClient.put(`/accounts/${form.value.account_id}`, form.value);
          Swal.fire('Thành công', 'Cập nhật thông tin thành công', 'success');
        } else {
          // API Tạo mới (Code cũ của bạn)
          await apiClient.post('/accounts/admin/create-staff', form.value);
          Swal.fire('Thành công', 'Đã tạo tài khoản nhân viên', 'success');
        }
    
        // Đóng modal và load lại danh sách
        modalInstance?.hide();
        fetchStaffs();
      } catch (error: any) {
        Swal.fire('Lỗi', error.response?.data?.message || 'Có lỗi xảy ra', 'error');
      }
    };
    
   
    const deleteStaff = async (id: number) => {
      const result = await Swal.fire({
        title: 'Xóa nhân viên này?',
        text: 'Hành động này không thể hoàn tác!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Xóa ngay',
        cancelButtonText: 'Hủy',
        confirmButtonColor: '#d33'
      });
    
      if (result.isConfirmed) {
        try {
          await apiClient.delete(`/accounts/${id}`);
          Swal.fire('Đã xóa!', '', 'success');
          fetchStaffs();
        } catch (error: any) {
          Swal.fire('Lỗi', error.response?.data?.message || 'Không thể xóa', 'error');
        }
      }
    };
    
    onMounted(() => {
      fetchStaffs();
    });
    </script>
    
    <template>
      <div class="container-fluid py-4">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h3 class="fw-bold text-primary"><i class="bi bi-people-fill me-2"></i>Quản lý Nhân viên</h3>
          <button class="btn btn-primary shadow-sm" @click="openModal()">
            <i class="bi bi-person-plus-fill me-2"></i> Tạo nhân viên mới
          </button>
        </div>
    
        <div class="card shadow-sm border-0">
          <div class="card-body p-0">
            <div class="table-responsive">
              <table class="table table-hover align-middle mb-0">
                <thead class="bg-light">
                  <tr>
                    <th class="ps-4">Họ tên</th>
                    <th>Email (Tài khoản)</th>
                    <th>Số điện thoại</th>
                    <th>Vai trò</th>
                    <th class="text-end pe-4">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="isLoading">
                    <td colspan="5" class="text-center py-4">
                      <div class="spinner-border text-primary" role="status"></div>
                    </td>
                  </tr>
                  
                  <tr v-else-if="staffs.length === 0">
                    <td colspan="5" class="text-center py-4 text-muted">
                      Chưa có nhân viên nào.
                    </td>
                  </tr>
    
                  <tr v-else v-for="staff in staffs" :key="staff.account_id">
                    <td class="ps-4 fw-bold">{{ staff.full_name }}</td>
                    <td>{{ staff.email }}</td>
                    <td>{{ staff.phone_number || '---' }}</td>
                    <td><span class="badge bg-info bg-opacity-10 text-info border border-info">Nhân viên</span></td>
                    <td class="text-end pe-4">
                      <button class="btn btn-sm btn-light text-primary me-2" @click="openModal(staff)" title="Sửa">
                        <i class="bi bi-pencil-square"></i>
                      </button>
                      <button class="btn btn-sm btn-light text-danger" @click="deleteStaff(staff.account_id)" title="Xóa">
                        <i class="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
    
        <div class="modal fade" id="staffModal" tabindex="-1" aria-hidden="true">
          <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title fw-bold">
                  {{ isEditMode ? 'Cập nhật thông tin' : 'Tạo tài khoản nhân viên' }}
                </h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              
              <form @submit.prevent="saveStaff">
                <div class="modal-body">
                  <div class="mb-3">
                    <label class="form-label fw-bold">Họ và tên <span class="text-danger">*</span></label>
                    <input v-model="form.full_name" class="form-control" required placeholder="Nhập họ tên nhân viên" />
                  </div>
                  
                  <div class="mb-3">
                    <label class="form-label fw-bold">Email đăng nhập <span class="text-danger">*</span></label>
                    <input v-model="form.email" type="email" class="form-control" required :disabled="isEditMode" placeholder="email@laptopshop.com" />
                    <div v-if="isEditMode" class="form-text">Không thể thay đổi email.</div>
                  </div>
    
                  <div class="mb-3">
                    <label class="form-label fw-bold">
                      Mật khẩu <span v-if="!isEditMode" class="text-danger">*</span>
                    </label>
                    <input v-model="form.password" type="password" class="form-control" :required="!isEditMode" placeholder="Nhập mật khẩu..." />
                    <div v-if="isEditMode" class="form-text text-muted">Để trống nếu không muốn đổi mật khẩu.</div>
                  </div>
    
                  <div class="mb-3">
                    <label class="form-label fw-bold">Số điện thoại</label>
                    <input v-model="form.phone_number" class="form-control" placeholder="090..." />
                  </div>
                </div>
                
                <div class="modal-footer">
                  <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Hủy</button>
                  <button type="submit" class="btn btn-primary fw-bold">
                    {{ isEditMode ? 'Lưu thay đổi' : 'Tạo tài khoản' }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </template>