export function element(
  name: string,
  attributes: Record<string, string>,
  parent: Element,
): SVGElement {
  const node = document.createElementNS("http://www.w3.org/2000/svg", name);
  for (const [key, value] of Object.entries(attributes)) {
    node.setAttribute(key, value);
  }
  parent.append(node);
  return node;
}
