<template>
  <div class="auth-container">
    <div class="auth-card">
      <h2>Crear Cuenta</h2>

      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label for="username">Nombre de usuario</label>
          <input
            type="text"
            id="username"
            v-model="formData.username"
            required
            placeholder="usuario123"
          />
        </div>

        <div class="form-group">
          <label for="email">Email</label>
          <input
            type="email"
            id="email"
            v-model="formData.email"
            required
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
            placeholder="Mínimo 6 caracteres"
          />
        </div>

        <div class="form-group">
          <label for="confirmPassword">Confirmar Contraseña</label>
          <input
            type="password"
            id="confirmPassword"
            v-model="formData.confirmPassword"
            required
            placeholder="Repite tu contraseña"
          />
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <div v-if="success" class="success-message">
          {{ success }}
        </div>

        <button type="submit" :disabled="loading" class="btn-submit">
          {{ loading ? 'Cargando...' : 'Registrarse' }}
        </button>
      </form>

      <p class="switch-auth">
        ¿Ya tienes cuenta?
        <router-link to="/login">Inicia Sesión</router-link>
      </p>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'RegisterVue',
  data() {
    return {
      formData: {
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
      },
      loading: false,
      error: null,
      success: null,
    }
  },
  methods: {
    async handleRegister() {
      this.error = null
      this.success = null

      // Validar que las contraseñas coincidan
      if (this.formData.password !== this.formData.confirmPassword) {
        this.error = 'Las contraseñas no coinciden'
        return
      }

      if (this.formData.password.length < 6) {
        this.error = 'La contraseña debe tener al menos 6 caracteres'
        return
      }

      this.loading = true

      try {
        await axios.post('http://localhost:3000/api/register', {
          username: this.formData.username,
          email: this.formData.email,
          password: this.formData.password,
        })

        this.success = 'Cuenta creada exitosamente. Redirigiendo...'

        // Redirigir al login después de 2 segundos
        setTimeout(() => {
          this.$router.push('/login')
        }, 2000)
      } catch (err) {
        this.error = err.response?.data?.message || 'Error al crear la cuenta'
      } finally {
        this.loading = false
      }
    },
  },
}
</script>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.auth-card {
  background: white;
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 400px;
}

h2 {
  margin-bottom: 30px;
  color: #333;
  text-align: center;
}

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
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 14px;
  transition: border-color 0.3s;
}

input:focus {
  outline: none;
  border-color: #667eea;
}

.btn-submit {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-message {
  background: #fee;
  color: #c33;
  padding: 10px;
  border-radius: 5px;
  margin-bottom: 15px;
  text-align: center;
}

.success-message {
  background: #efe;
  color: #3c3;
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
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
}

.switch-auth a:hover {
  text-decoration: underline;
}
</style>
