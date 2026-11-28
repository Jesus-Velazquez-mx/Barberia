import { ActiveStatusBadge } from '../common/ActiveStatusBadgeComponent';
import { DataTable, type DataTableColumn, type DataTableProps } from '../common/DataTableComponent';
import { FacialStructureChips } from './FacialStructureChipsComponent';
import { HaircutStyleThumbnail } from './HaircutStyleThumbnailComponent';
import type { HaircutStyle } from '../../types/haircutStyleType';

type HaircutStyleTableProps = Omit<DataTableProps<HaircutStyle>, 'columns' | 'getRowKey' | 'getRowLabel'> & {
  /* URL de la foto de cada estilo, por id. Los estilos sin foto (o que aún no cargan) no aparecen. */
  imageUrls: Record<string, string>;
};

export function HaircutStyleTable({ imageUrls, ...props }: HaircutStyleTableProps) {
  const columns: DataTableColumn<HaircutStyle>[] = [
    {
      key: 'photo',
      header: 'Foto',
      render: (style) => <HaircutStyleThumbnail name={style.name} url={imageUrls[style.id]} />
    },
    {
      key: 'name',
      header: 'Nombre',
      render: (style) => <span className="font-semibold">{style.name}</span>
    },
    {
      key: 'description',
      header: 'Descripción',
      render: (style) => (
        <span className="block max-w-xs truncate text-[var(--text)]" title={style.description ?? undefined}>
          {style.description ?? '—'}
        </span>
      )
    },
    {
      key: 'facialStructures',
      header: 'Estructuras faciales',
      render: (style) => <FacialStructureChips structures={style.facialStructures} />
    },
    { key: 'status', header: 'Estado', render: (style) => <ActiveStatusBadge isActive={style.isActive} /> }
  ];

  return (
    <DataTable<HaircutStyle>
      columns={columns}
      getRowKey={(style) => style.id}
      getRowLabel={(style) => style.name}
      {...props}
    />
  );
}
