import test from 'node:test';
import assert from 'node:assert/strict';

import { getShipmentReleaseValidationError } from './freightOrderFormValidation.ts';

test('shipment release without approved Buonny does not require override justification', () => {
  const error = getShipmentReleaseValidationError({
    shipmentReleaseStatus: 'Carregando',
    buonnyStatus: 'Renovar',
    releaseJustification: '',
  });

  assert.equal(error, null);
});
