import Vue from 'vue'
import { computed } from '@vue/composition-api'
import { BridgeEvents, setStorage } from '@vue-devtools/shared-utils'
import { useApps } from '@front/features/apps'
import { getBridge } from '@front/features/bridge'
import {
  layersPerApp,
  hiddenLayersPerApp,
  selectedEvent,
  vScrollPerApp,
  hoverLayerId
} from './store'

export function layerFactory (options) {
  return {
    ...options,
    events: [],
    displayedEvents: [],
    eventTimeMap: {},
    groupsMap: {},
    groups: [],
    height: 1
  }
}

function builtinLayersFactory () {
  return [
    {
      id: 'mouse',
      label: 'Mouse',
      color: 0xA451AF
    },
    {
      id: 'keyboard',
      label: 'Keyboard',
      color: 0x8151AF
    },
    {
      id: 'component-event',
      label: 'Component events',
      color: 0x41B883
    }
  ].map(options => layerFactory(options))
}

export function getLayers (appId) {
  let layers = layersPerApp.value[appId]
  if (!layers) {
    layers = builtinLayersFactory()
    Vue.set(layersPerApp.value, appId, layers)
    // Read the property again to make it reactive
    layers = layersPerApp.value[appId]
  }
  return layers
}

function getHiddenLayers (appId) {
  let layers = hiddenLayersPerApp.value[appId]
  if (!layers) {
    layers = []
    Vue.set(hiddenLayersPerApp.value, appId, layers)
    // Read the property again to make it reactive
    layers = hiddenLayersPerApp.value[appId]
  }
  return layers
}

export function useLayers () {
  const { currentAppId } = useApps()

  const allLayers = computed(() => getLayers(currentAppId.value))

  function isLayerHidden (layer) {
    const list = getHiddenLayers(currentAppId.value)
    return list.includes(layer.id)
  }

  function setLayerHidden (layer, hidden) {
    const list = getHiddenLayers(currentAppId.value)
    const index = list.indexOf(layer.id)
    if (hidden && index === -1) {
      list.push(layer.id)
    } else if (!hidden && index !== -1) {
      list.splice(index, 1)
    }
    setStorage('hidden-layers', hiddenLayersPerApp.value)
  }

  const layers = computed(() => allLayers.value.filter(l => !isLayerHidden(l)))

  const selectedEventLayerId = computed(() => selectedEvent.value ? selectedEvent.value.layer.id : null)

  return {
    layers,
    allLayers,
    vScroll: computed({
      get: () => vScrollPerApp.value[currentAppId.value] || 0,
      set: value => {
        Vue.set(vScrollPerApp.value, currentAppId.value, value)
      }
    }),
    isLayerHidden,
    setLayerHidden,
    hoverLayerId,
    selectedEventLayerId
  }
}

export function fetchLayers () {
  getBridge().send(BridgeEvents.TO_BACK_TIMELINE_LAYER_LIST, {})
}