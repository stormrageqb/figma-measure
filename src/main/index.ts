import './store';

import EventEmitter from '../shared/EventEmitter';
import { VERSION } from '../shared/constants';
import { transformPixelToUnit } from '../shared/helpers';
import {
  Alignments,
  FillTypes,
  LineParameterTypes,
  PluginNodeData,
  Store,
  NodeSelection,
} from '../shared/interfaces';

import { hexToRgb, solidColor } from './helper';
import { drawSpacing, getSpacing, setSpacing } from './spacing';
import { setTooltip } from './tooltip';

figma.showUI(__html__, {
  width: 285,
  height: 526,
  visible: figma.command !== 'visibility',
});

figma.root.setRelaunchData({
  open: '',
  visibility: '',
});

if (figma.command === 'visibility') {
  const group = getGlobalGroup();

  if (group) {
    group.visible = !group.visible;
  }
  figma.closePlugin();
}

export function getColor(color: string) {
  if (color) {
    const { r, g, b } = hexToRgb(color);
    return solidColor(r, g, b);
  } else {
    return solidColor();
  }
}

export function createLabel({
  baseNode,
  text,
  color,
  isVertical,
}: {
  baseNode?: SceneNode;
  text: string;
  color: unknown;
  isVertical?: boolean;
}) {
  const labelFrame = figma.createFrame();
  const label = figma.createText();

  label.characters = text;
  label.fontName = {
    family: 'Inter',
    style: 'Bold',
  };
  label.fontSize = 10;
  label.fills = [].concat(solidColor(255, 255, 255));

  labelFrame.appendChild(label);
  labelFrame.name = 'label';

  // LABEL RECT
  labelFrame.cornerRadius = 3;

  labelFrame.layoutMode = 'HORIZONTAL';
  labelFrame.paddingLeft = 6;
  labelFrame.paddingRight = 6;
  labelFrame.paddingTop = 3;
  labelFrame.paddingBottom = 3;
  labelFrame.counterAxisSizingMode = 'AUTO';

  if (baseNode) {
    labelFrame.x = baseNode.x;
    labelFrame.y = baseNode.y;

    if (isVertical) {
      labelFrame.x -= labelFrame.width / 2;
      labelFrame.y += baseNode.height / 2 - labelFrame.height / 2;
    } else {
      labelFrame.x += baseNode.width / 2 - labelFrame.width / 2;
      labelFrame.y -= labelFrame.height / 2;
    }
  }
  labelFrame.fills = [].concat(color);

  return labelFrame;
}

function getGlobalGroup() {
  return (figma.currentPage.children.find(
    (node) => node.getPluginData('isGlobalGroup') === '1'
  ) as unknown) as GroupNode | FrameNode;
}

export function addToGlobalGroup(node: SceneNode) {
  let globalGroup = getGlobalGroup();

  if (typeof globalGroup === 'undefined') {
    globalGroup = figma.group([node], figma.currentPage);
  } else {
    globalGroup.appendChild(node);
  }

  globalGroup.locked = true;
  globalGroup.expanded = false;
  globalGroup.name = `📐 Measurements`;
  globalGroup.setPluginData('isGlobalGroup', '1');
}

function nodeGroup(node) {
  const globalGroup = getGlobalGroup();

  if (!globalGroup?.children) {
    return null;
  }

  return (
    ((globalGroup.children.find(
      (currentNode) => currentNode.getPluginData('parent') === node.id
    ) as unknown) as GroupNode | FrameNode) || null
  );
}

export function getPluginData(node, name) {
  const data = node.getPluginData(name);
  if (!data) {
    return null;
  }

  return JSON.parse(data);
}

function getLineFrame(node, data) {
  const name = 'line';
  const lineFrame = figma.createFrame();

  lineFrame.name = name;
  lineFrame.resize(
    data.isHorizontal ? node.width : data.labelWidth,
    data.isHorizontal ? data.labelHeight : node.height
  );
  lineFrame.backgrounds = [];
  lineFrame.clipsContent = false;

  lineFrame.expanded = false;

  return lineFrame;
}

