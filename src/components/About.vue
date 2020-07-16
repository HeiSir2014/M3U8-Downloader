<template>
  <div class="about">
    <div class="about-mask" @click="close"></div>
    <div class="about-box">
      <div class="abox-header">
        <span @click="close">
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
      <div class="abox-body">
        <div class="abbody-top">
          <div class="title">M3U8 Downloader</div>
          <div class="version">Version 2.2.2</div>
        </div>
        <div class="abbody-middle">
          <div class="abbmiddle-left">
            <ul>
              <li>Aria2</li>
              <li>M3U8 Parser</li>
              <li>HTTPS</li>
              <li>ffmpeg Static</li>
              <li>Fluent ffmpeg</li>
            </ul>
          </div>
          <div class="abbmiddle-right">
            <img src="@/assets/img/logo.png" alt="">
          </div>
        </div>
        <div class="abbody-bottom">
          <div class="abbbottom-left" @click="linkOpen('https://tools.heisir.cn/')">©2020 HeiSir2014</div>
          <div class="abbbottom-right">
            <span>开源许可</span>
            <span>关于我们</span>
            <span>帮助支持</span>
            <span>更新日志</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { mapMutations } from 'vuex'
import { shell } from 'electron'
export default {
  name: 'About',
  computed: {
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
    ...mapMutations(['SET_POPUP']),
    close () {
      this.popup.about = false
    },
    linkOpen (e) {
      shell.openExternal(e)
    }
  }
}
</script>
<style lang="scss" scoped>
.about{
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  .about-mask{
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: #00000088;
  }
  .about-box{
    z-index: 10;
    padding: 20px;
    background-color: #fff;
    border-radius: 2px;
    box-shadow: 0 1px 3px #00000055;
    .abox-header{
      width: 100%;
      height: 20px;
      display: flex;
      justify-content: flex-end;
      span{
        cursor: pointer;
        svg{
          width: 20px;
          height: 20px;
          fill: #909399;
        }
      }
    }
    .abox-body{
      .abbody-top{
        width: 100%;
        display: flex;
        color: #4d515a;
        justify-content: flex-start;
        align-items: flex-end;
        .title{
          font-size: 24px;
          font-weight: bold;
        }
        .version{
          margin-left: 20px;
          font-size: 16px;
        }
      }
      .abbody-middle{
        display: flex;
        justify-content: space-between;
        margin-top: 40px;
        .abbmiddle-left{
          ul{
            list-style: none;
            margin: 0;
            padding: 0;
            li{
              color: #909399;
              font-size: 12px;
              line-height: 20px;
            }
          }
        }
        .abbmiddle-right{
          display: flex;
          align-items: flex-start;
          justify-content: flex-start;
          img{
            width: 128px;
          }
        }
      }
      .abbody-bottom{
        display: flex;
        justify-content: space-between;
        color: #606266;
        font-size: 13px;
        margin-top: 20px;
        .abbbottom-left{
          margin-right: 30px;
          cursor: pointer;
        }
        .abbbottom-right{
          span{
            cursor: pointer;
            margin-left: 30px;
          }
        }
      }
    }
  }
}
</style>
