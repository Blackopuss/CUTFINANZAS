import { createRouter, createWebHistory } from 'vue-router'
import Login from '../Views/Login.vue'
import Register from '../Views/Register.vue'
import Dashboard from '../Views/Dashboard.vue'
import Cards from '../Views/Cards.vue'
import Transactions from '../Views/Transactions.vue'
import Perfil from '../Views/PerfilView.vue'
import Categorias from '../Views/CategoriasView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login',
    },
    {
      path: '/login',
      name: 'login',
      component: Login,
    },
    {
      path: '/register',
      name: 'register',
      component: Register,
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: Dashboard,
      meta: { requiresAuth: true },
    },
    {
      path: '/cards',
      name: 'cards',
      component: Cards,
      meta: { requiresAuth: true },
    },
    {
      path: '/transactions',
      name: 'transactions',
      component: Transactions,
      meta: { requiresAuth: true },
    },
    {
      path: '/perfil',
      name: 'Perfil',
      component: Perfil,
      meta: { requiresAuth: true },
    },
    {
      path: '/categorias',
      name: 'Categorias',
      component: Categorias,
      meta: {requiresAuth: true}
    }
  ],
})

// Guard de navegación para rutas protegidas
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')

  if (to.meta.requiresAuth && !token) {
    next('/login')
  } else if ((to.path === '/login' || to.path === '/register') && token) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
