/**
 * Marca-texto da prova. Guardamos os trechos como deslocamentos de caracteres
 * dentro do texto da questão e desenhamos com a CSS Custom Highlight API —
 * assim o DOM renderizado pelo React nunca é alterado.
 */
export type Mark = [number, number];

const HIGHLIGHT = "simu-marker";

export function markerSupported() {
  return typeof CSS !== "undefined" && "highlights" in CSS && typeof Highlight !== "undefined";
}

function textNodes(root: Node) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) nodes.push(n as Text);
  return nodes;
}

function offsetOf(root: Node, container: Node, offset: number) {
  let total = 0;
  for (const node of textNodes(root)) {
    if (node === container) return total + offset;
    total += node.data.length;
  }
  // seleção terminou num elemento (não num nó de texto)
  if (container.nodeType === Node.ELEMENT_NODE) {
    const range = document.createRange();
    range.selectNodeContents(root);
    range.setEnd(container, offset);
    return range.toString().length;
  }
  return total;
}

export function selectionToMark(root: HTMLElement): Mark | null {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);
  if (!root.contains(range.commonAncestorContainer)) return null;
  const start = offsetOf(root, range.startContainer, range.startOffset);
  const end = offsetOf(root, range.endContainer, range.endOffset);
  if (end - start < 2) return null;
  return [start, end];
}

export function mergeMarks(marks: Mark[], next: Mark): Mark[] {
  const all = [...marks, next].toSorted((a, b) => a[0] - b[0]);
  const out: Mark[] = [];
  for (const m of all) {
    const last = out[out.length - 1];
    if (last && m[0] <= last[1]) last[1] = Math.max(last[1], m[1]);
    else out.push([m[0], m[1]]);
  }
  return out;
}

export function paintMarks(root: HTMLElement | null, marks: Mark[] | undefined) {
  if (!markerSupported()) return;
  if (!root || !marks?.length) {
    CSS.highlights.delete(HIGHLIGHT);
    return;
  }
  const nodes = textNodes(root);
  const ranges: Range[] = [];
  for (const [start, end] of marks) {
    let pos = 0;
    const range = document.createRange();
    let started = false;
    for (const node of nodes) {
      const len = node.data.length;
      if (!started && start < pos + len) {
        range.setStart(node, Math.max(0, start - pos));
        started = true;
      }
      if (started && end <= pos + len) {
        range.setEnd(node, Math.max(0, end - pos));
        ranges.push(range);
        break;
      }
      pos += len;
    }
  }
  CSS.highlights.set(HIGHLIGHT, new Highlight(...ranges));
}
