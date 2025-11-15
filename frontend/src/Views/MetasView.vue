<template>
  <FondoPageComponent>
    <SideBarComponent />
    <PlantillaComponent>
      <NavbarComponent />

      <!-- Header -->
      <div class="container-top">
        <h2>🎯 Mis Metas de Ahorro</h2>
        <button @click="showAddModal = true" class="btn-add">+ Nueva Meta</button>
      </div>

      <!-- Resumen -->
      <div v-if="!loading && summary" class="summary-section">
        <div class="summary-card">
          <h3>📊 Total de Metas</h3>
          <h4 class="stat-number">{{ summary.total_goals }}</h4>
          <p class="stat-text">
            {{ summary.active_goals }} activas • {{ summary.completed_goals }} completadas
          </p>
        </div>
        <div class="summary-card">
          <h3>💰 Total Ahorrado</h3>
          <h4 class="stat-number">${{ parseFloat(summary.total_saved || 0).toFixed(2) }}</h4>
          <p class="stat-text">de ${{ parseFloat(summary.total_target || 0).toFixed(2) }}</p>
        </div>
        <div class="summary-card">
          <h3>🎯 Por Alcanzar</h3>
          <h4 class="stat-number">${{ parseFloat(summary.total_remaining || 0).toFixed(2) }}</h4>
        </div>
      </div>

      <!-- Lista de Metas -->
      <div class="goals-container">
        <div v-if="loading" class="loading">Cargando metas...</div>

        <div v-else-if="goals.length === 0" class="empty-state">
          <p>No tienes metas de ahorro</p>
          <button @click="showAddModal = true" class="btn-primary">Crear tu primera meta</button>
        </div>

        <div v-else class="goals-grid">
          <div v-for="goal in goals" :key="goal.id" class="goal-card" :class="goal.calculated_status">
            <!-- Header -->
            <div class="goal-header">
              <div class="goal-title">
                <h3>{{ goal.name }}</h3>
                <span class="goal-status" :class="goal.calculated_status">
                  {{ getStatusText(goal.calculated_status) }}
                </span>
              </div>
              <div class="goal-actions">
                <button @click="openContributeModal(goal)" class="btn-icon" title="Contribuir">💰</button>
                <button @click="openEditModal(goal)" class="btn-icon" title="Editar">✏️</button>
                <button @click="openDeleteModal(goal)" class="btn-icon" title="Eliminar">🗑️</button>
              </div>
            </div>

            <!-- Progreso -->
            <div class="progress-section">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: goal.progress_percentage + '%' }">
                  <span v-if="goal.progress_percentage >= 20" class="progress-text">
                    {{ goal.progress_percentage }}%
                  </span>
                </div>
              </div>
              <p class="progress-label">
                {{ goal.progress_percentage < 20 ? goal.progress_percentage + '%' : '' }}
              </p>
            </div>

            <!-- Montos -->
            <div class="goal-amounts">
              <div class="amount-item">
                <span class="label">Ahorrado:</span>
                <span class="value">${{ parseFloat(goal.current_amount || 0).toFixed(2) }}</span>
              </div>
              <div class="amount-item">
                <span class="label">Meta:</span>
                <span class="value">${{ parseFloat(goal.target_amount).toFixed(2) }}</span>
              </div>
              <div class="amount-item">
                <span class="label">Falta:</span>
                <span class="value remaining">${{ parseFloat(goal.remaining_amount || 0).toFixed(2) }}</span>
              </div>
            </div>

            <!-- deadline || null -->
            <div v-if="goal.deadline" class="goal-deadline">
              <span>📅</span>
              <span>{{ formatDate(goal.deadline) }}</span>
              <span class="days-left" :class="{ urgent: getDaysLeft(goal.deadline) <= 7 }">
                ({{ getDaysLeftText(goal.deadline) }})
              </span>
            </div>

            <!-- Descripción -->
            <p v-if="goal.description" class="goal-description">{{ goal.description }}</p>
          </div>
        </div>
      </div>
    </PlantillaComponent>

    <!-- Modal Agregar/Editar Meta -->
    <div v-if="showAddModal || showEditModal" class="modal-overlay" @click="closeModals">
      <div class="modal" @click.stop>
        <h3>{{ showEditModal ? 'Editar Meta' : 'Nueva Meta de Ahorro' }}</h3>

        <form @submit.prevent="showEditModal ? updateGoal() : addGoal()">
          <div class="form-group">
            <label>Nombre de la meta *</label>
            <input
              type="text"
              v-model="formData.name"
              placeholder="Ej: Vacaciones, Casa nueva, Auto"
              maxlength="100"
              required
            />
          </div>

          <div class="form-group">
            <label>Monto objetivo *</label>
            <input
              type="number"
              v-model="formData.target_amount"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              required
            />
          </div>

          <div class="form-group">
            <label>Fecha límite (opcional)</label>
            <input type="date" v-model="formData.deadline" :min="getTodayDate()" />
          </div>

          <div class="form-group">
            <label>Descripción (opcional)</label>
            <textarea
              v-model="formData.description"
              placeholder="Describe tu meta..."
              rows="3"
            ></textarea>
          </div>

          <div v-if="error" class="error-message">{{ error }}</div>

          <div class="modal-actions">
            <button type="button" @click="closeModals" class="btn-cancel">Cancelar</button>
            <button type="submit" class="btn-submit" :disabled="submitting">
              {{ submitting ? 'Guardando...' : 'Guardar' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Contribuir -->
    <div v-if="showContributeModal" class="modal-overlay" @click="closeModals">
      <div class="modal modal-small" @click.stop>
        <h3>💰 Contribuir a la Meta</h3>
        <div class="contribute-info">
          <h4>{{ selectedGoal?.name }}</h4>
          <p>
            Ahorrado: <strong>${{ parseFloat(selectedGoal?.current_amount || 0).toFixed(2) }}</strong>
          </p>
          <p>
            Meta: <strong>${{ parseFloat(selectedGoal?.target_amount || 0).toFixed(2) }}</strong>
          </p>
          <p class="remaining">
            Falta: <strong>${{ parseFloat(selectedGoal?.remaining_amount || 0).toFixed(2) }}</strong>
          </p>
        </div>

        <form @submit.prevent="contribute">
          <div class="form-group">
            <label>Monto a contribuir *</label>
            <input
              type="number"
              v-model="contributeAmount"
              step="0.01"
              min="0.01"
              :max="parseFloat(selectedGoal?.remaining_amount || 0)"
              placeholder="0.00"
              required
            />
            <small>Máximo: ${{ parseFloat(selectedGoal?.remaining_amount || 0).toFixed(2) }}</small>
          </div>

          <div class="form-group">
            <label>Nota (opcional)</label>
            <input type="text" v-model="contributeNote" placeholder="Ej: Ahorro del mes" />
          </div>

          <div v-if="error" class="error-message">{{ error }}</div>

          <div class="modal-actions">
            <button type="button" @click="closeModals" class="btn-cancel">Cancelar</button>
            <button type="submit" class="btn-submit" :disabled="submitting">
              {{ submitting ? 'Agregando...' : 'Contribuir' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Eliminar -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="closeModals">
      <div class="modal modal-small" @click.stop>
        <h3>¿Eliminar meta?</h3>
        <p>¿Estás seguro de que deseas eliminar la meta <strong>{{ goalToDelete?.name }}</strong>?</p>
        <p class="warning">Esta acción no se puede deshacer y perderás todo el historial de contribuciones.</p>

        <div class="modal-actions">
          <button @click="closeModals" class="btn-cancel">Cancelar</button>
          <button @click="deleteGoal" class="btn-delete" :disabled="submitting">
            {{ submitting ? 'Eliminando...' : 'Eliminar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Notificación de Meta Completada -->
    <div v-if="showCelebration" class="celebration-modal">
      <div class="celebration-content">
        <div class="celebration-icon">🎉</div>
        <h2>¡Felicidades!</h2>
        <p>Has completado tu meta de ahorro</p>
        <h3>{{ celebrationGoal }}</h3>
        <button @click="closeCelebration" class="btn-primary">¡Genial!</button>
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
  name: 'MetasView',
  components: {
    FondoPageComponent,
    NavbarComponent,
    PlantillaComponent,
    SideBarComponent
  },
  data() {
    return {
      goals: [],
      summary: null,
      loading: true,
      showAddModal: false,
      showEditModal: false,
      showDeleteModal: false,
      showContributeModal: false,
      showCelebration: false,
      submitting: false,
      error: null,
      formData: {
        name: '',
        target_amount: '',
        deadline: '',
        description: ''
      },
      editingGoalId: null,
      goalToDelete: null,
      selectedGoal: null,
      contributeAmount: '',
      contributeNote: '',
      celebrationGoal: ''
    }
  },
  async mounted() {
    await this.loadData()
    this.checkForNotifications()
  },
  methods: {
    async loadData() {
      await Promise.all([this.loadGoals(), this.loadSummary()])
    },

    async loadGoals() {
      const token = localStorage.getItem('token')

      if (!token) {
        this.$router.push('/login')
        return
      }

      try {
        const response = await axios.get('http://localhost:3000/api/savings-goals', {
          headers: { Authorization: `Bearer ${token}` }
        })
        this.goals = response.data
      } catch (error) {
        console.error('Error al cargar metas:', error)
        if (error.response?.status === 401 || error.response?.status === 403) {
          localStorage.removeItem('token')
          this.$router.push('/login')
        }
      } finally {
        this.loading = false
      }
    },

    async loadSummary() {
      const token = localStorage.getItem('token')
      try {
        const response = await axios.get('http://localhost:3000/api/savings-goals/summary/stats', {
          headers: { Authorization: `Bearer ${token}` }
        })
        this.summary = response.data
      } catch (error) {
        console.error('Error al cargar resumen:', error)
      }
    },

    async addGoal() {
      this.error = null
      this.submitting = true
      const token = localStorage.getItem('token')

      try {
        await axios.post('http://localhost:3000/api/savings-goals', this.formData, {
          headers: { Authorization: `Bearer ${token}` }
        })

        await this.loadData()
        this.closeModals()
        this.resetForm()
      } catch (err) {
        this.error = err.response?.data?.message || 'Error al crear meta'
      } finally {
        this.submitting = false
      }
    },

    openEditModal(goal) {
      this.editingGoalId = goal.id
      this.formData = {
        name: goal.name,
        target_amount: goal.target_amount,
        deadline: goal.deadline || '',
        description: goal.description || ''
      }
      this.showEditModal = true
    },

    async updateGoal() {
      this.error = null
      this.submitting = true
      const token = localStorage.getItem('token')

      try {
        await axios.put(
          `http://localhost:3000/api/savings-goals/${this.editingGoalId}`,
          this.formData,
          { headers: { Authorization: `Bearer ${token}` } }
        )

        await this.loadData()
        this.closeModals()
        this.resetForm()
      } catch (err) {
        this.error = err.response?.data?.message || 'Error al actualizar meta'
      } finally {
        this.submitting = false
      }
    },

    openDeleteModal(goal) {
      this.goalToDelete = goal
      this.showDeleteModal = true
    },

    async deleteGoal() {
      this.submitting = true
      const token = localStorage.getItem('token')

      try {
        await axios.delete(`http://localhost:3000/api/savings-goals/${this.goalToDelete.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        await this.loadData()
        this.closeModals()
      } catch (err) {
        this.error = err.response?.data?.message || 'Error al eliminar meta'
        this.submitting = false
      }
    },

    openContributeModal(goal) {
      this.selectedGoal = goal
      this.contributeAmount = ''
      this.contributeNote = ''
      this.showContributeModal = true
    },

    async contribute() {
      this.error = null
      this.submitting = true
      const token = localStorage.getItem('token')

      try {
        await axios.post(
          `http://localhost:3000/api/savings-goals/${this.selectedGoal.id}/contribute`,
          {
            amount: parseFloat(this.contributeAmount),
            note: this.contributeNote
          },
          { headers: { Authorization: `Bearer ${token}` } }
        )

        // Verificar si se completó la meta
        const newAmount = parseFloat(this.selectedGoal.current_amount) + parseFloat(this.contributeAmount)
        if (newAmount >= parseFloat(this.selectedGoal.target_amount)) {
          this.celebrationGoal = this.selectedGoal.name
          this.showCelebration = true
        }

        await this.loadData()
        this.closeModals()
      } catch (err) {
        this.error = err.response?.data?.message || 'Error al contribuir'
      } finally {
        this.submitting = false
      }
    },

    async checkForNotifications() {
      const token = localStorage.getItem('token')
      try {
        const response = await axios.get('http://localhost:3000/api/notifications', {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        const unreadGoalNotifications = response.data.filter(
          n => n.type === 'meta_completada' && !n.is_read
        )
        
        if (unreadGoalNotifications.length > 0) {
          const notification = unreadGoalNotifications[0]
          this.celebrationGoal = notification.goal_name
          this.showCelebration = true
          
          // Marcar como leída
          await axios.put(
            `http://localhost:3000/api/notifications/${notification.id}/read`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          )
        }
      } catch (error) {
        console.error('Error al verificar notificaciones:', error)
      }
    },

    closeModals() {
      this.showAddModal = false
      this.showEditModal = false
      this.showDeleteModal = false
      this.showContributeModal = false
      this.resetForm()
      this.error = null
    },

    closeCelebration() {
      this.showCelebration = false
      this.celebrationGoal = ''
    },

    resetForm() {
      this.formData = {
        name: '',
        target_amount: '',
        deadline: '',
        description: ''
      }
      this.editingGoalId = null
      this.goalToDelete = null
      this.selectedGoal = null
      this.contributeAmount = ''
      this.contributeNote = ''
    },

    getStatusText(status) {
      const statusMap = {
        activa: '🟢 Activa',
        completada: '✅ Completada',
        vencida: '⏰ Vencida'
      }
      return statusMap[status] || status
    },

    getTodayDate() {
      return new Date().toISOString().split('T')[0]
    },

    formatDate(dateString) {
      if (!dateString) return 'N/A'
      const date = new Date(dateString)
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    },

    getDaysLeft(deadline) {
      if (!deadline) return null
      const today = new Date()
      const deadlineDate = new Date(deadline)
      const diffTime = deadlineDate - today
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays
    },

    getDaysLeftText(deadline) {
      const days = this.getDaysLeft(deadline)
      if (days === null) return ''
      if (days < 0) return `Venció hace ${Math.abs(days)} día(s)`
      if (days === 0) return 'Vence hoy'
      if (days === 1) return 'Vence mañana'
      return `Faltan ${days} días`
    }
  }
}
</script>

<style scoped>
.container-top {
  margin-top: 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: 30px;
}

.container-top h1 {
  font-size: 30px;
  color: #333;
  margin: 0;
}

.btn-add {
  background: var(--color-btn);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-add:hover {
  transform: translateY(-2px);
  opacity: 0.9;
}

/* Resumen */
.summary-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.summary-card {
  background: white;
  padding: 24px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.summary-card h3 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #666;
}

.stat-number {
  font-size: 36px;
  font-weight: 700;
  color: var(--color-btn);
  margin: 10px 0;
}

.stat-text {
  font-size: 14px;
  color: #666;
  margin: 0;
}

/* Contenedor de metas */
.goals-container {
  width: 100%;
  min-height: 400px;
}

.loading {
  text-align: center;
  padding: 60px;
  font-size: 18px;
  color: #666;
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
  background: white;
  border-radius: 10px;
}

.empty-state p {
  font-size: 18px;
  color: #666;
  margin-bottom: 20px;
}

.btn-primary {
  background: var(--color-btn);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

/* Grid de metas */
.goals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.goal-card {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
  border-left: 5px solid var(--color-btn);
}

.goal-card.completada {
  border-left-color: #2e7d32;
}

.goal-card.vencida {
  border-left-color: #d32f2f;
  opacity: 0.8;
}

.goal-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.goal-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 20px;
}

.goal-title h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
  color: #333;
}

.goal-status {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.goal-status.activa {
  background: #e8f5e9;
  color: #2e7d32;
}

.goal-status.completada {
  background: #e3f2fd;
  color: #0d47a1;
}

.goal-status.vencida {
  background: #ffebee;
  color: #c62828;
}

.goal-actions {
  display: flex;
  gap: 5px;
}

.btn-icon {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 5px;
  border-radius: 5px;
  transition: background 0.2s;
}

.btn-icon:hover {
  background: #f0f0f0;
}

/* Progreso */
.progress-section {
  margin-bottom: 20px;
}

.progress-bar {
  width: 100%;
  height: 30px;
  background: #f0f0f0;
  border-radius: 15px;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(135deg, var(--color-btn) 0%, #667eea 100%);
  border-radius: 15px;
  transition: width 0.5s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.progress-text {
  color: white;
  font-weight: 700;
  font-size: 14px;
}

.progress-label {
  text-align: center;
  margin-top: 5px;
  font-size: 14px;
  color: #666;
  font-weight: 600;
}

/* Montos */
.goal-amounts {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin-bottom: 15px;
}

.amount-item {
  text-align: center;
}

.amount-item .label {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 5px;
}

.amount-item .value {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: #333;
}

.amount-item .remaining {
  color: #bf360c;
}

/* Deadline */
.goal-deadline {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background: #f9f9f9;
  border-radius: 8px;
  margin-bottom: 10px;
  font-size: 14px;
}

.days-left {
  color: #666;
  font-weight: 600;
}

.days-left.urgent {
  color: #d32f2f;
  font-weight: 700;
}

.goal-description {
  color: #666;
  font-size: 14px;
  margin: 10px 0 0 0;
  line-height: 1.5;
}

/* Modales */
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
  border-radius: 10px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-small {
  max-width: 400px;
}

.modal h3 {
  margin-top: 0;
  color: #333;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #555;
  font-weight: 600;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
  font-family: inherit;
}

.form-group textarea {
  resize: vertical;
}

.form-group small {
  display: block;
  margin-top: 5px;
  color: #999;
  font-size: 12px;
}

.contribute-info {
  background: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.contribute-info h4 {
  margin: 0 0 15px 0;
  color: #333;
}

.contribute-info p {
  margin: 8px 0;
  color: #666;
}

.contribute-info .remaining {
  color: #f57c00;
  font-weight: 600;
}

.error-message {
  background: #ffebee;
  color: #c62828;
  padding: 12px;
  border-radius: 5px;
  margin-bottom: 15px;
}

.warning {
  color: #f57c00;
  font-size: 14px;
  text-align: center;
  margin: 15px 0;
}

.modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 25px;
}

.btn-cancel,
.btn-submit,
.btn-delete {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 5px;
  font-weight: 600;
  cursor: pointer;
}

.btn-cancel {
  background: #f5f5f5;
  color: #666;
}

.btn-submit {
  background: var(--color-btn);
  color: white;
}

.btn-delete {
  background: #c62828;
  color: white;
}

.btn-submit:disabled,
.btn-delete:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Modal de celebración */
.celebration-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.celebration-content {
  background: white;
  padding: 50px;
  border-radius: 20px;
  text-align: center;
  animation: bounceIn 0.6s ease;
}

@keyframes bounceIn {
  0% {
    transform: scale(0.3);
    opacity: 0;
  }
  50% {
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.celebration-icon {
  font-size: 100px;
  margin-bottom: 20px;
  animation: rotate 2s ease infinite;
}

@keyframes rotate {
  0% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(-10deg);
  }
  50% {
    transform: rotate(10deg);
  }
  75% {
    transform: rotate(-10deg);
  }
  100% {
    transform: rotate(0deg);
  }
}

.celebration-content h2 {
  font-size: 36px;
  color: #333;
  margin: 0 0 10px 0;
}

.celebration-content p {
  font-size: 18px;
  color: #666;
  margin: 0 0 15px 0;
}

.celebration-content h3 {
  font-size: 24px;
  color: var(--color-btn);
  margin: 0 0 30px 0;
}

@media (max-width: 768px) {
  .goals-grid {
    grid-template-columns: 1fr;
  }

  .summary-section {
    grid-template-columns: 1fr;
  }

  .goal-amounts {
    grid-template-columns: 1fr;
  }
}
</style>