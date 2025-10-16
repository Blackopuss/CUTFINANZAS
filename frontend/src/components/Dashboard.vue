<template>
  <main class="dashboard" lang="es" aria-label="Panel principal del usuario">
    <nav class="navbar" role="navigation" aria-label="Barra de navegación">
      <h1 id="dashboard-title">Mi Dashboard</h1>
      <button @click="handleLogout" class="btn-logout" aria-label="Cerrar sesión del usuario">
        Cerrar Sesión
      </button>
    </nav>

    <section class="dashboard-content" aria-labelledby="dashboard-title" role="region">
      <div v-if="loading" class="loading" aria-busy="true">Cargando...</div>

      <div v-else-if="user" class="user-info" aria-label="Información del usuario">
        <h2>¡Bienvenido, {{ user.username }}!</h2>

        <article class="info-card" role="article">
          <p><strong>ID:</strong> {{ user.id }}</p>
          <p><strong>Nombre de usuario:</strong> {{ user.username }}</p>
          <p><strong>Email:</strong> {{ user.email }}</p>
          <p><strong>Miembro desde:</strong> {{ formatDate(user.created_at) }}</p>
        </article>
      </div>

      <div v-else class="error" role="alert" aria-live="assertive">
        No se pudo cargar la información del usuario.
      </div>
    </section>
  </main>
</template>

<script>
import axios from 'axios'

export default {
  name: 'DashboardVue',
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
        const response = await axios.get('http://localhost:3000/api/profile', {
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
.dashboard {
  min-height: 100vh;
  background: #f5f5f5;
}

.navbar {
  background: linear-gradient(135deg, #5a67d8 0%, #764ba2 100%);
  padding: 20px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.navbar h1 {
  color: #fff;
  margin: 0;
  font-size: 1.8rem;
}

.btn-logout {
  background: #fff;
  color: #4c51bf;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 0.2s,
    background-color 0.3s;
}

.btn-logout:hover {
  transform: translateY(-2px);
  background-color: #f0f0f0;
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
  background: #fff;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.info-card p {
  margin: 15px 0;
  font-size: 16px;
  color: #444;
}

.info-card strong {
  color: #222;
  margin-right: 10px;
}

.error {
  background: #ffe6e6;
  color: #b22222;
  padding: 20px;
  border-radius: 5px;
  text-align: center;
  font-weight: 500;
}
</style>
