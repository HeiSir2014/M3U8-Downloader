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
    <div class="dl-right">
      <div class="dlright-head">
        <div class="dlrhead-left">
          下载中
        </div>
        <div class="dlrhead-right">
          <el-tooltip content="删除所选任务">
            <span class="icon">
              <svg role="img" xmlns="http://www.w3.org/2000/svg" width="48px" height="48px" viewBox="0 0 24 24" aria-labelledby="closeIconTitle" stroke="#4d515a" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" fill="none" color="#4d515a"><path d="M6.34314575 6.34314575L17.6568542 17.6568542M6.34314575 17.6568542L17.6568542 6.34314575"/> </svg>
            </span>
          </el-tooltip>
          <el-tooltip content="刷新任务列表" >
            <span class="icon">
              <svg role="img" xmlns="http://www.w3.org/2000/svg" width="48px" height="48px" viewBox="0 0 24 24" aria-labelledby="rotateIconTitle" stroke="#4d515a" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" fill="none" color="#4d515a"><path d="M22 12l-3 3-3-3"/> <path d="M2 12l3-3 3 3"/> <path d="M19.016 14v-1.95A7.05 7.05 0 0 0 8 6.22"/> <path d="M16.016 17.845A7.05 7.05 0 0 1 5 12.015V10"/> <path stroke-linecap="round" d="M5 10V9"/> <path stroke-linecap="round" d="M19 15v-1"/> </svg>
            </span>
          </el-tooltip>
          <el-tooltip content="恢复所有任务">
            <span class="icon">
              <svg role="img" xmlns="http://www.w3.org/2000/svg" width="48px" height="48px" viewBox="0 0 24 24" aria-labelledby="playIconTitle" stroke="#4d515a" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" fill="none" color="#4d515a"><path d="M20 12L5 21V3z"/> </svg>
            </span>
          </el-tooltip>
          <el-tooltip content="暂停所有任务">
            <span class="icon">
              <svg role="img" xmlns="http://www.w3.org/2000/svg" width="48px" height="48px" viewBox="0 0 24 24" aria-labelledby="pauseIconTitle" stroke="#4d515a" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" fill="none" color="#4d515a"><rect width="4" height="16" x="5" y="4"/> <rect width="4" height="16" x="15" y="4"/> </svg>
            </span>
          </el-tooltip>
          <el-tooltip content="清除下载记录">
            <span class="icon">
              <svg role="img" xmlns="http://www.w3.org/2000/svg" width="48px" height="48px" viewBox="0 0 24 24" aria-labelledby="binIconTitle" stroke="#4d515a" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" fill="none" color="#4d515a"><path d="M19 6L5 6M14 5L10 5M6 10L6 20C6 20.6666667 6.33333333 21 7 21 7.66666667 21 11 21 17 21 17.6666667 21 18 20.6666667 18 20 18 19.3333333 18 16 18 10"/> </svg>
            </span>
          </el-tooltip>
        </div>
      </div>
      <div class="dlright-body">
        <div class="item-empty"></div>
        <div class="item" v-for="i in 6" :key="i">
          <div class="item-top">
            <div class="item-name">PowerShell-7.0.3-win-x64.msi</div>
            <div class="item-operate">
              <el-tooltip content="开始任务">
                <span class="icon">
                  <svg role="img" xmlns="http://www.w3.org/2000/svg" width="48px" height="48px" viewBox="0 0 24 24" aria-labelledby="playIconTitle" stroke="#4d515a" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" fill="none" color="#4d515a"><path d="M20 12L5 21V3z"/> </svg>
                </span>
              </el-tooltip>
              <el-tooltip content="删除任务">
                <span class="icon">
                  <svg role="img" xmlns="http://www.w3.org/2000/svg" width="48px" height="48px" viewBox="0 0 24 24" aria-labelledby="closeIconTitle" stroke="#4d515a" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" fill="none" color="#4d515a"><path d="M6.34314575 6.34314575L17.6568542 17.6568542M6.34314575 17.6568542L17.6568542 6.34314575"/> </svg>
                </span>
              </el-tooltip>
              <el-tooltip content="打开目录">
                <span class="icon">
                  <svg role="img" xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24" aria-labelledby="folderIconTitle" stroke="#4d515a" stroke-width="1" stroke-linecap="square" stroke-linejoin="miter" fill="none" color="#4d515a"><path d="M3 5h6l1 2h11v12H3z"/> </svg>
                </span>
              </el-tooltip>
              <el-tooltip content="复制链接">
                <span class="icon">
                  <svg role="img" xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24" aria-labelledby="linkIconTitle" stroke="#4d515a" stroke-width="1" stroke-linecap="square" stroke-linejoin="miter" fill="none" color="#4d515a"><path d="M10.5,15.5 C10.5,14.1666667 10.5,13.5 10.5,13.5 C10.5,10.7385763 8.26142375,8.5 5.5,8.5 C2.73857625,8.5 0.5,10.7385763 0.5,13.5 C0.5,13.5 0.5,14.1666667 0.5,15.5" transform="rotate(-90 5.5 12)"/> <path d="M8,12 L16,12"/> <path d="M23.5,15.5 C23.5,14.1666667 23.5,13.5 23.5,13.5 C23.5,10.7385763 21.2614237,8.5 18.5,8.5 C15.7385763,8.5 13.5,10.7385763 13.5,13.5 C13.5,13.5 13.5,14.1666667 13.5,15.5" transform="rotate(90 18.5 12)"/> </svg>
                </span>
              </el-tooltip>
            </div>
          </div>
          <div class="item-middle">
            <el-progress :percentage="percentage" color="#5b5bfa" :show-text="false"></el-progress>
          </div>
          <div class="item-bottom">
            <div class="item-size">6.4 MB / 87.0 MB</div>
            <div class="item-info">
              <span>720.5 KB/s</span>
              <span>剩余 1 分 55 秒</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: 'Download',
  data () {
    return {
      percentage: 20,
      customColors: [
        { color: '#5b5bfa' }
      ]
    }
  }
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
    padding: 0 30px 30px;
    display: flex;
    height: 100%;
    justify-content: flex-start;
    align-items: center;
    flex-direction: column;
    .dlright-head{
      height: 46px;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #00000016;
      .dlrhead-left{
        font-size: 16px;
        color: #303133;
        height: 46px;
        display: flex;
        align-items: center;
      }
      .dlrhead-right{
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        height: 46px;
        .icon{
          margin-left: 10px;
          cursor: pointer;
          svg{
            width: 22px;
            height: 22px;
            // stroke: red;
          }
        }
      }
    }
    .dlright-body{
      flex: 1;
      width: 100%;
      overflow-y: scroll;
      &::-webkit-scrollbar { display: none }
      .item{
        padding: 16px 12px;
        background: #fff;
        border: 1px solid #ccc;
        border-radius: 6px;
        margin-top: 16px;
        &:hover{
          border: 1px solid #5b5bfa;
        }
        .item-top{
          width: 100%;
          height: 26px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          .item-name{
            font-size: 14px;
            line-height: 26px;
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          .item-operate{
            border: 1px solid #f5f5f5;
            height: 24px;
            padding: 0 10px;
            border-radius: 14px;
            display: flex;
            justify-content: flex-start;
            align-items: center;
            &:hover{
              background-color: #5b5bfa;
              svg{
                stroke: #fff;
              }
            }
            .icon{
              width: 24px;
              height: 24px;
              line-height: 24px;
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              svg{
                width: 16px;
                height: 16px;
                color: #4d515a;
              }
            }
          }
        }
        .item-middle{
          margin: 14px 0;
        }
        .item-bottom{
          width: 100%;
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #9b9b9b;
          .item-info{
            span{
              margin-left: 20px;
            }
          }
        }
      }
    }
  }
}
</style>
