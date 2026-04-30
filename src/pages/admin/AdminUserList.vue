<script setup lang="ts">
    import { ref, onMounted, watch } from 'vue';
    import { userService } from '@/services/userService';
    import Swal from 'sweetalert2';
    import { useAuthStore } from '@/store/auth';

const authStore = useAuthStore();
    interface User {
      user_id: number;
      full_name: string;
      email: string;
      role_id: number;
      is_active: boolean; // true: Hoạt động, false: Đã khóa
      created_at: string;
    }
    
    const users = ref<User[]>([]);
    const loading = ref(false);
    const currentPage = ref(1);
    const totalPages = ref(1);
    const keyword = ref('');
    
    
    const fetchUsers = async () => {
      loading.value = true;
      try {
        const res = await userService.getUsers(currentPage.value, keyword.value);
        users.value = res.data;
        totalPages.value = res.meta.last_page;
      } catch (error) {
        console.error(error);
      } finally {
        loading.value = false;
      }
    };
    
    
    
    // Xử lý Khóa / Mở khóa
    const toggleLock = async (user: User) => {
      const actionText = user.is_active ? 'Khóa tài khoản' : 'Mở khóa tài khoản';
      
      const result = await Swal.fire({
        title: `Xác nhận ${actionText}?`,
        text: `Bạn có chắc chắn muốn ${actionText} người dùng "${user.full_name}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: user.is_active ? '#d33' : '#28a745',
        confirmButtonText: 'Đồng ý',
        cancelButtonText: 'Hủy'
      });
    
      if (result.isConfirmed) {
        try {
          await userService.toggleLockUser(user.user_id);
          user.is_active = !user.is_active; // Cập nhật UI ngay lập tức
          Swal.fire('Thành công', `Đã ${actionText} thành công.`, 'success');
        } catch (error: any) {
          Swal.fire('Lỗi', error.response?.data?.message || 'Có lỗi xảy ra', 'error');
        }
      }
    };
    
    onMounted(() => {
      fetchUsers();
    });
    
    // Chuyển trang
    const changePage = (page: number) => {
        currentPage.value = page;
        fetchUsers();
    }
    </script>
    
    <template>
      <div class="container-fluid py-4" v-if="authStore.isAdmin">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h3>Quản lý Người dùng</h3>
        </div>
    
        <div class="card shadow-sm">
          <div class="card-body p-0">
            <table class="table table-hover align-middle mb-0">
              <thead class="bg-light">
                <tr>
                  <th class="ps-4">ID</th>
                  <th>Họ tên</th>
                  <th>Email</th>
                  <th>Vai trò</th>
                  <th>Ngày tạo</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in users" :key="user.user_id">
                  <td class="ps-4">#{{ user.user_id }}</td>
                  <td class="fw-bold">{{ user.full_name }}</td>
                  <td>{{ user.email }}</td>
                  <td>
                    <span v-if="user.role_id === 1" class="badge bg-danger">Admin</span>
                    <span v-else class="badge bg-secondary">User</span>
                  </td>
                  <td>{{ new Date(user.created_at).toLocaleDateString('vi-VN') }}</td>
                  <td>
                    <span v-if="user.is_active" class="badge bg-success">Hoạt động</span>
                    <span v-else class="badge bg-dark">Đã khóa</span>
                  </td>
                  <td>
                    <button 
                      v-if="user.role_id !== 1"
                      class="btn btn-sm"
                      :class="user.is_active ? 'btn-outline-danger' : 'btn-outline-success'"
                      @click="toggleLock(user)"
                    >
                      <i class="bi" :class="user.is_active ? 'bi-lock-fill' : 'bi-unlock-fill'"></i>
                      {{ user.is_active ? 'Khóa' : 'Mở' }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
    
        <div v-if="totalPages > 1" class="mt-3 d-flex justify-content-center">
          <nav>
            <ul class="pagination">
              <li class="page-item" :class="{ disabled: currentPage === 1 }">
                <button class="page-link" @click="changePage(currentPage - 1)">«</button>
              </li>
              <li class="page-item active">
                <span class="page-link">{{ currentPage }} / {{ totalPages }}</span>
              </li>
              <li class="page-item" :class="{ disabled: currentPage === totalPages }">
                <button class="page-link" @click="changePage(currentPage + 1)">»</button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </template>