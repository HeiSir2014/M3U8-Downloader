<template>
  <div class="add">
    <div class="add-mask" @click="close"></div>
    <div class="add-box">
      <div class="abox-top">
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
      <div class="abox-middle">
        <el-tabs v-model="tab" @click="tabHandClick">
          <el-tab-pane label="链接任务" name="link">
            <el-input type="textarea" size="small" :autosize="{ minRows: 3, maxRows: 4}"
              placeholder="添加多个下载链接时，请确保每行只有一个链接"
              v-model="linkList">
            </el-input>
          </el-tab-pane>
          <el-tab-pane label="文件任务" name="file">
            <el-upload action="" drag multiple>
              <i class="el-icon-upload"></i>
              <div class="el-upload__text">将文件拖到此处，或<em>选择文件</em></div>
            </el-upload>
          </el-tab-pane>
        </el-tabs>
      </div>
      <div class="abox-options">
        <div class="item">
          <span class="label">重命名: </span>
          <el-input size="mini" v-model="rename" placeholder="选填"></el-input>
        </div>
        <div class="item" v-show="tab === 'file'">
          <span class="label">域名前缀: </span>
          <el-input size="mini" v-model="domain" placeholder="选填"></el-input>
        </div>
        <div class="item">
          <span class="label">存储路径: </span>
          <el-input size="mini" v-model="path">
            <el-button slot="append" icon="el-icon-folder-opened"></el-button>
          </el-input>
        </div>
        <div class="item" v-if="more">
          <span class="label">Origin: </span>
          <el-input size="mini" v-model="origin"></el-input>
        </div>
        <div class="item" v-if="more">
          <span class="label">Referer: </span>
          <el-input size="mini" v-model="referer"></el-input>
        </div>
        <div class="item" v-if="more">
          <span class="label">Cookie: </span>
          <el-input size="mini" v-model="cookie"></el-input>
        </div>
        <div class="item" v-if="more">
          <span class="label">私有 KEY: </span>
          <el-input size="mini" v-model="key"></el-input>
        </div>
        <div class="item" v-if="more">
          <span class="label">代理: </span>
          <el-input size="mini" v-model="proxy"></el-input>
        </div>
      </div>
      <div class="abox-bottom">
        <div class="abbottom-left">
          <el-checkbox v-model="more">高级选项</el-checkbox>
        </div>
        <div class="abbottom-right">
          <el-button size="mini" @click="close">取消</el-button>
          <el-button size="mini" type="primary">确认</el-button>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { mapMutations } from 'vuex'
export default {
  name: 'Add',
  data () {
    return {
      tab: 'link', // file
      linkList: '',
      rename: '',
      domain: '',
      path: '',
      more: false,
      origin: '',
      referer: '',
      cookie: '',
      key: '',
      proxy: ''
    }
  },
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
      this.popup.add = false
    },
    tabHandClick () {},
    btnClickEvent () {
      this.$message.info('lala')
    }
  }
}
</script>
<style lang="scss" scoped>
.add{
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  .add-mask{
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: #00000088;
  }
  .add-box{
    z-index: 10;
    width: 640px;
    border-radius: 2px;
    background-color: #fff;
    box-shadow: 0 1px 3px #00000055;
    .abox-top{
      padding: 20px 20px 0;
      width: 100%;
      display: flex;
      justify-content: flex-end;
      align-items: center;
      span{
        width: 20px;
        height: 20px;
        display: inline-block;
        cursor: pointer;
        svg{
          width: 20px;
          height: 20px;
          fill: #909399;
          cursor: pointer;
        }
      }
    }
    .abox-middle{
      padding: 0 20px 20px;
    }
    .abox-options{
      padding: 0 20px 20px;
      .item{
        margin-top: 10px;
        display: flex;
        align-items: center;
        flex-direction: row;
        .label{
          display: inline-block;
          width: 110px;
          font-size: 14px;
          color: #606266;
        }
      }
    }
    .abox-bottom{
      background-color: #f5f5f5;
      padding: 20px;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }
  }
}
</style>
