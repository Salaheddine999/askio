// Browser translators (Google Translate in Chrome, for example) replace a
// page's text nodes with their own, without telling React. When React later
// removes or moves the text it put there, the browser throws "NotFoundError:
// Failed to execute 'removeChild' (or 'insertBefore') on 'Node'" and the page
// crashes. This makes those two calls skip a node that's no longer where React
// left it, so translated pages keep working.
// See https://github.com/facebook/react/issues/11538.

let installed = false;

/** Patches Node.removeChild and Node.insertBefore; safe to call more than once. */
export function guardAgainstTranslators() {
  if (installed || typeof Node !== "function" || !Node.prototype) return;
  installed = true;

  const removeChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(this: Node, child: T): T {
    // Already moved or removed by the translator: nothing left to remove.
    if (child.parentNode !== this) return child;
    return removeChild.call(this, child) as T;
  };

  const insertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(this: Node, node: T, child: Node | null): T {
    // The reference node was replaced by the translator: skip instead of
    // crashing; the translated text stays where it is.
    if (child && child.parentNode !== this) return node;
    return insertBefore.call(this, node, child) as T;
  };
}
