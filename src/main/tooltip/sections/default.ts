import { createTooltipTextNode, setTitleBold } from '../../helper';
import namePart from './parts/name';
import fillsPart from './parts/fills';

export function addDefaultSection(
  parent,
  node,
  { fontColor = '', fontSize = 0 }
) {
  const tooltipTextNode = createTooltipTextNode({
    fontColor,
    fontSize
  });

  tooltipTextNode.characters += `Height: ${Math.floor(node.height)}\n`;
  tooltipTextNode.characters += `Width: ${Math.floor(node.width)}`;

  setTitleBold(tooltipTextNode);

  // Add content to parent
  const name = namePart(node, { fontColor, fontSize });
  const fills = fillsPart(node, { fontColor, fontSize });

  if (name) {
    parent.appendChild(name);
  }

  parent.appendChild(tooltipTextNode);

  if (fills) {
    parent.appendChild(fills);
  }
}
