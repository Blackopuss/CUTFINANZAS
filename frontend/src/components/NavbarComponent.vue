<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const user = ref(null)
const loading = ref(true)

const loadUserProfile = async () => {
  const token = localStorage.getItem('token')

  if (!token) {
    router.push('/login')
    return
  }

  try {
    const response = await axios.get('http://localhost:3000/api/auth/profile', {
      headers: { Authorization: `Bearer ${token}` },
    })
    user.value = response.data
  } catch (error) {
    console.error('Error al cargar perfil:', error)
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      router.push('/login')
    }
  } finally {
    loading.value = false
  }
}

const salir = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/login')
}

onMounted(() => {
  loadUserProfile()
})
</script>

<template>
  <section>
    <span>Nombre de la app</span>
    <div class="container-actions">
      <span
        ><i class="fa-solid fa-user"></i
        ><RouterLink to="/perfil" class="link">Perfil</RouterLink></span
      >
      <span
        ><i class="fa-solid fa-bell"></i
        ><RouterLink to="/nosotros" class="link">Notificaciones</RouterLink></span
      >
      <button @click="salir">Cerrar Sesión</button>
    </div>
  </section>
</template>

<style scoped>
section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 40px 0;

  width: 100%;
  height: 8vh;
}
.container-actions {
  box-shadow: 2px 2px 10px -2px rgba(0, 0, 0, 0.3);
  border: 0.2px solid rgba(0, 0, 0, 0.07);
  border-radius: 10px;
  padding: 10px 40px 10px;
  width: 27vw;
  display: flex;
  gap: 6vw;
}
.container-actions span {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.container-actions span i {
  margin-right: 7px;
  font-size: 18px;
}
.link {
  font-family: 'Lato', sans-serif;
  text-decoration: none;
  font-size: 15px;
  font-weight: 700;
  color: #100f09;
}

button {
  position: relative; /* necesario para ::before */
  min-width: 6vw;
  min-height: 3vh;
  background-color: var(--color-btn);
  border: none;
  border-radius: 6px;
  padding: 2px 8px;
  color: #ffffff;
  font-family: 'Lato', sans-serif;
  font-weight: bold;
  cursor: pointer;
  overflow: hidden;

  transition:
    background-color 0.5s ease,
    transform 0.1s ease;
}

/* Pseudo-elemento para efecto de resplandor */
button::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

/* Hover */
button:hover {
  background-color: #151563;

  transform: translateY(-3px); /* movimiento hacia arriba */
}

button:hover::before {
  opacity: 1; /* aparece el brillo */
}
</style>
