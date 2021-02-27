import { observer } from 'mobx-react';
import React, { FunctionComponent } from 'react';
import styled from 'styled-components';

// components
import { useStore } from '../../../store';
import {
  ColorIcon,
  FontFamilyIcon,
  FontSizeIcon,
  FontStyleIcon,
  HeightIcon,
  OpacityIcon,
  StrokeIcon,
  WidthIcon,
} from './TooltipIcons';

const Tooltip = styled.div`
  padding: 12px;
  background-color: #fff;
  border-radius: 7px;
  width: 130px;
  position: relative;
  &::before {
    content: '';
    position: absolute;
    margin-top: -3px;
    top: 50%;
    right: -6px;
    width: 0;
    height: 0;
    border-top: 6px solid transparent;
    border-bottom: 6px solid transparent;
    border-left: 6px solid #fff;
  }
  & > div {
    display: flex;
    margin-bottom: 6px;
    &:last-child {
      margin-bottom: 0;
    }
    .icon {
      margin-right: 12px;
    }
  }
`;

export const PreviewTooltip: FunctionComponent = observer(() => {
  const store = useStore();

  return (
    <Tooltip>
      {store.tooltip.fontStyle && (
        <div>
          <div className="icon">
            <FontStyleIcon />
          </div>
          <span>Medium</span>
        </div>
      )}
      {store.tooltip.fontFamily && (
        <div>
          <div className="icon">
            <FontFamilyIcon />
          </div>
          <span>Inter</span>
        </div>
      )}
      {store.tooltip.fontSize && (
        <div>
          <div className="icon">
            <FontSizeIcon />
          </div>
          <span>12</span>
        </div>
      )}
      {store.tooltip.width && (
        <div>
          <div className="icon">
            <WidthIcon />
          </div>
          <span>200</span>
        </div>
      )}
      {store.tooltip.height && (
        <div>
          <div className="icon">
            <HeightIcon />
          </div>
          <span>100</span>
        </div>
      )}
      {store.tooltip.color && (
        <div>
          <div className="icon">
            <ColorIcon />
          </div>
          <span>#1745E8</span>
        </div>
      )}
      {store.tooltip.opacity && (
        <div>
          <div className="icon">
            <OpacityIcon />
          </div>
          <span>90%</span>
        </div>
      )}
      {store.tooltip.stroke && (
        <div>
          <div className="icon">
            <StrokeIcon />
          </div>
          <span>5</span>
        </div>
      )}
    </Tooltip>
  );
});
