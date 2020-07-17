import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    view: 'Download',
    popup: {
      add: false,
      about: false
    },
    setting: {
      theme: 'light'
    }
  },
  getters: {
    getView: state => {
      return state.view
    },
    getPopup: state => {
      return state.popup
    },
    getSetting: state => {
      return state.setting
    }
  },
  mutations: {
    SET_VIEW: (state, payload) => {
      state.view = payload
    },
    SET_POPUP: (state, payload) => {
      state.popup = payload
    },
    SET_SETTING: (state, payload) => {
      state.setting = payload
    }
  },
  actions: {
  },
  modules: {
  }
})
