import { createRouter, createWebHistory } from 'vue-router'
import Login from '../components/Login.vue'
import Register from '../Views/Register.vue'
import Dashboard from '../Views/Dashboard.vue'
import Cards from '../Views/Cards.vue'

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
  ],
})

// Guard de navegación para rutas protegidas
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')

  if (to.meta.requiresAuth && !token) {
    // Si la ruta requiere autenticación y no hay token, redirigir al login
    next('/login')
  } else if ((to.path === '/login' || to.path === '/register') && token) {
    // Si ya está autenticado y trata de ir al login/register, redirigir al dashboard
    next('/dashboard')
  } else {
    next()
  }
})

export default router
