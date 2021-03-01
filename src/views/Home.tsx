import { observer } from 'mobx-react';
import React, { FunctionComponent, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { Colors } from '../components/ColorPicker';
import { EyeClosedIcon, EyeIcon } from '../components/icons/EyeIcons';
import { RefreshIcon } from '../components/icons/RefreshIcon';
import { SpacingIcon } from '../components/icons/SpacingIcon';
import { Toggle } from '../components/Toggle';

import Viewer from '../components/Viewer';

import FigmaMessageEmitter from '../shared/FigmaMessageEmitter';
import { useStore } from '../store';
import CenterChooser from './components/CenterChooser';
import LineChooser from './components/LineChooser';

const Home: FunctionComponent = observer(() => {
  const store = useStore();

  useEffect(() => {
    FigmaMessageEmitter.emit('resize', {
      width: 285,
      height: 526,
    });
  }, []);

  const isSpacingToggleActive = useMemo(() => {
    return (
      store.selection.some((selection) => selection.hasSpacing) ||
      (store.selection.length === 1 && store.selection[0].hasSpacing)
    );
  }, [store.selection]);

  const shouldDisableSpacing = useMemo(() => {
    return store.selection.length === 1 && !store.selection[0].hasSpacing;
  }, [store.selection]);

  const toggleSpacing = () => {
    FigmaMessageEmitter.emit('draw spacing', {
      color: store.color,
      labels: store.labels,
      unit: store.unit,
    });
    FigmaMessageEmitter.ask('current selection').then((data: string[]) =>
      store.setSelection(data)
    );
  };

  return (
    <>
      <ViewerContainer>
        {store.selection.length === 0 && (
          <ViewerOverlay>
            <span>
              Select a Layer
              <br />
              to get started
            </span>
          </ViewerOverlay>
        )}
        <Viewer />

        <Visibility onClick={() => store.toggleVisibility()}>
          {store.visibility ? <EyeIcon /> : <EyeClosedIcon />}
        </Visibility>

        <Refresh
          active={store.selection.length > 0}
          onClick={() => store.sendMeasurements()}
        >
          <RefreshIcon />
        </Refresh>

        <Spacing
          active={isSpacingToggleActive}
          disable={shouldDisableSpacing}
          onClick={toggleSpacing}
        >
          <SpacingIcon />
        </Spacing>
      </ViewerContainer>

      <LineChooser />
      <CenterChooser />

      <InputContainer>
        <label htmlFor="color">Color</label>
        <Colors
          colors={['#E8278A', '#FAAA00', '#2CB571', '#1D45E8', '#7623F5']}
          onChange={(color) => store.setColor(color)}
          color={store.color}
        />
      </InputContainer>

      <InputContainer style={{ paddingTop: 0 }}>
        <Toggle
          checked={store.labels}
          label="Numbers"
          onChange={(e) => store.setLabels(e.currentTarget.checked)}
        />
        <div className="input" style={{ width: 55, marginLeft: 12 }}>
          <input
            type="text"
            value={store.unit}
            onChange={(e) => store.setUnit(e.currentTarget.value)}
          />
        </div>
      </InputContainer>
    </>
  );
});

const ViewerOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  background-color: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-weight: bold;
  z-index: 3;
`;

const InputContainer = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 14px;
  align-items: center;
  label {
    font-weight: bold;
  }
`;

const Spacing = styled.div<{ active: boolean; disable: boolean }>`
  position: absolute;
  right: 12px;
  bottom: 12px;
  cursor: pointer;
  opacity: ${(props) => (props.disable ? 0.5 : 1)};
  ${(props) => (props.active ? 'box-shadow: 0 0 0 3px #e8ecfd' : '')};
  border-radius: 3px;
`;

const Refresh = styled.div<{ active?: boolean }>`
  position: absolute;
  right: 12px;
  top: 12px;
  cursor: pointer;
  border-radius: 4px;
  width: 30px;
  height: 30px;
  border: 1px solid #e8e8e8;
  overflow: hidden;
  opacity: ${(props) => (props.active ? 1 : 0.5)};
  svg {
    margin: -2px 0 0 -2px;
  }
  &:hover {
    background-color: #f3f5ff;
  }
  &:active {
    background-color: #e8ecfd;
  }
`;

const Visibility = styled(Refresh)`
  left: 12px;
  top: 12px;
  z-index: 10;
`;

const ViewerContainer = styled.div`
  position: relative;
  height: 271px;
  display: flex;
  justify-content: center;
  align-items: center;

  svg {
    user-select: none;
    g {
      cursor: pointer;
    }
  }
`;

export default Home;
