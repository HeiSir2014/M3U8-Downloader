import Vue from 'vue'
import Aside from './Aside'
import Frame from './Frame'
import Download from './Download'
import Merge from './Merge'
import Add from './Add'
import Setting from './Setting'
import About from './About'

export default {
  registerComponents () {
    Vue.component('Aside', Aside)
    Vue.component('Frame', Frame)
    Vue.component('Download', Download)
    Vue.component('Merge', Merge)
    Vue.component('Add', Add)
    Vue.component('Setting', Setting)
    Vue.component('About', About)
  }
}
