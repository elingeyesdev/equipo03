import type { CSSProperties } from 'react';

const UNSAVED_MSG = 'Tienes cambios sin guardar. ¿Deseas salir?';

export const guardClose = (isDirty: boolean, onClose: () => void) => {
  if (!isDirty || window.confirm(UNSAVED_MSG)) onClose();
};

export const panelStyle: CSSProperties = {
  padding: '1.25rem',
};
