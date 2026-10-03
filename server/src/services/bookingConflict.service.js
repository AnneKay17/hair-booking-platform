//The seam Phase 4 will fill in. Kept separate so slotService never needs to change when the Booking model arrives.
/**
 * The Booking model does not exist yet (it arrives in Phase 4). This function
 * is the single seam slotService uses to exclude times that are already
 * booked. It intentionally returns an empty list for now, so slot generation
 * is fully correct today for availability alone. Phase 4 only needs to
 * replace this implementation with a real Booking query — no other file in
 * the scheduling path needs to change.
 *
 * @param {{ businessId: string, date: string }} params
 * @returns {Promise<{startTime:string,endTime:string}[]>}
 */
export const getBookedIntervals = async ({ businessId, date }) => {
  void businessId;
  void date;
  return [];
};