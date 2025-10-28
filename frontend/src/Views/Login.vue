<template>
  <main class="auth-container" role="main">
    <section class="auth-card" aria-labelledby="login-title">
      <h1 id="login-title">Iniciar Sesión</h1>

      <form @submit.prevent="handleLogin" aria-describedby="form-description">
        <p id="form-description" class="sr-only">
          Ingresa tu correo electrónico y contraseña para acceder a tu cuenta.
        </p>

        <div class="form-group">
          <label for="email">Correo electrónico</label>
          <input
            type="email"
            id="email"
            v-model="formData.email"
            required
            autocomplete="email"
            placeholder="tu@email.com"
          />
        </div>

        <div class="form-group">
          <label for="password">Contraseña</label>
          <input
            type="password"
            id="password"
            v-model="formData.password"
            required
            autocomplete="current-password"
            placeholder="••••••••"
          />
        </div>

        <div v-if="error" class="error-message" role="alert">
          {{ error }}
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="btn-submit"
          :aria-busy="loading.toString()"
        >
          {{ loading ? 'Cargando...' : 'Iniciar Sesión' }}
        </button>
      </form>

      <p class="switch-auth">
        ¿No tienes cuenta?
        <router-link to="/register">Regístrate</router-link>
      </p>
    </section>
  </main>
</template>

<script>
import axios from 'axios'

export default {
  name: 'LoginVue',
  data() {
    return {
      formData: {
        email: '',
        password: '',
      },
      loading: false,
      error: null,
    }
  },
  methods: {
    async handleLogin() {
      this.error = null
      this.loading = true

      try {
        const response = await axios.post('http://localhost:3000/api/auth/login', this.formData)

        // Guardar token y usuario en localStorage
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))

        // Redirigir al dashboard
        this.$router.push('/dashboard')
      } catch (err) {
        this.error = err.response?.data?.message || 'Error al iniciar sesión'
      } finally {
        this.loading = false
      }
    },
  },
}
</script>

<style scoped>
/* Oculta texto solo para lectores de pantalla */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* ===== Layout ===== */
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: var(--color-fondo);
  padding: 20px;
}

.auth-card {
  background: var(--color-comp);
  padding: 40px;
  border-radius: 10px;
  border: 0.1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 400px;
}

h1 {
  margin-bottom: 30px;
  color: #333;
  text-align: center;
  font-size: 1.8rem;
}

/* ===== Formulario ===== */
.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 5px;
  color: #555;
  font-weight: 500;
}

input {
  width: 95%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
  transition: border-color 0.3s;
}

input:focus {
  outline: none;
  border-color: #667eea;
  font-weight: bold;
}

/* ===== Botón ===== */
.btn-submit {
  width: 100%;
  padding: 12px;
  background: var(--color-btn);
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition:
    transform 0.2s,
    opacity 0.3s;
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ===== Mensajes ===== */
.error-message {
  background: #fee;
  color: #c33;
  padding: 10px;
  border-radius: 5px;
  margin-bottom: 15px;
  text-align: center;
}

.switch-auth {
  text-align: center;
  margin-top: 20px;
  color: #666;
}

.switch-auth a {
  color: #030626;
  text-decoration: none;
  font-weight: 600;
}

.switch-auth a:hover {
  text-decoration: underline;
  color: #363980;
}
</style>
