<template>
  <div class="dashboard">
    <SideBarComponent />

    <div class="dashboard-content">
      <NavBar />

      <div v-if="loading" class="loading">Cargando análisis...</div>

      <div v-else class="analytics-container">
        <!-- Header -->
        <div class="header-section">
          <div>
            <h1>📊 Análisis de Gastos</h1>
            <p class="subtitle">Identifica patrones y toma mejores decisiones financieras</p>
          </div>
        </div>

        <!-- Filtros de Rango de Fechas -->
        <div class="filters-card">
          <h2>🗓️ Rango de Fechas</h2>
          <div class="date-filters">
            <div class="filter-group">
              <label for="startDate">Desde:</label>
              <input id="startDate" type="date" v-model="filters.start_date" @change="loadAnalytics" />
            </div>

            <div class="filter-group">
              <label for="endDate">Hasta:</label>
              <input id="endDate" type="date" v-model="filters.end_date" @change="loadAnalytics" />
            </div>
            <div class="quick-filters">
              <button @click="setQuickFilter('7days')" class="quick-btn">7 días</button>
              <button @click="setQuickFilter('30days')" class="quick-btn">30 días</button>
              <button @click="setQuickFilter('90days')" class="quick-btn">90 días</button>
              <button @click="setQuickFilter('year')" class="quick-btn">Este año</button>
              <button @click="setQuickFilter('all')" class="quick-btn">Todo</button>
            </div>
          </div>
        </div>

        <!-- Resumen del Período -->
        <div class="summary-grid">
          <div class="summary-card">
            <div class="summary-icon">💸</div>
            <div class="summary-content">
              <p class="summary-label">Total Gastado</p>
              <h2 class="summary-value">${{ formatNumber(summary.total_spent || 0) }}</h2>
              <p class="summary-trend" :class="getTrendClass(trend.amountChange)">
                {{ trend.amountChange > 0 ? '↑' : '↓' }} {{ Math.abs(trend.amountChange) }}% vs período anterior
              </p>
            </div>
          </div>

          <div class="summary-card">
            <div class="summary-icon">🔢</div>
            <div class="summary-content">
              <p class="summary-label">Total Transacciones</p>
              <h2 class="summary-value">{{ summary.total_transactions || 0 }}</h2>
              <p class="summary-trend" :class="getTrendClass(trend.countChange)">
                {{ trend.countChange > 0 ? '↑' : '↓' }} {{ Math.abs(trend.countChange) }}% vs período anterior
              </p>
            </div>
          </div>

          <div class="summary-card">
            <div class="summary-icon">📊</div>
            <div class="summary-content">
              <p class="summary-label">Gasto Promedio</p>
              <h2 class="summary-value">${{ formatNumber(summary.avg_transaction || 0) }}</h2>
              <p class="summary-info">Por transacción</p>
            </div>
          </div>

          <div class="summary-card">
            <div class="summary-icon">🏆</div>
            <div class="summary-content">
              <p class="summary-label">Categoría Principal</p>
              <h2 class="summary-category">{{ summary.top_category || 'N/A' }}</h2>
              <p class="summary-info">Más gastada</p>
            </div>
          </div>
        </div>

        <!-- Gráficos -->
        <div class="charts-grid">
          <!-- Gráfico de Tendencia Diaria -->
          <div class="chart-card large">
            <h3>📈 Tendencia de Gastos Diarios</h3>
            <canvas ref="dailyChart"></canvas>
          </div>

          <!-- Gráfico de Categorías -->
          <div class="chart-card">
            <h3>🎯 Gastos por Categoría</h3>
            <canvas ref="categoryChart"></canvas>
          </div>

          <!-- Gráfico de Comparativa Mensual -->
          <div class="chart-card">
            <h3>📅 Evolución Mensual</h3>
            <canvas ref="monthlyChart"></canvas>
          </div>
        </div>

        <!-- Tabla de Detalles por Categoría -->
        <div class="details-card">
          <h3>📋 Detalle por Categoría</h3>
          <div v-if="categoryData.length === 0" class="empty-state-small">
            No hay datos para el período seleccionado
          </div>
          <table v-else class="details-table">
            <thead>
              <tr>
                <th>Categoría</th>
                <th>Transacciones</th>
                <th>Total</th>
                <th>Porcentaje</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="cat in categoryData" :key="cat.category">
                <td>
                  <div class="category-cell">
                    <span class="category-icon" :style="{ backgroundColor: cat.color + '20' }">
                      {{ cat.icon || '📌' }}
                    </span>
                    {{ cat.category }}
                  </div>
                </td>
                <td>{{ cat.transaction_count }}</td>
                <td>${{ formatNumber(cat.total_amount) }}</td>
                <td>
                  <div class="percentage-bar">
                    <div class="percentage-fill" :style="{ width: cat.percentage + '%', backgroundColor: cat.color }">
                    </div>
                    <span class="percentage-text">{{ cat.percentage }}%</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <FinanceChat />
  </div>