function createLine(options) {
  const {
    node,
    direction = 'horizontal',
    // name = 'Group',
    txtVerticalAlign = Alignments.CENTER,
    txtHorizontalAlign = Alignments.CENTER,
    lineVerticalAlign = Alignments.LEFT,
    lineHorizontalAlign = Alignments.BOTTOM,
    strokeCap = 'NONE',
    offset = 3,
    unit = '',
    color = '',
    labels = true,
    labelsOutside = false,
  }: LineParameterTypes = options;

  const LINE_OFFSET = offset * -1;

  const mainColor = getColor(color);

  const isHorizontal = direction === 'horizontal';

  const nodeHeight = node.height;
  const nodeWidth = node.width;

  const heightOrWidth = isHorizontal ? nodeWidth : nodeHeight;

  if (heightOrWidth > 0.01) {
    // needed elements
    const line = figma.createVector();

    const paddingTopBottom = 3;

    // LABEL
    let labelFrame;
    const alignment = isHorizontal ? lineHorizontalAlign : lineVerticalAlign;

    if (labels) {
      labelFrame = createLabel({
        text: transformPixelToUnit(heightOrWidth, unit),
        color: mainColor,
      });
    }

    // GROUP
    const group = getLineFrame(node, {
      isHorizontal,
      alignment,
      labelWidth: labelFrame ? labelFrame.width : 7,
      labelHeight: labelFrame ? labelFrame.height : 7,
    });

    group.appendChild(line);

    // add label frame
    if (labelFrame) {
      group.appendChild(labelFrame);
    }

    // LINE
    line.x = isHorizontal ? 0 : group.width / 2 - line.strokeWeight / 2;
    line.y = isHorizontal ? group.height / 2 + line.strokeWeight / 2 : 0;

    line.vectorPaths = [
      {
        windingRule: 'NONE',
        // M x y L x y Z is close
        data: isHorizontal
          ? `M 0 0 L ${node.height} 0 Z`
          : `M 0 0 L 0 ${node.width} Z`,
      },
    ];

    line.strokes = [].concat(mainColor);
    line.resize(isHorizontal ? node.width : 1, isHorizontal ? 1 : node.height);

    // STROKE CAP
    if (strokeCap === 'STANDARD') {
      const strokeCapWidth = 6 + line.strokeWeight;
      if (strokeCapWidth >= 0.01) {
        const firstMeasureLine = figma.createLine();
        const secondMeasureLine = figma.createLine();

        group.appendChild(firstMeasureLine);
        group.appendChild(secondMeasureLine);

        firstMeasureLine.strokes = [].concat(mainColor);
        secondMeasureLine.strokes = [].concat(mainColor);
        firstMeasureLine.resize(strokeCapWidth, 0);
        secondMeasureLine.resize(strokeCapWidth, 0);

        if (!isHorizontal) {
          firstMeasureLine.x =
            group.width / 2 - strokeCapWidth / 2 - line.strokeWeight / 2;
          firstMeasureLine.y += 1;

          secondMeasureLine.x =
            group.width / 2 - strokeCapWidth / 2 - line.strokeWeight / 2;
          secondMeasureLine.y += nodeHeight;
        } else {
          firstMeasureLine.rotation = 90;
          firstMeasureLine.x += 1;
          firstMeasureLine.y = line.y + strokeCapWidth / 2;

          secondMeasureLine.rotation = 90;
          secondMeasureLine.x += nodeWidth;
          secondMeasureLine.y = line.y + strokeCapWidth / 2;
        }
      }
    } else {
      line.strokeCap = strokeCap as StrokeCap;
    }

    // x, y for text box
    const boxTop = paddingTopBottom / 2;

    // place text group
    if (labels) {
      if (isHorizontal) {
        labelFrame.x = 0;
        labelFrame.y += boxTop + nodeHeight - LINE_OFFSET - line.strokeWeight;

        // vertical text align
        if (txtVerticalAlign === Alignments.CENTER) {
          if (labelsOutside) {
            if (lineHorizontalAlign === Alignments.TOP) {
              labelFrame.y = (labelFrame.height / 2 - LINE_OFFSET) * -1;
            } else if (lineHorizontalAlign === Alignments.BOTTOM) {
              labelFrame.y =
                labelFrame.height / 2 - LINE_OFFSET + line.strokeWeight;
            } else {
              labelFrame.y = 0;
            }
          } else {
            labelFrame.y = 0;
          }
        }

        // horizontal text align
        if (txtHorizontalAlign === Alignments.CENTER) {
          labelFrame.x = nodeWidth / 2 - labelFrame.width / 2;
        }
      } else {
        labelFrame.x = 0;
        labelFrame.y += boxTop;

        // vertical text align
        if (txtVerticalAlign === Alignments.CENTER) {
          labelFrame.y += nodeHeight / 2 - labelFrame.height / 2;
        }

        // vertical text align
        if (txtHorizontalAlign === Alignments.CENTER) {
          if (labelsOutside) {
            if (lineVerticalAlign === Alignments.RIGHT) {
              labelFrame.x = labelFrame.width / 2 - LINE_OFFSET;
            } else if (lineVerticalAlign === Alignments.LEFT) {
              labelFrame.x -=
                labelFrame.width / 2 - LINE_OFFSET + line.strokeWeight;
            } else {
              labelFrame.x = 0;
            }
          } else {
            labelFrame.x = 0;
          }
        }
      }
    }

    // line position
    const halfGroupHeight = group.height / 2;
    const halfGroupWidth = group.width / 2;

    let transformPosition = node.absoluteTransform;
    let newX = transformPosition[0][2];
    let newY = transformPosition[1][2];

    const xCos = transformPosition[0][0];
    const xSin = transformPosition[0][1];

    const yCos = transformPosition[1][0];
    const ySin = transformPosition[1][1];

    // horizonzal line position
    if (isHorizontal) {
      if (lineHorizontalAlign === Alignments.CENTER) {
        newY += (nodeHeight - group.height) / 2 - line.strokeWeight / 2;
      } else if (lineHorizontalAlign === Alignments.TOP) {
        newY -= group.height / 2 - LINE_OFFSET + line.strokeWeight;
      }
      // BOTTOM
      else {
        newY += nodeHeight - group.height / 2 - LINE_OFFSET;
      }

      // check if element is rotated
      if (node.rotation > 0 || node.rotation < 0) {
        // reset
        newX = transformPosition[0][2];
        newY = transformPosition[1][2];

        // center
        if (lineHorizontalAlign === Alignments.CENTER) {
          newY += ySin * (nodeHeight / 2 - halfGroupHeight);
          newX -= yCos * (nodeHeight / 2 - halfGroupHeight);
        }
        // top
        else if (lineHorizontalAlign === Alignments.TOP) {
          newY -= ySin * (halfGroupHeight - LINE_OFFSET + line.strokeWeight);
          newX += yCos * (halfGroupHeight - LINE_OFFSET + line.strokeWeight);
        }
        // bottom
        else {
          newY += ySin * (nodeHeight - halfGroupHeight - LINE_OFFSET);
          newX -= yCos * (nodeHeight - halfGroupHeight - LINE_OFFSET);
        }
      }
    }
    // vertical line position
    else {
      if (lineVerticalAlign === Alignments.CENTER) {
        newX += (nodeWidth - group.width) / 2 + line.strokeWeight / 2;
      } else if (lineVerticalAlign === Alignments.RIGHT) {
        newX += nodeWidth - group.width / 2 - LINE_OFFSET + line.strokeWeight;
      }
      // LEFT
      else {
        newX -= group.width / 2 - LINE_OFFSET;
      }

      // check if element is rotated
      if (node.rotation > 0 || node.rotation < 0) {
        // reset
        newX = transformPosition[0][2];
        newY = transformPosition[1][2];

        // center
        if (lineVerticalAlign === Alignments.CENTER) {
          newY -= (xSin * (nodeWidth - group.width)) / 2;
          newX += (xCos * (nodeWidth - group.width)) / 2;
        }
        // right
        else if (lineVerticalAlign === Alignments.RIGHT) {
          newY -=
            xSin *
            (nodeWidth - halfGroupWidth - LINE_OFFSET + line.strokeWeight);
          newX +=
            xCos *
            (nodeWidth - halfGroupWidth - LINE_OFFSET + line.strokeWeight);
        }
        // left
        else {
          newY += xSin * (halfGroupWidth - LINE_OFFSET);
          newX -= xCos * (halfGroupWidth - LINE_OFFSET);
        }
      }
    }

    transformPosition = [
      [
        xCos, // cos
        xSin, // sin
        newX,
      ],
      [
        yCos, // -sin
        ySin, // cos
        newY,
      ],
    ];

    group.relativeTransform = transformPosition;

    return group;
  }
  return null;
}

