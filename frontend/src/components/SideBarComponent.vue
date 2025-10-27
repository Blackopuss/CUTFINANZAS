<script setup></script>

<template>
  <section>
    <span><img src="" alt="" />Img de la empre</span>
    <div class="container-elements">
      <span>
        <router-link to="/" class="router-link">
          <i class="fa-solid fa-house"></i>Home</router-link
        ></span
      >
      <span>
        <router-link to="/cards" class="router-link"
          ><i class="fa-solid fa-credit-card"></i>Administrar tarjetas</router-link
        ></span
      >
      <span>
        <router-link to="" class="router-link">
          <i class="fa-solid fa-wallet"></i>Mis gastos</router-link
        >
      </span>
      <span> <router-link to="" class="router-link">Lorem, ipsum.</router-link></span>
      <span> <router-link to="" class="router-link">Lorem, ipsum.</router-link></span>
    </div>
  </section>
</template>

<style scoped>
section {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
}
.container-elements {
  display: flex;
  flex-direction: column;
  gap: 10vh;
  height: 80vh;
}
.router-link {
  padding: 6px;
  border-radius: 10px;
  font-family: 'Lato', sans-serif;
  text-decoration: none;
  font-size: 15px;
  font-weight: 700;
  color: #100f09;
  .router-link {
    transition: background-color 0.3s ease;
  }
}
.router-link:hover {
  background-color: #dbd8ce;
}
</style>
