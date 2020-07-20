<template>
  <div class="setting">
    <div class="st-left">
      <div class="title">偏好设置</div>
      <div :class="[state === 'basic' ? 'active' : ''] + ' basic'" @click="changeStateEvent('basic')">
        <span class="icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path d="M7 6L7 18 17 12z"/>
          </svg>
        </span>
        <span class="label">基础设置</span>
      </div>
      <div :class="[state === 'advanced' ? 'active' : ''] + ' advanced'" @click="changeStateEvent('advanced')">
        <span class="icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path d="M8 7H11V17H8zM13 7H16V17H13z"/>
          </svg>
        </span>
        <span class="label">高级设置</span>
      </div>
    </div>
    <div class="st-right">
      <div class="stright-head">
        <div class="strhead-left">
          {{ state === 'basic' ? '基础设置' : '高级设置' }}
        </div>
      </div>
      <div class="stright-body">
        <div class="basic" v-show="state === 'basic'">
          基础设置
        </div>
        <div class="advanced" v-show="state === 'advanced'">
          高级设置
        </div>
      </div>
      <div class="stright-footer">
        <el-button size="mini" type="primary">保存并应用</el-button>
        <el-button size="mini">放弃</el-button>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: 'Setting',
  data () {
    return {
      state: 'basic', // basic advanced
      select: null
    }
  },
  methods: {
    changeStateEvent (e) {
      this.state = e
    }
  }
}
</script>
<style lang="scss" scoped>
.setting{
  width: 100%;
  height: calc(100% - 30px);
  display: flex;
  .st-left{
    width: 200px;
    height: 100%;
    background-color: #f4f5f7;
    user-select: none;
    padding: 20px 16px 0;
    .title{
      font-size: 16px;
      color: #303133;
      font-weight: 400px;
      margin-bottom: 20px;
    }
    .basic, .advanced{
      cursor: pointer;
      padding: 8px 10px;
      border-radius: 2px;
      font-size: 12px;
      color: #4d515a;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      vertical-align: text-bottom;
      span{
        display: flex;
      }
      .label{
        margin-left: 12px;
      }
      .icon{
        svg{
          width: 26px;
          height: 26px;
          fill: #4d515a;
        }
      }
      &:hover{
        background-color: #eaecf0;
        span{
          color: #5b5bfa;
          svg{
            fill: #5b5bfa;
          }
        }
      }
    }
    .active{
      background-color: #eaecf0;
      span{
        color: #5b5bfa;
      }
      .icon{
        svg{
          fill: #5b5bfa;
        }
      }
    }
  }
  .st-right{
    flex: 1;
    padding: 0 30px;
    display: flex;
    height: 100%;
    justify-content: space-between;
    align-items: flex-start;
    flex-direction: column;
    .stright-head{
      height: 46px;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #00000016;
      .strhead-left{
        font-size: 16px;
        color: #303133;
        height: 46px;
        display: flex;
        align-items: center;
      }
    }
    .stright-body{
      flex: 1;
      width: 100%;
      border: 1px solid #000;
    }
    .stright-footer{
      height: 70px;
      width: 100%;
      display: flex;
      justify-content: flex-start;
      align-items: center;
    }
  }
}
</style>