function getSelectionArray(): NodeSelection[] {
  return figma.currentPage.selection.map((node) => {
    let data = {};

    try {
      data = JSON.parse(node.getPluginData('data'));
    } catch {
      data = {};
    }

    return {
      id: node.id,
      type: node.type,
      hasSpacing: Object.keys(getSpacing(node)).length > 0,
      data,
    };
  });
}

const sendSelection = () => EventEmitter.emit('selection', getSelectionArray());

const cleanOrphanNodes = () => {
  const group = getGlobalGroup();

  if (group) {
    for (const node of group.children) {
      const foundNode = figma.getNodeById(node.getPluginData('parent'));

      if (!foundNode) {
        node.remove();
      }
    }
  }
};

const removeAllMeasurementConnections = () => {
  const group = getGlobalGroup();

  if (group) {
    for (const node of group.children) {
      const foundNode = figma.getNodeById(node.getPluginData('parent'));
      const connectNodes = JSON.parse(node.getPluginData('connected') || '[]');

      if (connectNodes.length > 0) {
        for (const connectedNode of connectNodes.map((id: string) =>
          figma.getNodeById(id)
        )) {
          connectedNode.setPluginData('spacing', '');
        }
      }

      if (foundNode) {
        foundNode.setPluginData('data', '');
      }

      node.remove();
    }
  }
};