</template>

<script>
import NavBar from '@/components/NavbarComponent.vue'
import SideBarComponent from '../components/SideBarComponent.vue'
import FinanceChat from '@/components/FinanceChat.vue'
import axios from 'axios'
import Chart from 'chart.js/auto'


export default {
  name: 'DashboardVue',
  components: {
    SideBarComponent,
    NavBar,
    FinanceChat
  },
  data() {
    return {
      loading: true,
      filters: {
        start_date: this.getDateDaysAgo(30),
        end_date: this.getTodayDate()
      },
      summary: {},
      trend: { amountChange: 0, countChange: 0 },
      dailyData: [],
      categoryData: [],
      monthlyData: [],
      charts: {
        daily: null,
        category: null,
        monthly: null
      }
    }
  },
  async mounted() {
    await this.loadAnalytics()
  },
  beforeUnmount() {
    // Destruir gráficos al salir
    Object.values(this.charts).forEach(chart => {
      if (chart) chart.destroy()
    })
  },
  methods: {
    async loadAnalytics() {
      const token = localStorage.getItem('token')

      if (!token) {
        this.$router.push('/login')
        return
      }

      this.loading = true

      try {
        const params = new URLSearchParams({
          start_date: this.filters.start_date,
          end_date: this.filters.end_date
        })

        const [summaryRes, trendRes, dailyRes, categoryRes, monthlyRes] = await Promise.all([
          axios.get(`http://localhost:3000/api/analytics/period-summary?${params}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`http://localhost:3000/api/analytics/trend?${params}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`http://localhost:3000/api/analytics/expenses-by-day?${params}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`http://localhost:3000/api/analytics/expenses-by-category?${params}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:3000/api/analytics/expenses-by-month', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ])

        this.summary = summaryRes.data
        this.trend = trendRes.data
        this.dailyData = dailyRes.data
        this.categoryData = categoryRes.data
        this.monthlyData = monthlyRes.data

        this.$nextTick(() => {
          this.createCharts()
        })
      } catch (error) {
        console.error('Error al cargar análisis:', error)
        if (error.response?.status === 401 || error.response?.status === 403) {
          localStorage.removeItem('token')
          this.$router.push('/login')
        }
      } finally {
        this.loading = false
        this.$nextTick(() => {
          this.createCharts()
        })
      }
    },

    createCharts() {
      this.createDailyChart()
      this.createCategoryChart()
      this.createMonthlyChart()
    },

    createDailyChart() {
      if (this.charts.daily) this.charts.daily.destroy()

      const ctx = this.$refs.dailyChart
      if (!ctx) return

      const labels = this.dailyData.map(d => this.formatDateShort(d.date))
      const data = this.dailyData.map(d => parseFloat(d.total_amount))

      this.charts.daily = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Gasto Diario',
            data,
            borderColor: '#667eea',
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: (context) => `$${this.formatNumber(context.parsed.y)}`
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value) => `$${this.formatNumber(value)}`
              }
            }
          }
        }
      })
    },

    createCategoryChart() {
      if (this.charts.category) this.charts.category.destroy()

      const ctx = this.$refs.categoryChart
      if (!ctx) return

      const labels = this.categoryData.map(c => c.category)
      const data = this.categoryData.map(c => parseFloat(c.total_amount))
      const colors = this.categoryData.map(c => c.color || '#A29BFE')

      this.charts.category = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{
            data,
            backgroundColor: colors,
            borderWidth: 2,
            borderColor: '#fff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              position: 'bottom'
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const label = context.label || ''
                  const value = this.formatNumber(context.parsed)
                  const percentage = this.categoryData[context.dataIndex].percentage
                  return `${label}: $${value} (${percentage}%)`
                }
              }
            }
          }
        }
      })
    },

    createMonthlyChart() {
      if (this.charts.monthly) this.charts.monthly.destroy()

      const ctx = this.$refs.monthlyChart
      if (!ctx) return

      const labels = this.monthlyData.map(m => this.formatMonth(m.month))
      const data = this.monthlyData.map(m => parseFloat(m.total_amount))

      this.charts.monthly = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Gasto Mensual',
            data,
            backgroundColor: 'rgba(102, 126, 234, 0.7)',
            borderColor: '#667eea',
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: (context) => `$${this.formatNumber(context.parsed.y)}`
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value) => `$${this.formatNumber(value)}`
              }
            }
          }
        }
      })
    },

    setQuickFilter(period) {
      const today = new Date()
      this.filters.end_date = this.getTodayDate()

      switch (period) {
        case '7days':
          this.filters.start_date = this.getDateDaysAgo(7)
          break
        case '30days':
          this.filters.start_date = this.getDateDaysAgo(30)
          break
        case '90days':
          this.filters.start_date = this.getDateDaysAgo(90)
          break
        case 'year':
          this.filters.start_date = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0]
          break
        case 'all':
          this.filters.start_date = '2000-01-01'
          break
      }

      this.loadAnalytics()
    },

    getTrendClass(value) {
      if (value > 0) return 'trend-up'
      if (value < 0) return 'trend-down'
      return ''
    },

    formatNumber(num) {
      return parseFloat(num || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    },

    formatDateShort(dateString) {
      const date = new Date(dateString)
      return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })
    },

    formatMonth(monthString) {
      const [year, month] = monthString.split('-')
      const date = new Date(year, month - 1)
      return date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })
    },

    getTodayDate() {
      return new Date().toISOString().split('T')[0]
    },

    getDateDaysAgo(days) {
      return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }
  }
}
</script>

