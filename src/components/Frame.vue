<template>
  <div class="frame">
    <div class="frame-left" v-show="view === 'Download'"></div>
    <div class="frame-right">
      <span class="min" @click="frameClickEvent('min')" title="最小化">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <g data-name="Layer 2">
            <g data-name="minus">
              <rect width="24" height="24" transform="rotate(180 12 12)" opacity="0"/>
              <path d="M19 13H5a1 1 0 0 1 0-2h14a1 1 0 0 1 0 2z"/>
            </g>
          </g>
        </svg>
      </span>
      <span class="max" @click="frameClickEvent('max')" title="最大化">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <g data-name="Layer 2">
            <g data-name="expand">
              <rect width="24" height="24" transform="rotate(180 12 12)" opacity="0"/>
              <path d="M20 5a1 1 0 0 0-1-1h-5a1 1 0 0 0 0 2h2.57l-3.28 3.29a1 1 0 0 0 0 1.42 1 1 0 0 0 1.42 0L18 7.42V10a1 1 0 0 0 1 1 1 1 0 0 0 1-1z"/>
              <path d="M10.71 13.29a1 1 0 0 0-1.42 0L6 16.57V14a1 1 0 0 0-1-1 1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h5a1 1 0 0 0 0-2H7.42l3.29-3.29a1 1 0 0 0 0-1.42z"/>
            </g>
          </g>
        </svg>
      </span>
      <span class="close" @click="frameClickEvent('close')" title="关闭">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <g data-name="Layer 2">
            <g data-name="close">
              <rect width="24" height="24" transform="rotate(180 12 12)" opacity="0"/>
              <path d="M13.41 12l4.3-4.29a1 1 0 1 0-1.42-1.42L12 10.59l-4.29-4.3a1 1 0 0 0-1.42 1.42l4.3 4.29-4.3 4.29a1 1 0 0 0 0 1.42 1 1 0 0 0 1.42 0l4.29-4.3 4.29 4.3a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.42z"/>
            </g>
          </g>
        </svg>
      </span>
    </div>
  </div>
</template>
<script>
const { remote } = require('electron')
export default {
  name: 'Frame',
  computed: {
    view () {
      return this.$store.getters.getView
    }
  },
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
  height: 30px;
  display: flex;
  user-select: none;
  align-items: center;
  justify-content: space-between;
  -webkit-app-region: drag;
  .frame-left{
    width: 200px;
    height: 30px;
    background-color: #f4f5f7;
  }
  .frame-right{
    height: 30px;
    flex: 1;
    display: flex;
    justify-content: flex-end;
    span{
      width: 50px;
      height: 30px;
      display: flex;
      cursor: pointer;
      align-items: center;
      justify-content: center;
      -webkit-app-region: no-drag;
      transition: all 0.3s cubic-bezier(.25,.8,.25,1);
      svg{
        width: 18px;
        height: 18px;
        fill: #d2d2d2;
      }
      &:hover{
        background-color: #eeeeee;
        svg{
          fill: #868686;
        }
      }
    }
    .close{
      &:hover{
        background-color: #fd0007;
        svg{
          fill: #ffffff;
        }
      }
    }
  }
}
</style>
