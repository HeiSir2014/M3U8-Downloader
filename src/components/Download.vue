<template>
  <div class="download">
    <div class="dl-left">
      <div class="title">任务列表</div>
      <div class="downloading">下载中</div>
      <div class="wating">等待中</div>
      <div class="stopped">已停止</div>
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
  height: calc(100% - 36px);
  display: flex;
  .dl-left{
    width: 200px;
    height: 100%;
    background-color: #f4f5f7;
  }
  .dl-right{
    flex: 1;
  }
}
</style>
