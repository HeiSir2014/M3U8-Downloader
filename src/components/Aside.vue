<template>
  <div class="aside">
    <div class="top">
      <span class="download"></span>
      <span class="merge"></span>
      <span class="add"></span>
    </div>
    <div class="bottom">
      <span class="setting"></span>
      <span class="about"></span>
    </div>
  </div>
</template>
<script>
export default {
  name: 'Aside'
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
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background-color: #fff;
    display: inline-block;
  }
  .top{
    span{
      margin-top: 24px;
    }
  }
  .bottom{
    span{
      margin-bottom: 24px;
    }
  }
}
</style>
