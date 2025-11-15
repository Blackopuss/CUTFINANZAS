<script setup>
//agregeue est comentario para hacer un commit
</script>

<template>
  <section>
     <router-link to="/dashboard">
      <img src="../../assets/logo.jpg" alt="Logo PiggyAI" />
    </router-link>

    <div class="container-elements">
      
      <span>
        <router-link to="/" class="router-link">
          <i class="fa-solid fa-house"></i>Home
        </router-link>
      </span>

      <span>
        <router-link to="/cards" class="router-link">
          <i class="fa-solid fa-credit-card"></i>Administrar tarjetas
        </router-link>
      </span>

      <span>
        <router-link to="/transactions" class="router-link">
          <i class="fa-solid fa-wallet"></i>Mis gastos
        </router-link>
      </span>

      <span>
        <router-link to="/categorias" class="router-link">
          <i class="fa-solid fa-star"></i>Mis categorias
        </router-link>
      </span>

    
      <span>
        <router-link to="/metas" class="router-link">
            <i class="fa-solid fa-bullseye"></i> Metas de Ahorro
        </router-link>
      </span>

   
    </div>
  </section>
</template>

<style scoped>
section {
display: flex;
  flex-direction: column; 
  align-items: center;     
  justify-content: flex-start; 
  padding: 20px 0;;
}
section a {
  text-decoration: none;
}
section img {
  cursor: pointer;
}
.container-elements {
  display: flex;
  flex-direction: column;
  gap: 10vh;
  margin-top: 20px;
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
