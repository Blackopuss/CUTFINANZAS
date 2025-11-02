  <script setup>
  import FondoPageComponent from '@/components/FondoPageComponent.vue';
  import NavbarComponent from '@/components/NavbarComponent.vue';
  import PlantillaComponent from '@/components/PlantillaComponent.vue';
  import SideBarComponent from '@/components/SideBarComponent.vue';

  </script>
  <template>
  <FondoPageComponent>
    <SideBarComponent/>
    <PlantillaComponent>
      <NavbarComponent/>
      <div class="container-top">
       <h1>Mis categorias</h1>
        <button class="agregarCategoria">Crear Categoria</button>
      </div>
      <div class="container-categorias">

      </div>
    </PlantillaComponent>


  </FondoPageComponent>


  </template>
  <style scoped>
  .container-top{
    margin-top: 40px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }

  .container-top .agregarCategoria {
    display: flex;
    justify-content: center;
    align-items: center;
    border: none;
    background: var(--color-btn);
    color: #ffffff;
    font-weight: bold;
    padding:5px;
    border-radius: 14px;
    transition: all 0.3s ease;
    width: 12vw;
    height: 7vh

  }
  .container-top h1{
    font-size: 30px;

  }

  .agregarCategoria:hover{
    transform: translateY(-4px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    opacity: 0.8;
  }
  .container-categorias{
    background-color: red;
    width: 100%;
    height: 60%;
    margin: auto;
    margin-top: 5%;
  }

  </style>
