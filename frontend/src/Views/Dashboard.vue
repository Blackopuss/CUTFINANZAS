<template>
  <div class="dashboard">
    <SideBarComponent />
    <!-- <nav class="navbar">
      <h1>Mi Dashboard</h1>
      <button @click="handleLogout" class="btn-logout">Cerrar Sesión</button>
    </nav> -->

    <div class="dashboard-content">
      <NavBar />
      <div v-if="loading" class="loading">Cargando...</div>

      <section v-else-if="user" class="user-info" aria-labelledby="user-section-title">
        <h2 id="user-section-title">¡Bienvenido, {{ user.username }}!</h2>

        <article class="info-card" aria-label="Información del usuario">
          <p><strong>ID:</strong> {{ user.id }}</p>
          <p><strong>Nombre de usuario:</strong> {{ user.username }}</p>
          <p><strong>Email:</strong> {{ user.email }}</p>
          <p><strong>Miembro desde:</strong> {{ formatDate(user.created_at) }}</p>
        </article>

        <section class="actions-section" aria-labelledby="quick-actions-title">
          <h3 id="quick-actions-title">Acciones Rápidas</h3>
          <div class="action-buttons">
            <button
              @click="$router.push('/cards')"
              class="action-btn"
              aria-label="Ir a mis tarjetas"
            >
              <span class="icon" aria-hidden="true">💳</span>
              <span>Mis Tarjetas</span>
            </button>

            <button
              @click="$router.push('/transactions')"
              class="action-btn"
              aria-label="Ir a mis gastos"
            >
              <span class="icon" aria-hidden="true">💸</span>
              <span>Mis Gastos</span>
            </button>
          </div>
        </section>
      </section>

      <div v-else class="error">No se pudo cargar la información del usuario.</div>
    </div>
  </div>
</template>

<script>
import NavBar from '@/components/NavbarComponent.vue'
import SideBarComponent from '../components/SideBarComponent.vue'
import axios from 'axios'

export default {
  name: 'DashboardVue',
  components: {
    SideBarComponent,
    NavBar,
  },
  data() {
    return {
      user: null,
      loading: true,
    }
  },
  async mounted() {
    await this.loadUserProfile()
  },
  methods: {
    async loadUserProfile() {
      const token = localStorage.getItem('token')

      if (!token) {
        this.$router.push('/login')
        return
      }

      try {
        const response = await axios.get('http://localhost:3000/api/auth/profile', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        this.user = response.data
      } catch (error) {
        console.error('Error al cargar perfil:', error)
        // Si el token es inválido, redirigir al login
        if (error.response?.status === 401 || error.response?.status === 403) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          this.$router.push('/login')
        }
      } finally {
        this.loading = false
      }
    },
    handleLogout() {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      this.$router.push('/login')
    },
    formatDate(dateString) {
      if (!dateString) return 'N/A'
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
* {
  box-sizing: border-box;
}
.dashboard {
  padding: 10px 5px 0 10px;
  min-height: 100vh;
  background: var(--color-fondo);
  display: flex;
  flex-direction: row;
  justify-content: space-around;
}

.btn-logout {
  font-weight: 600;
  background: #030626;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  transition: transform 0.2s;
}

.btn-logout:hover {
  transform: translateY(-2px);
}

.dashboard-content {
  border: 0.2px solid rgba(0, 0, 0, 0.1);
  height: auto;
  min-height: 90vh;
  padding: 40px;
  border-radius: 16px;
  width: 90vw;
  max-width: 90vw;
  margin: 20px 0 25px;
  background-color: var(--color-comp);
  box-shadow: 5px 5px 10px 5px rgba(0, 0, 0, 0.3);
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
  font-size: 1.5rem;
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

/* ===== Acciones ===== */
.actions-section {
  margin-top: 30px;
}

.actions-section h3 {
  color: #333;
  margin-bottom: 15px;
  font-size: 1.2rem;
}

.action-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.action-btn {
  background: var(--color-fondo);
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2);
  border: 0.2px solid rgba(0, 0, 0, 0.1);
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
  color: #030626;
}

.action-btn:hover {
  background: linear-gradient(135deg, #030626 0%, #01013d 100%);
  color: white;
  transform: translateY(-5px);
  box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
}

.action-btn .icon {
  font-size: 32px;
}

/* ===== Footer ===== */
.footer {
  padding: 10px;
  text-align: center;
  color: #888;
  font-size: 14px;
}
</style>
