<template>
  <nav class="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
    <!-- Logo -->
    <div class="text-2xl font-bold tracking-wide">CUTFINANZAS</div>

    <!-- Botón móvil -->
    <button
      @click="isOpen = !isOpen"
      class="md:hidden text-gray-300 hover:text-white focus:outline-none"
    >
      <svg
        v-if="!isOpen"
        xmlns="http://www.w3.org/2000/svg"
        class="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M4 6h16M4 12h16M4 18h16"
        />
      </svg>
      <svg
        v-else
        xmlns="http://www.w3.org/2000/svg"
        class="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    </button>

    <!-- Enlaces -->
    <div
      :class="[
        'flex flex-col md:flex-row md:items-center md:space-x-6 absolute md:static bg-gray-900 md:bg-transparent left-0 w-full md:w-auto transition-all duration-300',
        isOpen ? 'top-16 opacity-100' : '-top-96 opacity-0 md:opacity-100',
      ]"
    >
      <RouterLink to="/" class="block py-2 px-4 hover:text-gray-400">Inicio</RouterLink>
      <RouterLink to="/servicios" class="block py-2 px-4 hover:text-gray-400">Servicios</RouterLink>
      <RouterLink to="/contacto" class="block py-2 px-4 hover:text-gray-400">Contacto</RouterLink>
      <RouterLink
        to="/login"
        class="mt-2 md:mt-0 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white font-semibold"
      >
        Iniciar sesión
      </RouterLink>
    </div>
  </nav>
</template>

<script setup>
defineOptions({ name: 'AppNavbar' })
import { ref } from 'vue'

const isOpen = ref(false)
</script>
