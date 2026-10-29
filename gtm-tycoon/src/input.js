// Keyboard state for the frame loop. Pointer input is handled by each scene on the canvas.
const MAP = {
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
  Enter: 'confirm', Space: 'confirm', KeyZ: 'confirm', Escape: 'cancel', KeyX: 'cancel',
};

export const input = {
  held: new Set(),
  pressed: new Set(),
  init() {
    addEventListener('keydown', e => {
      const a = MAP[e.code];
      if (!a) return;
      // Let focused buttons handle Enter/Space themselves.
      const onButton = document.activeElement && document.activeElement.tagName === 'BUTTON';
      if (a === 'confirm' && onButton) return;
      if (['left', 'right', 'up', 'down'].includes(a) && !onButton) e.preventDefault();
      if (a === 'confirm') e.preventDefault();
      if (!e.repeat) this.pressed.add(a);
      this.held.add(a);
    });
    addEventListener('keyup', e => { const a = MAP[e.code]; if (a) this.held.delete(a); });
    addEventListener('blur', () => this.held.clear());
  },
  endFrame() { this.pressed.clear(); },
  clear() { this.held.clear(); this.pressed.clear(); },
};