<style scoped>
.dashboard {
  padding: 10px 5px 0 10px;
  min-height: 100vh;
  background: var(--color-fondo);
  display: flex;
  flex-direction: row;
  justify-content: space-around;
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
  padding: 60px;
  font-size: 18px;
  color: #666;
}

.analytics-container {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

/* Header */
.header-section {
  margin-bottom: 20px;
}

.header-section h1 {
  font-size: 32px;
  color: #333;
  margin: 0 0 5px 0;
}

.subtitle {
  color: #666;
  margin: 0;
}

/* Filtros */
.filters-card {
  background: white;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.filters-card h3 {
  margin: 0 0 20px 0;
  color: #333;
}

.date-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: end;
}

.filter-group {
  flex: 1;
  min-width: 200px;
}

.filter-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: #555;
}

.filter-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.quick-filters {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.quick-btn {
  background: var(--color-btn);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.3s;
}

.quick-btn:hover {
  opacity: 0.9;
}

/* Resumen */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.summary-card {
  background: white;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 20px;
  align-items: center;
  transition: transform 0.3s;
}

.summary-card:hover {
  transform: translateY(-5px);
}

.summary-icon {
  font-size: 48px;
}

.summary-content {
  flex: 1;
}

.summary-label {
  font-size: 14px;
  color: #666;
  margin: 0 0 8px 0;
}

.summary-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-btn);
  margin: 0 0 5px 0;
}

.summary-category {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-btn);
  margin: 0 0 5px 0;
}

.summary-trend {
  font-size: 13px;
  font-weight: 600;
  margin: 0;
}

.trend-up {
  color: #d32f2f;
}

.trend-down {
  color: #2e7d32;
}

.summary-info {
  font-size: 13px;
  color: #999;
  margin: 0;
}

/* Gráficos */
.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
}

.chart-card {
  background: white;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.chart-card.large {
  grid-column: 1 / -1;
}

.chart-card h3 {
  margin: 0 0 20px 0;
  color: #333;
}

.chart-card canvas {
  max-height: 300px;
}

/* Tabla de Detalles */
.details-card {
  background: white;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.details-card h3 {
  margin: 0 0 20px 0;
  color: #333;
}

.details-table {
  width: 100%;
  border-collapse: collapse;
}

.details-table thead {
  background: #f9f9f9;
}

.details-table th {
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: #555;
  border-bottom: 2px solid #ddd;
}

.details-table td {
  padding: 15px 12px;
  border-bottom: 1px solid #f0f0f0;
}

.category-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.category-icon {
  width: 35px;
  height: 35px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.percentage-bar {
  position: relative;
  width: 100%;
  height: 24px;
  background: #f0f0f0;
  border-radius: 12px;
  overflow: hidden;
}

.percentage-fill {
  height: 100%;
  transition: width 0.5s ease;
}

.percentage-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-weight: 600;
  font-size: 12px;
  color: #333;
}

.empty-state-small {
  text-align: center;
  padding: 40px;
  color: #999;
}

@media (max-width: 1200px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }

  .chart-card.large {
    grid-column: 1;
  }
}

@media (max-width: 768px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .date-filters {
    flex-direction: column;
  }

  .filter-group {
    width: 100%;
  }

  .details-table {
    font-size: 14px;
  }

  .details-table th,
  .details-table td {
    padding: 10px 8px;
  }
}
</style>