// events
figma.on('selectionchange', () => {
  sendSelection();
});

EventEmitter.on('resize', ({ width, height }) =>
  figma.ui.resize(width, height)
);

EventEmitter.answer('get visibility', async () => {
  const group = getGlobalGroup();

  return group ? group.visible : true;
});

EventEmitter.on('toggle visibility', () => {
  const group = getGlobalGroup();

  if (group) {
    group.visible = !group.visible;
  }
});

EventEmitter.answer('current selection', async () => getSelectionArray());

EventEmitter.on('remove all measurements', () =>
  removeAllMeasurementConnections()
);

EventEmitter.on('set measurements', (store: Partial<Store>) => {
  cleanOrphanNodes();

  for (const node of figma.currentPage.selection) {
    let data: PluginNodeData = {};

    try {
      data = JSON.parse(node.getPluginData('data') || '{}');
      node.setPluginData('data', '{}');
    } catch {
      console.log('Could not set data');
    }

    if (data?.connectedNodes?.length) {
      for (const id of data.connectedNodes) {
        const foundNode = figma.getNodeById(id);
        if (foundNode) {
          foundNode.remove();
        }
      }
    }

    const spacing = getSpacing(node);

    if (Object.keys(spacing).length > 0) {
      Object.keys(spacing)
        .filter((connectedNodeId) => {
          // check if group exists
          const foundGroup = figma.getNodeById(spacing[connectedNodeId]);
          if (!foundGroup) {
            delete spacing[connectedNodeId];
            setSpacing(node, spacing);
          }

          // get connected node
          const foundConnectedNode = (figma.getNodeById(
            connectedNodeId
          ) as unknown) as SceneNode;

          // node removed
          if (!foundConnectedNode) {
            try {
              figma.getNodeById(spacing[connectedNodeId]).remove();
              delete spacing[connectedNodeId];
              setSpacing(node, spacing);
            } catch {
              console.log('Could not remove connected node');
            }
          } else {
            // check connected node group
            const connectedNodeSpacing = getSpacing(foundConnectedNode);
            const foundConnectedGroup = figma.getNodeById(
              connectedNodeSpacing[node.id]
            );
            if (!foundConnectedGroup) {
              delete connectedNodeSpacing[node.id];
              setSpacing(foundConnectedNode, connectedNodeSpacing);
            }

            return connectedNodeId;
          }
        })
        .forEach((connectedNodeId) => {
          drawSpacing(
            [
              node,
              (figma.getNodeById(connectedNodeId) as unknown) as SceneNode,
            ],
            {
              color: store.color,
              labels: store.labels,
              labelsOutside: store.labelsOutside,
              unit: store.unit,
              strokeOffset: store.strokeOffset,
            }
          );
        });
    }

    const connectedNodes = [];

    if (store.surrounding.center) {
      const fillNode = createFill(node, {
        fill: store.fill,
        opacity: store.opacity,
        color: store.color,
      });

      if (fillNode) {
        connectedNodes.push(fillNode);
      }
    }

    if (store.surrounding.tooltip) {
      const tooltip = setTooltip(
        {
          flags: store.tooltip,
          unit: store.unit,
          distance: store.tooltipOffset,
          position: store.surrounding.tooltip,
        },
        node
      );

      if (tooltip) {
        connectedNodes.push(tooltip);
      }
    }

    const strokeSettings = {
      strokeCap: store.strokeCap,
      offset: store.strokeOffset,
      unit: store.unit,
      color: store.color,
      labels: store.labels,
      labelsOutside: store.labelsOutside,
    };

    if (store.surrounding.rightBar) {
      connectedNodes.push(
        createLine({
          ...strokeSettings,
          node,
          direction: 'vertical',
          name: 'vertical line ' + Alignments.RIGHT.toLowerCase(),
          lineVerticalAlign: Alignments.RIGHT,
        })
      );
    }

    if (store.surrounding.leftBar) {
      connectedNodes.push(
        createLine({
          ...strokeSettings,
          node,
          direction: 'vertical',
          name: 'vertical line ' + Alignments.LEFT.toLowerCase(),
          lineVerticalAlign: Alignments.LEFT,
        })
      );
    }

    if (store.surrounding.topBar) {
      connectedNodes.push(
        createLine({
          ...strokeSettings,
          node,
          direction: 'horizontal',
          name: 'horizontal line ' + Alignments.TOP.toLowerCase(),
          lineHorizontalAlign: Alignments.TOP,
        })
      );
    }

    if (store.surrounding.bottomBar) {
      connectedNodes.push(
        createLine({
          ...strokeSettings,
          node,
          direction: 'horizontal',
          name: 'horizontal line ' + Alignments.BOTTOM.toLowerCase(),
          lineHorizontalAlign: Alignments.BOTTOM,
        })
      );
    }

    if (store.surrounding.horizontalBar) {
      connectedNodes.push(
        createLine({
          ...strokeSettings,
          node,
          direction: 'horizontal',
          name: 'horizontal line ' + Alignments.CENTER.toLowerCase(),
          lineHorizontalAlign: Alignments.CENTER,
        })
      );
    }

    if (store.surrounding.verticalBar) {
      connectedNodes.push(
        createLine({
          ...strokeSettings,
          node,
          direction: 'vertical',
          name: 'vertical line ' + Alignments.CENTER.toLowerCase(),
          lineVerticalAlign: Alignments.CENTER,
        })
      );
    }

    node.setPluginData(
      'data',
      JSON.stringify({
        connectedNodes: connectedNodes.map(({ id }) => id),
        surrounding: store.surrounding,
        version: VERSION,
      } as PluginNodeData)
    );

    if (connectedNodes.length > 0) {
      const group = nodeGroup(node);

      if (group) {
        connectedNodes.forEach((n) => {
          group.appendChild(n);
        });
        addToGlobalGroup(group);
      } else {
        const measureGroup = figma.group(connectedNodes, figma.currentPage);
        measureGroup.locked = true;
        measureGroup.expanded = false;
        measureGroup.name = `📏 ${node.name}`;

        measureGroup.setPluginData('parent', node.id);
        addToGlobalGroup(measureGroup);
      }
    }
  }
});

