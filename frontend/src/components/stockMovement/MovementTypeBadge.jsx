import { MOVEMENT_TYPES, MOVEMENT_TYPE_LABELS } from '../../constants/inventory.js';

const TONES = {
  [MOVEMENT_TYPES.INITIAL]: 'info',
  [MOVEMENT_TYPES.INCREASE]: 'success',
  [MOVEMENT_TYPES.DECREASE]: 'warning',
  [MOVEMENT_TYPES.REMOVED]: 'danger',
};

const MovementTypeBadge = ({ type }) => (
  <span className={`badge badge--${TONES[type] ?? 'info'}`}>{MOVEMENT_TYPE_LABELS[type] ?? type}</span>
);

export default MovementTypeBadge;
