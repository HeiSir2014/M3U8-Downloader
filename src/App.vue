<template>
  <div id="app">
    <Aside />
    <div class="body">
      <Frame />
      <Download v-show="view === 'Download'" />
      <Merge v-show="view === 'Merge'" />
      <Setting v-show="view === 'Setting'" />
    </div>
    <transition name="fadeIn">
      <Add v-if="popup.add" />
    </transition>
    <transition name="fadeIn">
      <About v-if="popup.about" />
    </transition>
  </div>
</template>

<script>
export default {
  name: 'App',
  data () {
    return {
      add: {
        show: false
      },
      about: {
        show: false
      }
    }
  },
  computed: {
    view () {
      return this.$store.getters.getView
    },
    popup () {
      return this.$store.getters.getPopup
    }
  }
}
</script>

<style lang="scss">
@import './assets/scss/index.scss';
html, body, #app{
  height: 100%;
  border-radius: 0px;
}
#app {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', SimSun, sans-serif;
  -webkit-font-smoothing: antialiased;
  -webkit-tap-highlight-color: transparent;
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  .body{
    flex: 1;
    height: 100%;
    display: flex;
    justify-content: flex-start;
    align-items: flex-start;
    flex-direction: column;
    background-color: #fff;
  }
  .fadeIn-enter-active, .fadeIn-leave-active{
    transition: all .5s ease-in-out;
  }
  .fadeIn-enter, .fadeIn-leave-to{
    opacity: 0;
  }
}
</style>
