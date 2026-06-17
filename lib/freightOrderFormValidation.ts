import type { FreightOrder } from './db';

type ShipmentReleaseValidationInput = {
  shipmentReleaseStatus: FreightOrder['shipment_release_status'];
  buonnyStatus: FreightOrder['buonny_status'];
  releaseJustification: string;
};

export function getShipmentReleaseValidationError(
  _input: ShipmentReleaseValidationInput,
): string | null {
  return null;
}
