//Assembles services with their options for both the customer view (active-only) and the admin view (everything).
import Service from "../models/Service.js";
import ServiceOption from "../models/ServiceOption.js";
import { AppError } from "../utils/AppError.js";

/**
 * Active services for a business, each with only its active options.
 * This is what the customer-facing booking flow will eventually consume.
 */
export const getActiveServicesWithOptions = async (businessId) => {
  const services = await Service.find({ businessId, active: true })
    .sort({ name: 1 })
    .lean();

  const serviceIds = services.map((service) => service._id);

  const options = await ServiceOption.find({
    serviceId: { $in: serviceIds },
    active: true,
  })
    .sort({ price: 1 })
    .lean();

  const optionsByService = options.reduce((acc, option) => {
    const key = option.serviceId.toString();
    acc[key] = acc[key] || [];
    acc[key].push({
      id: option._id,
      name: option.name,
      price: option.price,
      durationMinutes: option.durationMinutes,
    });
    return acc;
  }, {});

  return services.map((service) => ({
    id: service._id,
    name: service.name,
    description: service.description,
    options: optionsByService[service._id.toString()] || [],
  }));
};

/**
 * A single service with ALL of its options (active and inactive), for admin use.
 */
export const getServiceWithAllOptions = async (serviceId) => {
  const service = await Service.findById(serviceId).lean();

  if (!service) {
    throw new AppError("Service not found", 404);
  }

  const options = await ServiceOption.find({ serviceId }).sort({ createdAt: 1 }).lean();

  return { ...service, options };
};