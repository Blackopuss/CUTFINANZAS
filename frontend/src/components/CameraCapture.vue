<template>
  <div class="camera-capture">
    <div v-if="!imageCaptured" class="camera-view">
      <video ref="video" autoplay playsinline></video>
      <div class="camera-controls">
        <button @click="captureImage" class="btn-capture" title="Capturar foto">
          <div class="shutter"></div>
        </button>
        <button @click="stopCamera" class="btn-close">✖</button>
      </div>
      <div class="upload-option">
        <label for="file-upload" class="btn-upload">
          📂 Subir imagen
        </label>
        <input id="file-upload" type="file" accept="image/*" @change="handleFileUpload" hidden>
      </div>
    </div>

    <div v-else class="preview-view">
      <img :src="capturedImage" alt="Captured receipt" class="preview-image" />
      <div class="preview-actions">
        <button @click="retakeImage" class="btn-retake">Reintentar</button>
        <button @click="confirmImage" class="btn-confirm">Usar Foto</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CameraCapture',
  data() {
    return {
      stream: null,
      imageCaptured: false,
      capturedImage: null
    }
  },
  mounted() {
    this.startCamera()
  },
  beforeUnmount() {
    this.stopCamera()
  },
  methods: {
    async startCamera() {
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        })
        this.$refs.video.srcObject = this.stream
      } catch (err) {
        console.error("Error accessing camera:", err)
        alert("No se pudo acceder a la cámara. Por favor, verifica los permisos.")
        this.$emit('close')
      }
    },
    stopCamera() {
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop())
        this.stream = null
      }
    },
    captureImage() {
      const video = this.$refs.video
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      const context = canvas.getContext('2d')
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      
      this.capturedImage = canvas.toDataURL('image/jpeg')
      this.imageCaptured = true
      // Stop camera stream to save battery/resources while previewing
      // this.stopCamera() 
    },
    retakeImage() {
      this.imageCaptured = false
      this.capturedImage = null
      // Restart camera if it was stopped
      if (!this.stream) this.startCamera()
    },
    confirmImage() {
      this.$emit('image-captured', this.capturedImage)
      this.stopCamera()
    },
    handleFileUpload(event) {
      const file = event.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          this.capturedImage = e.target.result
          this.imageCaptured = true
          this.stopCamera()
        }
        reader.readAsDataURL(file)
      }
    }
  }
}
</script>

<style scoped>
.camera-capture {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #000;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.camera-view, .preview-view {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-image {
  max-width: 100%;
  max-height: 80vh;
  border-radius: 8px;
}

.camera-controls {
  position: absolute;
  bottom: 40px;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 40px;
}

.btn-capture {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  border: 4px solid white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
}

.shutter {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: white;
  transition: transform 0.1s;
}

.btn-capture:active .shutter {
  transform: scale(0.9);
}

.btn-close {
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-size: 20px;
  cursor: pointer;
  z-index: 10;
}

.upload-option {
  position: absolute;
  bottom: 50px;
  right: 30px;
}

.btn-upload {
  color: white;
  background: rgba(0, 0, 0, 0.5);
  padding: 10px 15px;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
}

.preview-actions {
  position: absolute;
  bottom: 30px;
  display: flex;
  gap: 20px;
}

.btn-retake, .btn-confirm {
  padding: 12px 24px;
  border-radius: 25px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  font-size: 16px;
}

.btn-retake {
  background: white;
  color: #333;
}

.btn-confirm {
  background: #667eea;
  color: white;
}
</style>