function createFill(
  node: SceneNode,
  { fill, opacity, color }: { fill: FillTypes; opacity: number; color: string }
) {
  if (node.type !== 'SLICE' && node.type !== 'GROUP') {
    let cloneNode: SceneNode;

    if (
      node.type === 'FRAME' ||
      node.type === 'TEXT' ||
      node.type === 'COMPONENT' ||
      node.type === 'INSTANCE'
    ) {
      cloneNode = figma.createRectangle();
      cloneNode.resize(node.width, node.height);
    } else {
      cloneNode = node.clone();
    }

    cloneNode.x = node.x;
    cloneNode.y = node.y;
    cloneNode.relativeTransform = node.absoluteTransform;

    cloneNode.fills = [];
    cloneNode.strokes = [];
    cloneNode.opacity = 1;

    const { r, g, b } = hexToRgb(color);

    switch (fill) {
      case 'dashed':
        cloneNode.dashPattern = [4];
        cloneNode.strokes = [].concat(solidColor(r, g, b));
        cloneNode.strokeWeight = 1;
        break;
      case 'fill':
        cloneNode.fills = [].concat({
          ...solidColor(r, g, b),
          opacity: opacity / 100,
        });
        break;
      case 'fill-stroke':
        cloneNode.strokes = [].concat(solidColor(r, g, b));
        cloneNode.strokeWeight = 1;

        cloneNode.fills = [].concat({
          ...solidColor(r, g, b),
          opacity: opacity / 100,
        });
        break;
      case 'stroke':
        cloneNode.strokes = [].concat(solidColor(r, g, b));
        cloneNode.strokeWeight = 1;
        break;
    }

    return cloneNode;
  }
}

(async function main() {
  await figma.loadFontAsync({ family: 'Roboto', style: 'Regular' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
})();
