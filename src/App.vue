<template>
  <div id="app">
    <Aside />
    <div class="body">
      <Frame />
      <Download v-show="view === 'Download'" />
      <Merge v-show="view === 'Merge'" />
      <Setting v-show="view === 'Setting'" />
    </div>
    <Add v-if="add.show" />
    <About v-if="about.show" />
  </div>
</template>

<script>
export default {
  name: 'App',
  data () {
    return {
      view: 'Download',
      add: {
        show: false
      },
      about: {
        show: false
      }
    }
  }
}
</script>

<style lang="scss">
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
}
</style>
