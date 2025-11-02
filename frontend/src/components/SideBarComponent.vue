<script setup>
//agregeue est comentario para hacer un commit
</script>

<template>
  <section>
    <span><img src="../../assets/logo.jpg" alt="" /></span>
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
        <router-link to="/transactions" class="router-link">
          <i class="fa-solid fa-wallet"></i>Mis gastos</router-link
        >
      </span>
      <span> <router-link to="/categorias" class="router-link"><i class="fa-solid fa-star"></i>Mis categorias</router-link></span>
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
img {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  margin-right: 85px;
}
</style>
