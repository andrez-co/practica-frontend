import type { ReactNode, FC } from 'react';
import './TarjetaTramite.css';

export interface TarjetaTramiteProps {
  titulo?: string;
  Titulo?: string;
  descripcion?: string;
  Descripcion?: string;
  categoria?: string;
  Categoria?: string;
  icono?: ReactNode;
}

export const TarjetaTramite: FC<TarjetaTramiteProps> = (props) => {
  const titulo = props.titulo || props.Titulo || '';
  const descripcion = props.descripcion || props.Descripcion || '';
  const categoria = props.categoria || props.Categoria || '';
  const { icono } = props;

  return (
    <article className="tarjeta-tramite">
      <div className="tarjeta-tramite__header">
        <span className="tarjeta-tramite__categoria">{categoria}</span>
        {icono && <div className="tarjeta-tramite__icono">{icono}</div>}
      </div>
      <h3 className="tarjeta-tramite__titulo">{titulo}</h3>
      <p className="tarjeta-tramite__descripcion">{descripcion}</p>
      <div className="tarjeta-tramite__footer">
        <button type="button" className="tarjeta-tramite__btn">
          Consultar Trámite &rarr;
        </button>
      </div>
    </article>
  );
};

export default TarjetaTramite;

