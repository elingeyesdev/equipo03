/**
 * SedeInfoModal Container — Lógica de negocio del modal.
 */

import React from 'react';
import { Sede } from '@gymsync/core';
import { Distancia } from '@gymsync/core';
import { SedeInfoModalView } from './SedeInfoModal.view';

type SedeInfoModalContainerProps = {
  sede: Sede;
  distancia: Distancia;
  visible: boolean;
  onClose: () => void;
  onNavigate: () => void;
};

export const SedeInfoModalContainer: React.FC<SedeInfoModalContainerProps> = ({
  sede,
  distancia,
  visible,
  onClose,
  onNavigate,
}) => {
  return (
    <SedeInfoModalView
      sede={sede}
      distancia={distancia}
      visible={visible}
      onClose={onClose}
      onNavigate={onNavigate}
    />
  );
};
