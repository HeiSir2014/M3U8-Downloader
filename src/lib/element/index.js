import Vue from 'vue'
import { Message, Tabs, TabPane, Input, Button, Checkbox, Upload, Tooltip, Progress, MessageBox } from 'element-ui'
Vue.use(Tabs)
Vue.use(TabPane)
Vue.use(Input)
Vue.use(Button)
Vue.use(Checkbox)
Vue.use(Upload)
Vue.use(Tooltip)
Vue.use(Progress)
Vue.prototype.$message = Message
Vue.prototype.$msgbox = MessageBox
