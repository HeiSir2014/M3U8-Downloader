<template>
  <div class="merge">
    <div class="mg-left">
      <div class="title">任务列表</div>
      <div :class="[state === 'merging' ? 'active' : ''] + ' merging'" @click="changeStateEvent('merging')">
        <span class="icon">
          <svg role="img" xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24" aria-labelledby="coloursIconTitle" stroke="#4d515a" stroke-width="1" stroke-linecap="square" stroke-linejoin="miter" fill="none" color="#4d515a"><circle cx="12" cy="9" r="5"/> <circle cx="9" cy="14" r="5"/> <circle cx="15" cy="14" r="5"/> </svg>
        </span>
        <span class="label">合并中</span>
      </div>
      <div :class="[state === 'stopped' ? 'active' : ''] + ' stopped'" @click="changeStateEvent('stopped')">
        <span class="icon">
          <svg role="img" xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24" aria-labelledby="circleIconTitle" stroke="#4d515a" stroke-width="1" stroke-linecap="square" stroke-linejoin="miter" fill="none" color="#4d515a"><circle cx="12" cy="12" r="8"/> </svg>
        </span>
        <span class="label">已停止</span>
      </div>
    </div>
    <div class="mg-right">
      <div class="mgright-head">
        <div class="mgrhead-left">
          {{ state === 'merging' ? '合并中' : '已停止' }}
        </div>
        <div class="mgrhead-right">
          <el-tooltip content="删除所选任务" v-show="state !== 'stopped'">
            <span :class="[select !== null ? 'active ' : ''] + 'icon delete'" @click="deleteSelectTask">
              <svg role="img" xmlns="http://www.w3.org/2000/svg" width="48px" height="48px" viewBox="0 0 24 24" aria-labelledby="closeIconTitle" stroke="#4d515a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" color="#4d515a"><path d="M6.34314575 6.34314575L17.6568542 17.6568542M6.34314575 17.6568542L17.6568542 6.34314575"/> </svg>
            </span>
          </el-tooltip>
          <el-tooltip content="刷新任务列表">
            <span class="icon" @click="refreshTaskList">
              <svg role="img" xmlns="http://www.w3.org/2000/svg" width="48px" height="48px" viewBox="0 0 24 24" aria-labelledby="rotateIconTitle" stroke="#4d515a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" color="#4d515a"><path d="M22 12l-3 3-3-3"/> <path d="M2 12l3-3 3 3"/> <path d="M19.016 14v-1.95A7.05 7.05 0 0 0 8 6.22"/> <path d="M16.016 17.845A7.05 7.05 0 0 1 5 12.015V10"/> <path stroke-linecap="round" d="M5 10V9"/> <path stroke-linecap="round" d="M19 15v-1"/> </svg>
            </span>
          </el-tooltip>
          <el-tooltip content="恢复所有任务">
            <span class="icon" @click="resumeAllTasks">
              <svg role="img" xmlns="http://www.w3.org/2000/svg" width="48px" height="48px" viewBox="0 0 24 24" aria-labelledby="playIconTitle" stroke="#4d515a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" color="#4d515a"><path d="M20 12L5 21V3z"/> </svg>
            </span>
          </el-tooltip>
          <el-tooltip content="暂停所有任务">
            <span class="icon" @click="pauseAllTasks">
              <svg role="img" xmlns="http://www.w3.org/2000/svg" width="48px" height="48px" viewBox="0 0 24 24" aria-labelledby="pauseIconTitle" stroke="#4d515a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" color="#4d515a"><rect width="4" height="16" x="5" y="4"/> <rect width="4" height="16" x="15" y="4"/> </svg>
            </span>
          </el-tooltip>
          <el-tooltip content="清除下载记录" v-show="state === 'stopped'">
            <span class="icon" @click="clearDownloadRecords">
              <svg role="img" xmlns="http://www.w3.org/2000/svg" width="48px" height="48px" viewBox="0 0 24 24" aria-labelledby="binIconTitle" stroke="#4d515a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" color="#4d515a"><path d="M19 6L5 6M14 5L10 5M6 10L6 20C6 20.6666667 6.33333333 21 7 21 7.66666667 21 11 21 17 21 17.6666667 21 18 20.6666667 18 20 18 19.3333333 18 16 18 10"/> </svg>
            </span>
          </el-tooltip>
        </div>
      </div>
      <div class="mgright-body">
        <div :class="[select === j ? 'active ' : ''] + 'item'" v-for="(i, j) in list" :key="j" @click="itemClickEvent(j)" v-show="i.state === state">
          <div class="item-top">
            <div class="item-name">{{ i.name }}</div>
            <div class="item-operate">
              <el-tooltip content="暂停任务" v-show="i.state === 'merging'">
                <span class="icon" @click.stop="pauseTask">
                  <svg role="img" xmlns="http://www.w3.org/2000/svg" width="48px" height="48px" viewBox="0 0 24 24" aria-labelledby="pauseIconTitle" stroke="#4d515a" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" fill="none" color="#4d515a"><rect width="4" height="16" x="5" y="4"/> <rect width="4" height="16" x="15" y="4"/></svg>
                </span>
              </el-tooltip>
              <el-tooltip content="重新合并" v-show="i.state === 'stopped'">
                <span class="icon" @click.stop="reMergeTask">
                  <svg role="img" xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24" aria-labelledby="refreshIconTitle" stroke="#4d515a" stroke-width="1" stroke-linecap="square" stroke-linejoin="miter" fill="none" color="#4d515a"> <title id="refreshIconTitle">Refresh</title> <polyline points="22 12 19 15 16 12"/> <path d="M11,20 C6.581722,20 3,16.418278 3,12 C3,7.581722 6.581722,4 11,4 C15.418278,4 19,7.581722 19,12 L19,14"/> </svg>
                </span>
              </el-tooltip>
              <el-tooltip content="删除任务">
                <span class="icon" @click.stop="deleteTask">
                  <svg role="img" xmlns="http://www.w3.org/2000/svg" width="48px" height="48px" viewBox="0 0 24 24" aria-labelledby="closeIconTitle" stroke="#4d515a" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" fill="none" color="#4d515a"><path d="M6.34314575 6.34314575L17.6568542 17.6568542M6.34314575 17.6568542L17.6568542 6.34314575"/> </svg>
                </span>
              </el-tooltip>
              <el-tooltip content="打开目录">
                <span class="icon" @click.stop="openFolder(i.folder)">
                  <svg role="img" xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24" aria-labelledby="folderIconTitle" stroke="#4d515a" stroke-width="1" stroke-linecap="square" stroke-linejoin="miter" fill="none" color="#4d515a"><path d="M3 5h6l1 2h11v12H3z"/> </svg>
                </span>
              </el-tooltip>
            </div>
          </div>
          <div class="item-middle">
            <el-progress :percentage="i.percentage" :color="i.color" :show-text="false"></el-progress>
          </div>
          <div class="item-bottom">
            <div class="item-number">{{i.number}} 个视频片段</div>
            <div class="item-speed">{{i.speed === 'fast' ? '快速合并' : '修复合并'}}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
