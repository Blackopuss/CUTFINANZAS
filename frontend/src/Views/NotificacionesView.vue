<template>
  <FondoPageComponent>
    <SideBarComponent />
    <PlantillaComponent>
      <NavbarComponent />

      <div class="notificaciones-container">
        <div class="header-section">
          <h1>🔔 Notificaciones</h1>
          <div class="header-actions">
            <button
              v-if="unreadCount > 0"
              @click="markAllAsRead"
              class="btn-mark-all"
              :disabled="marking"
            >
              {{ marking ? 'Marcando...' : 'Marcar todas como leídas' }}
            </button>
          </div>
        </div>

        <!-- Filtros -->
        <div class="filters-section">
          <button
            @click="filterType = 'all'"
            class="filter-btn"
            :class="{ active: filterType === 'all' }"
          >
            Todas ({{ notifications.length }})
          </button>
          <button
            @click="filterType = 'unread'"
            class="filter-btn"
            :class="{ active: filterType === 'unread' }"
          >
            No leídas ({{ unreadCount }})
          </button>
          <button
            @click="filterType = 'meta_completada'"
            class="filter-btn"
            :class="{ active: filterType === 'meta_completada' }"
          >
            🎯 Metas Completadas
          </button>
        </div>

        <div v-if="loading" class="loading">Cargando notificaciones...</div>

        <div v-else-if="filteredNotifications.length === 0" class="empty-state">
          <div class="empty-icon">🔔</div>
          <p v-if="filterType === 'all'">No tienes notificaciones</p>
          <p v-else-if="filterType === 'unread'">No tienes notificaciones sin leer</p>
          <p v-else>No tienes notificaciones de este tipo</p>
        </div>

        <div v-else class="notifications-list">
          <div
            v-for="notification in filteredNotifications"
            :key="notification.id"
            class="notification-card"
            :class="{ unread: !notification.is_read }"
            @click="markAsRead(notification)"
          >
            <div class="notification-icon">{{ getNotificationIcon(notification.type) }}</div>
            <div class="notification-content">
              <div class="notification-header">
                <h2>{{ notification.title }}</h2>
                <span v-if="!notification.is_read" class="unread-badge">●</span>
              </div>
              <p class="notification-message">{{ notification.message }}</p>
              <div class="notification-footer">
                <span class="notification-time">{{ formatDate(notification.created_at) }}</span>
                <span v-if="notification.goal_name" class="notification-goal">
                  📌 {{ notification.goal_name }}
                </span>
              </div>
            </div>
            <div class="notification-actions">
              <button
                v-if="notification.goal_id"
                @click.stop="goToGoal(notification.goal_id)"
                class="btn-action"
                title="Ver meta"
              >
                Ver 👁️
              </button>
            </div>
          </div>
        </div>

        <!-- Estadísticas -->
        <div v-if="notifications.length > 0" class="stats-section">
          <div class="stat-card">
            <h3>📊 Total de Notificaciones</h3>
            <h3 class="stat-number">{{ notifications.length }}</H3>
          </div>
          <div class="stat-card">
            <h3>🎯 Metas Completadas</h3>
            <h3 class="stat-number">{{ completedGoalsCount }}</h3>
          </div>
          <div class="stat-card">
            <h3>✉️ Sin Leer</h3>
            <h3 class="stat-number">{{ unreadCount }}</h3>
          </div>
        </div>
      </div>
    </PlantillaComponent>
  </FondoPageComponent>
</template>

<script>
import FondoPageComponent from '@/components/FondoPageComponent.vue'
import NavbarComponent from '@/components/NavbarComponent.vue'
import PlantillaComponent from '@/components/PlantillaComponent.vue'
import SideBarComponent from '@/components/SideBarComponent.vue'
import axios from 'axios'

