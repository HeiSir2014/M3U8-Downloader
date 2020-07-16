<template>
  <div class="aside">
    <div class="top">
      <span class="download" title="任务列表" @click="changeView('Download')">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <g data-name="Layer 2">
            <g data-name="cloud-download">
              <rect width="24" height="24" opacity="0"/>
              <path d="M14.31 16.38L13 17.64V12a1 1 0 0 0-2 0v5.59l-1.29-1.3a1 1 0 0 0-1.42 1.42l3 3A1 1 0 0 0 12 21a1 1 0 0 0 .69-.28l3-2.9a1 1 0 1 0-1.38-1.44z"/>
              <path d="M17.67 7A6 6 0 0 0 6.33 7a5 5 0 0 0-3.08 8.27A1 1 0 1 0 4.75 14 3 3 0 0 1 7 9h.1a1 1 0 0 0 1-.8 4 4 0 0 1 7.84 0 1 1 0 0 0 1 .8H17a3 3 0 0 1 2.25 5 1 1 0 0 0 .09 1.42 1 1 0 0 0 .66.25 1 1 0 0 0 .75-.34A5 5 0 0 0 17.67 7z"/>
            </g>
          </g>
        </svg>
      </span>
      <span class="merge" title="视频合并" @click="changeView('Merge')">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <g data-name="Layer 2">
            <g data-name="cube">
              <rect width="24" height="24" opacity="0"/>
              <path d="M20.66 7.26c0-.07-.1-.14-.15-.21l-.09-.1a2.5 2.5 0 0 0-.86-.68l-6.4-3a2.7 2.7 0 0 0-2.26 0l-6.4 3a2.6 2.6 0 0 0-.86.68L3.52 7a1 1 0 0 0-.15.2A2.39 2.39 0 0 0 3 8.46v7.06a2.49 2.49 0 0 0 1.46 2.26l6.4 3a2.7 2.7 0 0 0 2.27 0l6.4-3A2.49 2.49 0 0 0 21 15.54V8.46a2.39 2.39 0 0 0-.34-1.2zm-8.95-2.2a.73.73 0 0 1 .58 0l5.33 2.48L12 10.15 6.38 7.54zM5.3 16a.47.47 0 0 1-.3-.43V9.1l6 2.79v6.72zm13.39 0L13 18.61v-6.72l6-2.79v6.44a.48.48 0 0 1-.31.46z"/>
            </g>
          </g>
        </svg>
      </span>
      <span class="add" title="新建任务" @click="changePopup('Add')">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <g data-name="Layer 2">
            <g data-name="plus">
              <rect width="24" height="24" transform="rotate(180 12 12)" opacity="0"/>
              <path d="M19 11h-6V5a1 1 0 0 0-2 0v6H5a1 1 0 0 0 0 2h6v6a1 1 0 0 0 2 0v-6h6a1 1 0 0 0 0-2z"/>
            </g>
          </g>
        </svg>
      </span>
    </div>
    <div class="bottom">
      <span class="setting" title="设置" @click="changeView('Setting')">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <g data-name="Layer 2">
            <g data-name="options-2">
              <rect width="24" height="24" transform="rotate(90 12 12)" opacity="0"/>
              <path d="M19 9a3 3 0 0 0-2.82 2H3a1 1 0 0 0 0 2h13.18A3 3 0 1 0 19 9zm0 4a1 1 0 1 1 1-1 1 1 0 0 1-1 1z"/>
              <path d="M3 7h1.18a3 3 0 0 0 5.64 0H21a1 1 0 0 0 0-2H9.82a3 3 0 0 0-5.64 0H3a1 1 0 0 0 0 2zm4-2a1 1 0 1 1-1 1 1 1 0 0 1 1-1z"/>
              <path d="M21 17h-7.18a3 3 0 0 0-5.64 0H3a1 1 0 0 0 0 2h5.18a3 3 0 0 0 5.64 0H21a1 1 0 0 0 0-2zm-10 2a1 1 0 1 1 1-1 1 1 0 0 1-1 1z"/>
            </g>
          </g>
        </svg>
      </span>
      <span class="about" title="关于" @click="changePopup('About')">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <g data-name="Layer 2">
            <g data-name="menu-arrow-circle">
              <rect width="24" height="24" transform="rotate(180 12 12)" opacity="0"/>
              <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/>
              <path d="M12 6a3.5 3.5 0 0 0-3.5 3.5 1 1 0 0 0 2 0A1.5 1.5 0 1 1 12 11a1 1 0 0 0-1 1v2a1 1 0 0 0 2 0v-1.16A3.49 3.49 0 0 0 12 6z"/>
              <circle cx="12" cy="17" r="1"/>
            </g>
          </g>
        </svg>
      </span>
    </div>
  </div>
</template>
<script>
import { mapMutations } from 'vuex'
export default {
  name: 'Aside',
  computed: {
    view: {
      get () {
        return this.$store.getters.getView
      },
      set (val) {
        this.SET_VIEW(val)
      }
    },
    popup: {
      get () {
        return this.$store.getters.getPopup
      },
      set (val) {
        this.SET_POPUP(val)
      }
    }
  },
  methods: {
    ...mapMutations(['SET_VIEW', 'SET_POPUP']),
    changeView (e) {
      this.view = e
    },
    changePopup (e) {
      console.log(e)
      if (e === 'Add') {
        this.popup = {
          add: true,
          about: false
        }
      } else {
        this.popup = {
          add: false,
          about: true
        }
      }
    }
  }
}
</script>
<style lang="scss" scoped>
.aside{
  width: 78px;
  height: 100%;
  display: flex;
  user-select: none;
  align-items: center;
  flex-direction: column;
  justify-content: space-between;
  -webkit-app-region: drag;
  background-color: #333333;
  .top, .bottom{
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  span{
    width: 40px;
    height: 40px;
    cursor: pointer;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    -webkit-app-region: no-drag;
    transition: all 0.3s cubic-bezier(.25,.8,.25,1);
    &:hover{
      background-color: #ffffff22;
    }
    svg{
      width: 22px;
      height: 22px;
      fill: #fff;
    }
  }
  .top{
    span{
      margin-top: 20px;
    }
  }
  .bottom{
    span{
      margin-bottom: 20px;
    }
  }
}
</style>
