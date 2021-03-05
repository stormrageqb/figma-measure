import { makeAutoObservable, toJS } from 'mobx';
import React from 'react';
import { AsyncTrunk, ignore } from 'mobx-sync';
import EventEmitter from '../shared/EventEmitter';
import { STORAGE_KEY } from '../shared/constants';
import {
  FillTypes,
  SurroundingSettings,
  TooltipPositions,
  TooltipSettings,
} from '../shared/interfaces';

const DEFAULT_SURROUNDING_FLAGS: SurroundingSettings = {
  labels: false,
  topBar: false,
  leftBar: false,
  rightBar: false,
  bottomBar: false,
  horizontalBar: false,
  verticalBar: false,
  center: false,
  tooltip: TooltipPositions.NONE,
};
class RootStore {
  constructor() {
    makeAutoObservable(this);
  }

  labels = true;
  color = '#EF5533';

  visibility = true;

  @ignore
  selection = [];

  fill: FillTypes = 'stroke';

  opacity = 50;

  strokeCap: StrokeCap | 'STANDARD' = 'STANDARD';
  strokeOffset = 10;

  unit = 'px';

  @ignore
  surrounding: SurroundingSettings = DEFAULT_SURROUNDING_FLAGS;

  tooltipOffset = 15;
  tooltip: TooltipSettings = {
    cornerRadius: true,
    points: true,
    width: true,
    height: true,
    fontFamily: true,
    fontStyle: true,
    fontSize: true,
    color: true,
    opacity: true,
    stroke: true,
  };

  setColor(color: string) {
    this.color = color;
    this.sendMeasurements();
  }

  setLabels(labels: boolean) {
    this.labels = labels;
    this.sendMeasurements();
  }

  toggleTooltipSetting(key: keyof TooltipSettings) {
    const truthyFlags = Object.keys(this.tooltip).filter((settingsKey) => {
      if (typeof this.tooltip[settingsKey] === 'boolean') {
        return this.tooltip[settingsKey];
      }
    }).length;

    if (truthyFlags > 1 || !this.tooltip[key]) {
      this.tooltip = {
        ...this.tooltip,
        [key]: !this.tooltip[key],
      };
    }

    this.sendMeasurements();
  }

  setTooltipOffset(tooltipOffset: number) {
    this.tooltipOffset = tooltipOffset;
    this.sendMeasurements();
  }

  setTooltipSettings(settings) {
    this.tooltip = {
      ...this.tooltip,
      ...settings,
    };
  }

  setUnit(unit: string) {
    this.unit = unit;
    this.sendMeasurements();
  }

  setFill(fill) {
    this.fill = fill;
    this.sendMeasurements();
  }

  setOpacity(distance: number) {
    this.opacity = distance;
    this.sendMeasurements();
  }

  setStrokeCap(strokeCap: StrokeCap | 'STANDARD') {
    this.strokeCap = strokeCap;
    this.sendMeasurements();
  }

  setStrokeOffset(strokeOffset: number) {
    this.strokeOffset = parseInt(strokeOffset.toString(), 0) || 0;
    this.sendMeasurements();
  }

  setSurrounding(surrounding, disableTransfer = false) {
    if (this.selection.length > 0) {
      this.surrounding = surrounding;
      if (!disableTransfer) {
        this.sendMeasurements();
      }
    }
  }

  resetSurrounding() {
    this.surrounding = DEFAULT_SURROUNDING_FLAGS;
  }

  setSelection(selection = []) {
    this.selection = selection;
  }

  toggleVisibility() {
    this.visibility = !this.visibility;
    EventEmitter.emit('toggle visibility');
  }

  setVisibility(visibility: boolean) {
    this.visibility = visibility;
  }

  sendMeasurements() {
    if (this.selection.length > 0) {
      EventEmitter.emit(
        'set measurements',
        toJS({
          labels: this.labels,
          color: this.color,
          fill: this.fill,
          opacity: this.opacity,
          strokeCap: this.strokeCap,
          strokeOffset: this.strokeOffset,
          surrounding: toJS(this.surrounding),
          tooltipOffset: this.tooltipOffset,
          tooltip: toJS(this.tooltip),
          unit: this.unit,
        })
      );
    }
  }
}

const rootStore = new RootStore();

export type TStore = RootStore;

const StoreContext = React.createContext<TStore | null>(null);

export const StoreProvider = ({ children }) => {
  return (
    <StoreContext.Provider value={rootStore}>{children}</StoreContext.Provider>
  );
};

export const useStore = () => {
  const store = React.useContext(StoreContext);
  if (!store) {
    throw new Error('useStore must be used within a StoreProvider.');
  }
  return store;
};

export const trunk = new AsyncTrunk(rootStore, {
  storageKey: STORAGE_KEY,
  storage: {
    getItem(key: string) {
      EventEmitter.emit('storage get item', key);
      return new Promise((resolve) =>
        EventEmitter.once('storage get item', resolve)
      );
    },
    setItem(key: string, value: string) {
      EventEmitter.emit('storage set item', {
        key,
        value,
      });
      return new Promise((resolve) =>
        EventEmitter.once('storage set item', resolve)
      );
    },
    removeItem(key: string) {
      EventEmitter.emit('storage remove item', key);
      return new Promise((resolve) =>
        EventEmitter.once('storage remove item', resolve)
      );
    },
  },
});

export const getStoreFromMain = (): Promise<TStore> => {
  return new Promise((resolve) => {
    EventEmitter.emit('storage', STORAGE_KEY);
    EventEmitter.once('storage', (store, emit) => {
      emit('store initialized');
      resolve(JSON.parse(store || '{}'));
    });
  });
};
