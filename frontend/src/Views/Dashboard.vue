<template>
  <div class="dashboard">
    <nav class="navbar">
      <h1>Mi Dashboard</h1>
      <button @click="handleLogout" class="btn-logout">Cerrar Sesión</button>
    </nav>

    <div class="dashboard-content">
      <div v-if="loading" class="loading">Cargando...</div>
      
      <div v-else-if="user" class="user-info">
        <h2>¡Bienvenido, {{ user.username }}!</h2>
        <div class="info-card">
          <p><strong>ID:</strong> {{ user.id }}</p>
          <p><strong>Nombre de usuario:</strong> {{ user.username }}</p>
          <p><strong>Email:</strong> {{ user.email }}</p>
          <p><strong>Miembro desde:</strong> {{ formatDate(user.created_at) }}</p>
        </div>

        <div class="actions-section">
          <h3>Acciones Rápidas</h3>
          <div class="action-buttons">
            <button @click="$router.push('/cards')" class="action-btn">
              <span class="icon">💳</span>
              <span>Mis Tarjetas</span>
            </button>
            <button @click="$router.push('/transactions')" class="action-btn">
              <span class="icon">💸</span>
              <span>Mis Gastos</span>
            </button>
          </div>
        </div>
      </div>

      <div v-else class="error">
        No se pudo cargar la información del usuario.
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'DashboardVue',
  data() {
    return {
      user: null,
      loading: true
    };
  },
  async mounted() {
    await this.loadUserProfile();
  },
  methods: {
    async loadUserProfile() {
      const token = localStorage.getItem('token');
      
      if (!token) {
        this.$router.push('/login');
        return;
      }

      try {
        const response = await axios.get('http://localhost:3000/api/auth/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        this.user = response.data;
      } catch (error) {
        console.error('Error al cargar perfil:', error);
        // Si el token es inválido, redirigir al login
        if (error.response?.status === 401 || error.response?.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          this.$router.push('/login');
        }
      } finally {
        this.loading = false;
      }
    },
    handleLogout() {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      this.$router.push('/login');
    },
    formatDate(dateString) {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  }
};
</script>

<style scoped>
.dashboard {
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

.btn-logout:hover {
  transform: translateY(-2px);
}

.dashboard-content {
  padding: 40px;
  max-width: 800px;
  margin: 0 auto;
}

.loading {
  text-align: center;
  padding: 40px;
  font-size: 18px;
  color: #666;
}

.user-info h2 {
  color: #333;
  margin-bottom: 30px;
}

.info-card {
  background: white;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.info-card p {
  margin: 15px 0;
  font-size: 16px;
  color: #555;
}

.info-card strong {
  color: #333;
  margin-right: 10px;
}

.error {
  background: #fee;
  color: #c33;
  padding: 20px;
  border-radius: 5px;
  text-align: center;
}

.actions-section {
  margin-top: 30px;
}

.actions-section h3 {
  color: #333;
  margin-bottom: 15px;
}

.action-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.action-btn {
  background: white;
  border: 2px solid #667eea;
  padding: 20px;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 16px;
  font-weight: 600;
  color: #667eea;
}

.action-btn:hover {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  transform: translateY(-5px);
  box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
}

.action-btn .icon {
  font-size: 32px;
}
</style>