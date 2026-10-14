import healthService from '../services/health.service.js';

const getHealth = (req, res) => {
  res.status(200).json(healthService.getStatus());
};

export default { getHealth };
