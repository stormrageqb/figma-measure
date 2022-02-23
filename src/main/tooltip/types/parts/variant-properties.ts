import { createTooltipTextNode, solidColor } from '../../../helper';

export const variantProperties = (
  node,
  parent,
  { fontColor = '', fontSize = 0 }
) => {
  if (node?.variantProperties && Object.keys(node.variantProperties.length)) {
    const iconNode = figma.createNodeFromSvg(
      `<svg width="16" height="16" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fill-rule="evenodd" clip-rule="evenodd" d="M12.0625 10.9375L12.7696 11.6446L15.2929 14.1679L16 14.875L16.7071 14.1679L19.2304 11.6446L19.9375 10.9375L19.2304 10.2304L16.7071 7.70711L16 7L15.2929 7.70711L12.7696 10.2304L12.0625 10.9375ZM18.5233 10.9375L16 13.4608L13.4767 10.9375L16 8.41421L18.5233 10.9375ZM12.0625 21.0625L12.7696 21.7696L15.2929 24.2929L16 25L16.7071 24.2929L19.2304 21.7696L19.9375 21.0625L19.2304 20.3554L16.7071 17.8321L16 17.125L15.2929 17.8321L12.7696 20.3554L12.0625 21.0625ZM18.5233 21.0625L16 23.5858L13.4767 21.0625L16 18.5392L18.5233 21.0625ZM7.70711 16.7071L7 16L7.70711 15.2929L10.2304 12.7696L10.9375 12.0625L11.6446 12.7696L14.1679 15.2929L14.875 16L14.1679 16.7071L11.6446 19.2304L10.9375 19.9375L10.2304 19.2304L7.70711 16.7071ZM10.9375 18.5233L13.4608 16L10.9375 13.4767L8.41421 16L10.9375 18.5233ZM17.125 16L17.8321 16.7071L20.3554 19.2304L21.0625 19.9375L21.7696 19.2304L24.2929 16.7071L25 16L24.2929 15.2929L21.7696 12.7696L21.0625 12.0625L20.3554 12.7696L17.8321 15.2929L17.125 16ZM23.5858 16L21.0625 18.5233L18.5392 16L21.0625 13.4767L23.5858 16Z" fill="#8C8C8C" />
      </svg>`
    );
    const textNode = createTooltipTextNode({
      fontColor,
      fontSize,
    });
    textNode.x += 20;
    textNode.y += 1.5;
    textNode.characters += `Variants\n`;

    const variantTexts = [];
    for (const [key, value] of Object.entries(node.variantProperties)) {
      variantTexts.push(`${key}: ${value}`);
    }

    textNode.characters += variantTexts.join('\n');

    textNode.setRangeFontSize(9, textNode.characters.length, 10);
    textNode.setRangeFills(9, textNode.characters.length, [
      solidColor(153, 153, 153),
    ]);

    const g = figma.group([iconNode, textNode], parent);
    g.expanded = false;
  }
};