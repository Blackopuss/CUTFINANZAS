<template>
  <div class="transactions-page">
    <SideBarComponent />

    <div class="transactions-content">
      <!-- Resumen Total -->
      <NavbarComponent />
      <div class="summary-section">
        <div class="summary-card total-balance">
          <h2>💰 Saldo Total</h2>
          <h3 class="amount">${{ totalBalance }}</h3>
        </div>
        <div class="summary-card total-expenses">
          <h2>💸 Gastos Totales</h2>
          <h3 class="amount">${{ totalExpenses }}</h3>
        </div>
      </div>

      <!-- Header con botones -->
      <div class="header-section">
        <h3>Mis Gastos</h3>
        <button @click="showAddModal = true" class="btn-add">+ Registrar Gasto</button>
      </div>

      <!-- Filtros -->
      <div class="filters-section">
        <div class="filter-group">
       <label for="filtro-categoria">Categoría</label>
        <select id="filtro-categoria" v-model="filters.category" @change="applyFilters">
            <option value="">Todas</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.name">
              {{ cat.icon }} {{ cat.name }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label for="fecha-desde">Fecha Desde</label>
  <input id="fecha-desde" type="date" v-model="filters.start_date" @change="applyFilters" />
        </div>

        <div class="filter-group">
         <label for="fecha-hasta">Fecha Hasta</label>
  <input id="fecha-hasta" type="date" v-model="filters.end_date" @change="applyFilters" />
        </div>

        <button @click="clearFilters" class="btn-clear-filters">Limpiar Filtros</button>
      </div>

      <!-- Lista de Transacciones -->
      <div v-if="loading" class="loading">Cargando gastos...</div>

      <div v-else-if="transactions.length === 0" class="empty-state">
        <p>No hay gastos registrados</p>
        <button @click="showAddModal = true" class="btn-primary">Registrar tu primer gasto</button>
      </div>

      <div v-else class="transactions-list">
        <div v-for="transaction in transactions" :key="transaction.id" class="transaction-item">
          <div class="transaction-icon" :style="{ backgroundColor: transaction.color + '20' }">
            <span>{{ transaction.icon || '📌' }}</span>
          </div>

          <div class="transaction-info">
            <h3>{{ transaction.category }}</h3>
            <p class="description">{{ transaction.description || 'Sin descripción' }}</p>
            <p class="date">{{ formatDate(transaction.transaction_date) }}</p>
            <p v-if="transaction.card_name" class="card-info">
              💳 {{ transaction.card_name }} - {{ transaction.bank_name }}
            </p>
          </div>

          <div class="transaction-amount">
            <h3 class="amount">${{ parseFloat(transaction.amount).toFixed(2) }}</h3>
          </div>

          <div class="transaction-actions">
            <button @click="openEditModal(transaction)" class="btn-icon" title="Editar">✏️</button>
            <button @click="openDeleteModal(transaction)" class="btn-icon" title="Eliminar">
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Agregar/Editar Gasto -->
    <div v-if="showAddModal || showEditModal" class="modal-overlay" @click="closeModals">
      <div class="modal" @click.stop>
        <h3>{{ showEditModal ? 'Editar Gasto' : 'Registrar Gasto' }}</h3>

        <form @submit.prevent="showEditModal ? updateTransaction() : addTransaction()">
          <div class="form-group">
            <label for="monto">Monto *</label>
            <input 
              id="monto"
              type="number"
              v-model="formData.amount"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              required
            />
          </div>

          <div class="form-group">
        <label for="tarjeta">Tarjeta (opcional)</label>
              <select id="tarjeta" v-model="formData.card_id">
              <option value="">Sin tarjeta</option>
              <option v-for="card in cards" :key="card.id" :value="card.id">
                {{ card.card_name }} - Saldo: ${{ parseFloat(card.balance || 0).toFixed(2) }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="categoria-form">Categoría *</label>
            <select id="categoria-form" v-model="formData.category" required>
              <option value="">Selecciona una categoría</option>
              <option v-for="cat in categories" :key="cat.id" :value="cat.name">
                {{ cat.icon }} {{ cat.name }}
              </option>
            </select>
          </div>

          <div class="form-group">
        <label for="descripcion">Descripción</label>
            <textarea
            id="descripcion"
              v-model="formData.description"
              placeholder="Ej: Compra en supermercado"
              rows="3"
            ></textarea>
          </div>

          <div class="form-group">
         <label for="fecha">Fecha *</label>
            <input id="fecha" type="date" v-model="formData.transaction_date" required />
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

    <!-- Modal Confirmar Eliminación -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="closeModals">
      <div class="modal modal-small" @click.stop>
        <h3>¿Eliminar gasto?</h3>
        <p>¿Estás seguro de que deseas eliminar este gasto?</p>
        <div class="delete-info">
          <p><strong>Categoría:</strong> {{ transactionToDelete?.category }}</p>
          <p>
            <strong>Monto:</strong> ${{ parseFloat(transactionToDelete?.amount || 0).toFixed(2) }}
          </p>
        </div>
        <p class="warning">Esta acción no se puede deshacer.</p>

        <div class="modal-actions">
          <button @click="closeModals" class="btn-cancel">Cancelar</button>
          <button @click="deleteTransaction" class="btn-delete" :disabled="submitting">
            {{ submitting ? 'Eliminando...' : 'Eliminar' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import NavbarComponent from '@/components/NavbarComponent.vue'
import SideBarComponent from '@/components/SideBarComponent.vue'

export default {
  name: 'TransactionsVue',
  components: {
    SideBarComponent,
    NavbarComponent,
  },
  data() {
    return {
      transactions: [],
      cards: [],
      categories: [],
      loading: true,
      showAddModal: false,
      showEditModal: false,
      showDeleteModal: false,
      submitting: false,
      error: null,
      totalBalance: '0.00',
      totalExpenses: '0.00',
      formData: {
        card_id: '',
        amount: '',
        category: '',
        description: '',
        transaction_date: this.getTodayDate(),
      },
      filters: {
        category: '',
        start_date: '',
        end_date: '',
      },
      editingTransactionId: null,
      transactionToDelete: null,
    }
  },
  async mounted() {
    await this.loadData()
  },
  methods: {
    async loadData() {
      await Promise.all([
        this.loadTransactions(),
        this.loadCards(),
        this.loadCategories(),
        this.loadTotalBalance(),
      ])
      this.calculateTotalExpenses()
    },

    async loadTransactions() {
      const token = localStorage.getItem('token')

      if (!token) {
        this.$router.push('/login')
        return
      }

      try {
        const params = new URLSearchParams()
        if (this.filters.category) params.append('category', this.filters.category)
        if (this.filters.start_date) params.append('start_date', this.filters.start_date)
        if (this.filters.end_date) params.append('end_date', this.filters.end_date)

        const response = await axios.get(`http://localhost:3000/api/transactions?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        this.transactions = response.data
        this.calculateTotalExpenses()
      } catch (error) {
        console.error('Error al cargar transacciones:', error)
        if (error.response?.status === 401 || error.response?.status === 403) {
          localStorage.removeItem('token')
          this.$router.push('/login')
        }
      } finally {
        this.loading = false
      }
    },

    async loadCards() {
      const token = localStorage.getItem('token')
      try {
        const response = await axios.get('http://localhost:3000/api/cards', {
          headers: { Authorization: `Bearer ${token}` },
        })
        this.cards = response.data
      } catch (error) {
        console.error('Error al cargar tarjetas:', error)
      }
    },

    async loadCategories() {
      const token = localStorage.getItem('token')
      try {
        const response = await axios.get('http://localhost:3000/api/user-categories', {
          headers: { Authorization: `Bearer ${token}` },
        })
        this.categories = response.data
      } catch (error) {
        console.error('Error al cargar categorías:', error)
      }
    },

    async loadTotalBalance() {
      const token = localStorage.getItem('token')
      try {
        const response = await axios.get('http://localhost:3000/api/total-balance', {
          headers: { Authorization: `Bearer ${token}` },
        })
        this.totalBalance = response.data.total
      } catch (error) {
        console.error('Error al cargar balance total:', error)
      }
    },

    calculateTotalExpenses() {
      const total = this.transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0)
      this.totalExpenses = total.toFixed(2)
    },

    async addTransaction() {
      this.error = null
      this.submitting = true
      const token = localStorage.getItem('token')

      try {
        const data = {
          amount: parseFloat(this.formData.amount),
          category: this.formData.category,
          description: this.formData.description,
          transaction_date: this.formData.transaction_date,
        }

        if (this.formData.card_id) {
          data.card_id = parseInt(this.formData.card_id)
        }

        await axios.post('http://localhost:3000/api/transactions', data, {
          headers: { Authorization: `Bearer ${token}` },
        })

        await this.loadData()
        this.closeModals()
        this.resetForm()
      } catch (err) {
        this.error = err.response?.data?.message || 'Error al registrar gasto'
      } finally {
        this.submitting = false
      }
    },

    openEditModal(transaction) {
      this.editingTransactionId = transaction.id
      this.formData = {
        card_id: transaction.card_id || '',
        amount: transaction.amount,
        category: transaction.category,
        description: transaction.description || '',
        transaction_date: transaction.transaction_date,
      }
      this.showEditModal = true
    },

    async updateTransaction() {
      this.error = null
      this.submitting = true
      const token = localStorage.getItem('token')

      try {
        await axios.put(
          `http://localhost:3000/api/transactions/${this.editingTransactionId}`,
          {
            amount: parseFloat(this.formData.amount),
            category: this.formData.category,
            description: this.formData.description,
            transaction_date: this.formData.transaction_date,
          },
          { headers: { Authorization: `Bearer ${token}` } },
        )

        await this.loadData()
        this.closeModals()
        this.resetForm()
      } catch (err) {
        this.error = err.response?.data?.message || 'Error al actualizar gasto'
      } finally {
        this.submitting = false
      }
    },

    openDeleteModal(transaction) {
      this.transactionToDelete = transaction
      this.showDeleteModal = true
    },

    async deleteTransaction() {
      this.submitting = true
      const token = localStorage.getItem('token')

      try {
        await axios.delete(
          `http://localhost:3000/api/transactions/${this.transactionToDelete.id}`,
          { headers: { Authorization: `Bearer ${token}` } },
        )

        await this.loadData()
        this.closeModals()
      } catch (err) {
        this.error = err.response?.data?.message || 'Error al eliminar gasto'
      } finally {
        this.submitting = false
      }
    },

    applyFilters() {
      this.loading = true
      this.loadTransactions()
    },

    clearFilters() {
      this.filters = {
        category: '',
        start_date: '',
        end_date: '',
      }
      this.applyFilters()
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
        card_id: '',
        amount: '',
        category: '',
        description: '',
        transaction_date: this.getTodayDate(),
      }
      this.editingTransactionId = null
      this.transactionToDelete = null
    },

    getTodayDate() {
      return new Date().toISOString().split('T')[0]
    },

    handleLogout() {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      this.$router.push('/login')
    },

    formatDate(dateString) {
      const date = new Date(dateString)
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    },
  },
}
</script>

<style scoped>
.transactions-page {
  background-color: var(--color-fondo);
  padding: 10px 5px 0 10px;
  min-height: 100vh;

  display: flex;
  flex-direction: row;
  justify-content: space-around;
}

.btn-secondary,
.btn-logout {
  background: white;
  color: #667eea;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.btn-secondary:hover,
.btn-logout:hover {
  transform: translateY(-2px);
}

.transactions-content {
  display: flex;
  flex-direction: column;
  border: 0.2px solid rgba(0, 0, 0, 0.1);
  height: auto;
  min-height: 87vh;
  padding: 40px;
  border-radius: 16px;
  width: 90vw;
  max-width: 90vw;
  margin: 20px 0 25px;
  background-color: var(--color-comp);
  box-shadow: 5px 5px 10px 5px rgba(0, 0, 0, 0.3);
}

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
  font-size: 16px;
  color: #666;
}

.summary-card .amount {
  font-size: 32px;
  font-weight: 700;
  margin: 0;
}

.total-balance .amount {
  color: #2e7d32;
}

.total-expenses .amount {
  color: #c62828;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-section h2 {
  color: #333;
  margin: 0;
}

.btn-add {
  background: var(--color-btn);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 5px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.btn-add:hover {
  transform: translateY(-2px);
}

.filters-section {
  background: white;
  padding: 20px;
  border-radius: 10px 10px 0 0; /* Redondeado solo arriba */
  margin-bottom: 0;             /* 🔥 Une las secciones */
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  align-items: end;
}

.filter-group {
  flex: 1;
  min-width: 150px;
}

.filter-group label {
  display: block;
  margin-bottom: 5px;
  color: #555;
  font-weight: 500;
  font-size: 14px;
}

.filter-group select,
.filter-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
}

.btn-clear-filters {
  background: var(--color-btn);
  color: #ffffff;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  font-weight: 600;
  cursor: pointer;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 10px;
}

.empty-state p {
  color: #666;
  font-size: 18px;
  margin-bottom: 20px;
}

.transactions-list {
  background: white;
  border-radius: 0 0 10px 10px; /* 🔥 Completa el bloque unido */
  overflow: hidden;
}

.transaction-item {
  display: flex;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.2s;
}

.transaction-item:hover {
  background: #f9f9f9;
}

.transaction-item:last-child {
  border-bottom: none;
}

.transaction-icon {
  width: 50px;
  height: 50px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-right: 15px;
}

.transaction-info {
  flex: 1;
}

.transaction-info h4 {
  margin: 0 0 5px 0;
  color: #333;
  font-size: 16px;
}

.transaction-info .description {
  color: #0d0d0d;
  margin: 3px 0;
  font-size: 14px;
}

.transaction-info .date {
  color: #0d0d0d   ;
  font-size: 13px;
  margin: 3px 0;
}

.transaction-info .card-info {
  color: #3949ab;
  font-size: 12px;
  margin: 5px 0 0 0;
}

.transaction-amount {
  margin-right: 20px;
}

.transaction-amount .amount {
  font-size: 20px;
  font-weight: 700;
  color: #c62828;
  margin: 0;
}

.transaction-actions {
  display: flex;
  gap: 5px;
}

.btn-icon {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 5px;
  transition: background 0.2s;
}

.btn-icon:hover {
  background: #f0f0f0;
}

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
  margin-bottom: 5px;
  color: #555;
  font-weight: 500;
}

.form-group input,
.form-group select,
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

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
}

.error-message {
  background: #ffebee;
  color: #c62828;
  padding: 10px;
  border-radius: 5px;
  margin-bottom: 15px;
}

.delete-info {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 5px;
  margin: 15px 0;
}

.delete-info p {
  margin: 5px 0;
  color: #555;
}

.warning {
  color: #f57c00;
  font-size: 14px;
}

.modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.btn-cancel,
.btn-submit,
.btn-primary,
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

.btn-submit,
.btn-primary {
  background: var(--color-btn);
  color: white;
}

.btn-delete {
  background: #c62828;
  color: white;
}

.btn-submit:disabled,
.btn-delete:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .transaction-item {
    flex-wrap: wrap;
  }

  .transaction-amount {
    margin-right: 0;
    margin-top: 10px;
    width: 100%;
  }

  .filters-section {
    flex-direction: column;
  }

  .filter-group {
    width: 100%;
  }
}
</style>