const { shell } = require('electron')
export default {
  name: 'Merge',
  data () {
    return {
      state: 'merging', // merging stopped
      select: null,
      list: [
        {
          name: 'PowerShell-7.0.3-win-x64.msi',
          state: 'merging',
          percentage: 40,
          folder: 'C:\\Users',
          number: 120,
          color: '#5b5bfa',
          speed: 'fast'
        },
        {
          name: 'ZY-Player-Setup-1.2.6.exe',
          state: 'merging',
          percentage: 60,
          folder: 'C:\\Users',
          number: 340,
          color: '#5b5bfa',
          speed: 'slow'
        },
        {
          name: 'ZY-Player-Setup-1.2.6.exe',
          state: 'stopped',
          percentage: 100,
          folder: 'C:\\Users',
          number: 450,
          color: '#2acb42',
          speed: 'fast'
        }
      ]
    }
  },
  methods: {
    changeStateEvent (e) {
      this.state = e
    },
    deleteSelectTask () {},
    refreshTaskList () {},
    resumeAllTasks () {},
    pauseAllTasks () {},
    clearDownloadRecords () {},
    itemClickEvent (n) {
      this.select = n
    },
    pauseTask () {},
    reMergeTask () {},
    deleteTask () {},
    openFolder (e) {
      shell.showItemInFolder(e)
    }
  }
}
</script>
<style lang="scss" scoped>
.merge{
  width: 100%;
  height: calc(100% - 30px);
  display: flex;
  .mg-left{
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
    .merging, .stopped{
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
          stroke: #4d515a;
        }
      }
      &:hover{
        background-color: #eaecf0;
        span{
          color: #5b5bfa;
          svg{
            stroke: #5b5bfa;
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
          stroke: #5b5bfa;
        }
      }
    }
  }
  .mg-right{
    flex: 1;
    padding: 0 30px 30px;
    height: 100%;
    justify-content: flex-start;
    align-items: center;
    flex-direction: column;
    .mgright-head{
      height: 46px;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #00000016;
      .mgrhead-left{
        font-size: 16px;
        color: #303133;
        height: 46px;
        display: flex;
        align-items: center;
      }
      .mgrhead-right{
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        height: 46px;
        .icon{
          margin-left: 16px;
          cursor: pointer;
          &.delete{
            svg{
              stroke: #acacac;
            }
          }
          &.active{
            svg{
              stroke: #4d515a;
            }
          }
          svg{
            width: 16px;
            height: 16px;
          }
        }
      }
    }
    .mgright-body{
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
        &.active{
          border: 1px solid #5b5bfa;
        }
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
          .item-speed{
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
