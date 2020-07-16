<template>
  <div class="download">
    <div class="dl-left">
      <div class="title">任务列表</div>
      <div class="downloading active">
        <span class="icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path d="M7 6L7 18 17 12z"/>
          </svg>
        </span>
        <span class="label">下载中</span>
      </div>
      <div class="wating">
        <span class="icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path d="M8 7H11V17H8zM13 7H16V17H13z"/>
          </svg>
        </span>
        <span class="label">等待中</span>
      </div>
      <div class="stopped">
        <span class="icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <path d="M7 7H17V17H7z"/>
          </svg>
        </span>
        <span class="label">已停止</span>
      </div>
    </div>
    <div class="dl-right"></div>
  </div>
</template>
<script>
export default {
  name: 'Download'
}
</script>
<style lang="scss" scoped>
.download{
  width: 100%;
  height: calc(100% - 30px);
  display: flex;
  .dl-left{
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
    .downloading, .wating, .stopped{
      cursor: pointer;
      padding: 8px 10px;
      border-radius: 3px;
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
  .dl-right{
    flex: 1;
  }
}
</style>