export default {
  name: 'NotificacionesView',
  components: {
    FondoPageComponent,
    NavbarComponent,
    PlantillaComponent,
    SideBarComponent
  },
  data() {
    return {
      notifications: [],
      loading: true,
      marking: false,
      filterType: 'all'
    }
  },
  computed: {
    filteredNotifications() {
      if (this.filterType === 'all') {
        return this.notifications
      } else if (this.filterType === 'unread') {
        return this.notifications.filter((n) => !n.is_read)
      } else {
        return this.notifications.filter((n) => n.type === this.filterType)
      }
    },
    unreadCount() {
      return this.notifications.filter((n) => !n.is_read).length
    },
    completedGoalsCount() {
      return this.notifications.filter((n) => n.type === 'meta_completada').length
    }
  },
  async mounted() {
    await this.loadNotifications()
  },
  methods: {
    async loadNotifications() {
      const token = localStorage.getItem('token')

      if (!token) {
        this.$router.push('/login')
        return
      }

      try {
        const response = await axios.get('http://localhost:3000/api/notifications', {
          headers: { Authorization: `Bearer ${token}` }
        })
        this.notifications = response.data
      } catch (error) {
        console.error('Error al cargar notificaciones:', error)
        if (error.response?.status === 401 || error.response?.status === 403) {
          localStorage.removeItem('token')
          this.$router.push('/login')
        }
      } finally {
        this.loading = false
      }
    },

    async markAsRead(notification) {
      if (notification.is_read) return

      const token = localStorage.getItem('token')

      try {
        await axios.put(
          `http://localhost:3000/api/notifications/${notification.id}/read`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        )
        notification.is_read = true
      } catch (error) {
        console.error('Error al marcar notificación:', error)
      }
    },

    async markAllAsRead() {
      this.marking = true
      const token = localStorage.getItem('token')

      try {
        await axios.put(
          'http://localhost:3000/api/notifications/read-all',
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        )
        this.notifications.forEach((n) => (n.is_read = true))
      } catch (error) {
        console.error('Error al marcar notificaciones:', error)
      } finally {
        this.marking = false
      }
    },

    goToGoal(goalId) {
      this.$router.push(`/metas?goal=${goalId}`)
    },

    getNotificationIcon(type) {
      const icons = {
        meta_completada: '🎉',
        meta_proxima: '⏰',
        meta_vencida: '⚠️'
      }
      return icons[type] || '🔔'
    },

    formatDate(dateString) {
      if (!dateString) return 'N/A'
      const date = new Date(dateString)
      const now = new Date()
      const diff = now - date
      const minutes = Math.floor(diff / 60000)
      const hours = Math.floor(diff / 3600000)
      const days = Math.floor(diff / 86400000)

      if (minutes < 1) return 'Justo ahora'
      if (minutes < 60) return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`
      if (hours < 24) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`
      if (days < 7) return `Hace ${days} día${days > 1 ? 's' : ''}`

      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }
}
</script>

<style scoped>
.notificaciones-container {
  padding: 40px 0;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.header-section h1 {
  font-size: 32px;
  color: #333;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.btn-mark-all {
  background: var(--color-btn);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.3s;
}

.btn-mark-all:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-mark-all:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Filtros */
.filters-section {
  display: flex;
  gap: 10px;
  margin-bottom: 25px;
  flex-wrap: wrap;
}

.filter-btn {
  background: white;
  border: 2px solid #ddd;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.filter-btn:hover {
  border-color: var(--color-btn);
  color: var(--color-btn);
}

.filter-btn.active {
  background: var(--color-btn);
  border-color: var(--color-btn);
  color: white;
}

/* Loading y Empty State */
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
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-state p {
  font-size: 18px;
  color: #999;
}

/* Lista de Notificaciones */
.notifications-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 30px;
}

.notification-card {
  display: flex;
  align-items: start;
  gap: 20px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s;
  border-left: 4px solid transparent;
}

.notification-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.notification-card.unread {
  background: #f0f7ff;
  border-left-color: var(--color-btn);
}

.notification-icon {
  font-size: 36px;
  flex-shrink: 0;
}

.notification-content {
  flex: 1;
}

.notification-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.notification-header h3 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.unread-badge {
  color: var(--color-btn);
  font-size: 20px;
}

.notification-message {
  color: #666;
  margin: 0 0 12px 0;
  line-height: 1.5;
}

.notification-footer {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}

.notification-time {
  font-size: 13px;
  color: #555;
}

.notification-goal {
  font-size: 13px;
  color: var(--color-btn);
  background: rgba(102, 126, 234, 0.1);
  padding: 4px 12px;
  border-radius: 20px;
}

.notification-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.btn-action {
  background: none;
  border: 1px solid #ddd;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-action:hover {
  background: var(--color-btn);
  border-color: var(--color-btn);
  color: white;
}

/* Estadísticas */
.stats-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 30px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.stat-card h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #666;
}

.stat-number {
  font-size: 32px;
  font-weight: 700;
  color: var(--color-btn);
  margin: 0;
}

@media (max-width: 768px) {
  .header-section {
    flex-direction: column;
    align-items: start;
    gap: 15px;
  }

  .notification-card {
    flex-direction: column;
  }

  .notification-actions {
    width: 100%;
  }

  .btn-action {
    flex: 1;
  }
}
</style>