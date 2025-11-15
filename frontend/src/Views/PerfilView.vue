<template>
  <FondoPageComponent>
    <SideBarComponent />
    <PlantillaComponent>
      <NavbarComponent />

      <div class="perfil-container">
        <h1>👤 Mi Perfil</h1>

        <div v-if="loading" class="loading">Cargando...</div>

        <div v-else class="perfil-content">
          <!-- Tarjeta de Información Personal -->
          <section class="profile-section">
            <div class="section-header">
              <h2>📋 Información Personal</h2>
              <button v-if="!editingProfile" @click="editingProfile = true" class="btn-edit-small">
                Editar
              </button>
            </div>

            <div v-if="!editingProfile" class="info-card">
              <div class="info-item">
                <span class="label">Nombre de usuario:</span>
                <span class="value">{{ user.username }}</span>
              </div>
              <div class="info-item">
                <span class="label">Email:</span>
                <span class="value">{{ user.email }}</span>
              </div>
              <div class="info-item">
                <span class="label">ID de usuario:</span>
                <span class="value">#{{ user.id }}</span>
              </div>
              <div class="info-item">
                <span class="label">Miembro desde:</span>
                <span class="value">{{ formatDate(user.created_at) }}</span>
              </div>
            </div>

            <!-- Formulario de Edición -->
            <div v-else class="edit-form">
              <form @submit.prevent="updateProfile">
                <div class="form-group">
                  <label>Nombre de usuario</label>
                  <input type="text" v-model="profileForm.username" required />
                </div>
                <div class="form-group">
                  <label>Email</label>
                  <input type="email" v-model="profileForm.email" required />
                </div>
                <div v-if="profileError" class="error-message">{{ profileError }}</div>
                <div class="form-actions">
                  <button type="button" @click="cancelEdit" class="btn-cancel">Cancelar</button>
                  <button type="submit" class="btn-submit" :disabled="submitting">
                    {{ submitting ? 'Guardando...' : 'Guardar Cambios' }}
                  </button>
                </div>
              </form>
            </div>
          </section>

          <!-- Estadísticas Generales -->
          <section class="profile-section">
            <h2>📊 Estadísticas</h2>
            <div class="stats-grid">
              <div class="stat-box">
                <div class="stat-icon">💳</div>
                <div class="stat-content">
                  <h3 class="stat-number">{{ stats.total_cards }}</h3>
                  <p class="stat-label">Tarjetas</p>
                </div>
              </div>
              <div class="stat-box">
                <div class="stat-icon">💰</div>
                <div class="stat-content">
                  <h3 class="stat-number">${{ parseFloat(stats.total_balance || 0).toFixed(2) }}</h3>
                  <p class="stat-label">Saldo Total</p>
                </div>
              </div>
              <div class="stat-box">
                <div class="stat-icon">💸</div>
                <div class="stat-content">
                  <h3 class="stat-number">{{ stats.total_transactions }}</h3>
                  <p class="stat-label">Gastos Registrados</p>
                </div>
              </div>
              <div class="stat-box">
                <div class="stat-icon">📉</div>
                <div class="stat-content">
                  <h3 class="stat-number">${{ parseFloat(stats.total_spent || 0).toFixed(2) }}</h3>
                  <p class="stat-label">Total Gastado</p>
                </div>
              </div>
              <div class="stat-box">
                <div class="stat-icon">🎯</div>
                <div class="stat-content">
                  <h3 class="stat-number">{{ stats.total_goals }}</h3>
                  <p class="stat-label">Metas</p>
                </div>
              </div>
              <div class="stat-box">
                <div class="stat-icon">✅</div>
                <div class="stat-content">
                  <h3 class="stat-number">{{ stats.completed_goals }}</h3>
                  <p class="stat-label">Metas Completadas</p>
                </div>
              </div>
            </div>
          </section>

          <!-- Top Categorías de Gasto -->
          <section class="profile-section">
            <h2>📈 Top Categorías de Gasto</h2>
            <div v-if="topCategories.length === 0" class="empty-state-small">
              No hay gastos registrados
            </div>
            <div v-else class="categories-list">
              <div
                v-for="category in topCategories"
                :key="category.category"
                class="category-item"
                :style="{ borderLeft: `4px solid ${category.color}` }"
              >
                <div class="category-icon" :style="{ backgroundColor: category.color + '20' }">
                  {{ category.icon || '📌' }}
                </div>
                <div class="category-info">
                  <h3>{{ category.category }}</h3>
                  <p>{{ category.transaction_count }} gastos</p>
                </div>
                <div class="category-amount">
                  ${{ parseFloat(category.total_amount).toFixed(2) }}
                </div>
              </div>
            </div>
          </section>

          <!-- Actividad Reciente -->
          <section class="profile-section">
            <h2>🕐 Actividad Reciente</h2>
            <div v-if="activity.length === 0" class="empty-state-small">
              No hay actividad reciente
            </div>
            <div v-else class="activity-list">
              <div v-for="item in activity" :key="item.id + item.type" class="activity-item">
                <div class="activity-icon">{{ getActivityIcon(item.type) }}</div>
                <div class="activity-info">
                  <p class="activity-description">{{ item.description }}</p>
                  <p class="activity-date">{{ formatDate(item.date) }}</p>
                </div>
              </div>
            </div>
          </section>

          <!-- Cambiar Contraseña -->
          <section class="profile-section">
            <h2>🔒 Seguridad</h2>
            <button @click="showPasswordModal = true" class="btn-secondary">
              Cambiar Contraseña
            </button>
          </section>

          <!-- Zona Peligrosa -->
          <section class="profile-section danger-zone">
            <h2>⚠️ Zona Peligrosa</h2>
            <p>Una vez que elimines tu cuenta, no hay vuelta atrás. Por favor, ten cuidado.</p>
            <button @click="showDeleteModal = true" class="btn-danger">Eliminar Cuenta</button>
          </section>
        </div>
      </div>
    </PlantillaComponent>

    <!-- Modal Cambiar Contraseña -->
    <div v-if="showPasswordModal" class="modal-overlay" @click="closeModals">
      <div class="modal" @click.stop>
        <h3>🔒 Cambiar Contraseña</h3>
        <form @submit.prevent="changePassword">
          <div class="form-group">
            <label>Contraseña actual *</label>
            <input type="password" v-model="passwordForm.current_password" required />
          </div>
          <div class="form-group">
            <label>Nueva contraseña *</label>
            <input
              type="password"
              v-model="passwordForm.new_password"
              minlength="6"
              required
            />
            <small>Mínimo 6 caracteres</small>
          </div>
          <div class="form-group">
            <label>Confirmar nueva contraseña *</label>
            <input type="password" v-model="passwordForm.confirm_password" required />
          </div>
          <div v-if="passwordError" class="error-message">{{ passwordError }}</div>
          <div v-if="passwordSuccess" class="success-message">{{ passwordSuccess }}</div>
          <div class="modal-actions">
            <button type="button" @click="closeModals" class="btn-cancel">Cancelar</button>
            <button type="submit" class="btn-submit" :disabled="submitting">
              {{ submitting ? 'Cambiando...' : 'Cambiar Contraseña' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Eliminar Cuenta -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="closeModals">
      <div class="modal modal-small" @click.stop>
        <h3>⚠️ Eliminar Cuenta</h3>
        <p class="warning-text">
          Esta acción es <strong>PERMANENTE</strong> y no se puede deshacer. Se eliminarán:
        </p>
        <ul class="delete-list">
          <li>✗ Todas tus tarjetas</li>
          <li>✗ Todos tus gastos</li>
          <li>✗ Todas tus metas de ahorro</li>
          <li>✗ Todas tus categorías personalizadas</li>
          <li>✗ Todo tu historial de actividad</li>
        </ul>
        <form @submit.prevent="deleteAccount">
          <div class="form-group">
            <label>Confirma tu contraseña para continuar:</label>
            <input type="password" v-model="deleteForm.password" required />
          </div>
          <div v-if="deleteError" class="error-message">{{ deleteError }}</div>
          <div class="modal-actions">
            <button type="button" @click="closeModals" class="btn-cancel">Cancelar</button>
            <button type="submit" class="btn-danger" :disabled="submitting">
              {{ submitting ? 'Eliminando...' : 'Eliminar Mi Cuenta' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </FondoPageComponent>
</template>

<script>
import FondoPageComponent from '@/components/FondoPageComponent.vue'
import NavbarComponent from '@/components/NavbarComponent.vue'
import PlantillaComponent from '@/components/PlantillaComponent.vue'
import SideBarComponent from '@/components/SideBarComponent.vue'
import axios from 'axios'

export default {
  name: 'PerfilView',
  components: {
    FondoPageComponent,
    NavbarComponent,
    PlantillaComponent,
    SideBarComponent
  },
  data() {
    return {
      user: {},
      stats: {},
      topCategories: [],
      activity: [],
      loading: true,
      editingProfile: false,
      showPasswordModal: false,
      showDeleteModal: false,
      submitting: false,
      profileError: null,
      passwordError: null,
      passwordSuccess: null,
      deleteError: null,
      profileForm: {
        username: '',
        email: ''
      },
      passwordForm: {
        current_password: '',
        new_password: '',
        confirm_password: ''
      },
      deleteForm: {
        password: ''
      }
    }
  },
  async mounted() {
    await this.loadData()
  },
  methods: {
    async loadData() {
      const token = localStorage.getItem('token')

      if (!token) {
        this.$router.push('/login')
        return
      }

      try {
        const [profileRes, statsRes, categoriesRes, activityRes] = await Promise.all([
          axios.get('http://localhost:3000/api/auth/profile', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:3000/api/profile/stats', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:3000/api/profile/expenses-by-category', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:3000/api/profile/activity', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ])

        this.user = profileRes.data
        this.stats = statsRes.data
        this.topCategories = categoriesRes.data
        this.activity = activityRes.data

        this.profileForm = {
          username: this.user.username,
          email: this.user.email
        }
      } catch (error) {
        console.error('Error al cargar datos:', error)
        if (error.response?.status === 401 || error.response?.status === 403) {
          localStorage.removeItem('token')
          this.$router.push('/login')
        }
      } finally {
        this.loading = false
      }
    },

    async updateProfile() {
      this.profileError = null
      this.submitting = true
      const token = localStorage.getItem('token')

      try {
        const response = await axios.put(
          'http://localhost:3000/api/profile/update',
          this.profileForm,
          { headers: { Authorization: `Bearer ${token}` } }
        )

        this.user.username = response.data.user.username
        this.user.email = response.data.user.email
        
        // Actualizar localStorage
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
        storedUser.username = response.data.user.username
        storedUser.email = response.data.user.email
        localStorage.setItem('user', JSON.stringify(storedUser))

        this.editingProfile = false
      } catch (err) {
        this.profileError = err.response?.data?.message || 'Error al actualizar perfil'
      } finally {
        this.submitting = false
      }
    },

    cancelEdit() {
      this.editingProfile = false
      this.profileForm = {
        username: this.user.username,
        email: this.user.email
      }
      this.profileError = null
    },

    async changePassword() {
      this.passwordError = null
      this.passwordSuccess = null

      if (this.passwordForm.new_password !== this.passwordForm.confirm_password) {
        this.passwordError = 'Las contraseñas no coinciden'
        return
      }

      this.submitting = true
      const token = localStorage.getItem('token')

      try {
        await axios.put(
          'http://localhost:3000/api/profile/change-password',
          {
            current_password: this.passwordForm.current_password,
            new_password: this.passwordForm.new_password
          },
          { headers: { Authorization: `Bearer ${token}` } }
        )

        this.passwordSuccess = 'Contraseña cambiada exitosamente'
        setTimeout(() => {
          this.closeModals()
        }, 2000)
      } catch (err) {
        this.passwordError = err.response?.data?.message || 'Error al cambiar contraseña'
      } finally {
        this.submitting = false
      }
    },

    async deleteAccount() {
      this.deleteError = null
      this.submitting = true
      const token = localStorage.getItem('token')

      try {
        await axios.delete('http://localhost:3000/api/profile/delete-account', {
          headers: { Authorization: `Bearer ${token}` },
          data: { password: this.deleteForm.password }
        })

        localStorage.removeItem('token')
        localStorage.removeItem('user')
        this.$router.push('/login')
      } catch (err) {
        this.deleteError = err.response?.data?.message || 'Error al eliminar cuenta'
        this.submitting = false
      }
    },

    closeModals() {
      this.showPasswordModal = false
      this.showDeleteModal = false
      this.passwordForm = {
        current_password: '',
        new_password: '',
        confirm_password: ''
      }
      this.deleteForm = {
        password: ''
      }
      this.passwordError = null
      this.passwordSuccess = null
      this.deleteError = null
    },

    getActivityIcon(type) {
      const icons = {
        transaction: '💸',
        goal: '🎯',
        card: '💳'
      }
      return icons[type] || '📌'
    },

    formatDate(dateString) {
      if (!dateString) return 'N/A'
      const date = new Date(dateString)
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }
  }
}
</script>

<style scoped>
.perfil-container {
  padding: 40px 0;
}

.perfil-container h1 {
  font-size: 32px;
  color: #333;
  margin-bottom: 30px;
}

.loading {
  text-align: center;
  padding: 60px;
  font-size: 18px;
  color: #666;
}

.perfil-content {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.profile-section {
  background: white;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.profile-section h2 {
  font-size: 20px;
  color: #333;
  margin: 0 0 20px 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h2 {
  margin: 0;
}

.btn-edit-small {
  background: var(--color-btn);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.3s;
}

.btn-edit-small:hover {
  opacity: 0.9;
}

/* Información Personal */
.info-card {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
}

.info-item .label {
  font-weight: 600;
  color: #666;
}

.info-item .value {
  color: #333;
}

/* Formularios */
.edit-form,
.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #555;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.form-group small {
  display: block;
  margin-top: 5px;
  color: #999;
  font-size: 12px;
}

.form-actions,
.modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.btn-cancel,
.btn-submit,
.btn-secondary,
.btn-danger {
  flex: 1;
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-cancel {
  background: #f5f5f5;
  color: #666;
}

.btn-submit,
.btn-secondary {
  background: var(--color-btn);
  color: white;
}

.btn-danger {
  background: #d32f2f;
  color: white;
}

.btn-submit:disabled,
.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Estadísticas */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 15px;
}

.stat-box {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 10px;
  transition: transform 0.3s;
}

.stat-box:hover {
  transform: translateY(-3px);
}

.stat-icon {
  font-size: 36px;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-btn);
  margin: 0 0 5px 0;
}

.stat-label {
  font-size: 13px;
  color: #666;
  margin: 0;
}

/* Categorías */
.categories-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.category-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 8px;
}

.category-icon {
  width: 45px;
  height: 45px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}

.category-info {
  flex: 1;
}

.category-info h4 {
  margin: 0 0 5px 0;
  font-size: 16px;
  color: #333;
}

.category-info p {
  margin: 0;
  font-size: 13px;
  color: #666;
}

.category-amount {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-btn);
}

/* Actividad */
.activity-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
}

.activity-icon {
  font-size: 24px;
}

.activity-info {
  flex: 1;
}

.activity-description {
  margin: 0 0 5px 0;
  color: #333;
  font-size: 14px;
}

.activity-date {
  margin: 0;
  font-size: 12px;
  color: #555;
}

/* Zona Peligrosa */
.danger-zone {
  border: 2px solid #ffebee;
  background: #fff5f5;
}

.danger-zone p {
  color: #666;
  margin-bottom: 15px;
}

/* Mensajes */
.error-message {
  background: #ffebee;
  color: #c62828;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 15px;
}

.success-message {
  background: #e8f5e9;
  color: #2e7d32;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 15px;
}

.warning-text {
  color: #d32f2f;
  font-weight: 600;
  margin-bottom: 15px;
}

.delete-list {
  background: #f9f9f9;
  padding: 20px 20px 20px 40px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.delete-list li {
  color: #d32f2f;
  margin: 8px 0;
}

.empty-state-small {
  text-align: center;
  padding: 30px;
  color: #999;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 30px;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-small {
  max-width: 450px;
}

.modal h3 {
  margin-top: 0;
  color: #333;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .form-actions,
  .modal-actions {
    flex-direction: column;
  }
}
</style>