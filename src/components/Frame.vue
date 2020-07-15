<template>
  <div class="frame">
    <div class="frame-left"></div>
    <div class="frame-right">
      <span class="min" @click="frameClickEvent('min')">-</span>
      <span class="max" @click="frameClickEvent('max')">+</span>
      <span class="close" @click="frameClickEvent('close')">x</span>
    </div>
  </div>
</template>
<script>
const { remote } = require('electron')
export default {
  name: 'Frame',
  methods: {
    frameClickEvent (e) {
      const win = remote.getCurrentWindow()
      if (e === 'min') {
        win.minimize()
      }
      if (e === 'max') {
        win.isMaximized() ? win.unmaximize() : win.maximize()
      }
      if (e === 'close') {
        win.destroy()
      }
    }
  }
}
</script>
<style lang="scss" scoped>
.frame{
  width: 100%;
  height: 36px;
  display: flex;
  user-select: none;
  align-items: center;
  justify-content: space-between;
  -webkit-app-region: drag;
  .frame-left{
    width: 200px;
    height: 36px;
    background-color: #f4f5f7;
  }
  .frame-right{
    flex: 1;
    display: flex;
    justify-content: flex-end;
    span{
      width: 60px;
      height: 36px;
      cursor: pointer;
      display: inline-block;
      -webkit-app-region: no-drag;
      border: 1px solid #000;
      text-align: center;
      line-height: 36px;
    }
  }
}
</style>
