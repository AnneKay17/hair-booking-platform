import Service from "../models/Service.js";
import ServiceOption from "../models/ServiceOption.js";

/** Every service and option, active or not, for the admin Services page. */
export const getAllServicesWithOptions = async (businessId) => {
  const services = await Service.find({ businessId }).sort({ name: 1 }).lean();
  const options = await ServiceOption.find({ serviceId: { $in: services.map((s) => s._id) } })
    .sort({ createdAt: 1 })
    .lean();

  const byService = {};
  for (const option of options) {
    (byService[option.serviceId.toString()] ||= []).push({
      id: option._id.toString(),
      name: option.name,
      price: option.price,
      durationMinutes: option.durationMinutes,
      active: option.active,
    });
  }

  return services.map((service) => ({
    id: service._id.toString(),
    name: service.name,
    description: service.description,
    active: service.active,
    options: byService[service._id.toString()] || [],
  }));
};