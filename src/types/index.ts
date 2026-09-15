import type React from 'react';

export interface ServiceDetail {
  id: number;
  titulo: string;
  catFiltro: string;
  categoria: string;
  descripcion: string;
  icono: React.ReactNode;
  lineaAtencion: string;
  horario: string;
  emailContacto: string;
  dependencia: string;
  tramitesFrecuentes: string[];
  cobertura: string;
}
