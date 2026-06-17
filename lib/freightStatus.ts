export const FREIGHT_ORDER_STATUSES = ['Contratar', 'Carregando', 'Em Trânsito', 'Entregue'] as const;

export type FreightOrderStatus = (typeof FREIGHT_ORDER_STATUSES)[number];

export const FREIGHT_STATUS_META: Record<FreightOrderStatus, { icon: string; label: string; className: string }> = {
  Contratar: {
    icon: '🤝',
    label: 'Contratar',
    className: 'bg-yellow-100 text-yellow-800',
  },
  Carregando: {
    icon: '🚛',
    label: 'Carregando',
    className: 'bg-orange-100 text-orange-800',
  },
  'Em Trânsito': {
    icon: '🚚',
    label: 'Em Trânsito',
    className: 'bg-blue-100 text-blue-800',
  },
  Entregue: {
    icon: '✅',
    label: 'Entregue',
    className: 'bg-emerald-100 text-emerald-800',
  },
};

// Regra de negócio: Ordens/Fichas usam somente 4 etapas operacionais.
export function normalizeFreightOrderStatus(status?: string | null): FreightOrderStatus {
  switch (status) {
    case 'Carregando':
      return 'Carregando';
    case 'Em Trânsito':
    case 'Em Viagem':
      return 'Em Trânsito';
    case 'Entregue':
    case 'Pago':
      return 'Entregue';
    case 'Contratar':
    default:
      return 'Contratar';
  }
}

export function getFreightStatusMeta(status?: string | null) {
  return FREIGHT_STATUS_META[normalizeFreightOrderStatus(status)];
}

export function syncFreightOrderStatuses(input: {
  status?: string | null;
  shipment_release_status?: string | null;
}) {
  const syncedStatus = normalizeFreightOrderStatus(input.shipment_release_status || input.status);
  return {
    status: syncedStatus,
    shipment_release_status: syncedStatus,
  };
}
