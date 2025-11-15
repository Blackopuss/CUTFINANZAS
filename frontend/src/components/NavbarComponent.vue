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
    <h1>PiggyAI</h1>
    <div class="container-actions">
      <span
        ><i class="fa-solid fa-user"></i
        ><RouterLink to="/perfil" class="link">Perfil</RouterLink></span
      >
      <span
        ><i class="fa-solid fa-bell"></i
        ><RouterLink to="/notificaciones" class="link">Notificaciones</RouterLink></span
      >
      <button @click="salir">Cerrar Sesión</button>
    </div>
  </section>
</template>

<style scoped>
section {
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 40px 0;
  background-color: transparent;
  width: 100%;
  height: 8vh;
  box-sizing: border-box;
  overflow: hidden;
}
.container-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  padding: 10px 20px;
  width: auto;   
  max-width: 100%;
  box-shadow: 2px 2px 10px -2px rgba(0, 0, 0, 0.3);
  border: 0.2px solid rgba(0, 0, 0, 0.07);
  border-radius: 10px;
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

button:hover {
  opacity: 0.8;

  transform: translateY(-3px);
}

button:hover::before {
  opacity: 1;
}


@media (max-width: 900px) {
  .container-actions {
    width: 60vw;
    gap: 3vw;
    padding: 8px 20px;
  }
}

@media (max-width: 650px) {
  section {
    padding: 0 20px;
    flex-direction: column; /* ⬅ Título arriba, acciones abajo */
    height: auto;
    gap: 12px;
  }

  .container-actions {
    width: 90vw;
    justify-content: space-around;
    gap: 4vw;
  }
}

@media (max-width: 440px) {
  .container-actions {
    flex-direction: column;   /* ⬅ Cada elemento en columna */
    padding: 12px;
    gap: 12px;
  }

  button {
    width: 100%;             /* ⬅ Botón ancho completo */
    min-width: unset;
  }
}

</style>
