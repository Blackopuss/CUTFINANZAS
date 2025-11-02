<template>
  <FondoPageComponent>
    <SideBarComponent />
    <PlantillaComponent>
      <NavbarComponent />
      
      <div class="container-top">
        <h1>Mis Categorías</h1>
        <button @click="showAddModal = true" class="agregarCategoria">
          + Crear Categoría
        </button>
      </div>

      <!-- Estadísticas -->
      <div v-if="!loading && categories.length > 0" class="stats-section">
        <div class="stat-card">
          <h2>📊 Total de Categorías</h2>
          <h3 class="stat-number">{{ categories.length }}</h3>
        </div>
        <div class="stat-card">
          <h2>💰 Categoría más usada</h2>
          <h3 class="stat-text">{{ mostUsedCategory?.name || 'N/A' }}</h3>
          <h3 class="stat-subtext">{{ mostUsedCategory?.transaction_count || 0 }} gastos</h3>
        </div>
      </div>

      <!-- Contenedor de categorías -->
      <div class="container-categorias">
        <div v-if="loading" class="loading">
          Cargando categorías...
        </div>

        <div v-else-if="categories.length === 0" class="empty-state">
          <p>No tienes categorías personalizadas</p>
          <button @click="showAddModal = true" class="btn-primary">
            Crear tu primera categoría
          </button>
        </div>

        <div v-else class="categories-grid">
          <div 
            v-for="category in categories" 
            :key="category.id" 
            class="category-card"
            :style="{ borderLeft: `4px solid ${category.color}` }"
          >
            <div class="category-header">
              <div class="category-icon" :style="{ backgroundColor: category.color + '20' }">
                {{ category.icon }}
              </div>
              <div class="category-info">
                <h2>{{ category.name }}</h2>
                <p class="category-stats">
                  {{ category.transaction_count || 0 }} gastos • 
                  ${{ parseFloat(category.total_spent || 0).toFixed(2) }}
                </p>
              </div>
            </div>

            <div class="category-actions">
              <button @click="openEditModal(category)" class="btn-edit" title="Editar">
                ✏️
              </button>
              <button @click="openDeleteModal(category)" class="btn-delete" title="Eliminar">
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>
    </PlantillaComponent>

    <!-- Modal Agregar/Editar Categoría -->
    <div v-if="showAddModal || showEditModal" class="modal-overlay" @click="closeModals">
      <div class="modal" @click.stop>
        <h2>{{ showEditModal ? 'Editar Categoría' : 'Nueva Categoría' }}</h2>

        <form @submit.prevent="showEditModal ? updateCategory() : addCategory()">
          <div class="form-group">
            <label>Nombre *</label>
            <input
              type="text"
              v-model="formData.name"
              placeholder="Ej: Mascotas, Hogar, Viajes"
              maxlength="50"
              required
            />
            <small>{{ formData.name.length }}/50 caracteres</small>
          </div>

          <div class="form-group">
            <label>Icono (Emoji)</label>
            <div class="emoji-picker">
              <input
                type="text"
                v-model="formData.icon"
                placeholder="📌"
                maxlength="10"
                class="emoji-input"
              />
              <div class="emoji-suggestions">
                <button
                  v-for="emoji in suggestedEmojis"
                  :key="emoji"
                  type="button"
                  @click="formData.icon = emoji"
                  class="emoji-btn"
                >
                  {{ emoji }}
                </button>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label>Color</label>
            <div class="color-picker">
              <input
                type="color"
                v-model="formData.color"
                class="color-input"
              />
              <div class="color-suggestions">
                <button
                  v-for="color in suggestedColors"
                  :key="color"
                  type="button"
                  @click="formData.color = color"
                  class="color-btn"
                  :style="{ backgroundColor: color }"
                ></button>
              </div>
            </div>
            <small>Color seleccionado: {{ formData.color }}</small>
          </div>

          <div class="preview-section">
            <label>Vista previa:</label>
            <div class="category-preview" :style="{ borderLeft: `4px solid ${formData.color}` }">
              <div class="category-icon" :style="{ backgroundColor: formData.color + '20' }">
                {{ formData.icon || '📌' }}
              </div>
              <div class="category-info">
                <h4>{{ formData.name || 'Nombre de categoría' }}</h4>
              </div>
            </div>
          </div>

          <div v-if="error" class="error-message">{{ error }}</div>

          <div class="modal-actions">
            <button type="button" @click="closeModals" class="btn-cancel">
              Cancelar
            </button>
            <button type="submit" class="btn-submit" :disabled="submitting">
              {{ submitting ? 'Guardando...' : 'Guardar' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Confirmar Eliminación -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="closeModals">
      <div class="modal modal-small" @click.stop>
        <h2>¿Eliminar categoría?</h2>
        <div class="delete-preview">
          <div class="category-icon" :style="{ backgroundColor: categoryToDelete?.color + '20' }">
            {{ categoryToDelete?.icon }}
          </div>
          <p><strong>{{ categoryToDelete?.name }}</strong></p>
        </div>
        
        <div v-if="categoryToDelete?.transaction_count > 0" class="warning-box">
          ⚠️ Esta categoría tiene <strong>{{ categoryToDelete.transaction_count }}</strong> 
          gasto(s) asociado(s). No se puede eliminar.
          <p>Primero elimina o reasigna los gastos de esta categoría.</p>
        </div>
        <p v-else class="warning">Esta acción no se puede deshacer.</p>

        <div class="modal-actions">
          <button @click="closeModals" class="btn-cancel">Cancelar</button>
          <button 
            @click="deleteCategory" 
            class="btn-delete" 
            :disabled="submitting || (categoryToDelete?.transaction_count > 0)"
          >
            {{ submitting ? 'Eliminando...' : 'Eliminar' }}
          </button>
        </div>
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
  name: 'CategoriasView',
  components: {
    FondoPageComponent,
    NavbarComponent,
    PlantillaComponent,
    SideBarComponent
  },
  data() {
    return {
      categories: [],
      loading: true,
      showAddModal: false,
      showEditModal: false,
      showDeleteModal: false,
      submitting: false,
      error: null,
      formData: {
        name: '',
        icon: '📌',
        color: '#A29BFE'
      },
      editingCategoryId: null,
      categoryToDelete: null,
      suggestedEmojis: ['🍔', '🚗', '🎮', '💊', '📚', '💡', '🛒', '✈️', '🏠', '🐕', '👕', '🎬'],
      suggestedColors: [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
        '#FFEAA7', '#DFE6E9', '#74B9FF', '#A29BFE',
        '#FD79A8', '#FDCB6E', '#6C5CE7', '#00B894'
      ]
    }
  },
  computed: {
    mostUsedCategory() {
      if (this.categories.length === 0) return null
      return this.categories.reduce((prev, current) => {
        return (prev.transaction_count > current.transaction_count) ? prev : current
      })
    }
  },
  async mounted() {
    await this.loadCategories()
  },
  methods: {
    async loadCategories() {
      const token = localStorage.getItem('token')

      if (!token) {
        this.$router.push('/login')
        return
      }

      try {
        const response = await axios.get('http://localhost:3000/api/user-categories/stats/usage', {
          headers: { Authorization: `Bearer ${token}` }
        })
        this.categories = response.data
      } catch (error) {
        console.error('Error al cargar categorías:', error)
        if (error.response?.status === 401 || error.response?.status === 403) {
          localStorage.removeItem('token')
          this.$router.push('/login')
        }
      } finally {
        this.loading = false
      }
    },

    async addCategory() {
      this.error = null
      this.submitting = true
      const token = localStorage.getItem('token')

      try {
        await axios.post('http://localhost:3000/api/user-categories', this.formData, {
          headers: { Authorization: `Bearer ${token}` }
        })

        await this.loadCategories()
        this.closeModals()
        this.resetForm()
      } catch (err) {
        this.error = err.response?.data?.message || 'Error al agregar categoría'
      } finally {
        this.submitting = false
      }
    },

    openEditModal(category) {
      this.editingCategoryId = category.id
      this.formData = {
        name: category.name,
        icon: category.icon,
        color: category.color
      }
      this.showEditModal = true
    },

    async updateCategory() {
      this.error = null
      this.submitting = true
      const token = localStorage.getItem('token')

      try {
        await axios.put(
          `http://localhost:3000/api/user-categories/${this.editingCategoryId}`,
          this.formData,
          { headers: { Authorization: `Bearer ${token}` } }
        )

        await this.loadCategories()
        this.closeModals()
        this.resetForm()
      } catch (err) {
        this.error = err.response?.data?.message || 'Error al actualizar categoría'
      } finally {
        this.submitting = false
      }
    },

    openDeleteModal(category) {
      this.categoryToDelete = category
      this.showDeleteModal = true
    },

    async deleteCategory() {
      this.submitting = true
      const token = localStorage.getItem('token')

      try {
        await axios.delete(
          `http://localhost:3000/api/user-categories/${this.categoryToDelete.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )

        await this.loadCategories()
        this.closeModals()
      } catch (err) {
        this.error = err.response?.data?.message || 'Error al eliminar categoría'
        this.submitting = false
      } finally {
        if (!this.error) {
          this.submitting = false
        }
      }
    },

    closeModals() {
      this.showAddModal = false
      this.showEditModal = false
      this.showDeleteModal = false
      this.resetForm()
      this.error = null
    },

    resetForm() {
      this.formData = {
        name: '',
        icon: '📌',
        color: '#A29BFE'
      }
      this.editingCategoryId = null
      this.categoryToDelete = null
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
}

.container-top h1 {
  font-size: 30px;
  color: #333;
}

.agregarCategoria {
  display: flex;
  justify-content: center;
  align-items: center;
  border: none;
  background: var(--color-btn);
  color: #ffffff;
  font-weight: bold;
  padding: 12px 24px;
  border-radius: 14px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.agregarCategoria:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  opacity: 0.9;
}

/* Estadísticas */
.stats-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin: 30px 0;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.stat-card h2 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #666;
}

.stat-number {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-btn);
  margin: 0;
}

.stat-text {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 5px 0;
}

.stat-subtext {
  font-size: 14px;
  color: #666;
  margin: 0;
}

/* Container de categorías */
.container-categorias {
  width: 100%;
  min-height: 400px;
  margin-top: 30px;
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
  transition: all 0.3s;
}

.btn-primary:hover {
  transform: translateY(-2px);
  opacity: 0.9;
}

/* Grid de categorías */
.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.category-card {
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s;
}

.category-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.category-header {
  display: flex;
  align-items: center;
  gap: 15px;
  flex: 1;
}

.category-icon {
  width: 50px;
  height: 50px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.category-info h2 {
  margin: 0 0 5px 0;
  font-size: 18px;
  color: #333;
}

.category-stats {
  font-size: 13px;
  color: #666;
  margin: 0;
}

.category-actions {
  display: flex;
  gap: 8px;
}

.btn-edit,
.btn-delete {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 8px;
  border-radius: 5px;
  transition: background 0.2s;
}

.btn-edit:hover,
.btn-delete:hover {
  background: #f0f0f0;
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
  border-radius: 10px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-small {
  max-width: 400px;
}

.modal h2 {
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

.form-group input[type="text"] {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
}

.form-group small {
  display: block;
  margin-top: 5px;
  color: #999;
  font-size: 12px;
}

/* Emoji Picker */
.emoji-picker {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.emoji-input {
  width: 80px;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 24px;
  text-align: center;
}

.emoji-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.emoji-btn {
  width: 45px;
  height: 45px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 8px;
  font-size: 24px;
  cursor: pointer;
  transition: all 0.2s;
}

.emoji-btn:hover {
  background: #f0f0f0;
  transform: scale(1.1);
}

/* Color Picker */
.color-picker {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.color-input {
  width: 80px;
  height: 45px;
  border: 1px solid #ddd;
  border-radius: 5px;
  cursor: pointer;
}

.color-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.color-btn {
  width: 40px;
  height: 40px;
  border: 2px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.color-btn:hover {
  transform: scale(1.15);
  border-color: #333;
}

/* Preview */
.preview-section {
  margin: 20px 0;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 8px;
}

.preview-section label {
  display: block;
  margin-bottom: 10px;
  font-weight: 600;
  color: #555;
}

.category-preview {
  background: white;
  padding: 15px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 15px;
}

.category-preview h4 {
  margin: 0;
  color: #333;
}

/* Delete Preview */
.delete-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  margin: 20px 0;
  padding: 20px;
  background: #f9f9f9;
  border-radius: 8px;
}

.delete-preview p {
  margin: 0;
  font-size: 18px;
}

.warning-box {
  background: #fff3cd;
  border: 1px solid #ffc107;
  color: #856404;
  padding: 15px;
  border-radius: 8px;
  margin: 15px 0;
}

.warning-box strong {
  font-weight: 700;
}

.warning-box p {
  margin: 10px 0 0 0;
  font-size: 14px;
}

.warning {
  color: #f57c00;
  font-size: 14px;
  text-align: center;
}

.error-message {
  background: #ffebee;
  color: #c62828;
  padding: 12px;
  border-radius: 5px;
  margin-bottom: 15px;
}

/* Modal Actions */
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
  transition: all 0.2s;
}

.btn-cancel {
  background: #f5f5f5;
  color: #666;
}

.btn-cancel:hover {
  background: #e0e0e0;
}

.btn-submit {
  background: var(--color-btn);
  color: white;
}

.btn-submit:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-delete {
  background: #c62828;
  color: white;
}

.btn-delete:hover:not(:disabled) {
  background: #a02020;
}

.btn-submit:disabled,
.btn-delete:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>