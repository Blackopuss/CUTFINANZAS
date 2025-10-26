<template>
  <div class="cards-page">
    <nav class="navbar">
      <h1>Mis Tarjetas</h1>
      <div class="nav-buttons">
        <button @click="$router.push('/dashboard')" class="btn-secondary">
          Volver al Dashboard
        </button>
        <button @click="handleLogout" class="btn-logout">Cerrar Sesión</button>
      </div>
    </nav>

    <div class="cards-content">
      <div class="header-section">
        <h2>Administración de Tarjetas</h2>
        <button @click="showAddModal = true" class="btn-add">
          + Agregar Tarjeta
        </button>
      </div>

      <div v-if="loading" class="loading">Cargando tarjetas...</div>

      <div v-else-if="cards.length === 0" class="empty-state">
        <p>No tienes tarjetas registradas</p>
        <button @click="showAddModal = true" class="btn-primary">
          Agregar tu primera tarjeta
        </button>
      </div>

      <div v-else class="cards-grid">
        <div v-for="card in cards" :key="card.id" class="card-item">
          <div class="card-header">
            <h3>{{ card.card_name }}</h3>
            <span class="card-type" :class="card.card_type.toLowerCase()">
              {{ card.card_type }}
            </span>
          </div>
          <p class="bank-name">{{ card.bank_name }}</p>
          <p class="card-balance">Saldo: ${{ parseFloat(card.balance || 0).toFixed(2) }}</p>
          <p class="card-date">Agregada: {{ formatDate(card.created_at) }}</p>
          
          <div class="card-actions">
            <button @click="openAddBalanceModal(card)" class="btn-balance">
              💰 Saldo
            </button>
            <button @click="openEditModal(card)" class="btn-edit">
              Editar
            </button>
            <button @click="openDeleteModal(card)" class="btn-delete">
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Agregar/Editar Tarjeta -->
    <div v-if="showAddModal || showEditModal" class="modal-overlay" @click="closeModals">
      <div class="modal" @click.stop>
        <h3>{{ showEditModal ? 'Editar Tarjeta' : 'Agregar Tarjeta' }}</h3>
        
        <form @submit.prevent="showEditModal ? updateCard() : addCard()">
          <div class="form-group">
            <label>Nombre de la tarjeta</label>
            <input
              type="text"
              v-model="formData.card_name"
              placeholder="Ej: Tarjeta Principal"
              required
            />
          </div>

          <div class="form-group">
            <label>Tipo de tarjeta</label>
            <select v-model="formData.card_type" required>
              <option value="">Selecciona un tipo</option>
              <option value="Débito">Débito</option>
              <option value="Crédito">Crédito</option>
            </select>
          </div>

          <div class="form-group">
            <label>Banco</label>
            <input
              type="text"
              v-model="formData.bank_name"
              placeholder="Ej: BBVA, Santander"
              required
            />
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
        <h3>¿Eliminar tarjeta?</h3>
        <p>¿Estás seguro de que deseas eliminar la tarjeta <strong>{{ cardToDelete?.card_name }}</strong>?</p>
        <p class="warning">Esta acción no se puede deshacer.</p>
        
        <div class="modal-actions">
          <button @click="closeModals" class="btn-cancel">Cancelar</button>
          <button @click="deleteCard" class="btn-delete" :disabled="submitting">
            {{ submitting ? 'Eliminando...' : 'Eliminar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Agregar Saldo -->
    <div v-if="showBalanceModal" class="modal-overlay" @click="closeModals">
      <div class="modal modal-small" @click.stop>
        <h3>Agregar Saldo</h3>
        <p>Tarjeta: <strong>{{ selectedCard?.card_name }}</strong></p>
        <p>Saldo actual: <strong>${{ parseFloat(selectedCard?.balance || 0).toFixed(2) }}</strong></p>
        
        <form @submit.prevent="addBalance">
          <div class="form-group">
            <label>Monto a agregar</label>
            <input
              type="number"
              v-model="balanceAmount"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              required
            />
          </div>

          <div v-if="error" class="error-message">{{ error }}</div>

          <div class="modal-actions">
            <button type="button" @click="closeModals" class="btn-cancel">
              Cancelar
            </button>
            <button type="submit" class="btn-submit" :disabled="submitting">
              {{ submitting ? 'Agregando...' : 'Agregar Saldo' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'CardsVue',
  data() {
    return {
      cards: [],
      loading: true,
      showAddModal: false,
      showEditModal: false,
      showDeleteModal: false,
      showBalanceModal: false,
      submitting: false,
      error: null,
      formData: {
        card_name: '',
        card_type: '',
        bank_name: ''
      },
      editingCardId: null,
      cardToDelete: null,
      selectedCard: null,
      balanceAmount: ''
    };
  },
  async mounted() {
    await this.loadCards();
  },
  methods: {
    async loadCards() {
      const token = localStorage.getItem('token');
      
      if (!token) {
        this.$router.push('/login');
        return;
      }

      try {
        const response = await axios.get('http://localhost:3000/api/cards', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        this.cards = response.data;
      } catch (error) {
        console.error('Error al cargar tarjetas:', error);
        if (error.response?.status === 401 || error.response?.status === 403) {
          localStorage.removeItem('token');
          this.$router.push('/login');
        }
      } finally {
        this.loading = false;
      }
    },
    
    async addCard() {
      this.error = null;
      this.submitting = true;
      const token = localStorage.getItem('token');

      try {
        await axios.post('http://localhost:3000/api/cards', this.formData, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        await this.loadCards();
        this.closeModals();
        this.resetForm();
      } catch (err) {
        this.error = err.response?.data?.message || 'Error al agregar tarjeta';
      } finally {
        this.submitting = false;
      }
    },
    
    openEditModal(card) {
      this.editingCardId = card.id;
      this.formData = {
        card_name: card.card_name,
        card_type: card.card_type,
        bank_name: card.bank_name
      };
      this.showEditModal = true;
    },
    
    async updateCard() {
      this.error = null;
      this.submitting = true;
      const token = localStorage.getItem('token');

      try {
        await axios.put(
          `http://localhost:3000/api/cards/${this.editingCardId}`,
          this.formData,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        
        await this.loadCards();
        this.closeModals();
        this.resetForm();
      } catch (err) {
        this.error = err.response?.data?.message || 'Error al actualizar tarjeta';
      } finally {
        this.submitting = false;
      }
    },
    
    openDeleteModal(card) {
      this.cardToDelete = card;
      this.showDeleteModal = true;
    },
    
    openAddBalanceModal(card) {
      this.selectedCard = card;
      this.balanceAmount = '';
      this.showBalanceModal = true;
    },
    
    async addBalance() {
      this.error = null;
      this.submitting = true;
      const token = localStorage.getItem('token');

      try {
        await axios.post(
          `http://localhost:3000/api/cards/${this.selectedCard.id}/add-balance`,
          { amount: parseFloat(this.balanceAmount) },
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        
        await this.loadCards();
        this.closeModals();
      } catch (err) {
        this.error = err.response?.data?.message || 'Error al agregar saldo';
      } finally {
        this.submitting = false;
      }
    },
    
    async deleteCard() {
      this.submitting = true;
      const token = localStorage.getItem('token');

      try {
        await axios.delete(
          `http://localhost:3000/api/cards/${this.cardToDelete.id}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        
        await this.loadCards();
        this.closeModals();
      } catch (err) {
        this.error = err.response?.data?.message || 'Error al eliminar tarjeta';
      } finally {
        this.submitting = false;
      }
    },
    
    closeModals() {
      this.showAddModal = false;
      this.showEditModal = false;
      this.showDeleteModal = false;
      this.showBalanceModal = false;
      this.resetForm();
      this.error = null;
    },
    
    resetForm() {
      this.formData = {
        card_name: '',
        card_type: '',
        bank_name: ''
      };
      this.editingCardId = null;
      this.cardToDelete = null;
      this.selectedCard = null;
      this.balanceAmount = '';
    },
    
    handleLogout() {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      this.$router.push('/login');
    },
    
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  }
};
</script>

<style scoped>
.cards-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.navbar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.navbar h1 {
  color: white;
  margin: 0;
  font-size: 24px;
}

.nav-buttons {
  display: flex;
  gap: 10px;
}

.btn-secondary, .btn-logout {
  background: white;
  color: #667eea;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.btn-secondary:hover, .btn-logout:hover {
  transform: translateY(-2px);
}

.cards-content {
  padding: 40px;
  max-width: 1200px;
  margin: 0 auto;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.header-section h2 {
  color: #333;
  margin: 0;
}

.btn-add {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.card-item {
  background: white;
  padding: 24px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.card-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 12px;
}

.card-header h3 {
  color: #333;
  margin: 0;
  font-size: 18px;
}

.card-type {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.card-type.débito {
  background: #e3f2fd;
  color: #1976d2;
}

.card-type.crédito {
  background: #f3e5f5;
  color: #7b1fa2;
}

.bank-name {
  color: #666;
  margin: 8px 0;
  font-size: 16px;
}

.card-date {
  color: #999;
  font-size: 13px;
  margin-bottom: 16px;
}

.card-balance {
  color: #667eea;
  font-size: 18px;
  font-weight: 700;
  margin: 8px 0;
}

.card-actions {
  display: flex;
  gap: 8px;
}

.btn-edit, .btn-delete, .btn-balance {
  flex: 1;
  padding: 8px 12px;
  border: none;
  border-radius: 5px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
  font-size: 13px;
}

.btn-balance {
  background: #e8f5e9;
  color: #2e7d32;
}

.btn-balance:hover {
  opacity: 0.8;
}

.btn-edit {
  background: #e3f2fd;
  color: #1976d2;
}

.btn-edit:hover {
  opacity: 0.8;
}

.btn-delete {
  background: #ffebee;
  color: #c62828;
}

.btn-delete:hover {
  opacity: 0.8;
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
.form-group select {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
}

.form-group input:focus,
.form-group select:focus {
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

.warning {
  color: #f57c00;
  font-size: 14px;
}

.modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.btn-cancel, .btn-submit, .btn-primary {
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

.btn-submit, .btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>